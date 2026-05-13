'use strict';
const { Router }               = require('express');
const { getDb, hydrateGuest }  = require('../db');
const r = Router();

r.get('/', (req, res) => {
  let sql    = 'SELECT * FROM guests WHERE 1=1';
  const args = [];
  if (req.query.q) {
    sql += ' AND (name LIKE ? OR email LIKE ?)';
    const like = `%${req.query.q}%`;
    args.push(like, like);
  }
  if (req.query.vip === '1') { sql += ' AND vip = 1'; }
  sql += ' ORDER BY name';
  res.json(getDb().prepare(sql).all(...args).map(hydrateGuest));
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(hydrateGuest(row));
});

r.post('/', (req, res) => {
  const { id, name, email, phone, nationality, idNumber, vip, stays, notes, lastStay } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  getDb().prepare(
    'INSERT INTO guests (id, name, email, phone, nationality, idNumber, vip, stays, notes, lastStay) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    id, name,
    email       ?? null,
    phone       ?? null,
    nationality ?? null,
    idNumber    ?? null,
    vip         ? 1 : 0,
    stays       ?? 0,
    JSON.stringify(notes ?? []),
    lastStay    ?? null
  );
  res.status(201).json(hydrateGuest(getDb().prepare('SELECT * FROM guests WHERE id = ?').get(id)));
});

r.put('/:id', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, email, phone, nationality, idNumber, vip, stays, notes, lastStay } = req.body;
  db.prepare(
    'UPDATE guests SET name=?, email=?, phone=?, nationality=?, idNumber=?, vip=?, stays=?, notes=?, lastStay=? WHERE id=?'
  ).run(
    name        ?? row.name,
    email       ?? row.email,
    phone       ?? row.phone,
    nationality ?? row.nationality,
    idNumber    ?? row.idNumber,
    vip !== undefined ? (vip ? 1 : 0) : row.vip,
    stays       ?? row.stays,
    notes !== undefined ? JSON.stringify(notes) : row.notes,
    lastStay    ?? row.lastStay,
    req.params.id
  );
  res.json(hydrateGuest(db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id)));
});

/* PATCH /guests/:id/notes — append a note */
r.patch('/:id/notes', (req, res) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'note required' });
  const db  = getDb();
  const row = db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const notes = JSON.parse(row.notes || '[]');
  notes.push(note);
  db.prepare('UPDATE guests SET notes=? WHERE id=?').run(JSON.stringify(notes), req.params.id);
  res.json(hydrateGuest(db.prepare('SELECT * FROM guests WHERE id = ?').get(req.params.id)));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM guests WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
