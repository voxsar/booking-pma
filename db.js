/* KavPMS — SQLite database setup + seed */
'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const DB_PATH = path.join(__dirname, 'kavpms.db');
let db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedIfEmpty();
  }
  return db;
}
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      code       TEXT NOT NULL,
      city       TEXT,
      rooms      INTEGER DEFAULT 0,
      type       TEXT
    );
    CREATE TABLE IF NOT EXISTS roomTypes (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      baseRate   REAL DEFAULT 0,
      capacity   INTEGER DEFAULT 2
    );
    CREATE TABLE IF NOT EXISTS rooms (
      id         TEXT PRIMARY KEY,
      number     TEXT NOT NULL,
      floor      INTEGER DEFAULT 1,
      typeId     TEXT REFERENCES roomTypes(id),
      status     TEXT DEFAULT 'available',
      propertyId TEXT REFERENCES properties(id)
    );
    CREATE TABLE IF NOT EXISTS guests (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT,
      phone       TEXT,
      nationality TEXT,
      idNumber    TEXT,
      vip         INTEGER DEFAULT 0,
      stays       INTEGER DEFAULT 0,
      notes       TEXT DEFAULT '[]',
      lastStay    TEXT
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id            TEXT PRIMARY KEY,
      guestId       TEXT REFERENCES guests(id),
      roomId        TEXT REFERENCES rooms(id),
      typeId        TEXT REFERENCES roomTypes(id),
      checkIn       TEXT,
      checkOut      TEXT,
      source        TEXT,
      paymentStatus TEXT DEFAULT 'pending',
      status        TEXT DEFAULT 'pending',
      total         REAL DEFAULT 0,
      paid          REAL DEFAULT 0,
      adults        INTEGER DEFAULT 2,
      children      INTEGER DEFAULT 0,
      createdAt     TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS housekeepingTasks (
      id         TEXT PRIMARY KEY,
      roomId     TEXT REFERENCES rooms(id),
      status     TEXT DEFAULT 'dirty',
      assignedTo TEXT,
      priority   TEXT DEFAULT 'medium',
      due        TEXT,
      notes      TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id        TEXT PRIMARY KEY,
      read      INTEGER DEFAULT 0,
      time      TEXT,
      title     TEXT,
      sub       TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);
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
function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as n FROM properties').get();
  if (count.n > 0) return;
  const insertProperty = db.prepare(
    'INSERT INTO properties (id, name, code, city, rooms, type) VALUES (@id, @name, @code, @city, @rooms, @type)'
  );
  const insertRoomType = db.prepare(
    'INSERT INTO roomTypes (id, name, baseRate, capacity) VALUES (@id, @name, @baseRate, @capacity)'
  );
  const insertRoom = db.prepare(
    'INSERT INTO rooms (id, number, floor, typeId, status, propertyId) VALUES (@id, @number, @floor, @typeId, @status, @propertyId)'
  );
  const insertGuest = db.prepare(
    'INSERT INTO guests (id, name, email, phone, nationality, idNumber, vip, stays, notes, lastStay) VALUES (@id, @name, @email, @phone, @nationality, @idNumber, @vip, @stays, @notes, @lastStay)'
  );
  const insertReservation = db.prepare(
    'INSERT INTO reservations (id, guestId, roomId, typeId, checkIn, checkOut, source, paymentStatus, status, total, paid, adults, children) VALUES (@id, @guestId, @roomId, @typeId, @checkIn, @checkOut, @source, @paymentStatus, @status, @total, @paid, @adults, @children)'
  );
  const insertTask = db.prepare(
    'INSERT INTO housekeepingTasks (id, roomId, status, assignedTo, priority, due, notes) VALUES (@id, @roomId, @status, @assignedTo, @priority, @due, @notes)'
  );
  const insertNotif = db.prepare(
    'INSERT INTO notifications (id, read, time, title, sub) VALUES (@id, @read, @time, @title, @sub)'
  );
  const seed = db.transaction(() => {
    // Properties
    [
      { id: 'p_villa', name: 'Casa Solana Villa',      code: 'CSV', city: 'Tulum, MX',  rooms: 12, type: 'Boutique villa' },
      { id: 'p_city',  name: 'The Meridian Hotel',     code: 'TMH', city: 'Lisbon, PT', rooms: 64, type: 'City hotel'    },
      { id: 'p_guest', name: 'Olive Grove Guesthouse', code: 'OGG', city: 'Chania, GR', rooms: 8,  type: 'Guesthouse'   },
    ].forEach(p => insertProperty.run(p));
    // Room types
    [
      { id: 'rt_deluxe', name: 'Deluxe King',     baseRate: 320, capacity: 2 },
      { id: 'rt_suite',  name: 'Garden Suite',     baseRate: 480, capacity: 3 },
      { id: 'rt_pool',   name: 'Pool Villa',       baseRate: 720, capacity: 4 },
      { id: 'rt_std',    name: 'Standard Twin',    baseRate: 220, capacity: 2 },
      { id: 'rt_loft',   name: 'Penthouse Loft',   baseRate: 950, capacity: 4 },
    ].forEach(rt => insertRoomType.run(rt));
    // Rooms (24 rooms across 4 floors)
    const types    = ['rt_deluxe', 'rt_suite', 'rt_pool', 'rt_std', 'rt_loft'];
    const statuses = ['available', 'occupied', 'dirty', 'clean', 'maintenance', 'occupied', 'available', 'occupied', 'clean'];
    let id = 1;
    for (let f = 1; f <= 4; f++) {
      for (let n = 1; n <= 6; n++) {
        const num        = `${f}${String(n).padStart(2, '0')}`;
        const typeId     = types[(f + n) % types.length];
        const status     = statuses[(f * n) % statuses.length];
        const propertyId = f <= 2 ? 'p_city' : f === 3 ? 'p_villa' : 'p_guest';
        insertRoom.run({ id: `r_${id++}`, number: num, floor: f, typeId, status, propertyId });
      }
    }
    // Guests
    [
      { id:'g1', name:'Amelia Hartwell',     email:'amelia.h@studio.co',    phone:'+44 7700 900133',    nationality:'GB', idNumber:'GBR-AH-882341',  vip:1, stays:7, notes:JSON.stringify(['VIP','Allergic to feathers','Prefers high floor']), lastStay:d(-42)  },
      { id:'g2', name:'Rafael Vidal',        email:'r.vidal@vinhos.pt',      phone:'+351 21 555 0188',   nationality:'PT', idNumber:'PT-998812',       vip:0, stays:3, notes:JSON.stringify(['Anniversary trip']),                                  lastStay:d(-120) },
      { id:'g3', name:'Yuki Tanaka',         email:'yuki@kogei.jp',          phone:'+81 90 0000 1234',   nationality:'JP', idNumber:'JP-TR-2231',      vip:0, stays:1, notes:JSON.stringify(['Quiet room preferred']),                              lastStay:d(-365) },
      { id:'g4', name:'Marcus & Lena Oduya', email:'marcus@oduya.io',        phone:'+254 722 998 100',   nationality:'KE', idNumber:'KE-9920-MO',      vip:1, stays:5, notes:JSON.stringify(['VIP','Twin beds, please']),                           lastStay:d(-14)  },
      { id:'g5', name:'Sofia Rinaldi',       email:'sofia.r@architettura.it',phone:'+39 333 442 8810',   nationality:'IT', idNumber:'IT-AA-118233',    vip:0, stays:2, notes:JSON.stringify(['Late check-out requested']),                          lastStay:d(-220) },
      { id:'g6', name:'Theo & Iris Brandt',  email:'tbrandt@nordheim.de',    phone:'+49 30 5566 7788',   nationality:'DE', idNumber:'DE-NRW-19238',    vip:0, stays:1, notes:JSON.stringify(['Honeymoon']),                                         lastStay:null    },
      { id:'g7', name:'Priya Iyer',          email:'priya@anantgroup.in',    phone:'+91 98765 12345',    nationality:'IN', idNumber:'IN-PSPRT-882',    vip:0, stays:4, notes:JSON.stringify(['Vegetarian breakfast']),                              lastStay:d(-60)  },
      { id:'g8', name:'Diego Almeida',       email:'d.almeida@latam.bz',     phone:'+55 11 9 9000 1234', nationality:'BR', idNumber:'BR-RG-552189',    vip:0, stays:0, notes:JSON.stringify([]),                                                    lastStay:null    },
    ].forEach(g => insertGuest.run(g));
    // Reservations
    [
      { id:'BK-7720', guestId:'g1', roomId:'r_3',  typeId:'rt_pool',   checkIn:d(0),  checkOut:d(4),  source:'Direct',  paymentStatus:'completed', status:'active',    total:2880, paid:2880, adults:2, children:0 },
      { id:'BK-7721', guestId:'g2', roomId:'r_8',  typeId:'rt_deluxe', checkIn:d(0),  checkOut:d(2),  source:'OTA',     paymentStatus:'pending',   status:'pending',   total:640,  paid:200,  adults:2, children:0 },
      { id:'BK-7722', guestId:'g3', roomId:'r_12', typeId:'rt_suite',  checkIn:d(1),  checkOut:d(5),  source:'Website', paymentStatus:'completed', status:'pending',   total:1920, paid:1920, adults:1, children:0 },
      { id:'BK-7723', guestId:'g4', roomId:'r_15', typeId:'rt_loft',   checkIn:d(-2), checkOut:d(3),  source:'Direct',  paymentStatus:'completed', status:'active',    total:4750, paid:4750, adults:2, children:1 },
      { id:'BK-7724', guestId:'g5', roomId:'r_5',  typeId:'rt_std',    checkIn:d(-1), checkOut:d(0),  source:'Phone',   paymentStatus:'pending',   status:'active',    total:220,  paid:100,  adults:1, children:0 },
      { id:'BK-7725', guestId:'g6', roomId:'r_19', typeId:'rt_pool',   checkIn:d(2),  checkOut:d(7),  source:'OTA',     paymentStatus:'completed', status:'pending',   total:3600, paid:3600, adults:2, children:0 },
      { id:'BK-7726', guestId:'g7', roomId:'r_22', typeId:'rt_suite',  checkIn:d(-5), checkOut:d(-1), source:'Agent',   paymentStatus:'completed', status:'completed', total:1920, paid:1920, adults:2, children:2 },
      { id:'BK-7727', guestId:'g8', roomId:'r_2',  typeId:'rt_deluxe', checkIn:d(-3), checkOut:d(-2), source:'Website', paymentStatus:'cancelled', status:'cancelled', total:320,  paid:0,    adults:1, children:0 },
      { id:'BK-7728', guestId:'g2', roomId:'r_14', typeId:'rt_deluxe', checkIn:d(-7), checkOut:d(-5), source:'OTA',     paymentStatus:'completed', status:'noshow',    total:640,  paid:200,  adults:2, children:0 },
      { id:'BK-7729', guestId:'g3', roomId:'r_17', typeId:'rt_loft',   checkIn:d(3),  checkOut:d(6),  source:'Direct',  paymentStatus:'pending',   status:'pending',   total:2850, paid:0,    adults:2, children:0 },
      { id:'BK-7730', guestId:'g1', roomId:'r_9',  typeId:'rt_std',    checkIn:d(0),  checkOut:d(1),  source:'Walk-in', paymentStatus:'completed', status:'active',    total:220,  paid:220,  adults:1, children:0 },
    ].forEach(r => insertReservation.run(r));
    // Housekeeping tasks
    [
      { id:'HK-201', roomId:'r_3',  status:'cleaning',    assignedTo:'Maria S.',  priority:'high',   due:t(11), notes:'VIP — extra towels'   },
      { id:'HK-202', roomId:'r_8',  status:'dirty',       assignedTo:null,        priority:'medium', due:t(13), notes:'Late check-out'        },
      { id:'HK-203', roomId:'r_12', status:'inspected',   assignedTo:'Pedro L.',  priority:'low',    due:t(10), notes:'Ready for arrival'     },
      { id:'HK-204', roomId:'r_15', status:'clean',       assignedTo:'Aiko T.',   priority:'high',   due:t(12), notes:'Suite turn-down'       },
      { id:'HK-205', roomId:'r_19', status:'dirty',       assignedTo:'Maria S.',  priority:'medium', due:t(14), notes:null                    },
      { id:'HK-206', roomId:'r_22', status:'maintenance', assignedTo:'Tomás R.',  priority:'high',   due:t(16), notes:'AC unit not cooling'   },
      { id:'HK-207', roomId:'r_5',  status:'cleaning',    assignedTo:'Pedro L.',  priority:'low',    due:t(15), notes:null                    },
      { id:'HK-208', roomId:'r_17', status:'dirty',       assignedTo:null,        priority:'medium', due:t(13), notes:null                    },
    ].forEach(tk => insertTask.run(tk));
    // Notifications
    [
      { id:'n1', read:0, time:'2 min ago',  title:'Late check-in expected — BK-7721', sub:'Rafael Vidal · ETA 22:40'           },
      { id:'n2', read:0, time:'18 min ago', title:'Maintenance request opened',        sub:'Room 322 · AC unit not cooling'     },
      { id:'n3', read:0, time:'1 hr ago',   title:'OTA rate parity drift',             sub:'Booking.com · Garden Suite +$24'   },
      { id:'n4', read:1, time:'3 hr ago',   title:'VIP arrival — Amelia Hartwell',     sub:'Pool Villa 103 · prepared at 09:00' },
      { id:'n5', read:1, time:'Yesterday',  title:'Daily revenue report ready',        sub:'Tap to view summary'                },
    ].forEach(n => insertNotif.run(n));
  });
  seed();
}
/* ── helpers for row hydration ── */
function hydrateGuest(row) {
  if (!row) return null;
  return { ...row, vip: row.vip === 1, notes: JSON.parse(row.notes || '[]') };
}
function hydrateNotif(row) {
  if (!row) return null;
  return { ...row, read: row.read === 1 };
}
module.exports = { getDb, hydrateGuest, hydrateNotif };
