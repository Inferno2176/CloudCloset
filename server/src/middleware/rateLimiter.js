import rateLimit from 'express-rate-limit';

/**
 * CloudCloset Atelier API Rate Limiting Middleware
 * Protects sensitive authentication and resource endpoints against brute force and DDoS.
 */

// Rate limiter for authentication endpoints (/api/auth/login, /api/auth/register, /api/auth/change-password)
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : parseInt(process.env.RATE_LIMIT_MAX_AUTH || '30', 10), // 30 requests per 15 min window in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  },
  skip: (_req) => {
    // In test environment, allow tests to selectively bypass unless testing rate limiting explicitly
    return process.env.NODE_ENV === 'test' && !process.env.ENABLE_TEST_RATE_LIMIT;
  }
});

// Strict limiter for testing or targeted brute-force protection
export const strictAuthLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  }
});
