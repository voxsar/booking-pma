'use strict';
const { Router }  = require('express');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const { pool }    = require('../db');

const r = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kavpms-secret-change-in-production';

/* ── POST /api/auth/login ── */
r.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password required' });
    }

    const [[user]] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
      },
    });
  } catch (e) { next(e); }
});

/* ── GET /api/auth/me ── */
r.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const [[user]] = await pool.query('SELECT id,username,name,role,email FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(e);
  }
});

/* ── POST /api/auth/logout ── (client-side, no server state) ── */
r.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = r;
