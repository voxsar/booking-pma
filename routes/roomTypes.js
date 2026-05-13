'use strict';
const { Router } = require('express');
const { getDb }  = require('../db');
const r = Router();

r.get('/', (_req, res) => {
  res.json(getDb().prepare('SELECT * FROM roomTypes ORDER BY baseRate').all());
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM roomTypes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

r.post('/', (req, res) => {
  const { id, name, baseRate, capacity } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id and name required' });
  getDb().prepare(
    'INSERT INTO roomTypes (id, name, baseRate, capacity) VALUES (?, ?, ?, ?)'
  ).run(id, name, baseRate ?? 0, capacity ?? 2);
  res.status(201).json(getDb().prepare('SELECT * FROM roomTypes WHERE id = ?').get(id));
});

r.put('/:id', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM roomTypes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { name, baseRate, capacity } = req.body;
  db.prepare('UPDATE roomTypes SET name=?, baseRate=?, capacity=? WHERE id=?').run(
    name     ?? row.name,
    baseRate ?? row.baseRate,
    capacity ?? row.capacity,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM roomTypes WHERE id = ?').get(req.params.id));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM roomTypes WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
