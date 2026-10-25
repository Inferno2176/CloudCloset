import express from 'express';
import { query } from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validateStockUpdate } from '../middleware/validation.js';
import { uploadProductImage, deleteProductImage, getPresignedViewUrl } from '../services/s3Service.js';
import { formatProductRow } from './productRoutes.js';

const router = express.Router();

// All routes in this router require verified Admin role
router.use(requireAdmin);

// GET /api/admin/orders (Fetch all orders across the atelier storefront)
router.get('/orders', async (req, res, next) => {
  try {
    const { status } = req.query;

    let queryText = 'SELECT * FROM orders';
    const queryParams = [];

    if (status && status !== 'All') {
      queryParams.push(status);
      queryText += ' WHERE status = $1';
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, queryParams);
    const orderRows = result.rows;

    if (orderRows.length === 0) {
      return res.json({ success: true, count: 0, orders: [] });
    }

    const orderIds = orderRows.map(o => o.id);
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
        name: item.product_name,
        size: item.selected_size,
        qty: item.quantity,
        price: item.unit_price
      });
    }

    const orders = orderRows.map(o => ({
      id: o.id,
      customer: o.customer_name,
      email: o.customer_email,
      date: o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '2026-10-20',
      total: o.total,
      status: o.status,
      payment: o.payment_method,
      destination: `${o.destination_city || 'City'} (${o.destination_pincode || ''})`,
      items: itemsByOrder[o.id] || []
    }));

    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/orders/:id/status (Update order status)
router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`
      });
    }

    const result = await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    res.json({
      success: true,
      message: `Order ${id} status updated to ${status}.`,
      order: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products (Create a new product)
router.post('/products', async (req, res, next) => {
  const {
    name,
    category,
    gender = 'Men',
    price,
    originalPrice,
    stockCount = 10,
    provenance = '100% GOTS Organic',
    description = '',
    fabric = '',
    care = '',
    origin = 'Crafted in Indian Atelier',
    colors = [],
    sizes = [],
    s3Key = null,
    images = []
  } = req.body;

  if (!name || price === undefined || price === null || price === '') {
    return res.status(400).json({
      success: false,
      error: 'Product name and price are required.'
    });
  }

  const numPrice = parseInt(price, 10);
  if (isNaN(numPrice) || numPrice <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Price must be a valid positive number.'
    });
  }

  const id = `cc-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
  let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!baseSlug) baseSlug = `garment-${id}`;

  try {
    // Ensure slug is unique
    const slugCheck = await query('SELECT id FROM products WHERE slug = $1', [baseSlug]);
    const slug = slugCheck.rows.length > 0 ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    // Map category string to category_id using case-insensitive lookup
    let categoryId = null;
    let categoryName = category || 'Shirts';
    if (category) {
      const catRes = await query(
        'SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1) OR id = $1 LIMIT 1',
        [category.trim()]
      );
      if (catRes.rows.length > 0) {
        categoryId = catRes.rows[0].id;
        categoryName = catRes.rows[0].name;
      }
    }

    const parsedStock = parseInt(stockCount, 10);
    const stock = isNaN(parsedStock) ? 10 : Math.max(0, parsedStock);
    const origPrice = parseInt(originalPrice, 10) || numPrice + 500;

    const result = await query(
      `INSERT INTO products (
        id, name, slug, category_id, gender, price, original_price,
        stock_count, provenance, description, fabric, care, origin,
        in_stock, is_new_arrival, colors, sizes, s3_key, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        id,
        name.trim(),
        slug,
        categoryId,
        gender,
        numPrice,
        origPrice,
        stock,
        provenance,
        description,
        fabric,
        care,
        origin,
        stock > 0,
        true, // is_new_arrival: freshly created garments appear in New Arrivals
        JSON.stringify(colors),
        JSON.stringify(sizes),
        s3Key || null,
        JSON.stringify(images)
      ]
    );

    const insertedRow = result.rows[0];
    insertedRow.category_name = categoryName;
    const formattedProduct = formatProductRow(insertedRow);

    // Attach fresh presigned URL if product has an S3 key
    if (formattedProduct.s3Key) {
      try {
        formattedProduct.presignedImageUrl = await getPresignedViewUrl(formattedProduct.s3Key);
      } catch (_e) {
        // Fallback to images[0]
      }
    }

    res.status(201).json({
      success: true,
      message: `Garment "${name}" created in inventory.`,
      product: formattedProduct
    });
  } catch (err) {
    // Safety handling for orphaned S3 object:
    // If product creation failed in PostgreSQL and an S3 object was uploaded for this attempt,
    // verify whether any other product references this s3Key before deleting it.
    if (s3Key) {
      try {
        const refCheck = await query('SELECT id FROM products WHERE s3_key = $1 LIMIT 1', [s3Key]);
        if (refCheck.rows.length === 0) {
          console.warn(`[Orphan Cleanup] DB insertion failed for "${name}". Safely removing orphaned S3 key: "${s3Key}"`);
          await deleteProductImage(s3Key);
        }
      } catch (cleanupErr) {
        console.warn(`[Orphan Cleanup Warning] Could not remove orphaned S3 key "${s3Key}":`, cleanupErr.message);
      }
    }
    next(err);
  }
});

// PATCH /api/admin/products/:id/stock (Update product stock count)
router.patch('/products/:id/stock', validateStockUpdate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stockCount } = req.body;

    const count = parseInt(stockCount, 10);
    if (isNaN(count) || count < 0) {
      return res.status(400).json({ success: false, error: 'Valid non-negative stock count required.' });
    }

    const result = await query(
      'UPDATE products SET stock_count = $1, in_stock = ($1 > 0), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, stock_count, in_stock',
      [count, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    res.json({
      success: true,
      message: `Stock updated for ${result.rows[0].name}.`,
      product: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id (Delete product)
router.delete('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Retrieve S3 key before deletion to clean up S3 object
    const prodRes = await query('SELECT s3_key FROM products WHERE id = $1', [id]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const s3Key = prodRes.rows[0].s3_key;
    if (s3Key) {
      try {
        await deleteProductImage(s3Key);
      } catch (err) {
        console.warn(`Could not delete S3 image ${s3Key}:`, err.message);
      }
    }

    await query('DELETE FROM products WHERE id = $1', [id]);

    res.json({
      success: true,
      message: `Product ${id} deleted from atelier inventory.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/upload-image (Upload product image to Amazon S3)
router.post('/upload-image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded. Please select a JPEG, PNG, or WebP photograph.'
      });
    }

    const productId = req.body.productId || `prod-${Date.now().toString().slice(-4)}`;
    const imageType = req.body.imageType || 'primary'; // 'primary' or 'gallery'
    const timestamp = Date.now();
    const ext = req.file.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : req.file.mimetype.split('/')[1] || 'webp';
    const s3Key = `products/${productId}/${imageType}-${timestamp}.${ext}`;

    const uploadResult = await uploadProductImage(req.file.buffer, s3Key, req.file.mimetype);
    const presignedUrl = uploadResult.presignedUrl || (await getPresignedViewUrl(uploadResult.key));

    res.json({
      success: true,
      message: 'Product photograph uploaded to Amazon S3 successfully.',
      s3Key: uploadResult.key,
      url: uploadResult.url,
      presignedUrl,
      bucket: uploadResult.bucket,
      isMock: uploadResult.isMock
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cleanup-orphan (Safely cleanup orphaned S3 image if product creation fails or is cancelled)
router.post('/cleanup-orphan', async (req, res, next) => {
  try {
    const { s3Key } = req.body;
    if (!s3Key || typeof s3Key !== 'string') {
      return res.status(400).json({
        success: false,
        error: 's3Key is required for orphan cleanup.'
      });
    }

    // Safety check: Avoid deleting objects that might already be referenced by products
    const refCheck = await query(
      'SELECT id FROM products WHERE s3_key = $1 OR images::text LIKE $2 LIMIT 1',
      [s3Key, `%${s3Key}%`]
    );

    if (refCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete S3 key "${s3Key}": Referenced by existing product ${refCheck.rows[0].id}.`
      });
    }

    await deleteProductImage(s3Key);

    res.json({
      success: true,
      message: `Orphaned S3 object "${s3Key}" cleaned up successfully.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
