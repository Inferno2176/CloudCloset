import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import app from './app.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { query, closePool, validateDatabaseConfig } from './db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = parseInt(process.env.PORT || '5001', 10);

/**
 * Validates that all required application tables exist in the database schema.
 */
export async function verifyDatabaseSchema() {
  const requiredTables = [
    'categories',
    'users',
    'products',
    'carts',
    'cart_items',
    'wishlists',
    'orders',
    'order_items'
  ];

  for (const table of requiredTables) {
    try {
      await query(`SELECT 1 FROM "${table}" LIMIT 1`);
    } catch (_err) {
      throw new Error(`Database schema validation failed. Missing required table: ${table}`);
    }
  }
  return true;
}

/**
 * Initializes catalogue state safely.
 * In development / test, automatically runs idempotent seed if products table is empty.
 * In production, demo seeding is strictly disabled; verifies schema validity and logs a clear warning.
 */
export async function initializeCatalogueState(isProduction = (process.env.NODE_ENV === 'production')) {
  const productCountRes = await query('SELECT count(*)::int as count FROM products');
  const existingCount = productCountRes.rows[0].count;

  if (existingCount === 0) {
    if (isProduction) {
      // In production: do NOT seed demo data. Verify schema and proceed safely.
      await verifyDatabaseSchema();
      console.warn(
        '[Production Safety Warning] Products table is currently empty. Automatic demo seeding is disabled in production to protect data integrity. Please populate production inventory via administrative tools or official migrations.'
      );
      return { seeded: false, count: 0, isProduction: true };
    } else {
      console.log('Database empty in development/test. Running initial idempotent seed...');
      await seedDatabase();
      return { seeded: true, count: 60, isProduction: false };
    }
  }

  console.log(`Database ready. Current catalog contains ${existingCount} archival garments.`);
  return { seeded: false, count: existingCount, isProduction };
}

async function startServer() {
  try {
    console.log('--- Initializing CloudCloset Atelier API Server ---');

    // 1. Validate environment configuration before booting
    validateDatabaseConfig();

    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('FATAL: JWT_SECRET environment variable must be configured in production.');
      } else {
        console.warn('[Security Warning] JWT_SECRET not configured. Using development fallback secret.');
      }
    }

    // 2. Run database migrations to ensure schema tables & indexes exist
    await runMigrations();

    // 3. Initialize catalogue state safely (skips seeding in production)
    await initializeCatalogueState();

    // 4. Start HTTP Express Server
    const server = app.listen(PORT, () => {
      console.log(`CloudCloset Atelier API running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Database health check: http://localhost:${PORT}/api/health/db`);
    });

    // 5. Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down CloudCloset server...`);
      server.close(async () => {
        try {
          await closePool();
          console.log('PostgreSQL connection pool closed successfully.');
          process.exit(0);
        } catch (poolErr) {
          console.error('Error closing database pool:', poolErr.message);
          process.exit(1);
        }
      });

      // Force shutdown if graceful cleanup takes longer than 10 seconds
      setTimeout(() => {
        console.error('Shutdown timed out. Terminating process forcibly.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('Fatal error during CloudCloset server startup:', err.message);
    process.exit(1);
  }
}

const isDirectRun = Boolean(
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  startServer();
}

export { startServer };
