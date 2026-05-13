/* KavPMS — Reservations page + ReservationDrawer */
/* eslint-disable */
const { useState: useResState, useEffect: useResEffect, useRef: useResRef } = React;

function Reservations({ setSelectedReservation }) {
  const [reservations, setReservations] = useResState(MOCK.reservations || []);
  const [search, setSearch]             = useResState('');
  const [statusFilter, setStatusFilter] = useResState('all');
  const [sortBy, setSortBy]             = useResState('checkIn');
  const [addOpen, setAddOpen]           = useResState(false);

  const refresh = async () => {
    const data = await kavAPI.getReservations();
    setReservations(data);
    MOCK.reservations = data;
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reservation?')) return;
    await kavAPI.deleteReservation(id);
    await refresh();
  };

  const handleAdd = async (form) => {
    await kavAPI.createReservation(form);
    await refresh();
    setAddOpen(false);
  };

  const STATUSES = ['all', 'pending', 'active', 'completed', 'cancelled', 'noshow'];

  const filtered = reservations
    .filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!search) return true;
      const g = helpers.guest(r.guestId);
      const room = helpers.room(r.roomId);
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        g?.name?.toLowerCase().includes(q) ||
        room?.number?.toString().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'checkIn')  return a.checkIn.localeCompare(b.checkIn);
      if (sortBy === 'checkOut') return a.checkOut.localeCompare(b.checkOut);
      if (sortBy === 'total')    return b.total - a.total;
      return 0;
    });

  const counts = {};
  STATUSES.forEach(s => {
    counts[s] = s === 'all' ? reservations.length : reservations.filter(r => r.status === s).length;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Front Office</div>
          <h1>Reservations</h1>
          <p>{reservations.length} total · {counts.active} active · {counts.pending} pending</p>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm">
            <Ic.Filter size={13} /><span>Export</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
            <Ic.Plus size={13} /><span>New booking</span>
          </button>
        </div>
      </div>

      <div className="row" style={{ gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div className="tb-search" style={{ flex: '1', minWidth: 200, maxWidth: 340 }}>
          <Ic.Search size={14} stroke="var(--fg-3)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guest, booking ID, room…"
          />
        </div>
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStatusFilter(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s]})`}
            </button>
          ))}
        </div>
        <select
          className="btn btn-ghost btn-sm"
          style={{ padding: '0 10px' }}
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
        >
          <option value="checkIn">Sort: Check-in</option>
          <option value="checkOut">Sort: Check-out</option>
          <option value="total">Sort: Total</option>
        </select>
      </div>

      <div className="glass table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Booking</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Stay</th>
              <th>Nights</th>
              <th>Source</th>
              <th>Payment</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const g    = helpers.guest(r.guestId);
              const room = helpers.room(r.roomId);
              if (!g || !room) return null;
              const nights = helpers.daysBetween(r.checkIn, r.checkOut);
              return (
                <tr key={r.id} onClick={() => setSelectedReservation(r)}>
                  <td className="num strong">{r.id}</td>
                  <td>
                    <div className="cell-guest">
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{helpers.initials(g.name)}</div>
                      <div className="meta">
                        <div className="name">{g.name} {g.vip && <Pill status="vip" />}</div>
                        <div className="sub">{g.nationality}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="strong">RM {room.number}</span> <span className="text-3">· {helpers.rtype(r.typeId)?.name}</span></td>
                  <td className="num">{helpers.fmt.date(r.checkIn)} → {helpers.fmt.date(r.checkOut)}</td>
                  <td className="num">{nights}n</td>
                  <td className="text-2">{r.source}</td>
                  <td><Pill status={r.paymentStatus} /></td>
                  <td><Pill status={r.status} /></td>
                  <td className="num strong" style={{ textAlign: 'right' }}>{helpers.fmt.money(r.total)}</td>
                  <td onClick={e => { e.stopPropagation(); handleDelete(r.id); }}>
                    <button className="tb-icon-btn" style={{ width: 24, height: 24 }}>
                      <Ic.X size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--fg-3)' }}>No reservations found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && (
        <AddReservationModal onSave={handleAdd} onClose={() => setAddOpen(false)} />
      )}
    </div>
  );
}

function AddReservationModal({ onSave, onClose }) {
  const guests = MOCK.guests || [];
  const rooms  = MOCK.rooms  || [];
  const types  = MOCK.roomTypes || [];
  const [form, setForm] = useResState({
    guestId: guests[0]?.id || '',
    roomId: rooms[0]?.id || '',
    typeId: types[0]?.id || '',
    checkIn:  helpers.d(1),
    checkOut: helpers.d(3),
    status: 'pending',
    paymentStatus: 'pending',
    source: 'Direct',
    total: 0,
    paid: 0,
    notes: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const nights = helpers.daysBetween(form.checkIn, form.checkOut);
  const selectedRoom = rooms.find(r => r.id === form.roomId);
  const rtype = types.find(t => t.id === (selectedRoom?.typeId || form.typeId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave({
      ...form,
      typeId: selectedRoom?.typeId || form.typeId,
      total: form.total || (rtype?.baseRate || 0) * nights,
    });
  };

  return (
    <Modal onClose={onClose} width={560}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)' }}>
          <h2>New reservation</h2>
        </div>
        <div style={{ padding: '18px 22px', maxHeight: 460, overflowY: 'auto' }}>
          <div className="form-group">
            <label>Guest</label>
            <select value={form.guestId} onChange={e => set('guestId', e.target.value)}>
              {guests.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Room</label>
            <select value={form.roomId} onChange={e => set('roomId', e.target.value)}>
              {rooms.filter(r => r.status === 'available').map(r => (
                <option key={r.id} value={r.id}>RM {r.number} · {helpers.rtype(r.typeId)?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Check-in</label>
              <input type="date" value={form.checkIn} onChange={e => set('checkIn', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Check-out</label>
              <input type="date" value={form.checkOut} onChange={e => set('checkOut', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}>
                {['Direct', 'Booking.com', 'Expedia', 'Airbnb', 'Phone', 'Walk-in'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Total (${rtype?.baseRate || 0}/night × {nights}n)</label>
              <input type="number" value={form.total || (rtype?.baseRate || 0) * nights} onChange={e => set('total', +e.target.value)} min={0} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 60 }} />
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm">Create booking</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── ReservationDrawer ── */
function ReservationDrawer({ reservation: initR, onClose, onCheckIn }) {
  const [r, setR]   = useResState(initR);
  const [tab, setTab] = useResState('details');

  const g    = helpers.guest(r.guestId);
  const room = helpers.room(r.roomId);
  const rtype = helpers.rtype(r.typeId);
  const nights = helpers.daysBetween(r.checkIn, r.checkOut);

  const handlePayment = async (body) => {
    const updated = await kavAPI.updatePayment(r.id, body);
    setR(updated);
    MOCK.reservations = MOCK.reservations.map(x => x.id === updated.id ? updated : x);
  };

  if (!g || !room) return null;

  const TABS = [
    { id: 'details',  label: 'Details' },
    { id: 'charges',  label: 'Charges' },
    { id: 'timeline', label: 'Timeline' },
  ];

  return (
    <Drawer onClose={onClose} width={540}>
      <div className="drawer-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{r.id}</div>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <h2 style={{ fontSize: 17 }}>{g.name}</h2>
            {g.vip && <Pill status="vip" />}
          </div>
          <div className="text-2 fz-12" style={{ marginTop: 3 }}>RM {room.number} · {rtype?.name} · {nights} nights</div>
        </div>
        <button className="tb-icon-btn" onClick={onClose}><Ic.X size={16} /></button>
      </div>

      <div style={{ padding: '0 22px', borderBottom: '1px solid var(--hairline)' }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="drawer-body" style={{ padding: '16px 22px' }}>
        {tab === 'details' && <RDetailsTab r={r} g={g} room={room} rtype={rtype} nights={nights} />}
        {tab === 'charges' && <RChargesTab r={r} onPayment={handlePayment} />}
        {tab === 'timeline' && <RTimelineTab r={r} />}
      </div>

      <div className="drawer-foot">
        {r.status === 'pending' && (
          <button className="btn btn-primary btn-sm" onClick={() => { onCheckIn(r); onClose(); }}>
            <Ic.Logout size={13} /> Check in
          </button>
        )}
        {r.status === 'active' && (
          <button className="btn btn-ghost btn-sm" onClick={() => { onCheckIn(r); onClose(); }}>
            <Ic.Logout size={13} /> Manage stay
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
    </Drawer>
  );
}

function RDetailsTab({ r, g, room, rtype, nights }) {
  return (
    <div>
      <div className="confirm-card" style={{ marginBottom: 14 }}>
        <div className="row between">
          <div>
            <div className="text-3 mono fz-10 uppercase">Stay</div>
            <div className="text-h fw-5 fz-13" style={{ marginTop: 3 }}>
              {helpers.fmt.date(r.checkIn)} → {helpers.fmt.date(r.checkOut)} · {nights} nights
            </div>
          </div>
          <Pill status={r.status} />
        </div>
      </div>

      <Field label="Guest" value={g.name} />
      <Field label="Email" value={g.email} />
      <Field label="Phone" value={g.phone} />
      <Field label="Nationality" value={g.nationality} />
      <Field label="Room" value={`RM ${room.number} · ${rtype?.name}`} />
      <Field label="Floor" value={`Floor ${room.floor}`} />
      <Field label="Booking source" value={r.source} />
      <Field label="Payment status" value={<Pill status={r.paymentStatus} />} />
      {r.notes && <Field label="Notes" value={r.notes} />}
    </div>
  );
}

function RChargesTab({ r, onPayment }) {
  const [amount, setAmount] = useResState('');
  const balance = r.total - r.paid;

  const handleCollect = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    await onPayment({ amountPaid: n, paymentStatus: n >= balance ? 'paid' : 'partial' });
    setAmount('');
  };

  return (
    <div>
      <div className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--hairline)', marginBottom: 8 }}>
        <span className="text-3 fz-12">Room charges</span>
        <span className="text-h fw-5">{helpers.fmt.money(r.total)}</span>
      </div>
      <ChargeRow label="Paid" value={r.paid} positive />
      <ChargeRow label="Balance due" value={balance} bold />

      {balance > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 8, letterSpacing: '0.1em' }}>Collect payment</div>
          <div className="row gap-2">
            <input
              type="number"
              placeholder={`Max ${helpers.fmt.money(balance)}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleCollect}>Collect</button>
          </div>
          <div className="row gap-2" style={{ marginTop: 8 }}>
            {[balance, balance / 2].filter(v => v > 0).map(v => (
              <button key={v} className="btn btn-ghost btn-xs" onClick={() => setAmount(v.toFixed(2))}>
                {helpers.fmt.money(v)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChargeRow({ label, value, positive, bold }) {
  return (
    <div className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
      <span className={`fz-13 ${bold ? 'fw-5 text-h' : 'text-2'}`}>{label}</span>
      <span className={`mono fz-13 ${bold ? 'fw-5 text-h' : ''} ${positive ? 'text-3' : ''}`}>
        {positive ? '−' : ''}{helpers.fmt.money(Math.abs(value))}
      </span>
    </div>
  );
}

function RTimelineTab({ r }) {
  const events = [
    { time: r.checkIn,   label: 'Check-in',        icon: 'ArrowR', done: ['active','completed'].includes(r.status) },
    { time: r.checkOut,  label: 'Check-out',        icon: 'Logout', done: r.status === 'completed' },
  ];
  return (
    <div className="timeline">
      {events.map((ev, i) => {
        const I = Ic[ev.icon];
        return (
          <div key={i} className="tl-item">
            <div className="tl-dot" style={ev.done ? { background: 'var(--st-available)', borderColor: 'var(--st-available)' } : {}}>
              {ev.done ? <Ic.Check size={10} stroke="#fff" /> : <I size={10} stroke="var(--fg-3)" />}
            </div>
            <div className="col flex-1">
              <div className="text-h fz-13 fw-5">{ev.label}</div>
              <div className="text-3 mono fz-11">{helpers.fmt.date(ev.time)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{value}</div>
    </div>
  );
}

window.Reservations = Reservations;
window.ReservationDrawer = ReservationDrawer;
window.Field = Field;
