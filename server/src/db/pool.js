import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { newDb } from 'pg-mem';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolInstance = null;
let memDb = null;

/**
 * Validates database environment configuration at runtime.
 * Fails fast with clear, safe error messages that do not expose credentials.
 */
export function validateDatabaseConfig() {
  if (process.env.NODE_ENV === 'test' || process.env.USE_PG_MEM === 'true') {
    return;
  }

  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      if (!parsed.protocol.startsWith('postgres')) {
        throw new Error('DATABASE_URL protocol must be postgresql:// or postgres://');
      }
      return;
    } catch (_err) {
      throw new Error('Invalid DATABASE_URL configuration. Please check your environment connection string.');
    }
  }

  // If DATABASE_URL is not set, discrete parameters are required
  const required = ['DB_HOST', 'DB_NAME', 'DB_USER'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Incomplete PostgreSQL database configuration. Missing environment variable(s): ${missing.join(', ')}. ` +
      `Please provide DATABASE_URL or set all required DB_* parameters.`
    );
  }
}

/**
 * Resolves SSL configuration for Amazon RDS or local PostgreSQL.
 * Uses proper TLS certificate validation rather than disabling security with rejectUnauthorized: false.
 */
function resolveSslConfig() {
  const isSslRequested =
    process.env.DB_SSL === 'true' ||
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require'));

  if (!isSslRequested) {
    return false;
  }

  // Check for custom CA cert path, or fallback to bundled Amazon RDS Global Trust Store
  const customCaPath = process.env.DB_CA_CERT;
  const defaultRdsCaPath = path.join(__dirname, '..', 'config', 'rds-ca-bundle.pem');

  let caPath = null;
  if (customCaPath && fs.existsSync(customCaPath)) {
    caPath = customCaPath;
  } else if (fs.existsSync(defaultRdsCaPath)) {
    caPath = defaultRdsCaPath;
  }

  if (caPath) {
    return {
      rejectUnauthorized: true,
      ca: fs.readFileSync(caPath, 'utf8')
    };
  }

  if (process.env.DB_SSL_ALLOW_SELF_SIGNED === 'true') {
    console.warn('[SECURITY WARNING] Connecting to PostgreSQL with rejectUnauthorized: false. Not recommended for production.');
    return { rejectUnauthorized: false };
  }

  // Default to standard TLS verification
  return { rejectUnauthorized: true };
}

/**
 * Returns the singleton connection pool instance.
 */
export function getPool() {
  if (poolInstance) return poolInstance;

  // In-memory database emulation reserved exclusively for isolated unit testing
  if (process.env.NODE_ENV === 'test' || process.env.USE_PG_MEM === 'true') {
    if (!memDb) {
      memDb = newDb();
      memDb.public.registerFunction({
        name: 'current_database',
        implementation: () => 'cloudcloset_test'
      });
      memDb.public.registerFunction({
        name: 'version',
        implementation: () => 'PostgreSQL 16.0 (pg-mem test fixture)'
      });
    }
    const adapter = memDb.adapters.createPg();
    poolInstance = new adapter.Pool();
    return poolInstance;
  }

  // Validate persistent PostgreSQL configuration
  validateDatabaseConfig();

  const sslConfig = resolveSslConfig();

  const poolConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: sslConfig,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '5000', 10)
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'cloudcloset',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: sslConfig,
        max: parseInt(process.env.DB_POOL_MAX || '20', 10),
        idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
        connectionTimeoutMillis: parseInt(process.env.DB_POOL_CONN_TIMEOUT || '5000', 10)
      };

  poolInstance = new Pool(poolConfig);

  // Handle transient errors on idle clients so they do not crash the Node.js process
  poolInstance.on('error', (err) => {
    console.error('[PostgreSQL Pool Warning] Unexpected idle client error:', err.message);
  });

  return poolInstance;
}

/**
 * Executes a parameterized SQL query safely against the connection pool.
 */
export async function query(text, params) {
  const pool = getPool();
  return pool.query(text, params);
}

/**
 * Acquires a dedicated client from the pool for multi-statement ACID transactions.
 */
export async function getClient() {
  const pool = getPool();
  return pool.connect();
}

/**
 * Gracefully shuts down the connection pool during application termination.
 */
export async function closePool() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    memDb = null;
  }
}
