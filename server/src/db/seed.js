import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { query, closePool } from './pool.js';
import { initialProducts, mockOrders } from '../../../src/data/products.js';

export async function seedDatabase() {
  console.log('--- Starting CloudCloset Database Seeding ---');

  // 1. Seed Categories
  const categories = [
    { id: 'cat-outerwear', name: 'Outerwear', slug: 'outerwear', description: 'Architectonic coats, trench silhouettes, and tailoring.' },
    { id: 'cat-shirts', name: 'Shirts', slug: 'shirts', description: 'Structured poplins, artisanal linens, and camp collar shirts.' },
    { id: 'cat-trousers', name: 'Trousers', slug: 'trousers', description: 'Pleated wide-leg, cropped wool, and relaxed linen trousers.' },
    { id: 'cat-knitwear', name: 'Knitwear', slug: 'knitwear', description: 'Fine-gauge merino, chunky ribbed knits, and cashmere blends.' },
    { id: 'cat-dresses', name: 'Dresses', slug: 'dresses', description: 'Minimalist slip dresses, draped maxis, and architectural linen gowns.' },
    { id: 'cat-accessories', name: 'Accessories', slug: 'accessories', description: 'Brutalist leather bags, vegetable-tanned wallets, and silk scarves.' }
  ];

  for (const cat of categories) {
    await query(
      `INSERT INTO categories (id, name, slug, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description`,
      [cat.id, cat.name, cat.slug, cat.description]
    );
  }
  console.log(`Seeded ${categories.length} categories.`);

  // Category mapping helper
  const categoryMap = {
    'Outerwear': 'cat-outerwear',
    'Shirts': 'cat-shirts',
    'Trousers': 'cat-trousers',
    'Knitwear': 'cat-knitwear',
    'Dresses': 'cat-dresses',
    'Accessories': 'cat-accessories'
  };

  // 2. Seed Default Users with secure bcrypt password hashes
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('atelier-admin-2025', salt);
  const customerPasswordHash = await bcrypt.hash('atelier-pass', salt);

  const defaultUsers = [
    {
      id: 'usr-admin-01',
      email: 'admin@cloudcloset.com',
      password_hash: adminPasswordHash,
      role: 'Admin',
      full_name: 'Atelier Administrator',
      phone: '+91 98100 12345'
    },
    {
      id: 'usr-customer-01',
      email: 'ananya.mehra@atelier.in',
      password_hash: customerPasswordHash,
      role: 'Member',
      full_name: 'Ananya Mehra',
      phone: '+91 98765 43210'
    }
  ];

  for (const u of defaultUsers) {
    await query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET
         role = EXCLUDED.role,
         full_name = EXCLUDED.full_name,
         phone = EXCLUDED.phone`,
      [u.id, u.email, u.password_hash, u.role, u.full_name, u.phone]
    );
  }
  console.log(`Seeded ${defaultUsers.length} default users (Admin & Customer).`);

  // 3. Seed 60 Unique Products idempotently
  let insertedCount = 0;
  for (const p of initialProducts) {
    const categoryId = categoryMap[p.category] || null;

    await query(
      `INSERT INTO products (
        id, name, slug, category_id, subcategory, gender,
        price, original_price, badge, provenance, rating, review_count,
        is_featured, is_trending, is_new_arrival, description, fabric, care,
        origin, in_stock, status, stock_count, colors, sizes,
        s3_key, gallery_keys, images
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24,
        $25, $26, $27
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        category_id = EXCLUDED.category_id,
        subcategory = EXCLUDED.subcategory,
        gender = EXCLUDED.gender,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        badge = EXCLUDED.badge,
        provenance = EXCLUDED.provenance,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        is_featured = EXCLUDED.is_featured,
        is_trending = EXCLUDED.is_trending,
        is_new_arrival = EXCLUDED.is_new_arrival,
        description = EXCLUDED.description,
        fabric = EXCLUDED.fabric,
        care = EXCLUDED.care,
        origin = EXCLUDED.origin,
        in_stock = EXCLUDED.in_stock,
        status = EXCLUDED.status,
        stock_count = EXCLUDED.stock_count,
        colors = EXCLUDED.colors,
        sizes = EXCLUDED.sizes,
        s3_key = EXCLUDED.s3_key,
        gallery_keys = EXCLUDED.gallery_keys,
        images = EXCLUDED.images`,
      [
        p.id,
        p.name,
        p.slug,
        categoryId,
        p.subcategory || '',
        p.gender,
        p.price,
        p.originalPrice || p.price,
        p.badge || null,
        p.provenance || 'Curated Atelier Line',
        p.rating || 5.0,
        p.reviewCount || 1,
        Boolean(p.isFeatured),
        Boolean(p.isTrending),
        Boolean(p.isNewArrival),
        p.description || '',
        p.fabric || '',
        p.care || '',
        p.origin || 'Indian Atelier',
        p.inStock !== false,
        p.status || 'active',
        p.stockCount || 10,
        JSON.stringify(p.colors || []),
        JSON.stringify(p.sizes || []),
        p.s3Key || null,
        JSON.stringify(p.galleryKeys || []),
        JSON.stringify(p.images || [])
      ]
    );
    insertedCount++;
  }
  console.log(`Seeded exactly ${insertedCount} archival products across Men, Women, and Unisex.`);

  // 4. Seed Mock Orders
  for (const o of mockOrders) {
    const orderRes = await query(
      `INSERT INTO orders (
        id, user_id, customer_name, customer_email, subtotal, discount,
        tax, shipping, total, status, payment_method, destination_city
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        total = EXCLUDED.total
      RETURNING id`,
      [
        o.id,
        'usr-customer-01',
        o.customer,
        o.email,
        o.total,
        0,
        Math.round(o.total * 0.12),
        0,
        o.total,
        o.status,
        o.payment,
        o.destination
      ]
    );

    if (orderRes.rows.length > 0 && Array.isArray(o.items)) {
      for (const item of o.items) {
        await query(
          `INSERT INTO order_items (
            id, order_id, product_name, selected_size, quantity, unit_price
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO NOTHING`,
          [
            `item-${o.id}-${item.name.replace(/\s+/g, '-').slice(0, 15)}`,
            o.id,
            item.name,
            item.size || 'M',
            item.qty || 1,
            item.price || 1999
          ]
        );
      }
    }
  }
  console.log(`Seeded ${mockOrders.length} initial atelier orders with line items.`);
  console.log('--- Database Seeding Completed Successfully ---');
}

// Execute directly if run as a standalone CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      return closePool();
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
