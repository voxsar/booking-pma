'use strict';
const router = require('express').Router();
const crypto = require('crypto');
const { pool } = require('../db');

/* Only admins and managers can manage API keys */
function requireAdmin(req, res, next) {
	if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
		return res.status(403).json({ error: 'Admin access required' });
	}
	next();
}

/* GET /api/api-keys — list all keys (no plaintext returned) */
router.get('/', requireAdmin, async (req, res, next) => {
	try {
		const [rows] = await pool.query(
			`SELECT k.id, k.keyPrefix, k.name, k.createdAt, k.lastUsed,
              u.username, u.name as userName
       FROM api_keys k
       LEFT JOIN users u ON k.userId = u.id
       ORDER BY k.createdAt DESC`
		);
		res.json(rows);
	} catch (e) { next(e); }
});

/* POST /api/api-keys — create a new API key (plaintext returned ONCE) */
router.post('/', requireAdmin, async (req, res, next) => {
	try {
		const { name, userId } = req.body;
		if (!name) return res.status(400).json({ error: 'name is required' });

		/* generate: kpms_ + 32 random hex chars = 37 chars total */
		const raw = 'kpms_' + crypto.randomBytes(16).toString('hex');
		const prefix = raw.substring(0, 12);
		const hash = crypto.createHash('sha256').update(raw).digest('hex');
		const id = 'ak_' + crypto.randomBytes(8).toString('hex');

		await pool.query(
			'INSERT INTO api_keys (id, keyHash, keyPrefix, name, userId) VALUES (?, ?, ?, ?, ?)',
			[id, hash, prefix, name, userId || req.user.id || null]
		);

		res.status(201).json({
			id,
			key: raw,           /* shown ONCE — store it securely */
			keyPrefix: prefix,
			name,
			createdAt: new Date().toISOString(),
			note: 'Store this key securely. It will not be shown again.',
		});
	} catch (e) { next(e); }
});

/* DELETE /api/api-keys/:id — revoke a key */
router.delete('/:id', requireAdmin, async (req, res, next) => {
	try {
		const [result] = await pool.query('DELETE FROM api_keys WHERE id = ?', [req.params.id]);
		if (result.affectedRows === 0) return res.status(404).json({ error: 'Key not found' });
		res.json({ deleted: req.params.id });
	} catch (e) { next(e); }
});

module.exports = router;
