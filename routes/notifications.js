'use strict';
const { Router }               = require('express');
const { getDb, hydrateNotif }  = require('../db');
const r = Router();

r.get('/', (req, res) => {
  let sql    = 'SELECT * FROM notifications WHERE 1=1';
  if (req.query.unread === '1') { sql += ' AND read = 0'; }
  sql += ' ORDER BY rowid DESC';
  res.json(getDb().prepare(sql).all().map(hydrateNotif));
});

r.post('/', (req, res) => {
  const { id, title, sub, time } = req.body;
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  getDb().prepare(
    'INSERT INTO notifications (id, read, time, title, sub) VALUES (?, 0, ?, ?, ?)'
  ).run(id, time ?? 'Just now', title, sub ?? null);
  res.status(201).json(hydrateNotif(getDb().prepare('SELECT * FROM notifications WHERE id = ?').get(id)));
});

/* PATCH /notifications/:id/read */
r.patch('/:id/read', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT id FROM notifications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE notifications SET read=1 WHERE id=?').run(req.params.id);
  res.json(hydrateNotif(db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id)));
});

/* POST /notifications/mark-all-read */
r.post('/mark-all-read', (req, res) => {
  getDb().prepare('UPDATE notifications SET read=1').run();
  res.json({ ok: true });
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
