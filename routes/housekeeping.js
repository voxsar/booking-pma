'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const STATUS_FLOW    = ['dirty', 'cleaning', 'clean', 'inspected'];
const VALID_STATUSES = ['dirty', 'cleaning', 'clean', 'inspected', 'maintenance'];
const r = Router();

r.get('/', async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM housekeepingTasks WHERE 1=1';
    const args = [];
    if (req.query.status)     { sql += ' AND status = ?';     args.push(req.query.status);     }
    if (req.query.roomId)     { sql += ' AND roomId = ?';     args.push(req.query.roomId);     }
    if (req.query.priority)   { sql += ' AND priority = ?';   args.push(req.query.priority);   }
    if (req.query.assignedTo) { sql += ' AND assignedTo = ?'; args.push(req.query.assignedTo); }
    sql += ' ORDER BY due';
    const [rows] = await pool.query(sql, args);
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, roomId, status, assignedTo, priority, due, notes } = req.body;
    if (!id || !roomId) return res.status(400).json({ error: 'id and roomId required' });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    await pool.execute('INSERT INTO housekeepingTasks (id,roomId,status,assignedTo,priority,due,notes) VALUES (?,?,?,?,?,?,?)',
      [id, roomId, status ?? 'dirty', assignedTo ?? null, priority ?? 'medium', due ?? null, notes ?? null]);
    const [[row]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [id]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { roomId, status, assignedTo, priority, due, notes } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    await pool.execute('UPDATE housekeepingTasks SET roomId=?,status=?,assignedTo=?,priority=?,due=?,notes=? WHERE id=?',
      [roomId ?? existing.roomId, status ?? existing.status,
       assignedTo !== undefined ? assignedTo : existing.assignedTo,
       priority ?? existing.priority, due ?? existing.due,
       notes !== undefined ? notes : existing.notes, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/:id/advance', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const idx = STATUS_FLOW.indexOf(existing.status);
    if (idx === -1 || idx === STATUS_FLOW.length - 1)
      return res.status(409).json({ error: `Task in "${existing.status}" cannot be advanced` });
    const next_status = STATUS_FLOW[idx + 1];
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.execute('UPDATE housekeepingTasks SET status=? WHERE id=?', [next_status, req.params.id]);
      if (next_status === 'clean' || next_status === 'inspected') {
        await conn.execute('UPDATE rooms SET status=? WHERE id=?', ['clean', existing.roomId]);
      } else if (next_status === 'cleaning') {
        await conn.execute('UPDATE rooms SET status=? WHERE id=?', ['dirty', existing.roomId]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    const [[task]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    const [[room]] = await pool.query('SELECT * FROM rooms WHERE id = ?', [existing.roomId]);
    res.json({ task, room });
  } catch (e) { next(e); }
});

r.patch('/:id/assign', async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    const [[row]] = await pool.query('SELECT id FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await pool.execute('UPDATE housekeepingTasks SET assignedTo=? WHERE id=?', [assignedTo ?? null, req.params.id]);
    const [[updated]] = await pool.query('SELECT * FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM housekeepingTasks WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
