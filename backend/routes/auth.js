/**
 * routes/auth.js - Authentication Routes
 * Handles user registration, login, profile retrieval
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ── Register User ────────────────────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const db = getDB();

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username or email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const stmt = db.prepare('INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)');
    const info = stmt.run(username, email, hashedPassword, full_name);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: { id: info.lastInsertRowid, username, email, full_name },
    });
  } catch (error) {
    next(error);
  }
});

// ── Login User ───────────────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const db = getDB();

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, full_name: user.full_name },
    });
  } catch (error) {
    next(error);
  }
});

// ── Get Current Profile ──────────────────────────────────────────────────────
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
