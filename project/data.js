/* KavPMS — data layer: helpers + API client */
/* eslint-disable */
const TODAY = new Date('2026-05-09T08:00:00');
const d = (offset) => {
  const x = new Date(TODAY);
  x.setDate(x.getDate() + offset);
  return x.toISOString().slice(0,10);
};
const t = (h, m=0) => `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

/* Populated by initData() from /api/init */
window.MOCK = {};

window.helpers = {
  d, t,
  fmt: {
    money: (n) => '$' + (n||0).toLocaleString(undefined, { maximumFractionDigits: 0 }),
    date: (s) => {
      if (!s) return '—';
      const dt = new Date(s);
      return dt.toLocaleDateString('en-US', { month:'short', day:'numeric' });
    },
    weekday: (s) => new Date(s).toLocaleDateString('en-US', { weekday:'short' }),
  },
  guest:   (id) => (window.MOCK.guests    || []).find(g  => g.id  === id),
  room:    (id) => (window.MOCK.rooms     || []).find(r  => r.id  === id),
  rtype:   (id) => (window.MOCK.roomTypes || []).find(rt => rt.id === id),
  initials:(n)  => n.split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase(),
  daysBetween: (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000),
};

/* ── API client ── */
const BASE = '';  /* same origin */
async function apiFetch(method, path, body) {
  const token = localStorage.getItem('kavpms.token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

window.kavAPI = {
  /* ── Init ── */
  init: () => apiFetch('GET', '/api/init'),
  /* ── Properties ── */
  getProperties:    ()      => apiFetch('GET',    '/api/properties'),
  createProperty:   (body)  => apiFetch('POST',   '/api/properties', body),
  updateProperty:   (id, b) => apiFetch('PUT',    `/api/properties/${id}`, b),
  deleteProperty:   (id)    => apiFetch('DELETE', `/api/properties/${id}`),
  /* ── Room types ── */
  getRoomTypes:     ()      => apiFetch('GET',    '/api/room-types'),
  createRoomType:   (body)  => apiFetch('POST',   '/api/room-types', body),
  updateRoomType:   (id, b) => apiFetch('PUT',    `/api/room-types/${id}`, b),
  deleteRoomType:   (id)    => apiFetch('DELETE', `/api/room-types/${id}`),
  /* ── Rooms ── */
  getRooms:         (q)     => apiFetch('GET',    '/api/rooms' + (q ? '?' + new URLSearchParams(q) : '')),
  createRoom:       (body)  => apiFetch('POST',   '/api/rooms', body),
  updateRoom:       (id, b) => apiFetch('PUT',    `/api/rooms/${id}`, b),
  setRoomStatus:    (id, s) => apiFetch('PATCH',  `/api/rooms/${id}/status`, { status: s }),
  deleteRoom:       (id)    => apiFetch('DELETE', `/api/rooms/${id}`),
  /* ── Guests ── */
  getGuests:        (q)     => apiFetch('GET',    '/api/guests' + (q ? '?' + new URLSearchParams(q) : '')),
  createGuest:      (body)  => apiFetch('POST',   '/api/guests', body),
  updateGuest:      (id, b) => apiFetch('PUT',    `/api/guests/${id}`, b),
  addGuestNote:     (id, n) => apiFetch('PATCH',  `/api/guests/${id}/notes`, { note: n }),
  deleteGuest:      (id)    => apiFetch('DELETE', `/api/guests/${id}`),
  /* ── Reservations ── */
  getReservations:  (q)     => apiFetch('GET',    '/api/reservations' + (q ? '?' + new URLSearchParams(q) : '')),
  createReservation:(body)  => apiFetch('POST',   '/api/reservations', body),
  updateReservation:(id, b) => apiFetch('PUT',    `/api/reservations/${id}`, b),
  checkinReservation: (id, roomId)    => apiFetch('POST', `/api/reservations/${id}/checkin`,  roomId ? { roomId } : {}),
  checkoutReservation:(id, amountPaid)=> apiFetch('POST', `/api/reservations/${id}/checkout`, amountPaid != null ? { amountPaid } : {}),
  updatePayment:    (id, b) => apiFetch('PATCH',  `/api/reservations/${id}/payment`, b),
  deleteReservation:(id)    => apiFetch('DELETE', `/api/reservations/${id}`),
  /* ── Housekeeping ── */
  getHousekeeping:  (q)     => apiFetch('GET',    '/api/housekeeping' + (q ? '?' + new URLSearchParams(q) : '')),
  createTask:       (body)  => apiFetch('POST',   '/api/housekeeping', body),
  updateTask:       (id, b) => apiFetch('PUT',    `/api/housekeeping/${id}`, b),
  advanceTask:      (id)    => apiFetch('POST',   `/api/housekeeping/${id}/advance`),
  assignTask:       (id, a) => apiFetch('PATCH',  `/api/housekeeping/${id}/assign`, { assignedTo: a }),
  deleteTask:       (id)    => apiFetch('DELETE', `/api/housekeeping/${id}`),
  /* ── Notifications ── */
  getNotifications: ()      => apiFetch('GET',    '/api/notifications'),
  markNotifRead:    (id)    => apiFetch('PATCH',  `/api/notifications/${id}/read`),
  markAllRead:      ()      => apiFetch('POST',   '/api/notifications/mark-all-read'),
  deleteNotif:      (id)    => apiFetch('DELETE', `/api/notifications/${id}`),
  /* ── Reports ── */
  getMetrics:             () => apiFetch('GET', '/api/reports/metrics'),
  getPaymentsTimeline:    () => apiFetch('GET', '/api/reports/payments-timeline'),
  getOccupancyHistory:    () => apiFetch('GET', '/api/reports/occupancy-history'),
  getChannelMix:          () => apiFetch('GET', '/api/reports/channel-mix'),
  getRoomTypePerformance: () => apiFetch('GET', '/api/reports/room-type-performance'),
};

/* ── initData: fetch everything and populate window.MOCK ── */
window.initData = async function() {
  const data = await window.kavAPI.init();
  Object.assign(window.MOCK, data);
};
