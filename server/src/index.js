import app from './app.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { query, closePool, validateDatabaseConfig } from './db/pool.js';

const PORT = parseInt(process.env.PORT || '5001', 10);

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

    // 3. Check if products exist; seed if empty (preserves existing catalogue)
    const productCountRes = await query('SELECT count(*)::int as count FROM products');
    const existingCount = productCountRes.rows[0].count;

    if (existingCount === 0) {
      console.log('Database empty. Running initial idempotent seed...');
      await seedDatabase();
    } else {
      console.log(`Database ready. Current catalog contains ${existingCount} archival garments.`);
    }

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

startServer();
