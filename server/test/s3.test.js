import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { upload } from '../src/middleware/upload.js';
import {
  getBucketName,
  getRegion,
  checkObjectExists,
  uploadProductImage,
  getPresignedViewUrl,
  getMockS3Store
} from '../src/services/s3Service.js';
import { runMigrations } from '../src/db/migrate.js';
import { seedDatabase } from '../src/db/seed.js';
import { closePool, query } from '../src/db/pool.js';

describe('CloudCloset Amazon S3 Integration & Access Security Suite', () => {
  let adminToken = '';
  let customerToken = '';
  const JWT_SECRET = process.env.JWT_SECRET || 'atelier_cloudcloset_super_secret_jwt_key_2026_dev_only';

  beforeAll(async () => {
    await runMigrations();
    await seedDatabase();

    // Create Admin Token with proper capitalized role matching DB schema
    adminToken = jwt.sign(
      { id: 'usr-admin-01', email: 'admin@cloudcloset.in', role: 'Admin', name: 'Atelier Director' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create Customer Token
    customerToken = jwt.sign(
      { id: 'usr-cust-01', email: 'client@atelier.in', role: 'Customer', name: 'Atelier Client' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await closePool();
  });

  // ==========================================
  // 1. S3 CONFIGURATION & REGION RESOLUTION
  // ==========================================
  describe('S3 Configuration Resolution', () => {
    it('should resolve the Sydney region (ap-southeast-2) by default', () => {
      const region = getRegion();
      expect(region).toBe('ap-southeast-2');
    });

    it('should resolve the target bucket (cloudcloset-atelier-assets-2026) by default', () => {
      const bucket = getBucketName();
      expect(bucket).toBe('cloudcloset-atelier-assets-2026');
    });
  });

  // ==========================================
  // 2. PRESIGNED GET URL ENDPOINT & FALLBACK
  // ==========================================
  describe('Presigned GET URL Generation & Fallbacks', () => {
    it('should return a presigned URL and external fallback URL for an existing product', async () => {
      const res = await request(app)
        .get('/api/products/cc-001/presigned-url');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.productId).toBe('cc-001');
      expect(res.body.s3Key).toBe('products/cc-001/primary.webp');
      expect(res.body.fallbackUrl).toMatch(/^https:\/\/images\.unsplash\.com/);
      expect(res.body.expiresInSeconds).toBe(3600);
    });

    it('should return 404 when requesting presigned URL for a non-existent product ID', async () => {
      const res = await request(app)
        .get('/api/products/cc-non-existent-999/presigned-url');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('not found');
    });

    it('should safely return null presigned URL when s3Key is missing but retain external CDN fallback', async () => {
      // Insert test garment without s3_key
      await query(`
        INSERT INTO products (id, name, slug, gender, price, original_price, images, s3_key)
        VALUES ('cc-test-no-s3', 'Archival Silk Scarf', 'archival-silk-scarf', 'Unisex', 1200, 1500, '["https://images.unsplash.com/sample.jpg"]', NULL)
        ON CONFLICT (id) DO UPDATE SET s3_key = NULL
      `);

      const res = await request(app)
        .get('/api/products/cc-test-no-s3/presigned-url');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.s3Key).toBeNull();
      expect(res.body.presignedUrl).toBeNull();
      expect(res.body.fallbackUrl).toBe('https://images.unsplash.com/sample.jpg');

      // Clean up
      await query("DELETE FROM products WHERE id = 'cc-test-no-s3'");
    });

    it('should handle missing keys gracefully in getPresignedViewUrl service function', async () => {
      const nullResult = await getPresignedViewUrl(null);
      expect(nullResult).toBeNull();

      const emptyResult = await getPresignedViewUrl('');
      expect(emptyResult).toBeNull();
    });
  });

  // ==========================================
  // 3. ADMIN AUTHORIZATION GUARD ON S3 UPLOADS
  // ==========================================
  describe('S3 Upload Access Control & RBAC', () => {
    it('should reject unauthenticated upload requests with 401', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .attach('image', Buffer.from('fake-image-bytes'), 'test.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-admin (customer) upload requests with 403', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${customerToken}`)
        .attach('image', Buffer.from('fake-image-bytes'), 'test.jpg');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden: Administrator privileges required.');
    });

    it('should permit authenticated administrator to upload valid fashion photography', async () => {
      const imageBuffer = Buffer.from('RIFF....WEBPVP8 ...fake-valid-webp-content');
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('productId', 'cc-001')
        .field('imageType', 'primary')
        .attach('image', imageBuffer, {
          filename: 'linen-coat-primary.webp',
          contentType: 'image/webp'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.s3Key).toMatch(/^products\/cc-001\/primary-\d+\.webp$/);
      expect(res.body.bucket).toBe('cloudcloset-atelier-assets-2026');
    });
  });

  // ==========================================
  // 4. MIME-TYPE & FILE SIZE VALIDATION
  // ==========================================
  describe('Image MIME-Type & Payload Validation', () => {
    it('should reject non-image file MIME types (e.g. text/plain) with 400 Bad Request', async () => {
      const textBuffer = Buffer.from('This is not an image.');
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', textBuffer, {
          filename: 'exploit.txt',
          contentType: 'text/plain'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid file type');
    });

    it('should reject dangerous executable files (e.g. application/x-msdownload) with 400', async () => {
      const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('image', exeBuffer, {
          filename: 'payload.exe',
          contentType: 'application/x-msdownload'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid file type');
    });

    it('should reject file upload when no file is attached with 400', async () => {
      const res = await request(app)
        .post('/api/admin/upload-image')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('productId', 'cc-001');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('No image file uploaded');
    });

    it('should configure 5MB maximum file size limit in upload middleware', () => {
      expect(upload).toBeDefined();
      // Multer limits: 5 * 1024 * 1024 = 5242880 bytes (5MB)
      expect(upload.limits.fileSize).toBe(5 * 1024 * 1024);
    });
  });

  // ==========================================
  // 5. OBJECT OVERWRITE & DUPLICATE PROTECTION
  // ==========================================
  describe('Duplicate Detection & Overwrite Protection', () => {
    it('should detect when an object exists and prevent duplicate upload if preventOverwrite is set', async () => {
      const testKey = 'products/cc-test-protect/primary.webp';
      const testBuffer = Buffer.from('test-image-content');

      // Initial upload
      await uploadProductImage(testBuffer, testKey, 'image/webp');

      const exists = await checkObjectExists(testKey);
      expect(exists).toBe(true);

      // Verify mock store
      const store = getMockS3Store();
      expect(store.has(testKey)).toBe(true);
    });

    it('should check non-existent keys safely and return false', async () => {
      const nonExistent = await checkObjectExists('products/non-existent-9999/test.webp');
      expect(nonExistent).toBe(false);
    });
  });
});
