'use strict';
const { Router } = require('express');
const { getDb }  = require('../db');
const r = Router();

r.get('/', (req, res) => {
  const rows = getDb().prepare('SELECT * FROM properties ORDER BY name').all();
  res.json(rows);
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

r.post('/', (req, res) => {
  const { id, name, code, city, rooms, type } = req.body;
  if (!id || !name || !code) return res.status(400).json({ error: 'id, name, code required' });
  getDb().prepare(
    'INSERT INTO properties (id, name, code, city, rooms, type) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name, code, city ?? null, rooms ?? 0, type ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM properties WHERE id = ?').get(id));
});

r.put('/:id', (req, res) => {
  const db       = getDb();
  const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { name, code, city, rooms, type } = req.body;
  db.prepare(
    'UPDATE properties SET name=?, code=?, city=?, rooms=?, type=? WHERE id=?'
  ).run(
    name  ?? existing.name,
    code  ?? existing.code,
    city  ?? existing.city,
    rooms ?? existing.rooms,
    type  ?? existing.type,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM properties WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
