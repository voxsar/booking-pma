/* KavPMS — MariaDB/MySQL database setup + seed */
'use strict';
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST || '127.0.0.1',
  user:               process.env.DB_USER     || 'kavpms',
  password:           process.env.DB_PASSWORD || 'Kav@PMS#2026!',
  database:           process.env.DB_NAME     || 'kavpms',
  waitForConnections: true,
  connectionLimit:    10,
  timezone:           '+00:00',
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS properties (
      id    VARCHAR(64)  PRIMARY KEY,
      name  VARCHAR(255) NOT NULL,
      code  VARCHAR(16)  NOT NULL,
      city  VARCHAR(255),
      rooms INT          DEFAULT 0,
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
      due        VARCHAR(8),
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
  const [[countRow]] = await pool.query('SELECT COUNT(*) as n FROM properties');
  if (countRow.n > 0) return;

  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    for (const p of [
      { id: 'p_villa', name: 'Casa Solana Villa',      code: 'CSV', city: 'Tulum, MX',  rooms: 12, type: 'Boutique villa' },
      { id: 'p_city',  name: 'The Meridian Hotel',     code: 'TMH', city: 'Lisbon, PT', rooms: 64, type: 'City hotel'     },
      { id: 'p_guest', name: 'Olive Grove Guesthouse', code: 'OGG', city: 'Chania, GR', rooms: 8,  type: 'Guesthouse'    },
    ]) {
      await conn.execute('INSERT INTO properties (id,name,code,city,rooms,type) VALUES (?,?,?,?,?,?)',
        [p.id, p.name, p.code, p.city, p.rooms, p.type]);
    }

    for (const rt of [
      { id: 'rt_deluxe', name: 'Deluxe King',     baseRate: 320, capacity: 2 },
      { id: 'rt_suite',  name: 'Garden Suite',     baseRate: 480, capacity: 3 },
      { id: 'rt_pool',   name: 'Pool Villa',       baseRate: 720, capacity: 4 },
      { id: 'rt_std',    name: 'Standard Twin',    baseRate: 220, capacity: 2 },
      { id: 'rt_loft',   name: 'Penthouse Loft',   baseRate: 950, capacity: 4 },
    ]) {
      await conn.execute('INSERT INTO roomTypes (id,name,baseRate,capacity) VALUES (?,?,?,?)',
        [rt.id, rt.name, rt.baseRate, rt.capacity]);
    }

    const types    = ['rt_deluxe', 'rt_suite', 'rt_pool', 'rt_std', 'rt_loft'];
    const statuses = ['available', 'occupied', 'dirty', 'clean', 'maintenance', 'occupied', 'available', 'occupied', 'clean'];
    let rid = 1;
    for (let f = 1; f <= 4; f++) {
      for (let n = 1; n <= 6; n++) {
        const num        = `${f}${String(n).padStart(2, '0')}`;
        const typeId     = types[(f + n) % types.length];
        const status     = statuses[(f * n) % statuses.length];
        const propertyId = f <= 2 ? 'p_city' : f === 3 ? 'p_villa' : 'p_guest';
        await conn.execute('INSERT INTO rooms (id,number,floor,typeId,status,propertyId) VALUES (?,?,?,?,?,?)',
          [`r_${rid++}`, num, f, typeId, status, propertyId]);
      }
    }

    for (const g of [
      { id:'g1', name:'Amelia Hartwell',     email:'amelia.h@studio.co',     phone:'+44 7700 900133',    nationality:'GB', idNumber:'GBR-AH-882341', vip:1, stays:7, notes:JSON.stringify(['VIP','Allergic to feathers','Prefers high floor']), lastStay:d(-42)  },
      { id:'g2', name:'Rafael Vidal',        email:'r.vidal@vinhos.pt',       phone:'+351 21 555 0188',   nationality:'PT', idNumber:'PT-998812',      vip:0, stays:3, notes:JSON.stringify(['Anniversary trip']),                                 lastStay:d(-120) },
      { id:'g3', name:'Yuki Tanaka',         email:'yuki@kogei.jp',           phone:'+81 90 0000 1234',   nationality:'JP', idNumber:'JP-TR-2231',     vip:0, stays:1, notes:JSON.stringify(['Quiet room preferred']),                             lastStay:d(-365) },
      { id:'g4', name:'Marcus & Lena Oduya', email:'marcus@oduya.io',         phone:'+254 722 998 100',   nationality:'KE', idNumber:'KE-9920-MO',     vip:1, stays:5, notes:JSON.stringify(['VIP','Twin beds, please']),                          lastStay:d(-14)  },
      { id:'g5', name:'Sofia Rinaldi',       email:'sofia.r@architettura.it', phone:'+39 333 442 8810',   nationality:'IT', idNumber:'IT-AA-118233',   vip:0, stays:2, notes:JSON.stringify(['Late check-out requested']),                         lastStay:d(-220) },
      { id:'g6', name:'Theo & Iris Brandt',  email:'tbrandt@nordheim.de',     phone:'+49 30 5566 7788',   nationality:'DE', idNumber:'DE-NRW-19238',   vip:0, stays:1, notes:JSON.stringify(['Honeymoon']),                                        lastStay:null    },
      { id:'g7', name:'Priya Iyer',          email:'priya@anantgroup.in',     phone:'+91 98765 12345',    nationality:'IN', idNumber:'IN-PSPRT-882',   vip:0, stays:4, notes:JSON.stringify(['Vegetarian breakfast']),                             lastStay:d(-60)  },
      { id:'g8', name:'Diego Almeida',       email:'d.almeida@latam.bz',      phone:'+55 11 9 9000 1234', nationality:'BR', idNumber:'BR-RG-552189',   vip:0, stays:0, notes:JSON.stringify([]),                                                   lastStay:null    },
    ]) {
      await conn.execute('INSERT INTO guests (id,name,email,phone,nationality,idNumber,vip,stays,notes,lastStay) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [g.id, g.name, g.email, g.phone, g.nationality, g.idNumber, g.vip, g.stays, g.notes, g.lastStay || null]);
    }

    for (const r of [
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
    ]) {
      await conn.execute('INSERT INTO reservations (id,guestId,roomId,typeId,checkIn,checkOut,source,paymentStatus,status,total,paid,adults,children) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [r.id, r.guestId, r.roomId, r.typeId, r.checkIn, r.checkOut, r.source, r.paymentStatus, r.status, r.total, r.paid, r.adults, r.children]);
    }

    for (const tk of [
      { id:'HK-201', roomId:'r_3',  status:'cleaning',    assignedTo:'Maria S.',  priority:'high',   due:t(11), notes:'VIP — extra towels'   },
      { id:'HK-202', roomId:'r_8',  status:'dirty',       assignedTo:null,        priority:'medium', due:t(13), notes:'Late check-out'        },
      { id:'HK-203', roomId:'r_12', status:'inspected',   assignedTo:'Pedro L.',  priority:'low',    due:t(10), notes:'Ready for arrival'     },
      { id:'HK-204', roomId:'r_15', status:'clean',       assignedTo:'Aiko T.',   priority:'high',   due:t(12), notes:'Suite turn-down'       },
      { id:'HK-205', roomId:'r_19', status:'dirty',       assignedTo:'Maria S.',  priority:'medium', due:t(14), notes:null                    },
      { id:'HK-206', roomId:'r_22', status:'maintenance', assignedTo:'Tomás R.',  priority:'high',   due:t(16), notes:'AC unit not cooling'   },
      { id:'HK-207', roomId:'r_5',  status:'cleaning',    assignedTo:'Pedro L.',  priority:'low',    due:t(15), notes:null                    },
      { id:'HK-208', roomId:'r_17', status:'dirty',       assignedTo:null,        priority:'medium', due:t(13), notes:null                    },
    ]) {
      await conn.execute('INSERT INTO housekeepingTasks (id,roomId,status,assignedTo,priority,due,notes) VALUES (?,?,?,?,?,?,?)',
        [tk.id, tk.roomId, tk.status, tk.assignedTo || null, tk.priority, tk.due, tk.notes || null]);
    }

    for (const n of [
      { id:'n1', read:0, time:'2 min ago',  title:'Late check-in expected — BK-7721', sub:'Rafael Vidal · ETA 22:40'            },
      { id:'n2', read:0, time:'18 min ago', title:'Maintenance request opened',        sub:'Room 322 · AC unit not cooling'      },
      { id:'n3', read:0, time:'1 hr ago',   title:'OTA rate parity drift',             sub:'Booking.com · Garden Suite +$24'    },
      { id:'n4', read:1, time:'3 hr ago',   title:'VIP arrival — Amelia Hartwell',     sub:'Pool Villa 103 · prepared at 09:00' },
      { id:'n5', read:1, time:'Yesterday',  title:'Daily revenue report ready',        sub:'Tap to view summary'                },
    ]) {
      await conn.execute('INSERT INTO notifications (id,`read`,time,title,sub) VALUES (?,?,?,?,?)',
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
  return { ...row, vip: row.vip === 1, notes: typeof row.notes === 'string' ? JSON.parse(row.notes || '[]') : (row.notes || []) };
}

function hydrateNotif(row) {
  if (!row) return null;
  return { ...row, read: row.read === 1 };
}

module.exports = { pool, initDb, hydrateGuest, hydrateNotif };
