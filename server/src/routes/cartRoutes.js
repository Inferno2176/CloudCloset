import express from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to ensure a cart exists for a user
async function getOrCreateCartId(userId) {
  let cartRes = await query('SELECT id FROM carts WHERE user_id = $1', [userId]);
  if (cartRes.rows.length === 0) {
    const newCartId = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await query('INSERT INTO carts (id, user_id) VALUES ($1, $2)', [newCartId, userId]);
    return newCartId;
  }
  return cartRes.rows[0].id;
}

// GET /api/cart (Fetch user's shopping bag with validated product details)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);

    const itemsResult = await query(
      `SELECT ci.id as item_id, ci.selected_size, ci.selected_color, ci.quantity,
              p.id as product_id, p.name, p.slug, p.price, p.original_price, p.stock_count,
              p.in_stock, p.images, p.s3_key
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    const items = itemsResult.rows.map(row => ({
      id: row.item_id,
      selectedSize: row.selected_size,
      selectedColor: typeof row.selected_color === 'string' ? JSON.parse(row.selected_color) : row.selected_color,
      quantity: row.quantity,
      product: {
        id: row.product_id,
        name: row.name,
        slug: row.slug,
        price: row.price,
        originalPrice: row.original_price,
        stockCount: row.stock_count,
        inStock: row.in_stock,
        s3Key: row.s3_key,
        images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images || []
      }
    }));

    // Server-side calculation of subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const isFreeShipping = subtotal >= 1999 || items.length === 0;
    const shipping = isFreeShipping ? 0 : 150;
    const tax = Math.round(subtotal * 0.12);
    const total = subtotal + tax + shipping;

    res.json({
      success: true,
      items,
      subtotal,
      shipping,
      tax,
      total,
      isFreeShipping
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/add (Add item to bag with server-side inventory check)
router.post('/add', requireAuth, async (req, res, next) => {
  try {
    const { productId, size = 'M', color = null, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required.' });
    }

    // Verify product exists and has sufficient stock
    const prodRes = await query('SELECT id, name, price, stock_count, in_stock FROM products WHERE id = $1', [productId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const product = prodRes.rows[0];
    if (!product.in_stock || product.stock_count < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient inventory for "${product.name}". Available stock: ${product.stock_count}`
      });
    }

    const cartId = await getOrCreateCartId(req.user.id);
    const colorJson = color ? JSON.stringify(color) : null;

    // Check if variant already exists in cart
    const existing = await query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND selected_size = $3',
      [cartId, productId, size]
    );

    let itemId;
    if (existing.rows.length > 0) {
      itemId = existing.rows[0].id;
      const newQty = existing.rows[0].quantity + quantity;
      await query(
        'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newQty, itemId]
      );
    } else {
      itemId = `ci-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await query(
        `INSERT INTO cart_items (id, cart_id, product_id, selected_size, selected_color, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [itemId, cartId, productId, size, colorJson, quantity]
      );
    }

    res.json({
      success: true,
      message: `Added "${product.name}" to Bag.`,
      itemId
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/item/:id (Update quantity)
router.put('/item/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await query('DELETE FROM cart_items WHERE id = $1', [id]);
      return res.json({ success: true, message: 'Item removed from bag.' });
    }

    // Check item exists and product has sufficient stock
    const itemRes = await query(
      `SELECT ci.quantity, p.stock_count, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [id]
    );

    if (itemRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cart item not found.' });
    }

    if (itemRes.rows[0].stock_count < quantity) {
      return res.status(400).json({
        success: false,
        error: `Requested quantity exceeds available stock (${itemRes.rows[0].stock_count}).`
      });
    }

    await query(
      'UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, id]
    );

    res.json({ success: true, message: 'Cart quantity updated.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/item/:id (Remove item)
router.delete('/item/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ success: true, message: 'Item removed from bag.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/clear (Clear entire bag)
router.delete('/clear', requireAuth, async (req, res, next) => {
  try {
    const cartId = await getOrCreateCartId(req.user.id);
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ success: true, message: 'Shopping bag cleared.' });
  } catch (err) {
    next(err);
  }
});

export default router;
