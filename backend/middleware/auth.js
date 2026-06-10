/**
 * middleware/auth.js - JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 */

const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');

/**
 * Middleware: Verify JWT token and attach user to req.user
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists in DB
    const db = getDB();
    const user = db.prepare('SELECT id, username, email, full_name FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid. User not found.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

module.exports = { authenticateToken };
