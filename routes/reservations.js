'use strict';
const { Router } = require('express');
const { getDb }  = require('../db');
const VALID_STATUSES = ['pending', 'active', 'completed', 'cancelled', 'noshow'];
const r              = Router();

r.get('/', (req, res) => {
  let sql    = 'SELECT * FROM reservations WHERE 1=1';
  const args = [];
  if (req.query.status)   { sql += ' AND status = ?';    args.push(req.query.status);   }
  if (req.query.guestId)  { sql += ' AND guestId = ?';   args.push(req.query.guestId);  }
  if (req.query.roomId)   { sql += ' AND roomId = ?';    args.push(req.query.roomId);   }
  if (req.query.source)   { sql += ' AND source = ?';    args.push(req.query.source);   }
  if (req.query.checkIn)  { sql += ' AND checkIn >= ?';  args.push(req.query.checkIn);  }
  if (req.query.checkOut) { sql += ' AND checkOut <= ?'; args.push(req.query.checkOut); }
  sql += ' ORDER BY checkIn DESC';
  res.json(getDb().prepare(sql).all(...args));
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

r.post('/', (req, res) => {
  const { id, guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children } = req.body;
  if (!id || !guestId || !roomId || !checkIn || !checkOut)
    return res.status(400).json({ error: 'id, guestId, roomId, checkIn, checkOut required' });
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  getDb().prepare(
    'INSERT INTO reservations (id, guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, guestId, roomId, typeId ?? null, checkIn, checkOut, source ?? 'Direct',
        paymentStatus ?? 'pending', status ?? 'pending', total ?? 0, paid ?? 0,
        adults ?? 2, children ?? 0);
  res.status(201).json(getDb().prepare('SELECT * FROM reservations WHERE id = ?').get(id));
});

r.put('/:id', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children } = req.body;
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  db.prepare(`
    UPDATE reservations SET guestId=?, roomId=?, typeId=?, checkIn=?, checkOut=?,
      source=?, paymentStatus=?, status=?, total=?, paid=?, adults=?, children=?
    WHERE id=?
  `).run(
    guestId       ?? row.guestId,
    roomId        ?? row.roomId,
    typeId        ?? row.typeId,
    checkIn       ?? row.checkIn,
    checkOut      ?? row.checkOut,
    source        ?? row.source,
    paymentStatus ?? row.paymentStatus,
    status        ?? row.status,
    total         ?? row.total,
    paid          ?? row.paid,
    adults        ?? row.adults,
    children      ?? row.children,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id));
});

/* POST /reservations/:id/checkin — mark active, set room occupied */
r.post('/:id/checkin', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'pending')
    return res.status(409).json({ error: `Cannot check in a reservation with status "${row.status}"` });
  const { roomId } = req.body;
  const assignedRoom = roomId ?? row.roomId;
  db.transaction(() => {
    db.prepare('UPDATE reservations SET status=?, roomId=? WHERE id=?')
      .run('active', assignedRoom, req.params.id);
    db.prepare('UPDATE rooms SET status=? WHERE id=?')
      .run('occupied', assignedRoom);
    db.prepare('UPDATE guests SET stays = stays + 1 WHERE id=?')
      .run(row.guestId);
  })();
  res.json({
    reservation: db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id),
    room: db.prepare('SELECT * FROM rooms WHERE id = ?').get(assignedRoom),
  });
});

/* POST /reservations/:id/checkout — mark completed, room dirty */
r.post('/:id/checkout', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.status !== 'active')
    return res.status(409).json({ error: `Cannot check out a reservation with status "${row.status}"` });
  const { amountPaid } = req.body;
  db.transaction(() => {
    db.prepare('UPDATE reservations SET status=?, paymentStatus=?, paid=? WHERE id=?')
      .run('completed', 'completed', amountPaid ?? row.total, req.params.id);
    db.prepare('UPDATE rooms SET status=? WHERE id=?')
      .run('dirty', row.roomId);
    db.prepare(`
      INSERT INTO housekeepingTasks (id, roomId, status, priority, due)
      VALUES (?, ?, 'dirty', 'medium', ?)
      ON CONFLICT(id) DO NOTHING
    `).run(`HK-${Date.now()}`, row.roomId, '14:00');
  })();
  res.json({
    reservation: db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id),
    room: db.prepare('SELECT * FROM rooms WHERE id = ?').get(row.roomId),
  });
});

/* PATCH /reservations/:id/payment — update payment */
r.patch('/:id/payment', (req, res) => {
  const { paid, paymentStatus } = req.body;
  const db  = getDb();
  const row = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE reservations SET paid=?, paymentStatus=? WHERE id=?').run(
    paid          ?? row.paid,
    paymentStatus ?? row.paymentStatus,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM reservations WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
