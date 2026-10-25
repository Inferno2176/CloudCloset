import express from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/wishlist (Get user's wishlisted product IDs and full product cards)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT w.id as wishlist_id, w.product_id, w.created_at,
              p.name, p.slug, p.price, p.original_price, p.stock_count, p.in_stock,
              p.gender, p.category_id, p.images, p.s3_key
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    const productIds = result.rows.map(r => r.product_id);
    const products = result.rows.map(r => ({
      id: r.product_id,
      name: r.name,
      slug: r.slug,
      price: r.price,
      originalPrice: r.original_price,
      stockCount: r.stock_count,
      inStock: r.in_stock,
      gender: r.gender,
      s3Key: r.s3_key,
      images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images || []
    }));

    res.json({
      success: true,
      productIds,
      products
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/wishlist/toggle (Toggle wishlist status for a product)
router.post('/toggle', requireAuth, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    const existing = await query(
      'SELECT id FROM wishlists WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (existing.rows.length > 0) {
      await query('DELETE FROM wishlists WHERE id = $1', [existing.rows[0].id]);
      return res.json({
        success: true,
        action: 'removed',
        message: 'Product removed from wishlist.',
        isWishlisted: false
      });
    } else {
      const id = `wl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await query(
        'INSERT INTO wishlists (id, user_id, product_id) VALUES ($1, $2, $3)',
        [id, req.user.id, productId]
      );
      return res.json({
        success: true,
        action: 'added',
        message: 'Product saved to wishlist.',
        isWishlisted: true
      });
    }
  } catch (err) {
    next(err);
  }
});

export default router;
