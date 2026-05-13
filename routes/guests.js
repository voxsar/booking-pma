'use strict';
const { Router }              = require('express');
const { pool, hydrateGuest }  = require('../db');
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM guests WHERE 1=1';
    const args = [];
    if (req.query.q) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      const like = `%${req.query.q}%`;
      args.push(like, like);
    }
    if (req.query.vip === '1') { sql += ' AND vip = 1'; }
    sql += ' ORDER BY name';
    const [rows] = await pool.query(sql, args);
    res.json(rows.map(hydrateGuest));
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(hydrateGuest(row));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, name, email, phone, nationality, idNumber, vip, stays, notes, lastStay } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });
    await pool.execute('INSERT INTO guests (id,name,email,phone,nationality,idNumber,vip,stays,notes,lastStay) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, name, email ?? null, phone ?? null, nationality ?? null, idNumber ?? null,
       vip ? 1 : 0, stays ?? 0, JSON.stringify(notes ?? []), lastStay ?? null]);
    const [[row]] = await pool.query('SELECT * FROM guests WHERE id = ?', [id]);
    res.status(201).json(hydrateGuest(row));
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { name, email, phone, nationality, idNumber, vip, stays, notes, lastStay } = req.body;
    await pool.execute('UPDATE guests SET name=?,email=?,phone=?,nationality=?,idNumber=?,vip=?,stays=?,notes=?,lastStay=? WHERE id=?',
      [name ?? existing.name, email ?? existing.email, phone ?? existing.phone,
       nationality ?? existing.nationality, idNumber ?? existing.idNumber,
       vip !== undefined ? (vip ? 1 : 0) : existing.vip,
       stays ?? existing.stays,
       notes !== undefined ? JSON.stringify(notes) : existing.notes,
       lastStay ?? existing.lastStay, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
    res.json(hydrateGuest(row));
  } catch (e) { next(e); }
});

r.patch('/:id/notes', async (req, res, next) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ error: 'note required' });
    const [[existing]] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const notes = JSON.parse(existing.notes || '[]');
    notes.push(note);
    await pool.execute('UPDATE guests SET notes=? WHERE id=?', [JSON.stringify(notes), req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM guests WHERE id = ?', [req.params.id]);
    res.json(hydrateGuest(row));
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM guests WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
