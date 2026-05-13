'use strict';
const { Router } = require('express');
const { getDb }  = require('../db');
const STATUS_FLOW    = ['dirty', 'cleaning', 'clean', 'inspected'];
const VALID_STATUSES = ['dirty', 'cleaning', 'clean', 'inspected', 'maintenance'];
const r = Router();

r.get('/', (req, res) => {
  let sql    = 'SELECT * FROM housekeepingTasks WHERE 1=1';
  const args = [];
  if (req.query.status)     { sql += ' AND status = ?';      args.push(req.query.status);      }
  if (req.query.roomId)     { sql += ' AND roomId = ?';      args.push(req.query.roomId);      }
  if (req.query.priority)   { sql += ' AND priority = ?';    args.push(req.query.priority);    }
  if (req.query.assignedTo) { sql += ' AND assignedTo = ?';  args.push(req.query.assignedTo);  }
  sql += ' ORDER BY due';
  res.json(getDb().prepare(sql).all(...args));
});

r.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

r.post('/', (req, res) => {
  const { id, roomId, status, assignedTo, priority, due, notes } = req.body;
  if (!id || !roomId) return res.status(400).json({ error: 'id and roomId required' });
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  getDb().prepare(
    'INSERT INTO housekeepingTasks (id, roomId, status, assignedTo, priority, due, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, roomId, status ?? 'dirty', assignedTo ?? null, priority ?? 'medium', due ?? null, notes ?? null);
  res.status(201).json(getDb().prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(id));
});

r.put('/:id', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const { roomId, status, assignedTo, priority, due, notes } = req.body;
  if (status && !VALID_STATUSES.includes(status))
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  db.prepare(
    'UPDATE housekeepingTasks SET roomId=?, status=?, assignedTo=?, priority=?, due=?, notes=? WHERE id=?'
  ).run(
    roomId     ?? row.roomId,
    status     ?? row.status,
    assignedTo !== undefined ? assignedTo : row.assignedTo,
    priority   ?? row.priority,
    due        ?? row.due,
    notes      !== undefined ? notes : row.notes,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id));
});

/* POST /housekeeping/:id/advance — move to next status in flow */
r.post('/:id/advance', (req, res) => {
  const db  = getDb();
  const row = db.prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const idx  = STATUS_FLOW.indexOf(row.status);
  if (idx === -1 || idx === STATUS_FLOW.length - 1)
    return res.status(409).json({ error: `Task in "${row.status}" cannot be advanced` });
  const next = STATUS_FLOW[idx + 1];
  db.transaction(() => {
    db.prepare('UPDATE housekeepingTasks SET status=? WHERE id=?').run(next, req.params.id);
    if (next === 'clean' || next === 'inspected') {
      db.prepare('UPDATE rooms SET status=? WHERE id=?').run('clean', row.roomId);
    } else if (next === 'cleaning') {
      db.prepare('UPDATE rooms SET status=? WHERE id=?').run('dirty', row.roomId);
    }
  })();
  res.json({
    task: db.prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id),
    room: db.prepare('SELECT * FROM rooms WHERE id = ?').get(row.roomId),
  });
});

/* PATCH /housekeeping/:id/assign — assign to staff member */
r.patch('/:id/assign', (req, res) => {
  const { assignedTo } = req.body;
  const db  = getDb();
  const row = db.prepare('SELECT id FROM housekeepingTasks WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE housekeepingTasks SET assignedTo=? WHERE id=?').run(assignedTo ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM housekeepingTasks WHERE id = ?').get(req.params.id));
});

r.delete('/:id', (req, res) => {
  const info = getDb().prepare('DELETE FROM housekeepingTasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: req.params.id });
});

module.exports = r;
