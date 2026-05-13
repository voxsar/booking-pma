'use strict';
const { Router } = require('express');
const { getDb }  = require('../db');
const VALID_STATUSES = ['available', 'occupied', 'dirty', 'clean', 'maintenance'];
const r = Router();

r.get('/', (req, res) => {
  let sql    = 'SELECT * FROM rooms WHERE 1=1';
  const args = [];
  if (req.query.propertyId) { sql += ' AND propertyId = ?'; args.push(req.query.propertyId); }
  if (req.query.status)     { sql += ' AND status = ?';     args.push(req.query.status);     }
  if (req.query.typeId)     { sql += ' AND typeId = ?';     args.push(req.query.typeId);     }
  sql += ' ORDER BY floor, number';
  res.json(getDb().prepare(sql).all(...args));
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

r.post('/', (req, res) => {
  const { id, number, floor, typeId, status, propertyId } = req.body;
  if (!id || !number || !propertyId) return res.status(400).json({ error: 'id, number, propertyId required' });
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  getDb().prepare(
    'INSERT INTO rooms (id, number, floor, typeId, status, propertyId) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, number, floor ?? 1, typeId ?? null, status ?? 'available', propertyId);
  res.status(201).json(getDb().prepare('SELECT * FROM rooms WHERE id = ?').get(id));
});

r.put('/:id', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { number, floor, typeId, status, propertyId } = req.body;
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  db.prepare('UPDATE rooms SET number=?, floor=?, typeId=?, status=?, propertyId=? WHERE id=?').run(
    number     ?? row.number,
    floor      ?? row.floor,
    typeId     ?? row.typeId,
    status     ?? row.status,
    propertyId ?? row.propertyId,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id));
});

/* PATCH /rooms/:id/status — quick status change */
r.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  const db  = getDb();
  const row = db.prepare('SELECT id FROM rooms WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE rooms SET status=? WHERE id=?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
