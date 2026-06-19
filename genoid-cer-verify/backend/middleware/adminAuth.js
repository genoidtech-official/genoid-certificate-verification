/**
 * Admin Auth Middleware - Genoid Tech
 * Protects all admin API routes using JWT tokens
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_SECRET_KEY_2026';

/**
 * Verify JWT token from Authorization header.
 * Expected header: Authorization: Bearer <token>
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
}

module.exports = { adminAuth, JWT_SECRET };
