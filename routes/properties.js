'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const r = Router();

function makePropertyId(name) {
  const slug = String(name || 'property').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 36);
  return `p_${slug || Date.now().toString(36)}`;
}

r.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM properties ORDER BY CASE WHEN id = 'p_fifi' THEN 0 ELSE 1 END, name");
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, name, code, city, rooms, floors, type } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name, code required' });
    const propertyId = id || makePropertyId(name);
    await pool.execute('INSERT INTO properties (id,name,code,city,rooms,floors,type) VALUES (?,?,?,?,?,?,?)',
      [propertyId, name, code, city ?? null, rooms ?? 0, floors ?? 1, type ?? null]);
    const [[row]] = await pool.query('SELECT * FROM properties WHERE id = ?', [propertyId]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, code, city, rooms, floors, type } = req.body;
    await pool.execute('UPDATE properties SET name=?,code=?,city=?,rooms=?,floors=?,type=? WHERE id=?',
      [name ?? existing.name, code ?? existing.code, city ?? existing.city,
       rooms ?? existing.rooms, floors ?? existing.floors, type ?? existing.type, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM properties WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
