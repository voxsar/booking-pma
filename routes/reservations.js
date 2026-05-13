'use strict';
const { Router } = require('express');
const { pool }   = require('../db');
const VALID_STATUSES = ['pending', 'active', 'completed', 'cancelled', 'noshow'];
const r = Router();

function makeReservationId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const salt = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0').toUpperCase();
  return `BK-${stamp}${salt}`;
}

r.get('/', async (req, res, next) => {
  try {
    let sql = 'SELECT * FROM reservations WHERE 1=1';
    const args = [];
    if (req.query.status)   { sql += ' AND status = ?';    args.push(req.query.status);   }
    if (req.query.guestId)  { sql += ' AND guestId = ?';   args.push(req.query.guestId);  }
    if (req.query.roomId)   { sql += ' AND roomId = ?';    args.push(req.query.roomId);   }
    if (req.query.source)   { sql += ' AND source = ?';    args.push(req.query.source);   }
    if (req.query.checkIn)  { sql += ' AND checkIn >= ?';  args.push(req.query.checkIn);  }
    if (req.query.checkOut) { sql += ' AND checkOut <= ?'; args.push(req.query.checkOut); }
    sql += ' ORDER BY checkIn DESC';
    const [rows] = await pool.query(sql, args);
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { id, guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children } = req.body;
    if (!guestId || !roomId || !checkIn || !checkOut)
      return res.status(400).json({ error: 'guestId, roomId, checkIn, checkOut required' });
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    const reservationId = id || makeReservationId();
    await pool.execute('INSERT INTO reservations (id,guestId,roomId,typeId,checkIn,checkOut,source,paymentStatus,status,total,paid,adults,children) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [reservationId, guestId, roomId, typeId ?? null, checkIn, checkOut, source ?? 'Direct',
       paymentStatus ?? 'pending', status ?? 'pending', total ?? 0, paid ?? 0, adults ?? 2, children ?? 0]);
    const [[row]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [reservationId]);
    res.status(201).json(row);
  } catch (e) { next(e); }
});

r.put('/:id', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children } = req.body;
    if (status && !VALID_STATUSES.includes(status))
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    await pool.execute('UPDATE reservations SET guestId=?,roomId=?,typeId=?,checkIn=?,checkOut=?,source=?,paymentStatus=?,status=?,total=?,paid=?,adults=?,children=? WHERE id=?',
      [guestId ?? existing.guestId, roomId ?? existing.roomId, typeId ?? existing.typeId,
       checkIn ?? existing.checkIn, checkOut ?? existing.checkOut, source ?? existing.source,
       paymentStatus ?? existing.paymentStatus, status ?? existing.status,
       total ?? existing.total, paid ?? existing.paid, adults ?? existing.adults,
       children ?? existing.children, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.post('/:id/checkin', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.status !== 'pending')
      return res.status(409).json({ error: `Cannot check in a reservation with status "${existing.status}"` });
    const assignedRoom = req.body.roomId ?? existing.roomId;
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.execute('UPDATE reservations SET status=?,roomId=? WHERE id=?', ['active', assignedRoom, req.params.id]);
      await conn.execute('UPDATE rooms SET status=? WHERE id=?', ['occupied', assignedRoom]);
      await conn.execute('UPDATE guests SET stays = stays + 1 WHERE id=?', [existing.guestId]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    const [[reservation]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    const [[room]]        = await pool.query('SELECT * FROM rooms WHERE id = ?', [assignedRoom]);
    res.json({ reservation, room });
  } catch (e) { next(e); }
});

r.post('/:id/checkout', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.status !== 'active')
      return res.status(409).json({ error: `Cannot check out a reservation with status "${existing.status}"` });
    const balance = Math.max(Number(existing.total) - Number(existing.paid || 0), 0);
    const amountPaid = req.body.amountPaid != null ? Number(req.body.amountPaid) : balance;
    const nextPaid = Math.min(Number(existing.total), Number(existing.paid || 0) + Math.max(amountPaid, 0));
    const paymentStatus = nextPaid >= Number(existing.total) ? 'completed' : nextPaid > 0 ? 'partial' : 'pending';
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      await conn.execute('UPDATE reservations SET status=?,paymentStatus=?,paid=? WHERE id=?',
        ['completed', paymentStatus, nextPaid, req.params.id]);
      await conn.execute('UPDATE rooms SET status=? WHERE id=?', ['dirty', existing.roomId]);
      await conn.execute('INSERT IGNORE INTO housekeepingTasks (id,roomId,status,priority,due) VALUES (?,?,?,?,?)',
        [`HK-${Date.now()}`, existing.roomId, 'dirty', 'medium', '14:00']);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    const [[reservation]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    const [[room]]        = await pool.query('SELECT * FROM rooms WHERE id = ?', [existing.roomId]);
    res.json({ reservation, room });
  } catch (e) { next(e); }
});

r.patch('/:id/payment', async (req, res, next) => {
  try {
    const [[existing]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const { amountPaid, paid, paymentStatus } = req.body;
    const total = Number(existing.total || 0);
    const currentPaid = Number(existing.paid || 0);
    const nextPaid = amountPaid != null
      ? Math.min(total, currentPaid + Math.max(Number(amountPaid) || 0, 0))
      : paid != null
        ? Math.min(total, Math.max(Number(paid) || 0, 0))
        : currentPaid;
    const nextPaymentStatus = paymentStatus ?? (nextPaid >= total ? 'completed' : nextPaid > 0 ? 'partial' : 'pending');
    await pool.execute('UPDATE reservations SET paid=?,paymentStatus=? WHERE id=?',
      [nextPaid, nextPaymentStatus, req.params.id]);
    const [[row]] = await pool.query('SELECT * FROM reservations WHERE id = ?', [req.params.id]);
    res.json(row);
  } catch (e) { next(e); }
});

r.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM reservations WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: req.params.id });
  } catch (e) { next(e); }
});

module.exports = r;
