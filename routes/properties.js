'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const r = Router();

r.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM properties ORDER BY name');
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
    const { id, name, code, city, rooms, type } = req.body;
    if (!id || !name || !code) return res.status(400).json({ error: 'id, name, code required' });
    await pool.execute('INSERT INTO properties (id,name,code,city,rooms,type) VALUES (?,?,?,?,?,?)',
      [id, name, code, city ?? null, rooms ?? 0, type ?? null]);
    const [[row]] = await pool.query('SELECT * FROM properties WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM properties WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, code, city, rooms, type } = req.body;
    await pool.execute('UPDATE properties SET name=?,code=?,city=?,rooms=?,type=? WHERE id=?',
      [name ?? existing.name, code ?? existing.code, city ?? existing.city,
       rooms ?? existing.rooms, type ?? existing.type, req.params.id]);
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
