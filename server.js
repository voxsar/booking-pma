'use strict';
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { getDb, hydrateGuest, hydrateNotif } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

/* ── API routes ── */
app.use('/api/properties',   require('./routes/properties'));
app.use('/api/room-types',   require('./routes/roomTypes'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/guests',       require('./routes/guests'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/housekeeping', require('./routes/housekeeping'));
app.use('/api/notifications',require('./routes/notifications'));
app.use('/api/reports',      require('./routes/reports'));

/* ── GET /api/init — single call to bootstrap the frontend ── */
app.get('/api/init', (req, res) => {
  const db = getDb();
  const properties        = db.prepare('SELECT * FROM properties ORDER BY name').all();
  const roomTypes         = db.prepare('SELECT * FROM roomTypes ORDER BY baseRate').all();
  const rooms             = db.prepare('SELECT * FROM rooms ORDER BY floor, number').all();
  const guests            = db.prepare('SELECT * FROM guests ORDER BY name').all().map(hydrateGuest);
  const reservations      = db.prepare('SELECT * FROM reservations ORDER BY checkIn DESC').all();
  const housekeepingTasks = db.prepare('SELECT * FROM housekeepingTasks ORDER BY due').all();
  const notifications     = db.prepare('SELECT * FROM notifications ORDER BY rowid DESC').all().map(hydrateNotif);
  const roomStatuses      = ['available', 'occupied', 'dirty', 'clean', 'maintenance'];
  const bookingSources    = db.prepare('SELECT DISTINCT source FROM reservations ORDER BY source').all().map(r => r.source);

  const paymentsTimeline = [
    { day:'Mon', value:4200 }, { day:'Tue', value:5800 }, { day:'Wed', value:5100 },
    { day:'Thu', value:7400 }, { day:'Fri', value:9200 }, { day:'Sat', value:11200 },
    { day:'Sun', value:8800 },
  ];

  const total = rooms.length;
  const histRows = db.prepare(`
    SELECT checkIn as day, COUNT(DISTINCT roomId) as occ
    FROM reservations WHERE status IN ('active','completed')
    GROUP BY checkIn ORDER BY checkIn DESC LIMIT 14
  `).all().reverse();
  const occupancyHistory = histRows.length >= 3
    ? histRows.map(r => total > 0 ? Math.round((r.occ / total) * 100) : 0)
    : [62,71,68,74,79,86,91,88,84,90,93,87,85,89];

  res.json({
    properties,
    roomTypes,
    rooms,
    guests,
    reservations,
    housekeepingTasks,
    notifications,
    roomStatuses,
    bookingSources: bookingSources.length ? bookingSources : ['Direct','OTA','Agent','Phone','Website'],
    paymentsTimeline,
    occupancyHistory,
  });
});

/* ── Health check ── */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/* ── Serve frontend static files ── */
app.use(express.static(path.join(__dirname, 'project')));

/* ── SPA fallback ── */
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'project', 'KavPMS.html'));
});

/* ── Global error handler ── */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`KavPMS running → http://localhost:${PORT}`);
  getDb(); // warm up DB + seed
});
