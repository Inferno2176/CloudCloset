import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { sanitizePayload } from './middleware/validation.js';
import { query } from './db/pool.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Security HTTP headers with strict Content Security Policy allowing S3 & Unsplash assets
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://images.unsplash.com",
        "https://*.amazonaws.com",
        "https://*.s3.ap-southeast-2.amazonaws.com"
      ],
      connectSrc: [
        "'self'",
        "http://localhost:5001",
        "https://*.amazonaws.com",
        "https://*.s3.ap-southeast-2.amazonaws.com"
      ]
    }
  },
  frameguard: { action: 'deny' },
  xContentTypeOptions: true,
  xssFilter: true
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, server-to-server) or matched origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    }
    // Permissive only in local development
    return callback(null, true);
  },
  credentials: true
}));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize request bodies against prototype pollution and extraneous fields
app.use(sanitizePayload);

// Global authentication parser (extracts user from Bearer token if present)
app.use(authMiddleware);

// Public Health Check Endpoint (Verifies API and Database without leaking internal details)
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'connected';
  try {
    await query('SELECT 1');
  } catch (_err) {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    database: dbStatus,
    service: 'CloudCloset Atelier API Server',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Dedicated Database Health Check Endpoint
app.get('/api/health/db', async (_req, res) => {
  try {
    const startTime = Date.now();
    await query('SELECT 1');
    const latencyMs = Date.now() - startTime;

    res.json({
      status: 'healthy',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (_err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: 'Database connectivity unavailable.',
      timestamp: new Date().toISOString()
    });
  }
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 for unknown API endpoints
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found.'
  });
});

// Serve frontend production build when dist/ exists (e.g. on EC2 single-port deployment)
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    index: false
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Central error handler
app.use(errorHandler);

export default app;
