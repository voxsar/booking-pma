/* KavPMS — MariaDB/MySQL database setup + seed */
'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
	host: process.env.DB_HOST || '127.0.0.1',
	user: process.env.DB_USER || 'kavpms',
	password: process.env.DB_PASSWORD || 'Kav@PMS#2026!',
	database: process.env.DB_NAME || 'kavpms',
	waitForConnections: true,
	connectionLimit: 10,
	timezone: '+00:00',
});

async function initSchema() {
	await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        VARCHAR(64)  PRIMARY KEY,
      username  VARCHAR(255) NOT NULL UNIQUE,
      password  VARCHAR(255) NOT NULL,
      name      VARCHAR(255) NOT NULL,
      role      VARCHAR(32)  DEFAULT 'staff',
      email     VARCHAR(255),
      createdAt DATETIME     DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id    VARCHAR(64)  PRIMARY KEY,
      name  VARCHAR(255) NOT NULL,
      code  VARCHAR(16)  NOT NULL,
      city  VARCHAR(255),
      rooms INT          DEFAULT 0,
      floors INT         DEFAULT 1,
      type  VARCHAR(128)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS roomTypes (
      id       VARCHAR(64)   PRIMARY KEY,
      name     VARCHAR(255)  NOT NULL,
      baseRate DECIMAL(10,2) DEFAULT 0,
      capacity INT           DEFAULT 2
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS rooms (
      id         VARCHAR(64) PRIMARY KEY,
      number     VARCHAR(16) NOT NULL,
      floor      INT         DEFAULT 1,
      typeId     VARCHAR(64),
      status     VARCHAR(32) DEFAULT 'available',
      propertyId VARCHAR(64),
      beds       INT         DEFAULT 1,
      sqm        INT         DEFAULT 24,
      amenities  TEXT,
      FOREIGN KEY (typeId)     REFERENCES roomTypes(id),
      FOREIGN KEY (propertyId) REFERENCES properties(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS guests (
      id          VARCHAR(64)  PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      email       VARCHAR(255),
      phone       VARCHAR(64),
      nationality VARCHAR(8),
      idNumber    VARCHAR(64),
      vip         TINYINT(1)   DEFAULT 0,
      stays       INT          DEFAULT 0,
      notes       TEXT,
      lastStay    VARCHAR(16)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id            VARCHAR(32)   PRIMARY KEY,
      guestId       VARCHAR(64),
      roomId        VARCHAR(64),
      typeId        VARCHAR(64),
      checkIn       VARCHAR(16),
      checkOut      VARCHAR(16),
      source        VARCHAR(64),
      paymentStatus VARCHAR(32)   DEFAULT 'pending',
      status        VARCHAR(32)   DEFAULT 'pending',
      total         DECIMAL(10,2) DEFAULT 0,
      paid          DECIMAL(10,2) DEFAULT 0,
      adults        INT           DEFAULT 2,
      children      INT           DEFAULT 0,
      createdAt     DATETIME      DEFAULT NOW(),
      FOREIGN KEY (guestId) REFERENCES guests(id),
      FOREIGN KEY (roomId)  REFERENCES rooms(id),
      FOREIGN KEY (typeId)  REFERENCES roomTypes(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS housekeepingTasks (
      id         VARCHAR(64)  PRIMARY KEY,
      roomId     VARCHAR(64),
      status     VARCHAR(32)  DEFAULT 'dirty',
      assignedTo VARCHAR(128),
      priority   VARCHAR(16)  DEFAULT 'medium',
      due        VARCHAR(16),
      notes      TEXT,
      FOREIGN KEY (roomId) REFERENCES rooms(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id        VARCHAR(64)  PRIMARY KEY,
      \`read\`  TINYINT(1)   DEFAULT 0,
      time      VARCHAR(64),
      title     VARCHAR(255),
      sub       VARCHAR(255),
      createdAt DATETIME     DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
	await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id        VARCHAR(64)  PRIMARY KEY,
      keyHash   VARCHAR(64)  NOT NULL,
      keyPrefix VARCHAR(12)  NOT NULL,
      name      VARCHAR(255) NOT NULL,
      userId    VARCHAR(64),
      createdAt DATETIME     DEFAULT NOW(),
      lastUsed  DATETIME,
      INDEX idx_prefix (keyPrefix),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

	await ensureColumn('properties', 'floors', 'INT DEFAULT 1');
	await ensureColumn('rooms', 'beds', 'INT DEFAULT 1');
	await ensureColumn('rooms', 'sqm', 'INT DEFAULT 24');
	await ensureColumn('rooms', 'amenities', 'TEXT');
	await pool.query('ALTER TABLE housekeepingTasks MODIFY COLUMN due VARCHAR(16)');
}

async function ensureColumn(table, column, ddl) {
	const [[row]] = await pool.query(`
    SELECT COUNT(*) as n
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
  `, [table, column]);
	if (row.n === 0) {
		await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${ddl}`);
	}
}

const TODAY = new Date('2026-05-09T08:00:00');
function d(offset) {
	const x = new Date(TODAY);
	x.setDate(x.getDate() + offset);
	return x.toISOString().slice(0, 10);
}
function t(h, m = 0) {
	return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function seedIfEmpty() {
	const [[state]] = await pool.query(`
    SELECT
      COUNT(*) as n,
      SUM(CASE WHEN id = 'p_fifi' THEN 1 ELSE 0 END) as hasFifi
    FROM properties
  `);
	if (Number(state.hasFifi || 0) > 0 && process.env.RESEED_FIFI_DEMO !== '1') return;

	const conn = await pool.getConnection();
	await conn.beginTransaction();
	try {
		const oldReservationIds = [
			'BK-7720', 'BK-7721', 'BK-7722', 'BK-7723', 'BK-7724', 'BK-7725',
			'BK-7726', 'BK-7727', 'BK-7728', 'BK-7729', 'BK-7730',
		];
		await conn.query(`
      DELETE FROM reservations
      WHERE id IN (${oldReservationIds.map(() => '?').join(',')})
        OR id LIKE 'FR-30200-%'
        OR roomId REGEXP '^r_[0-9]+$'
        OR typeId IN ('rt_deluxe','rt_suite','rt_pool','rt_std','rt_loft')
    `, oldReservationIds);
		await conn.query("DELETE FROM housekeepingTasks WHERE id LIKE 'HK-FR-%' OR id IN ('HK-201','HK-202','HK-203','HK-204','HK-205','HK-206','HK-207','HK-208') OR roomId REGEXP '^r_[0-9]+$'");
		await conn.query("DELETE FROM notifications WHERE id LIKE 'nf_fifi_%' OR id IN ('n1','n2','n3','n4','n5')");
		await conn.query("DELETE FROM rooms WHERE id LIKE 'room_fifi_%' OR id REGEXP '^r_[0-9]+$'");
		await conn.query("DELETE FROM roomTypes WHERE id LIKE 'rt_fifi_%' OR id IN ('rt_deluxe','rt_suite','rt_pool','rt_std','rt_loft')");
		await conn.query("DELETE FROM guests WHERE id LIKE 'guest_fifi_%' OR id IN ('g1','g2','g3','g4','g5','g6','g7','g8')");
		await conn.query("DELETE FROM properties WHERE id IN ('p_villa','p_city','p_guest')");

		/* Seed users (password is 'password' hashed with bcrypt) */
		const bcrypt = require('bcryptjs');
		const hashedPassword = await bcrypt.hash('password', 10);
		for (const u of [
			{ id: 'u_admin', username: 'admin', password: hashedPassword, name: 'Fifi Admin', role: 'admin', email: 'admin@fifiresorts.lk' },
			{ id: 'u_elena', username: 'elena', password: hashedPassword, name: 'Sasi Perera', role: 'manager', email: 'sasi@fifiresorts.lk' },
			{ id: 'u_staff', username: 'staff', password: hashedPassword, name: 'Villa Host Desk', role: 'staff', email: 'frontdesk@fifiresorts.lk' },
		]) {
			await conn.execute(`
        INSERT INTO users (id,username,password,name,role,email)
        VALUES (?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), email=VALUES(email)
      `,
				[u.id, u.username, u.password, u.name, u.role, u.email]);
		}

		for (const p of [
			{ id: 'p_fifi', name: 'Fifi Resorts (Pvt) Ltd', code: '30200', city: 'Sri Lanka', rooms: 5, floors: 1, type: 'Private villa resort' },
		]) {
			await conn.execute(`
        INSERT INTO properties (id,name,code,city,rooms,floors,type)
        VALUES (?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), code=VALUES(code), city=VALUES(city),
          rooms=VALUES(rooms), floors=VALUES(floors), type=VALUES(type)
      `, [p.id, p.name, p.code, p.city, p.rooms, p.floors, p.type]);
		}

		for (const rt of [
			{ id: 'rt_fifi_eco', name: 'Eco Harmony Suite', baseRate: 119, capacity: 2 },
			{ id: 'rt_fifi_sunrise', name: 'Sunrise Vista Suite', baseRate: 139, capacity: 2 },
			{ id: 'rt_fifi_forest', name: 'Forest Escape Suite', baseRate: 175, capacity: 3 },
			{ id: 'rt_fifi_monarch', name: 'Mount Monarch Chalet', baseRate: 225, capacity: 2 },
			{ id: 'rt_fifi_luxe', name: 'Mount Luxe Chalet', baseRate: 225, capacity: 2 },
		]) {
			await conn.execute(`
        INSERT INTO roomTypes (id,name,baseRate,capacity)
        VALUES (?,?,?,?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), baseRate=VALUES(baseRate), capacity=VALUES(capacity)
      `, [rt.id, rt.name, rt.baseRate, rt.capacity]);
		}

		for (const room of [
			{ id: 'room_fifi_c01', number: 'C01', floor: 1, typeId: 'rt_fifi_monarch', status: 'occupied', propertyId: 'p_fifi', beds: 1, sqm: 58, amenities: ['Mountain view', 'King bed', 'Private deck', 'Tea station'] },
			{ id: 'room_fifi_c02', number: 'C02', floor: 1, typeId: 'rt_fifi_luxe', status: 'dirty', propertyId: 'p_fifi', beds: 1, sqm: 60, amenities: ['Garden view', 'King bed', 'Outdoor shower', 'Mini fridge'] },
			{ id: 'room_fifi_s01', number: 'S01', floor: 1, typeId: 'rt_fifi_sunrise', status: 'available', propertyId: 'p_fifi', beds: 1, sqm: 42, amenities: ['Sunrise balcony', 'Queen bed', 'Work nook'] },
			{ id: 'room_fifi_s03', number: 'S03', floor: 1, typeId: 'rt_fifi_eco', status: 'dirty', propertyId: 'p_fifi', beds: 1, sqm: 38, amenities: ['Eco linen', 'Rain shower', 'Courtyard seating'] },
			{ id: 'room_fifi_s02', number: 'S02', floor: 1, typeId: 'rt_fifi_forest', status: 'occupied', propertyId: 'p_fifi', beds: 2, sqm: 64, amenities: ['Family layout', 'Forest view', 'Child bed', 'Sofa lounge'] },
		]) {
			await conn.execute(`
        INSERT INTO rooms (id,number,floor,typeId,status,propertyId,beds,sqm,amenities)
        VALUES (?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE number=VALUES(number), floor=VALUES(floor), typeId=VALUES(typeId),
          status=VALUES(status), propertyId=VALUES(propertyId), beds=VALUES(beds), sqm=VALUES(sqm),
          amenities=VALUES(amenities)
      `, [room.id, room.number, room.floor, room.typeId, room.status, room.propertyId, room.beds, room.sqm, JSON.stringify(room.amenities)]);
		}

		for (const g of [
			{ id: 'guest_fifi_tevin', name: 'Mr. Tevin Senanayake', email: 'tevin.senanayake@example.com', phone: '+94 77 302 0011', nationality: 'LK', idNumber: 'LK-TVS-30200', vip: 1, stays: 6, notes: ['Repeat direct guest', 'Prefers Mount Monarch', 'Evening tea service'], lastStay: d(-38) },
			{ id: 'guest_fifi_silva', name: 'Anjali & Ruwan Silva', email: 'anjali.silva@example.com', phone: '+94 71 302 0044', nationality: 'LK', idNumber: 'LK-ARS-4412', vip: 0, stays: 2, notes: ['Anniversary stay', 'Vegetarian breakfast'], lastStay: d(-90) },
			{ id: 'guest_fifi_parker', name: 'Emily Parker', email: 'emily.parker@example.co.uk', phone: '+44 7700 302005', nationality: 'GB', idNumber: 'GBR-EP-55201', vip: 0, stays: 1, notes: ['Airport pickup arranged'], lastStay: null },
			{ id: 'guest_fifi_khan', name: 'Ayaan Khan', email: 'ayaan.khan@example.ae', phone: '+971 50 302 0066', nationality: 'AE', idNumber: 'AE-AK-4430', vip: 0, stays: 0, notes: ['Late check-in expected'], lastStay: null },
			{ id: 'guest_fifi_perera', name: 'Nadeesha Perera Family', email: 'nadeesha.perera@example.com', phone: '+94 76 302 0077', nationality: 'LK', idNumber: 'LK-NPF-8801', vip: 1, stays: 4, notes: ['Family suite', 'One child bed'], lastStay: d(-20) },
			{ id: 'guest_fifi_chen', name: 'Lina Chen', email: 'lina.chen@example.sg', phone: '+65 8302 0088', nationality: 'SG', idNumber: 'SG-LC-9022', vip: 0, stays: 1, notes: ['Quiet room preferred'], lastStay: d(-150) },
			{ id: 'guest_fifi_dias', name: 'Milan Dias', email: 'milan.dias@example.com', phone: '+94 72 302 0099', nationality: 'LK', idNumber: 'LK-MD-3022', vip: 0, stays: 3, notes: ['Uses Web20 promotion'], lastStay: d(-62) },
			{ id: 'guest_fifi_wijaya', name: 'Kavindu Wijesinghe', email: 'kavindu.w@example.com', phone: '+94 75 302 0100', nationality: 'LK', idNumber: 'LK-KW-8080', vip: 0, stays: 0, notes: [], lastStay: null },
		]) {
			await conn.execute(`
        INSERT INTO guests (id,name,email,phone,nationality,idNumber,vip,stays,notes,lastStay)
        VALUES (?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), phone=VALUES(phone),
          nationality=VALUES(nationality), idNumber=VALUES(idNumber), vip=VALUES(vip),
          stays=VALUES(stays), notes=VALUES(notes), lastStay=VALUES(lastStay)
      `, [g.id, g.name, g.email, g.phone, g.nationality, g.idNumber, g.vip, g.stays, JSON.stringify(g.notes), g.lastStay || null]);
		}

		for (const r of [
			{ id: 'FR-30200-1001', guestId: 'guest_fifi_tevin', roomId: 'room_fifi_c01', typeId: 'rt_fifi_monarch', checkIn: d(0), checkOut: d(1), source: 'Direct', paymentStatus: 'completed', status: 'active', total: 225, paid: 225, adults: 2, children: 0 },
			{ id: 'FR-30200-1002', guestId: 'guest_fifi_silva', roomId: 'room_fifi_c02', typeId: 'rt_fifi_luxe', checkIn: d(-1), checkOut: d(0), source: 'Phone', paymentStatus: 'partial', status: 'active', total: 225, paid: 125, adults: 2, children: 0 },
			{ id: 'FR-30200-1003', guestId: 'guest_fifi_perera', roomId: 'room_fifi_s02', typeId: 'rt_fifi_forest', checkIn: d(0), checkOut: d(1), source: 'Direct', paymentStatus: 'completed', status: 'active', total: 175, paid: 175, adults: 2, children: 1 },
			{ id: 'FR-30200-1004', guestId: 'guest_fifi_parker', roomId: 'room_fifi_s01', typeId: 'rt_fifi_sunrise', checkIn: d(1), checkOut: d(4), source: 'Website', paymentStatus: 'completed', status: 'pending', total: 417, paid: 417, adults: 1, children: 0 },
			{ id: 'FR-30200-1005', guestId: 'guest_fifi_khan', roomId: 'room_fifi_s03', typeId: 'rt_fifi_eco', checkIn: d(2), checkOut: d(5), source: 'Web20', paymentStatus: 'pending', status: 'pending', total: 357, paid: 0, adults: 2, children: 0 },
			{ id: 'FR-30200-1006', guestId: 'guest_fifi_chen', roomId: 'room_fifi_c01', typeId: 'rt_fifi_monarch', checkIn: d(-5), checkOut: d(-3), source: 'Booking.com', paymentStatus: 'completed', status: 'completed', total: 450, paid: 450, adults: 2, children: 0 },
			{ id: 'FR-30200-1007', guestId: 'guest_fifi_dias', roomId: 'room_fifi_s03', typeId: 'rt_fifi_eco', checkIn: d(-4), checkOut: d(-2), source: 'Web20', paymentStatus: 'completed', status: 'completed', total: 238, paid: 238, adults: 1, children: 0 },
			{ id: 'FR-30200-1008', guestId: 'guest_fifi_wijaya', roomId: 'room_fifi_s01', typeId: 'rt_fifi_sunrise', checkIn: d(5), checkOut: d(7), source: 'Affiliate', paymentStatus: 'pending', status: 'pending', total: 278, paid: 0, adults: 2, children: 0 },
			{ id: 'FR-30200-1009', guestId: 'guest_fifi_silva', roomId: 'room_fifi_c02', typeId: 'rt_fifi_luxe', checkIn: d(-9), checkOut: d(-7), source: 'Direct', paymentStatus: 'completed', status: 'completed', total: 450, paid: 450, adults: 2, children: 0 },
			{ id: 'FR-30200-1010', guestId: 'guest_fifi_tevin', roomId: 'room_fifi_c01', typeId: 'rt_fifi_monarch', checkIn: d(8), checkOut: d(10), source: 'Direct Offer', paymentStatus: 'pending', status: 'pending', total: 450, paid: 0, adults: 2, children: 0 },
		]) {
			await conn.execute(`
        INSERT INTO reservations (id,guestId,roomId,typeId,checkIn,checkOut,source,paymentStatus,status,total,paid,adults,children)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE guestId=VALUES(guestId), roomId=VALUES(roomId), typeId=VALUES(typeId),
          checkIn=VALUES(checkIn), checkOut=VALUES(checkOut), source=VALUES(source),
          paymentStatus=VALUES(paymentStatus), status=VALUES(status), total=VALUES(total),
          paid=VALUES(paid), adults=VALUES(adults), children=VALUES(children)
      `,
				[r.id, r.guestId, r.roomId, r.typeId, r.checkIn, r.checkOut, r.source, r.paymentStatus, r.status, r.total, r.paid, r.adults, r.children]);
		}

		for (const tk of [
			{ id: 'HK-FR-201', roomId: 'room_fifi_c01', status: 'cleaning', assignedTo: 'Sasi', priority: 'high', due: t(14), notes: 'Arrival refresh for Mr. Tevin' },
			{ id: 'HK-FR-202', roomId: 'room_fifi_c02', status: 'dirty', assignedTo: 'Sasi', priority: 'high', due: t(7, 21), notes: 'Pending checkout linen change' },
			{ id: 'HK-FR-203', roomId: 'room_fifi_s01', status: 'inspected', assignedTo: 'Not Assigned', priority: 'low', due: t(10), notes: 'Vacant suite ready for web arrival' },
			{ id: 'HK-FR-204', roomId: 'room_fifi_s03', status: 'dirty', assignedTo: 'Not Assigned', priority: 'medium', due: t(12), notes: 'Eco amenity refill and sweep' },
			{ id: 'HK-FR-205', roomId: 'room_fifi_s02', status: 'cleaning', assignedTo: 'Not Assigned', priority: 'high', due: t(7, 44), notes: 'Family suite: extra child bed' },
		]) {
			await conn.execute(`
        INSERT INTO housekeepingTasks (id,roomId,status,assignedTo,priority,due,notes)
        VALUES (?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE roomId=VALUES(roomId), status=VALUES(status),
          assignedTo=VALUES(assignedTo), priority=VALUES(priority), due=VALUES(due),
          notes=VALUES(notes)
      `,
				[tk.id, tk.roomId, tk.status, tk.assignedTo || null, tk.priority, tk.due, tk.notes || null]);
		}

		for (const n of [
			{ id: 'nf_fifi_1', read: 0, time: '2 min ago', title: 'VIP arrival - FR-30200-1001', sub: 'Mr. Tevin · Mount Monarch C01 · 02:00 PM' },
			{ id: 'nf_fifi_2', read: 0, time: '18 min ago', title: 'Housekeeping priority', sub: 'Family Suite S02 · child bed before 07:44' },
			{ id: 'nf_fifi_3', read: 0, time: '1 hr ago', title: 'Web20 promotion used', sub: 'Eco Harmony Suite · 20% web offer' },
			{ id: 'nf_fifi_4', read: 1, time: '3 hr ago', title: 'Direct offer dates updated', sub: 'Basic Package · 26 Dec 2025 to 30 Nov 2026' },
			{ id: 'nf_fifi_5', read: 1, time: 'Yesterday', title: 'Villa revenue report ready', sub: 'Fifi Resorts · 5-suite performance summary' },
		]) {
			await conn.execute(`
        INSERT INTO notifications (id,\`read\`,time,title,sub)
        VALUES (?,?,?,?,?)
        ON DUPLICATE KEY UPDATE \`read\`=VALUES(\`read\`), time=VALUES(time),
          title=VALUES(title), sub=VALUES(sub)
      `,
				[n.id, n.read, n.time, n.title, n.sub || null]);
		}

		await conn.commit();
	} catch (e) {
		await conn.rollback();
		throw e;
	} finally {
		conn.release();
	}
}

async function initDb() {
	await initSchema();
	await seedIfEmpty();
}

function hydrateGuest(row) {
	if (!row) return null;
	return {
		...row,
		vip: row.vip === 1,
		passport: row.idNumber,
		notes: typeof row.notes === 'string' ? JSON.parse(row.notes || '[]') : (row.notes || []),
	};
}

function hydrateRoom(row) {
	if (!row) return null;
	let amenities = row.amenities || [];
	if (typeof amenities === 'string') {
		try {
			amenities = JSON.parse(amenities || '[]');
		} catch (_e) {
			amenities = amenities ? amenities.split(',').map(s => s.trim()).filter(Boolean) : [];
		}
	}
	return { ...row, beds: row.beds || 1, sqm: row.sqm || 24, amenities };
}

function hydrateNotif(row) {
	if (!row) return null;
	return { ...row, read: row.read === 1 };
}

module.exports = { pool, initDb, hydrateGuest, hydrateRoom, hydrateNotif };
