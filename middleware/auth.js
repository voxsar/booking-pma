'use strict';
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'kavpms-secret-change-in-production';

async function authMiddleware(req, res, next) {
	/* ── API Key auth (X-API-Key header) ── */
	const apiKey = req.headers['x-api-key'];
	if (apiKey) {
		try {
			const prefix = apiKey.substring(0, 12);
			const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
			const [[row]] = await pool.query(
				'SELECT k.*, u.id as uid, u.username, u.name as uname, u.role FROM api_keys k LEFT JOIN users u ON k.userId = u.id WHERE k.keyPrefix = ? AND k.keyHash = ?',
				[prefix, keyHash]
			);
			if (!row) return res.status(401).json({ error: 'Invalid API key' });
			/* update lastUsed asynchronously — don't block the request */
			pool.query('UPDATE api_keys SET lastUsed = NOW() WHERE id = ?', [row.id]).catch(() => { });
			req.user = { id: row.uid, username: row.username, name: row.uname, role: row.role, apiKey: true };
			return next();
		} catch (e) {
			return next(e);
		}
	}

	/* ── Bearer JWT auth ── */
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
		return next(e);
	}
}

module.exports = authMiddleware;
