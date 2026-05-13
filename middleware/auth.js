'use strict';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kavpms-secret-change-in-production';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = authMiddleware;
