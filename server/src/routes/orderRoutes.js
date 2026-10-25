import express from 'express';
import { getClient, query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { validateCheckout } from '../middleware/validation.js';

const router = express.Router();

// POST /api/orders/checkout (Transactional order creation with atomic inventory update)
router.post('/checkout', requireAuth, validateCheckout, async (req, res, next) => {
  const client = await getClient();

  try {
    const {
      items, // array of { productId, size, color, quantity }
      shippingAddress, // { name, phone, address, city, state, pincode }
      paymentMethod = 'UPI',
      couponCode = null
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot checkout with an empty bag.' });
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.city) {
      return res.status(400).json({ success: false, error: 'Recipient name and shipping city are required.' });
    }

    // Begin ACID transaction
    await client.query('BEGIN');

    let subtotal = 0;
    const validatedItems = [];

    // Verify each item's stock and price in the database
    for (const item of items) {
      const prodRes = await client.query(
        'SELECT id, name, price, stock_count, in_stock FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: `Product with ID "${item.productId}" was not found.`
        });
      }

      const product = prodRes.rows[0];
      const requestedQty = parseInt(item.quantity, 10) || 1;

      if (!product.in_stock || product.stock_count < requestedQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: `Overselling prevented: "${product.name}" only has ${product.stock_count} units available.`
        });
      }

      // Atomically decrement stock
      const newStock = product.stock_count - requestedQty;
      await client.query(
        'UPDATE products SET stock_count = $1, in_stock = ($1 > 0), updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, product.id]
      );

      const itemTotal = product.price * requestedQty;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: requestedQty,
        size: item.size || 'M',
        color: item.color || null
      });
    }

    // Calculate totals on backend
    let discount = 0;
    if (couponCode === 'STYLE10' || couponCode === 'CLOUD10' || couponCode === 'SS25') {
      discount = Math.round(subtotal * 0.10);
    } else if (couponCode === 'CLOUD20') {
      discount = Math.round(subtotal * 0.20);
    }

    const isFreeShipping = subtotal >= 1999;
    const shipping = isFreeShipping ? 0 : 150;
    const tax = Math.round((subtotal - discount) * 0.12);
    const total = subtotal - discount + tax + shipping;

    const orderId = `ORD-2025-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert order record
    await client.query(
      `INSERT INTO orders (
        id, user_id, customer_name, customer_email, subtotal, discount,
        tax, shipping, total, status, payment_method, destination_address,
        destination_city, destination_state, destination_pincode
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Processing', $10, $11, $12, $13, $14)`,
      [
        orderId,
        req.user.id,
        shippingAddress.name,
        req.user.email,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        paymentMethod,
        shippingAddress.address || '',
        shippingAddress.city || '',
        shippingAddress.state || '',
        shippingAddress.pincode || ''
      ]
    );

    // Insert order items
    for (const item of validatedItems) {
      const itemId = `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await client.query(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, selected_color, selected_size, quantity, unit_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          itemId,
          orderId,
          item.productId,
          item.name,
          item.color ? JSON.stringify(item.color) : null,
          item.size,
          item.quantity,
          item.price
        ]
      );
    }

    // Clear user's cart in database if cart exists
    const cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [req.user.id]);
    if (cartRes.rows.length > 0) {
      await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
    }

    // Commit ACID transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created and inventory allocated successfully.',
      order: {
        id: orderId,
        customer: shippingAddress.name,
        email: req.user.email,
        total,
        subtotal,
        discount,
        tax,
        shipping,
        status: 'Processing',
        paymentMethod,
        itemsCount: validatedItems.length
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/orders/my-orders (Customer order history)
router.get('/my-orders', requireAuth, async (req, res, next) => {
  try {
    const ordersResult = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const orders = ordersResult.rows;
    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = ANY($1)',
      [orderIds]
    );

    const itemsByOrder = {};
    for (const item of itemsResult.rows) {
      if (!itemsByOrder[item.order_id]) {
        itemsByOrder[item.order_id] = [];
      }
      itemsByOrder[item.order_id].push({
        id: item.id,
        productName: item.product_name,
        size: item.selected_size,
        color: typeof item.selected_color === 'string' ? JSON.parse(item.selected_color) : item.selected_color,
        qty: item.quantity,
        price: item.unit_price
      });
    }

    const ordersWithItems = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    res.json({
      success: true,
      orders: ordersWithItems
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id (Order details - customer only sees own order)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Check authorization: customer can only view their own order
    if (req.user.role !== 'Admin' && order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view this order.'
      });
    }

    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [id]);

    res.json({
      success: true,
      order: {
        ...order,
        items: itemsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
