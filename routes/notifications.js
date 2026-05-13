'use strict';
const { Router }              = require('express');
const { pool, hydrateNotif }  = require('../db');
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM notifications WHERE 1=1';
    if (req.query.unread === '1') { sql += ' AND `read` = 0'; }
    sql += ' ORDER BY createdAt DESC';
    const [rows] = await pool.query(sql);
    res.json(rows.map(hydrateNotif));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, title, sub, time } = req.body;
    if (!id || !title) return res.status(400).json({ error: 'id and title required' });
    await pool.execute('INSERT INTO notifications (id,`read`,time,title,sub) VALUES (?,0,?,?,?)',
      [id, time ?? 'Just now', title, sub ?? null]);
    const [[row]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [id]);
    res.status(201).json(hydrateNotif(row));
  } catch (e) { next(e); }
});

r.patch('/:id/read', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT id FROM notifications WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await pool.execute('UPDATE notifications SET `read`=1 WHERE id=?', [req.params.id]);
    const [[updated]] = await pool.query('SELECT * FROM notifications WHERE id = ?', [req.params.id]);
    res.json(hydrateNotif(updated));
  } catch (e) { next(e); }
});

r.post('/mark-all-read', async (_req, res, next) => {
  try {
    await pool.execute('UPDATE notifications SET `read`=1');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
