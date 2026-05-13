'use strict';
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const { pool, initDb, hydrateGuest, hydrateRoom, hydrateNotif } = require('./db');
const { openApiSpec } = require('./swagger');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

/* ── Auth routes (public) ── */
app.use('/api/auth', require('./routes/auth'));

/* ── API routes (protected) ── */
app.use('/api/properties', authMiddleware, require('./routes/properties'));
app.use('/api/room-types', authMiddleware, require('./routes/roomTypes'));
app.use('/api/rooms', authMiddleware, require('./routes/rooms'));
app.use('/api/guests', authMiddleware, require('./routes/guests'));
app.use('/api/reservations', authMiddleware, require('./routes/reservations'));
app.use('/api/housekeeping', authMiddleware, require('./routes/housekeeping'));
app.use('/api/notifications', authMiddleware, require('./routes/notifications'));
app.use('/api/reports', authMiddleware, require('./routes/reports'));
app.use('/api/api-keys', authMiddleware, require('./routes/apiKeys'));

/* ── GET /api/init — single call to bootstrap the frontend ── */
app.get('/api/init', authMiddleware, async (_req, res, next) => {
	try {
		const [properties] = await pool.query("SELECT * FROM properties ORDER BY CASE WHEN id = 'p_fifi' THEN 0 ELSE 1 END, name");
		const [roomTypes] = await pool.query('SELECT * FROM roomTypes ORDER BY baseRate');
		const [rooms] = await pool.query('SELECT * FROM rooms ORDER BY floor, number');
		const [guestRows] = await pool.query('SELECT * FROM guests ORDER BY name');
		const [reservations] = await pool.query('SELECT * FROM reservations ORDER BY checkIn DESC');
		const [housekeepingTasks] = await pool.query('SELECT * FROM housekeepingTasks ORDER BY due');
		const [notifRows] = await pool.query('SELECT * FROM notifications ORDER BY createdAt DESC');
		const [srcRows] = await pool.query('SELECT DISTINCT source FROM reservations ORDER BY source');

		const guests = guestRows.map(hydrateGuest);
		const hydratedRooms = rooms.map(hydrateRoom);
		const notifications = notifRows.map(hydrateNotif);
		const bookingSources = srcRows.map(r => r.source);

		const paymentsTimeline = [
			{ day: 'Mon', value: 620 }, { day: 'Tue', value: 830 }, { day: 'Wed', value: 790 },
			{ day: 'Thu', value: 1015 }, { day: 'Fri', value: 1280 }, { day: 'Sat', value: 1530 },
			{ day: 'Sun', value: 1180 },
		];

		const total = hydratedRooms.length;
		const [histRows] = await pool.query(`
      SELECT checkIn as day, COUNT(DISTINCT roomId) as occ
      FROM reservations WHERE status IN ('active','completed')
      GROUP BY checkIn ORDER BY checkIn DESC LIMIT 14
    `);
		const sorted = histRows.reverse();
		const occupancyHistory = sorted.length >= 3
			? sorted.map(r => total > 0 ? Math.round((r.occ / total) * 100) : 0)
			: [62, 71, 68, 74, 79, 86, 91, 88, 84, 90, 93, 87, 85, 89];

		res.json({
			properties, roomTypes, rooms: hydratedRooms, guests, reservations,
			housekeepingTasks, notifications,
			roomStatuses: ['available', 'occupied', 'dirty', 'clean', 'maintenance'],
			bookingSources: bookingSources.length ? bookingSources : ['Direct', 'OTA', 'Agent', 'Phone', 'Website'],
			paymentsTimeline, occupancyHistory,
		});
	} catch (e) { next(e); }
});

/* ── Health check ── */
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

/* ── Swagger docs ── */
app.get('/api/docs.json', (_req, res) => res.json(openApiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
	explorer: true,
	swaggerOptions: { docExpansion: 'list' },
}));

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
async function start() {
	await initDb();
	app.listen(PORT, () => console.log(`KavPMS running → http://localhost:${PORT}`));
}
start().catch(err => { console.error(err); process.exit(1); });
