'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const r = Router();

r.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roomTypes ORDER BY baseRate');
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM roomTypes WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, name, baseRate, capacity } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    await pool.execute('INSERT INTO roomTypes (id,name,baseRate,capacity) VALUES (?,?,?,?)',
      [id, name, baseRate ?? 0, capacity ?? 2]);
    const [[row]] = await pool.query('SELECT * FROM roomTypes WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM roomTypes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, baseRate, capacity } = req.body;
    await pool.execute('UPDATE roomTypes SET name=?,baseRate=?,capacity=? WHERE id=?',
      [name ?? existing.name, baseRate ?? existing.baseRate, capacity ?? existing.capacity, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM roomTypes WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM roomTypes WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
