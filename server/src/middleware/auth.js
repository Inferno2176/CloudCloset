import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production.');
    }
    return 'atelier_cloudcloset_super_secret_jwt_key_2026_dev_only';
  }
  return secret;
}

/**
 * Global authentication parser.
 * Inspects Authorization: Bearer <token> header and attaches decoded user or authError to req.
 */
export function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    req.authError = null;
    return next();
  }

  if (!authHeader.startsWith('Bearer ')) {
    req.user = null;
    req.authError = 'malformed';
    return next();
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    req.user = null;
    req.authError = 'missing_token';
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded; // { id, email, role, name }
    req.authError = null;
    next();
  } catch (err) {
    req.user = null;
    if (err.name === 'TokenExpiredError') {
      req.authError = 'expired';
    } else {
      req.authError = 'invalid';
    }
    next();
  }
}

/**
 * Enforces authenticated member status.
 * Rejects missing, expired, and malformed tokens with explicit 401 responses.
 */
export function requireAuth(req, res, next) {
  if (req.user) {
    return next();
  }

  if (req.authError === 'expired') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token has expired. Please sign in again.'
    });
  }

  if (req.authError === 'malformed' || req.authError === 'invalid' || req.authError === 'missing_token') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or malformed authentication token. Please sign in with valid credentials.'
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Authentication required. Please sign in to access this resource.'
  });
}

/**
 * Enforces verified Administrator privileges.
 * Strictly verifies the server-side issued role rather than any client-supplied role parameter.
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    if (req.authError === 'expired') {
      return res.status(401).json({
        success: false,
        error: 'Administrator session expired. Please sign in again.'
      });
    }
    if (req.authError === 'invalid' || req.authError === 'malformed' || req.authError === 'missing_token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid or malformed authentication token. Please sign in with valid credentials.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to access this resource.'
    });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Administrator privileges required.'
    });
  }

  next();
}

/**
 * Signs a new JWT token with standard expiration window.
 */
export function generateToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}
