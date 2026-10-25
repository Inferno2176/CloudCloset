/**
 * CloudCloset Atelier API — Request Validation & Sanitization Middleware
 * Validates request schemas and sanitizes input to prevent injection, mass assignment, and type confusion.
 */

// Basic email validation regex conforming to standard RFC 5322 pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strips dangerous prototype pollution keys and trims strings recursively
 */
export function sanitizePayload(req, _res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Customer Registration Validation
 */
export function validateRegister(req, res, next) {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      error: 'A valid full name (at least 2 characters) is required.'
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      error: 'A valid email address is required.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Secret passcode must be at least 8 characters in length.'
    });
  }

  next();
}

/**
 * Login Validation
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please provide your registered email address.'
    });
  }

  if (!password || typeof password !== 'string' || !password) {
    return res.status(400).json({
      success: false,
      error: 'Please provide your account password.'
    });
  }

  next();
}

/**
 * Password Change Validation
 */
export function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Current password is required.'
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'New password must be at least 8 characters in length.'
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      error: 'New password must be different from current password.'
    });
  }

  next();
}

/**
 * Order Checkout Validation
 */
export function validateCheckout(req, res, next) {
  const { items, shippingAddress } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot checkout with an empty bag.'
    });
  }

  for (const item of items) {
    if (!item.productId || typeof item.productId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Each item must specify a valid productId.'
      });
    }
    const qty = parseInt(item.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be a positive integer between 1 and 10,000.'
      });
    }
  }

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Shipping address object is required.'
    });
  }

  if (!shippingAddress.name || typeof shippingAddress.name !== 'string' || shippingAddress.name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Recipient full name is required for shipping.'
    });
  }

  if (!shippingAddress.city || typeof shippingAddress.city !== 'string' || shippingAddress.city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Destination city is required for delivery logistics.'
    });
  }

  next();
}

/**
 * Admin Product Stock Update Validation
 */
export function validateStockUpdate(req, res, next) {
  const { stockCount } = req.body;
  const count = parseInt(stockCount, 10);

  if (isNaN(count) || count < 0 || count > 100000) {
    return res.status(400).json({
      success: false,
      error: 'Valid non-negative stock count (0 - 100,000) is required.'
    });
  }

  req.body.stockCount = count;
  next();
}
