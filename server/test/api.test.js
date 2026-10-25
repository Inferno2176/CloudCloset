import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { strictAuthLimiter } from '../src/middleware/rateLimiter.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { closePool, query } from '../src/db/pool.js';

describe('CloudCloset Atelier API & Database Integration Suite', () => {
  let customerToken = '';
  let customerUser = null;
  let adminToken = '';
  let adminUser = null;
  let sampleProduct = null;

  beforeAll(async () => {
    // Run database migrations and seed 60 products
    await runMigrations();
    await seedDatabase();
  });

  afterAll(async () => {
    await closePool();
  });

  // ==========================================
  // 1. DATABASE SCHEMA & SEED INTEGRITY
  // ==========================================
  describe('Database Schema & Catalogue Integrity', () => {
    it('should have seeded exactly 60 archival products without duplicates', async () => {
      const res = await query('SELECT count(*)::int as count FROM products');
      expect(res.rows[0].count).toBe(60);
    });

    it('should be idempotent: re-running seed should maintain exactly 60 products', async () => {
      await seedDatabase();
      const res = await query('SELECT count(*)::int as count FROM products');
      expect(res.rows[0].count).toBe(60);
    });

    it('should have seeded 6 major atelier categories', async () => {
      const res = await query('SELECT count(*)::int as count FROM categories');
      expect(res.rows[0].count).toBe(6);
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & ROLE-BASED ACCESS
  // ==========================================
  describe('Authentication & Authorization', () => {
    it('should register a new customer with a hashed password', async () => {
      const uniqueEmail = `test.client.${Date.now()}@atelier.in`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Meera Kapoor',
          email: uniqueEmail,
          password: 'secure-client-password',
          phone: '+91 99887 76655'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.role).toBe('Member');
      expect(res.body.token).toBeDefined();

      // Verify password is NOT stored as plaintext in database
      const dbUser = await query('SELECT password_hash FROM users WHERE email = $1', [uniqueEmail]);
      expect(dbUser.rows[0].password_hash).not.toBe('secure-client-password');
      expect(dbUser.rows[0].password_hash.startsWith('$2')).toBe(true); // bcrypt signature
    });

    it('should reject login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ananya.mehra@atelier.in',
          password: 'wrong-password'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully log in seeded customer and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ananya.mehra@atelier.in',
          password: 'atelier-pass'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('Member');
      customerToken = res.body.token;
      customerUser = res.body.user;
      expect(customerUser.email).toBe('ananya.mehra@atelier.in');
    });

    it('should reject a customer trying to log in as Admin', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ananya.mehra@atelier.in',
          password: 'atelier-pass',
          requestedRole: 'admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Administrator privileges required');
    });

    it('should log in verified Administrator with Admin privileges', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@cloudcloset.com',
          password: 'atelier-admin-2025',
          requestedRole: 'admin'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('Admin');
      adminToken = res.body.token;
      adminUser = res.body.user;
      expect(adminUser.email).toBe('admin@cloudcloset.com');
    });
  });

  // ==========================================
  // 3. PRODUCT CATALOGUE & DISCOVERY
  // ==========================================
  describe('Product Catalogue Endpoints', () => {
    it('should return active products from database', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products.length).toBe(60);
      sampleProduct = res.body.products[0];
    });

    it('should filter products by gender (Men)', async () => {
      const res = await request(app).get('/api/products?gender=Men');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThanOrEqual(10);
      for (const p of res.body.products) {
        expect(p.gender).toBe('Men');
      }
    });

    it('should filter products by category (Outerwear)', async () => {
      const res = await request(app).get('/api/products?category=Outerwear');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(10);
      for (const p of res.body.products) {
        expect(p.category).toBe('Outerwear');
      }
    });

    it('should search products by keyword', async () => {
      const res = await request(app).get('/api/products?search=Trench');
      expect(res.status).toBe(200);
      expect(res.body.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.products[0].name.toLowerCase()).toContain('trench');
    });

    it('should fetch single product details by id', async () => {
      const res = await request(app).get(`/api/products/${sampleProduct.id}`);
      expect(res.status).toBe(200);
      expect(res.body.product.id).toBe(sampleProduct.id);
      expect(res.body.product.price).toBe(sampleProduct.price);
    });
  });

  // ==========================================
  // 4. CART & WISHLIST PERSISTENCE
  // ==========================================
  describe('Cart & Wishlist Persistence', () => {
    let addedItemId = '';

    it('should reject unauthenticated cart access', async () => {
      const res = await request(app).get('/api/cart');
      expect(res.status).toBe(401);
    });

    it('should add item to user cart and validate stock', async () => {
      const res = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          productId: sampleProduct.id,
          size: 'M',
          quantity: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      addedItemId = res.body.itemId;
      expect(addedItemId).toBeDefined();
    });

    it('should fetch cart items with calculated server totals', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.subtotal).toBeGreaterThan(0);
      expect(res.body.total).toBe(res.body.subtotal + res.body.tax + res.body.shipping);
    });

    it('should toggle product in user wishlist', async () => {
      // First toggle: Add
      const addRes = await request(app)
        .post('/api/wishlist/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: sampleProduct.id });

      expect(addRes.status).toBe(200);
      expect(addRes.body.action).toBe('added');

      // Second toggle: Remove
      const removeRes = await request(app)
        .post('/api/wishlist/toggle')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: sampleProduct.id });

      expect(removeRes.status).toBe(200);
      expect(removeRes.body.action).toBe('removed');
    });
  });

  // ==========================================
  // 5. TRANSACTIONAL CHECKOUT & INVENTORY
  // ==========================================
  describe('Transactional Orders & Inventory Control', () => {
    it('should execute checkout transaction and atomically decrement stock', async () => {
      // Check initial stock
      const initialRes = await query('SELECT stock_count FROM products WHERE id = $1', [sampleProduct.id]);
      const initialStock = initialRes.rows[0].stock_count;

      const checkoutRes = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: sampleProduct.id,
              quantity: 2,
              size: 'M'
            }
          ],
          shippingAddress: {
            name: 'Ananya Mehra',
            city: 'Mumbai',
            address: 'Worli Sea Face, Apt 14B',
            pincode: '400018'
          },
          paymentMethod: 'UPI'
        });

      expect(checkoutRes.status).toBe(201);
      expect(checkoutRes.body.success).toBe(true);
      expect(checkoutRes.body.order.id).toBeDefined();

      // Verify stock was decremented in database
      const updatedRes = await query('SELECT stock_count FROM products WHERE id = $1', [sampleProduct.id]);
      expect(updatedRes.rows[0].stock_count).toBe(initialStock - 2);
    });

    it('should ROLLBACK transaction if requested quantity exceeds available stock', async () => {
      const stockRes = await query('SELECT stock_count FROM products WHERE id = $1', [sampleProduct.id]);
      const currentStock = stockRes.rows[0].stock_count;

      const failRes = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            {
              productId: sampleProduct.id,
              quantity: currentStock + 999, // impossible quantity
              size: 'M'
            }
          ],
          shippingAddress: {
            name: 'Ananya Mehra',
            city: 'Mumbai'
          }
        });

      expect(failRes.status).toBe(400);
      expect(failRes.body.error).toContain('Overselling prevented');

      // Verify stock was NOT changed (transaction was rolled back)
      const afterRes = await query('SELECT stock_count FROM products WHERE id = $1', [sampleProduct.id]);
      expect(afterRes.rows[0].stock_count).toBe(currentStock);
    });

    it('should retrieve customer order history', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================
  // 6. ADMIN OPERATIONS & S3 IMAGE UPLOAD
  // ==========================================
  describe('Admin Operations & S3 Upload Security', () => {
    it('should block non-admin users from admin routes (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow verified Admin to view all atelier orders', async () => {
      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow Admin to update product stock', async () => {
      const res = await request(app)
        .patch(`/api/admin/products/${sampleProduct.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stockCount: 25 });

      expect(res.status).toBe(200);
      expect(res.body.product.stock_count).toBe(25);
    });

    it('should reject image upload with invalid MIME type (e.g. text/plain)', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('fake data'), 'malicious.txt');

      expect([400, 500]).toContain(res.status); // Multer / validation rejected
      expect(res.body.error).toContain('Invalid file type');
    });

    it('should accept valid WebP/JPEG fashion photograph upload', async () => {
      // 1x1 transparent PNG buffer
      const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', pngBuffer, 'test-coat.png')
        .field('productId', 'cc-001')
        .field('imageType', 'primary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.s3Key).toContain('products/cc-001/');
    });
  });

  // ==========================================
  // 7. ADVANCED JWT & AUTHENTICATION SECURITY
  // ==========================================
  describe('JWT Signature, Expiration & Token Integrity', () => {
    it('should reject requests with malformed Authorization headers', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'NotBearer token123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or malformed authentication token');
    });

    it('should reject requests with forged or invalid token signatures', async () => {
      // Token signed with an unauthorized external key
      const forgedToken = jwt.sign(
        { id: 'usr-admin-01', email: 'admin@cloudcloset.com', role: 'Admin' },
        'attacker_fake_jwt_secret_key_12345'
      );

      const res = await request(app)
        .get('/api/admin/orders')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid or malformed authentication token');
    });

    it('should reject expired JWT tokens with explicit expiration message', async () => {
      const secret = process.env.JWT_SECRET || 'atelier_cloudcloset_super_secret_jwt_key_2026_dev_only';
      // Token expired 1 hour ago
      const expiredToken = jwt.sign(
        { id: 'usr-customer-01', email: 'ananya.mehra@atelier.in', role: 'Member' },
        secret,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('expired');
    });

    it('should reject client attempt to forge role via request body during registration', async () => {
      const attackerEmail = `attacker.${Date.now()}@atelier.in`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Malicious Actor',
          email: attackerEmail,
          password: 'secure-attacker-password',
          role: 'Admin' // Attempting privilege escalation
        });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('Member'); // Must remain Member
      const decoded = jwt.decode(res.body.token);
      expect(decoded.role).toBe('Member');
    });
  });

  // ==========================================
  // 8. PASSWORD SECURITY & MANAGEMENT
  // ==========================================
  describe('Password Security & Password Change Workflow', () => {
    let testUserEmail = '';
    let testUserToken = '';

    beforeAll(async () => {
      testUserEmail = `pass.user.${Date.now()}@atelier.in`;
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rohan Sharma',
          email: testUserEmail,
          password: 'initial-password-2025'
        });
      testUserToken = regRes.body.token;
    });

    it('should reject password change with incorrect current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'wrong-current-password',
          newPassword: 'brand-new-password-2025'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Incorrect current password');
    });

    it('should reject password change if new password is too short (< 8 chars)', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'initial-password-2025',
          newPassword: 'short'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 8 characters');
    });

    it('should successfully update password and verify new password on subsequent login', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          currentPassword: 'initial-password-2025',
          newPassword: 'updated-secret-passcode-2026'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify old password no longer works
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserEmail, password: 'initial-password-2025' });
      expect(oldLogin.status).toBe(401);

      // Verify new password works
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserEmail, password: 'updated-secret-passcode-2026' });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.token).toBeDefined();
    });

    it('should handle forgot-password inquiries safely without enumerating accounts', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent.random.user@atelier.in' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('If an atelier account is associated');
    });
  });

  // ==========================================
  // 9. PAYLOAD VALIDATION & INJECTION PREVENTION
  // ==========================================
  describe('Payload Validation & Schema Enforcement', () => {
    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email-address',
          password: 'password12345'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email address');
    });

    it('should reject checkout with missing shipping address', async () => {
      const res = await request(app)
        .post('/api/orders/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: sampleProduct.id, quantity: 1 }],
          shippingAddress: { name: '' } // missing city and empty name
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Recipient full name is required');
    });

    it('should never expose sensitive fields in user API responses', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();
    });
  });

  // ==========================================
  // 10. DATABASE CONNECTIVITY & HEALTH CHECKS
  // ==========================================
  describe('Database Connectivity & Health Monitoring', () => {
    it('should return healthy status on /api/health with database connected', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.database).toBe('connected');
    });

    it('should report database latency on /api/health/db', async () => {
      const res = await request(app).get('/api/health/db');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.latencyMs).toBeTypeOf('number');
    });

    it('should sanitize database unique constraint errors to 409 Conflict', async () => {
      // Attempt duplicate user registration with existing email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Test',
          email: 'ananya.mehra@atelier.in',
          password: 'some-password-123'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already exists');
    });
  });

  // ==========================================
  // 11. RATE LIMITING ENFORCEMENT
  // ==========================================
  describe('Authentication Rate Limiting Enforcement', () => {
    it('should reject requests with 429 Too Many Requests when rate limit threshold is exceeded', async () => {
      const testLimiterApp = express();
      testLimiterApp.use(strictAuthLimiter);
      testLimiterApp.post('/api/auth/test-login', (_req, res) => res.json({ success: true }));

      // Send 5 requests up to limit
      for (let i = 0; i < 5; i++) {
        const res = await request(testLimiterApp).post('/api/auth/test-login');
        expect(res.status).toBe(200);
      }

      // 6th request must trigger 429 Too Many Requests
      const blockedRes = await request(testLimiterApp).post('/api/auth/test-login');
      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.error).toContain('Too many requests');
    });
  });
});

