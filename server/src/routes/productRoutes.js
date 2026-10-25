import express from 'express';
import { query } from '../db/pool.js';
import { getPresignedViewUrl } from '../services/s3Service.js';

const router = express.Router();

function formatProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category_name || row.category,
    categoryId: row.category_id,
    subcategory: row.subcategory,
    gender: row.gender,
    price: row.price,
    originalPrice: row.original_price,
    badge: row.badge,
    provenance: row.provenance,
    rating: parseFloat(row.rating) || 5.0,
    reviewCount: row.review_count || 1,
    isFeatured: row.is_featured,
    isTrending: row.is_trending,
    isNewArrival: row.is_new_arrival,
    description: row.description,
    fabric: row.fabric,
    care: row.care,
    origin: row.origin,
    inStock: row.in_stock,
    status: row.status,
    stockCount: row.stock_count,
    colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors || [],
    sizes: typeof row.sizes === 'string' ? JSON.parse(row.sizes) : row.sizes || [],
    s3Key: row.s3_key,
    galleryKeys: typeof row.gallery_keys === 'string' ? JSON.parse(row.gallery_keys) : row.gallery_keys || [],
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || []
  };
}

// GET /api/products (Catalogue listing with filtering, search, and sorting)
router.get('/', async (req, res, next) => {
  try {
    const { gender, category, search, sort, isTrending, isNewArrival, isFeatured } = req.query;

    let queryText = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'active'
    `;
    const queryParams = [];

    if (gender && gender !== 'All') {
      queryParams.push(gender);
      queryText += ` AND p.gender = $${queryParams.length}`;
    }

    if (category && category !== 'All') {
      queryParams.push(category);
      queryText += ` AND (c.name = $${queryParams.length} OR p.subcategory = $${queryParams.length})`;
    }

    if (search && search.trim()) {
      queryParams.push(`%${search.trim().toLowerCase()}%`);
      queryText += ` AND (LOWER(p.name) LIKE $${queryParams.length} OR LOWER(p.description) LIKE $${queryParams.length} OR LOWER(p.provenance) LIKE $${queryParams.length})`;
    }

    if (isTrending === 'true') {
      queryText += ` AND p.is_trending = true`;
    }

    if (isNewArrival === 'true') {
      queryText += ` AND p.is_new_arrival = true`;
    }

    if (isFeatured === 'true') {
      queryText += ` AND p.is_featured = true`;
    }

    // Sorting
    if (sort === 'price-asc') {
      queryText += ` ORDER BY p.price ASC`;
    } else if (sort === 'price-desc') {
      queryText += ` ORDER BY p.price DESC`;
    } else if (sort === 'rating') {
      queryText += ` ORDER BY p.rating DESC, p.review_count DESC`;
    } else if (sort === 'newest') {
      queryText += ` ORDER BY p.is_new_arrival DESC, p.created_at DESC`;
    } else {
      queryText += ` ORDER BY p.is_featured DESC, p.id ASC`;
    }

    const result = await query(queryText, queryParams);
    const products = result.rows.map(formatProductRow);

    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id (Get single product by ID or Slug)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 OR p.slug = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product "${id}" not found in atelier catalogue.`
      });
    }

    const product = formatProductRow(result.rows[0]);

    // Attach secure S3 presigned URL if configured
    if (product.s3Key) {
      try {
        const presignedUrl = await getPresignedViewUrl(product.s3Key);
        product.presignedImageUrl = presignedUrl;
      } catch (_e) {
        // Fallback to CDN URLs
      }
    }

    res.json({
      success: true,
      product
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id/presigned-url (Generate secure, short-lived presigned GET URL for product image)
router.get('/:id/presigned-url', async (req, res, next) => {
  try {
    const { id } = req.params;
    const expiresIn = parseInt(req.query.expiresIn, 10) || 3600;

    const result = await query(
      `SELECT id, name, s3_key, gallery_keys, images
       FROM products
       WHERE id = $1 OR slug = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Product "${id}" not found in atelier catalogue.`
      });
    }

    const row = result.rows[0];
    const s3Key = row.s3_key;
    const images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images || [];
    const fallbackUrl = images[0] || null;

    let presignedUrl = null;
    if (s3Key) {
      try {
        presignedUrl = await getPresignedViewUrl(s3Key, expiresIn);
      } catch (err) {
        console.warn(`[S3 Presign Warning] Could not generate presigned URL for product ${id}:`, err.message);
      }
    }

    res.json({
      success: true,
      productId: row.id,
      s3Key,
      presignedUrl,
      fallbackUrl,
      expiresInSeconds: expiresIn
    });
  } catch (err) {
    next(err);
  }
});

export default router;
