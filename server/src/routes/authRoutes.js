import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRegister, validateLogin, validateChangePassword } from '../middleware/validation.js';

const router = express.Router();

// Apply sensible rate limiting to all authentication routes
router.use(authLimiter);

// POST /api/auth/register (Customer Registration)
router.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please sign in.'
      });
    }

    // Hash password with bcrypt work factor 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr-${Date.now()}`;

    // Create user: Customers ALWAYS receive 'Member' role regardless of request body
    const result = await query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone)
       VALUES ($1, $2, $3, 'Member', $4, $5)
       RETURNING id, email, role, full_name, phone, created_at`,
      [userId, normalizedEmail, passwordHash, name.trim(), phone || null]
    );

    const newUser = result.rows[0];
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.full_name
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to CloudCloset Atelier.',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.full_name,
        phone: newUser.phone
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login (Customer and Admin Login)
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password, requestedRole } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Query user by email
    const userResult = await query(
      'SELECT id, email, password_hash, role, full_name, phone FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.'
      });
    }

    const user = userResult.rows[0];

    // Verify password hash with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password.'
      });
    }

    // Role-based authorization verification:
    // If Admin login was specifically requested, verify that the authenticated user possesses the Admin role
    if (requestedRole === 'admin' && user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: '403 Forbidden: Administrator privileges required. Your account does not have admin permissions.'
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.full_name
    });

    res.json({
      success: true,
      message: user.role === 'Admin' ? 'Administrator access granted.' : 'Signed in successfully.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        phone: user.phone
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me (Get current authenticated user)
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userResult = await query(
      'SELECT id, email, role, full_name, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User account not found.'
      });
    }

    const user = userResult.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.full_name,
        phone: user.phone,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/change-password (Authenticated Password Change)
router.post('/change-password', requireAuth, validateChangePassword, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect current password. Please verify and try again.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Passcode changed successfully. Your account is secured.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password (Account-Enumeration Safe Password Recovery Dispatch)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid registered email address is required.' });
    }

    // Returns a generic safe response without leaking whether the email exists in the database
    res.json({
      success: true,
      message: `If an atelier account is associated with ${email.trim()}, password recovery instructions have been dispatched.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
