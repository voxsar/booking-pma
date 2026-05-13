'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const VALID_STATUSES = ['available', 'occupied', 'dirty', 'clean', 'maintenance'];
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM rooms WHERE 1=1';
    const args = [];
    if (req.query.propertyId) { sql += ' AND propertyId = ?'; args.push(req.query.propertyId); }
    if (req.query.status)     { sql += ' AND status = ?';     args.push(req.query.status);     }
    if (req.query.typeId)     { sql += ' AND typeId = ?';     args.push(req.query.typeId);      }
    sql += ' ORDER BY floor, number';
    const [rows] = await pool.query(sql, args);
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, number, floor, typeId, status, propertyId } = req.body;
    if (!id || !number || !propertyId) return res.status(400).json({ error: 'id, number, propertyId required' });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    await pool.execute('INSERT INTO rooms (id,number,floor,typeId,status,propertyId) VALUES (?,?,?,?,?,?)',
      [id, number, floor ?? 1, typeId ?? null, status ?? 'available', propertyId]);
    const [[row]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { number, floor, typeId, status, propertyId } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    await pool.execute('UPDATE rooms SET number=?,floor=?,typeId=?,status=?,propertyId=? WHERE id=?',
      [number ?? existing.number, floor ?? existing.floor, typeId ?? existing.typeId,
       status ?? existing.status, propertyId ?? existing.propertyId, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    const [[row]] = await pool.query('SELECT id FROM rooms WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await pool.execute('UPDATE rooms SET status=? WHERE id=?', [status, req.params.id]);
    const [[updated]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
