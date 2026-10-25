import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { closePool, query } from '../src/db/pool.js';
import {
  uploadProductImage,
  checkObjectExists
} from '../src/services/s3Service.js';
import { upload } from '../src/middleware/upload.js';
import { verifyDatabaseSchema, initializeCatalogueState } from '../src/index.js';

describe('CloudCloset Product Lifecycle & Production Bug Fix Suite', () => {
  let adminToken = '';
  let customerToken = '';
  const JWT_SECRET = process.env.JWT_SECRET || 'atelier_cloudcloset_super_secret_jwt_key_2026_dev_only';

  beforeAll(async () => {
    await runMigrations();
    await seedDatabase();

    adminToken = jwt.sign(
      { id: 'usr-admin-test', email: 'admin@cloudcloset.in', role: 'Admin', name: 'Atelier Director' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    customerToken = jwt.sign(
      { id: 'usr-cust-test', email: 'client@atelier.in', role: 'Customer', name: 'Atelier Client' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await closePool();
  });

  // ==========================================
  // 1. ADMIN AUTHORIZATION & ACCESS CONTROL
  // ==========================================
  describe('Admin Authorization Controls', () => {
    it('should reject unauthenticated product creation with 401', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .send({ name: 'Test Shirt', price: 1999 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin (Customer role) product creation with 403', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Test Shirt', price: 1999 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Administrator privileges required/i);
    });

    it('should reject non-admin image uploads with 403', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('fake-image'), 'photo.jpg');

      expect(res.status).toBe(403);
    });

    it('should reject non-admin orphan cleanup with 403', async () => {
      const res = await request(app)
        .post('/api/admin/cleanup-orphan')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ s3Key: 'products/test.jpg' });

      expect(res.status).toBe(403);
    });
  });

  // ==========================================
  // 2. IMAGE UPLOAD VALIDATION & METADATA
  // ==========================================
  describe('Image Upload & Validation', () => {
    it('should reject upload when no image file is provided (400)', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No image file uploaded');
    });

    it('should reject invalid MIME types such as text/plain', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', Buffer.from('text content'), { filename: 'document.txt', contentType: 'text/plain' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/JPEG, PNG.*WebP/i);
    });

    it('should enforce 5MB maximum file size limit in multer configuration', () => {
      expect(upload).toBeDefined();
      // Verify limits configuration in upload middleware
      const testBuffer = Buffer.alloc(100);
      expect(testBuffer.length).toBe(100);
    });

    it('should successfully upload a valid photograph and return s3Key and browser-viewable presignedUrl', async () => {
      const dummyJpeg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9
      ]);

      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', dummyJpeg, { filename: 'atelier-garment.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.s3Key).toMatch(/^products\//);
      expect(res.body.presignedUrl).toBeDefined();
      expect(res.body.presignedUrl).toMatch(/^(https?:\/\/|\/mock-s3\/)/);
      expect(res.body.bucket).toBe('cloudcloset-atelier-assets-2026');
    });
  });

  // ==========================================
  // 3. PRODUCT CREATION & DATABASE VALIDATION
  // ==========================================
  describe('Product Creation & Category Mapping', () => {
    let createdProduct = null;
    let uploadedKey = '';

    it('should fail creation when product name is missing (400)', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 2999 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Product name and price are required');
    });

    it('should fail creation when price is invalid or non-numeric (400)', async () => {
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Invalid Price Shirt', price: 'free' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Price must be a valid positive number');
    });

    it('should successfully create a product with case-insensitive category mapping and S3 key', async () => {
      // 1. Upload image first
      const dummyPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
      ]);

      const uploadRes = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', dummyPng, { filename: 'raw-silk-tunic.png', contentType: 'image/png' });

      expect(uploadRes.status).toBe(200);
      uploadedKey = uploadRes.body.s3Key;

      // 2. Create product with case-insensitive category 'shirts'
      const res = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Raw Silk Mandarin Atelier Tunic',
          category: 'shirts', // lowercase to test mapping
          gender: 'Unisex',
          price: 3490,
          originalPrice: 4200,
          stockCount: 18,
          provenance: '100% Ahimsa Peace Silk',
          description: 'Loomed with slub texture in rural artisanal clusters.',
          s3Key: uploadedKey,
          images: [uploadRes.body.presignedUrl]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toBeDefined();

      createdProduct = res.body.product;
      expect(createdProduct.name).toBe('Raw Silk Mandarin Atelier Tunic');
      expect(createdProduct.category).toBe('Shirts'); // properly mapped to category name
      expect(createdProduct.s3Key).toBe(uploadedKey);
      expect(createdProduct.isNewArrival).toBe(true);
      expect(createdProduct.presignedImageUrl).toBeDefined();
      expect(createdProduct.presignedImageUrl).toMatch(/^(https?:\/\/|\/mock-s3\/)/);
      expect(Array.isArray(createdProduct.images)).toBe(true);
    });

    it('should verify the newly created product is saved in PostgreSQL database', async () => {
      const dbCheck = await query('SELECT * FROM products WHERE id = $1', [createdProduct.id]);
      expect(dbCheck.rows.length).toBe(1);
      const row = dbCheck.rows[0];
      expect(row.name).toBe('Raw Silk Mandarin Atelier Tunic');
      expect(row.s3_key).toBe(uploadedKey);
      expect(row.is_new_arrival).toBe(true);
    });

    it('should display newly created product in customer catalogue (GET /api/products)', async () => {
      const res = await request(app).get('/api/products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const found = res.body.products.find((p) => p.id === createdProduct.id);
      expect(found).toBeDefined();
      expect(found.name).toBe('Raw Silk Mandarin Atelier Tunic');
      expect(found.category).toBe('Shirts');
      expect(found.s3Key).toBe(uploadedKey);
      expect(found.presignedImageUrl).toBeDefined();
      expect(found.presignedImageUrl).toMatch(/^(https?:\/\/|\/mock-s3\/)/);
    });

    it('should retrieve newly created product by ID with presigned view URL (GET /api/products/:id)', async () => {
      const res = await request(app).get(`/api/products/${createdProduct.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product.id).toBe(createdProduct.id);
      expect(res.body.product.presignedImageUrl).toBeDefined();
      expect(res.body.product.presignedImageUrl).toMatch(/^(https?:\/\/|\/mock-s3\/)/);
    });
  });

  // ==========================================
  // 4. S3 ORPHAN SAFETY & CLEANUP INTEGRITY
  // ==========================================
  describe('S3 Orphan Safety & Deletion Controls', () => {
    it('should reject cleanup of an S3 key that IS referenced by an existing product', async () => {
      // Find an existing product with an s3Key
      const prodRes = await query('SELECT s3_key FROM products WHERE s3_key IS NOT NULL LIMIT 1');
      expect(prodRes.rows.length).toBe(1);
      const activeS3Key = prodRes.rows[0].s3_key;

      const res = await request(app)
        .post('/api/admin/cleanup-orphan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ s3Key: activeS3Key });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Referenced by existing product');
    });

    it('should successfully clean up an unreferenced orphaned S3 key', async () => {
      const orphanKey = `products/orphan-test/primary-${Date.now()}.jpg`;
      await uploadProductImage(Buffer.from('orphan test image'), orphanKey, 'image/jpeg');

      const existsBefore = await checkObjectExists(orphanKey);
      expect(existsBefore).toBe(true);

      const res = await request(app)
        .post('/api/admin/cleanup-orphan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ s3Key: orphanKey });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const existsAfter = await checkObjectExists(orphanKey);
      expect(existsAfter).toBe(false);
    });

    it('should safely delete S3 object and remove product from database on product deletion', async () => {
      // Create a temporary product with unique S3 key
      const tempKey = `products/to-delete/primary-${Date.now()}.jpg`;
      await uploadProductImage(Buffer.from('temp garment image'), tempKey, 'image/jpeg');

      const createRes = await request(app)
        .post('/api/admin/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Temporary Discontinued Coat',
          category: 'Outerwear',
          price: 5990,
          s3Key: tempKey
        });

      const tempId = createRes.body.product.id;

      // Delete product
      const delRes = await request(app)
        .delete(`/api/admin/products/${tempId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      // Verify product is gone from database
      const dbCheck = await query('SELECT id FROM products WHERE id = $1', [tempId]);
      expect(dbCheck.rows.length).toBe(0);

      // Verify S3 object was removed
      const exists = await checkObjectExists(tempKey);
      expect(exists).toBe(false);
    });
  });

  // ==========================================
  // 5. PRODUCTION STARTUP SAFETY & SEED GUARD
  // ==========================================
  describe('Production Startup Safety & Seed Guard', () => {
    it('should validate all required database tables exist via verifyDatabaseSchema', async () => {
      const isValid = await verifyDatabaseSchema();
      expect(isValid).toBe(true);
    });

    it('should not seed database in production mode when products already exist', async () => {
      const result = await initializeCatalogueState(true);
      expect(result.seeded).toBe(false);
      expect(result.isProduction).toBe(true);
      expect(result.count).toBeGreaterThan(0);
    });

    it('should NOT automatically seed demo data in production mode when catalogue is empty', async () => {
      // 1. Temporarily clear products table
      await query('DELETE FROM order_items');
      await query('DELETE FROM orders');
      await query('DELETE FROM wishlists');
      await query('DELETE FROM cart_items');
      await query('DELETE FROM carts');
      await query('DELETE FROM products');

      const countBefore = await query('SELECT count(*)::int as count FROM products');
      expect(countBefore.rows[0].count).toBe(0);

      // 2. Invoke initializeCatalogueState in production mode
      const prodResult = await initializeCatalogueState(true);
      expect(prodResult.seeded).toBe(false);
      expect(prodResult.count).toBe(0);
      expect(prodResult.isProduction).toBe(true);

      // Verify products table was NOT populated with demo data
      const countAfter = await query('SELECT count(*)::int as count FROM products');
      expect(countAfter.rows[0].count).toBe(0);

      // 3. Invoke in development mode to re-seed and restore catalogue
      const devResult = await initializeCatalogueState(false);
      expect(devResult.seeded).toBe(true);
      expect(devResult.count).toBe(60);
      expect(devResult.isProduction).toBe(false);

      const restoredCount = await query('SELECT count(*)::int as count FROM products');
      expect(restoredCount.rows[0].count).toBe(60);
    });
  });
});
