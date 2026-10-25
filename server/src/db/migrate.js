import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('--- Starting CloudCloset PostgreSQL Migrations ---');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split schema into individual executable statements to handle multi-statement execution cleanly
  const statements = schemaSql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  for (const statement of statements) {
    try {
      await query(statement);
    } catch (err) {
      console.error(`Migration error on statement:\n${statement.slice(0, 100)}...\n`, err.message);
      throw err;
    }
  }

  console.log(`Successfully executed ${statements.length} migration statements.`);
  console.log('Tables initialized: categories, users, products, carts, cart_items, wishlists, orders, order_items.');
}

// Execute directly if run as a standalone CLI script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => {
      console.log('Migration completed successfully.');
      return closePool();
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
