/* KavPMS — Guests, Housekeeping, Calendar, Reports, Settings */
/* eslint-disable */
const { useState: useOState, useEffect: useOEffect, useRef: useORef } = React;

/* ══════════════════════════════════════════════
   GUESTS
══════════════════════════════════════════════ */
function Guests() {
  const [guests, setGuests]       = useOState(MOCK.guests || []);
  const [search, setSearch]       = useOState('');
  const [selected, setSelected]   = useOState(null);
  const [addOpen, setAddOpen]     = useOState(false);

  const refresh = async () => {
    const data = await kavAPI.getGuests();
    setGuests(data);
    MOCK.guests = data;
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this guest?')) return;
    await kavAPI.deleteGuest(id);
    await refresh();
    setSelected(null);
  };

  const handleAdd = async (form) => {
    await kavAPI.createGuest(form);
    await refresh();
    setAddOpen(false);
  };

  const handleUpdate = async (id, form) => {
    await kavAPI.updateGuest(id, form);
    await refresh();
    setSelected(null);
  };

  const handleAddNote = async (id, note) => {
    await kavAPI.addGuestNote(id, note);
    await refresh();
    const updated = (MOCK.guests || []).find(g => g.id === id);
    if (updated) setSelected(updated);
  };

  const filtered = guests.filter(g => {
    if (!search) return true;
    const q = search.toLowerCase();
    return g.name?.toLowerCase().includes(q) || g.email?.toLowerCase().includes(q) || g.nationality?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">CRM</div>
          <h1>Guests</h1>
          <p>{guests.length} registered guests</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
            <Ic.Plus size={13} /><span>Add guest</span>
          </button>
        </div>
      </div>

      <div className="tb-search" style={{ marginBottom: 14, maxWidth: 360 }}>
        <Ic.Search size={14} stroke="var(--fg-3)" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests…" />
      </div>

      <div className="glass table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Guest</th><th>Nationality</th><th>Email</th><th>Phone</th><th>Stays</th><th>VIP</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(g => (
              <tr key={g.id} onClick={() => setSelected(g)}>
                <td>
                  <div className="cell-guest">
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{helpers.initials(g.name)}</div>
                    <span className="name">{g.name}</span>
                  </div>
                </td>
                <td className="text-2">{g.nationality}</td>
                <td className="text-2">{g.email}</td>
                <td className="text-2 mono">{g.phone}</td>
                <td className="num">{g.stays || 0}</td>
                <td>{g.vip && <Pill status="vip" />}</td>
                <td onClick={e => { e.stopPropagation(); handleDelete(g.id); }}>
                  <button className="tb-icon-btn" style={{ width: 24, height: 24 }}><Ic.X size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <GuestDrawer
          guest={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onAddNote={handleAddNote}
          onDelete={handleDelete}
        />
      )}

      {addOpen && <GuestFormModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function GuestDrawer({ guest: initG, onClose, onUpdate, onAddNote, onDelete }) {
  const [g, setG]         = useOState(initG);
  const [note, setNote]   = useOState('');
  const [editing, setEditing] = useOState(false);
  const [form, setForm]   = useOState({ name: g.name, email: g.email, phone: g.phone, nationality: g.nationality, vip: g.vip });

  useOEffect(() => { setG(initG); setForm({ name: initG.name, email: initG.email, phone: initG.phone, nationality: initG.nationality, vip: initG.vip }); }, [initG.id]);

  const reservations = (MOCK.reservations || []).filter(r => r.guestId === g.id);

  const handleSave = async () => {
    await onUpdate(g.id, form);
    setEditing(false);
  };

  const handleNote = async () => {
    if (!note.trim()) return;
    await onAddNote(g.id, note.trim());
    setNote('');
  };

  return (
    <Drawer onClose={onClose} width={500}>
      <div className="guest-profile-head">
        <div className="guest-avatar-lg">{helpers.initials(g.name)}</div>
        <div className="col flex-1">
          <div className="row gap-2">
            <div className="fz-18 fw-5 text-h">{g.name}</div>
            {g.vip && <Pill status="vip" />}
          </div>
          <div className="text-3 fz-12 mono" style={{ marginTop: 3 }}>{g.nationality} · {reservations.length} stay{reservations.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost btn-xs" onClick={() => setEditing(e => !e)}><Ic.Edit size={12} /></button>
          <button className="tb-icon-btn" onClick={onClose}><Ic.X size={16} /></button>
        </div>
      </div>

      <div className="drawer-body">
        {editing ? (
          <div>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Nationality</label>
                <input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} />
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>Save changes</button>
            </div>
          </div>
        ) : (
          <>
            <Field label="Email"       value={g.email} />
            <Field label="Phone"       value={g.phone || '—'} />
            <Field label="Nationality" value={g.nationality} />
            <Field label="Passport"    value={g.passport || '—'} />
            <Field label="Total stays" value={g.stays || 0} />

            {reservations.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 10, letterSpacing: '0.1em' }}>Stay history</div>
                {reservations.slice(0, 5).map(r => {
                  const room = helpers.room(r.roomId);
                  return (
                    <div key={r.id} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--hairline)', gap: 10 }}>
                      <div className="col flex-1">
                        <div className="fz-12 fw-5 text-h">RM {room?.number || '—'}</div>
                        <div className="text-3 mono fz-10">{helpers.fmt.date(r.checkIn)} → {helpers.fmt.date(r.checkOut)}</div>
                      </div>
                      <div>
                        <Pill status={r.status} />
                      </div>
                      <div className="num fz-12 text-h">{helpers.fmt.money(r.total)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 8, letterSpacing: '0.1em' }}>Guest notes</div>
              {(g.notes || []).map((n, i) => (
                <div key={i} style={{ padding: '6px 10px', background: 'var(--surface-3)', borderRadius: 6, fontSize: 12, marginBottom: 6, color: 'var(--fg-1)' }}>{n}</div>
              ))}
              <div className="row gap-2" style={{ marginTop: 8 }}>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note…"
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleNote()}
                />
                <button className="btn btn-ghost btn-sm" onClick={handleNote}>Add</button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="drawer-foot">
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(g.id)}>Delete</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
    </Drawer>
  );
}

function GuestFormModal({ onSave, onClose }) {
  const [form, setForm] = useOState({ name: '', email: '', phone: '', nationality: '', passport: '', vip: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => { e.preventDefault(); await onSave(form); };
  return (
    <Modal onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)' }}><h2>Add guest</h2></div>
        <div style={{ padding: '18px 22px' }}>
          <div className="form-group"><label>Full name</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Nationality</label><input value={form.nationality} onChange={e => set('nationality', e.target.value)} /></div>
            <div className="form-group"><label>Passport / ID</label><input value={form.passport} onChange={e => set('passport', e.target.value)} /></div>
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm">Add guest</button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════
   HOUSEKEEPING
══════════════════════════════════════════════ */
function Housekeeping({ pushToast }) {
  const [tasks, setTasks]     = useOState(MOCK.housekeepingTasks || []);
  const [addOpen, setAddOpen] = useOState(false);

  const refresh = async () => {
    const data = await kavAPI.getHousekeeping();
    setTasks(data);
    MOCK.housekeepingTasks = data;
  };

  const handleAdvance = async (id) => {
    const updated = await kavAPI.advanceTask(id);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    MOCK.housekeepingTasks = MOCK.housekeepingTasks.map(t => t.id === updated.id ? updated : t);
    pushToast('Task advanced');
  };

  const handleAssign = async (id, assignedTo) => {
    const updated = await kavAPI.assignTask(id, assignedTo);
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    MOCK.housekeepingTasks = MOCK.housekeepingTasks.map(t => t.id === updated.id ? updated : t);
  };

  const handleDelete = async (id) => {
    await kavAPI.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    MOCK.housekeepingTasks = MOCK.housekeepingTasks.filter(t => t.id !== id);
  };

  const handleAdd = async (form) => {
    await kavAPI.createTask(form);
    await refresh();
    setAddOpen(false);
    pushToast('Task created');
  };

  const cols = [
    { status: 'dirty',     label: 'Dirty',     color: 'var(--st-dirty)'     },
    { status: 'cleaning',  label: 'Cleaning',  color: 'var(--st-occupied)'  },
    { status: 'clean',     label: 'Clean',     color: 'var(--st-available)' },
    { status: 'inspected', label: 'Inspected', color: 'var(--st-available)' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Operations</div>
          <h1>Housekeeping</h1>
          <p>{tasks.filter(t => t.status === 'dirty' || t.status === 'cleaning').length} tasks active</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
            <Ic.Plus size={13} /><span>New task</span>
          </button>
        </div>
      </div>

      <div className="hk-board">
        {cols.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          return (
            <div key={col.status} className="glass hk-col">
              <div className="hk-col-head">
                <div className="row gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span className="text-h fz-12 fw-5">{col.label}</span>
                </div>
                <span className="text-3 mono fz-11">{colTasks.length}</span>
              </div>
              <div>
                {colTasks.map(t => (
                  <HKTask key={t.id} task={t} onAdvance={handleAdvance} onAssign={handleAssign} onDelete={handleDelete} />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ padding: '16px 14px', color: 'var(--fg-3)', fontSize: 12 }}>No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addOpen && <HKTaskModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function HKTask({ task, onAdvance, onAssign, onDelete }) {
  const room = helpers.room(task.roomId);
  const NEXT = { dirty: 'Start cleaning', cleaning: 'Mark clean', clean: 'Inspect', inspected: null };
  const nextLabel = NEXT[task.status];

  return (
    <div className="hk-task">
      <div className="row between" style={{ marginBottom: 6 }}>
        <div className="text-h fz-13 fw-5">RM {room?.number || '—'}</div>
        {task.priority === 'high' && <Pill status="maintenance" label="High" />}
      </div>
      <div className="text-3 fz-11" style={{ marginBottom: 8 }}>{task.notes || 'Standard turn-over'}</div>
      <div className="text-3 mono fz-10" style={{ marginBottom: 10 }}>
        {task.assignedTo || 'Unassigned'} · due {task.due}
      </div>
      <div className="row gap-2">
        {nextLabel && (
          <button className="btn btn-ghost btn-xs" style={{ flex: 1 }} onClick={() => onAdvance(task.id)}>
            {nextLabel}
          </button>
        )}
        <button className="tb-icon-btn" style={{ width: 24, height: 24 }} onClick={() => onDelete(task.id)}>
          <Ic.X size={11} />
        </button>
      </div>
    </div>
  );
}

function HKTaskModal({ onSave, onClose }) {
  const rooms = MOCK.rooms || [];
  const [form, setForm] = useOState({
    roomId: rooms[0]?.id || '',
    status: 'dirty',
    priority: 'normal',
    assignedTo: '',
    notes: '',
    due: helpers.d(0),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e) => { e.preventDefault(); await onSave(form); };
  return (
    <Modal onClose={onClose} width={440}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)' }}><h2>New task</h2></div>
        <div style={{ padding: '18px 22px' }}>
          <div className="form-group">
            <label>Room</label>
            <select value={form.roomId} onChange={e => set('roomId', e.target.value)}>
              {rooms.map(r => <option key={r.id} value={r.id}>RM {r.number} ({r.status})</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['dirty', 'cleaning', 'clean', 'inspected'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Assign to</label>
              <input value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="Staff name" />
            </div>
            <div className="form-group">
              <label>Due by</label>
              <input type="date" value={form.due} onChange={e => set('due', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Task description" />
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm">Create task</button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════ */
function Calendar({ property, pushToast }) {
  const [weekOffset, setWeekOffset] = useOState(0);

  const rooms = (MOCK.rooms || []).filter(r => r.propertyId === property.id).slice(0, 12);
  const reservations = MOCK.reservations || [];

  const weekStart = new Date('2026-05-09');
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const toISO = d => d.toISOString().slice(0, 10);
  const todayISO = '2026-05-09';

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Planning · {property.name}</div>
          <h1>Calendar</h1>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}><Ic.ArrowR size={13} style={{ transform: 'rotate(180deg)' }} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>Today</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}><Ic.ArrowR size={13} /></button>
        </div>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid var(--hairline)' }}>
          <div style={{ padding: '8px 10px', borderRight: '1px solid var(--hairline)' }} />
          {days.map((d, i) => {
            const iso = toISO(d);
            const isToday = iso === todayISO;
            return (
              <div key={i} style={{
                padding: '8px 0', textAlign: 'center',
                borderRight: i < 6 ? '1px solid var(--hairline)' : 'none',
                background: isToday ? 'var(--accent-soft)' : 'transparent'
              }}>
                <div className={`text-3 mono fz-10 ${isToday ? '' : ''}`} style={{ color: isToday ? 'var(--accent)' : 'var(--fg-3)' }}>
                  {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                </div>
                <div className={`fz-13 fw-5 ${isToday ? 'text-h' : 'text-2'}`} style={{ color: isToday ? 'var(--accent)' : undefined }}>
                  {d.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {rooms.map(room => (
          <div key={room.id} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', borderBottom: '1px solid var(--hairline)', minHeight: 48 }}>
            <div style={{ padding: '8px 10px', borderRight: '1px solid var(--hairline)', display: 'flex', alignItems: 'center' }}>
              <span className="text-2 mono fz-11">RM {room.number}</span>
            </div>
            {days.map((d, i) => {
              const iso = toISO(d);
              const isToday = iso === todayISO;
              const res = reservations.find(r =>
                r.roomId === room.id && r.checkIn <= iso && r.checkOut > iso &&
                ['pending', 'active'].includes(r.status)
              );
              const g = res ? helpers.guest(res.guestId) : null;
              const isStart = res && res.checkIn === iso;
              return (
                <div key={i} style={{
                  position: 'relative',
                  borderRight: i < 6 ? '1px solid var(--hairline)' : 'none',
                  background: isToday ? 'var(--accent-soft)' : 'transparent',
                  minHeight: 48,
                }}>
                  {res && isStart && g && (
                    <div style={{
                      position: 'absolute',
                      top: 6, left: 4,
                      right: -2,
                      bottom: 6,
                      background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 10.5,
                      fontWeight: 500,
                      color: '#fff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                      cursor: 'pointer',
                    }}>
                      {g.name.split(' ')[0]}
                    </div>
                  )}
                  {res && !isStart && (
                    <div style={{
                      position: 'absolute',
                      top: 6, left: 0, right: i < 6 ? -2 : 0, bottom: 6,
                      background: 'oklch(from var(--accent) l c h / 0.3)',
                      zIndex: 1,
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════ */
function Reports() {
  const [metrics, setMetrics]   = useOState(null);
  const [loading, setLoading]   = useOState(true);
  const [channelMix, setChannelMix] = useOState(MOCK.channelMix || []);
  const [rtPerf, setRtPerf]     = useOState(MOCK.roomTypePerformance || []);

  useOEffect(() => {
    (async () => {
      try {
        const [m, cm, rp] = await Promise.all([
          kavAPI.getMetrics(),
          kavAPI.getChannelMix(),
          kavAPI.getRoomTypePerformance(),
        ]);
        setMetrics(m);
        setChannelMix(cm);
        setRtPerf(rp);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const revenue7d = (MOCK.paymentsTimeline || []).reduce((s, p) => s + p.value, 0);
  const rooms = MOCK.rooms || [];
  const total = rooms.length;
  const occupied = rooms.filter(r => r.status === 'occupied').length;
  const occPct = total ? Math.round((occupied / total) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Analytics</div>
          <h1>Reports</h1>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm"><Ic.Filter size={13} /><span>Export</span></button>
          <button className="btn btn-primary btn-sm"><Ic.Bolt size={13} /><span>Full report</span></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stat-row" style={{ marginBottom: 14 }}>
        <div className="glass metric">
          <div className="top"><div className="label">Occupancy</div><div className="icon"><Ic.Sparkle2 size={14} /></div></div>
          <div className="v">{occPct}<span className="unit">%</span></div>
          <div className="delta up"><Ic.ArrowU size={11} /> +6.2 vs last week</div>
        </div>
        <div className="glass metric">
          <div className="top"><div className="label">Revenue · 7 days</div><div className="icon"><Ic.Coin size={14} /></div></div>
          <div className="v">{helpers.fmt.money(revenue7d)}</div>
          <div className="delta up"><Ic.ArrowU size={11} /> 18.4% wow</div>
        </div>
        <div className="glass metric">
          <div className="top"><div className="label">ADR</div><div className="icon"><Ic.Card size={14} /></div></div>
          <div className="v">$1,720</div>
          <div className="delta"><span className="text-3">avg daily rate</span></div>
        </div>
        <div className="glass metric">
          <div className="top"><div className="label">RevPAR</div><div className="icon"><Ic.Chart size={14} /></div></div>
          <div className="v">$1,221</div>
          <div className="delta up"><Ic.ArrowU size={11} /> On target</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: 10, marginBottom: 14 }}>
        {/* Revenue bar chart */}
        <div className="glass" style={{ padding: 22 }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 16, letterSpacing: '0.1em' }}>Revenue · 7 days</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 120 }}>
            {(MOCK.paymentsTimeline || []).map((p, i) => (
              <div key={i} className="col flex-1" style={{ alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: '100%',
                  height: `${(p.value / 12000) * 100}%`,
                  background: i === (MOCK.paymentsTimeline.length - 1) ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'var(--surface-3)',
                  borderRadius: 6,
                  minHeight: 4,
                  transition: 'all 240ms',
                }} />
                <div className="text-3 mono" style={{ fontSize: 10 }}>{p.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Channel mix */}
        <div className="glass" style={{ padding: 22 }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 16, letterSpacing: '0.1em' }}>Booking channels</div>
          <div className="col gap-3">
            {channelMix.slice(0, 5).map((ch, i) => (
              <div key={i}>
                <div className="row between" style={{ marginBottom: 5 }}>
                  <span className="text-1 fz-12">{ch.source}</span>
                  <span className="text-h mono fz-12 fw-5">{ch.pct}<span className="text-3">%</span></span>
                </div>
                <div className="bar"><div className="bar-fill" style={{ width: `${ch.pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Occupancy sparkline */}
      <div className="glass" style={{ padding: 22, marginBottom: 14 }}>
        <div className="row between" style={{ marginBottom: 16 }}>
          <div>
            <div className="text-3 mono fz-10 uppercase" style={{ letterSpacing: '0.1em' }}>Occupancy · 14-day trend</div>
            <div className="fz-22 fw-5 text-h" style={{ marginTop: 4 }}>{occPct}%</div>
          </div>
          <Pill status="completed" label="On track" />
        </div>
        <Sparkline data={MOCK.occupancyHistory || []} w={800} h={60} />
      </div>

      {/* Room type performance */}
      {rtPerf.length > 0 && (
        <div className="glass table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Room type</th><th>Rooms</th><th className="num">Base rate</th><th>Occupancy</th><th className="num">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {rtPerf.map((rt, i) => (
                <tr key={i}>
                  <td className="strong">{rt.name}</td>
                  <td>{rt.rooms}</td>
                  <td className="num">{helpers.fmt.money(rt.baseRate)}/night</td>
                  <td>
                    <div className="row gap-2">
                      <div className="bar" style={{ width: 80 }}>
                        <div className="bar-fill" style={{ width: `${rt.occupancy || 0}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                      </div>
                      <span className="mono fz-11">{rt.occupancy || 0}%</span>
                    </div>
                  </td>
                  <td className="num strong">{helpers.fmt.money(rt.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════ */
function Settings({ theme, setTheme }) {
  const [notifEmail, setNotifEmail] = useOState(true);
  const [notifSMS, setNotifSMS]     = useOState(false);
  const [autoHK, setAutoHK]         = useOState(true);
  const [currency, setCurrency]     = useOState('USD');

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">System</div>
          <h1>Settings</h1>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Appearance */}
        <div className="settings-section">
          <div className="settings-section-title">Appearance</div>
          <div className="glass" style={{ overflow: 'hidden' }}>
            <div className="settings-row">
              <div>
                <div className="fz-13 fw-5 text-h">Theme</div>
                <div className="text-3 fz-12">Dark or light interface</div>
              </div>
              <div className="row gap-2">
                {['dark', 'light'].map(t => (
                  <button
                    key={t}
                    className={`btn btn-sm ${theme === t ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setTheme(t)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-section">
          <div className="settings-section-title">Notifications</div>
          <div className="glass" style={{ overflow: 'hidden' }}>
            <div className="settings-row">
              <div>
                <div className="fz-13 fw-5 text-h">Email notifications</div>
                <div className="text-3 fz-12">Receive alerts via email</div>
              </div>
              <div className={`toggle ${notifEmail ? 'on' : ''}`} onClick={() => setNotifEmail(v => !v)} />
            </div>
            <div className="settings-row">
              <div>
                <div className="fz-13 fw-5 text-h">SMS alerts</div>
                <div className="text-3 fz-12">Send SMS for urgent events</div>
              </div>
              <div className={`toggle ${notifSMS ? 'on' : ''}`} onClick={() => setNotifSMS(v => !v)} />
            </div>
          </div>
        </div>

        {/* Operations */}
        <div className="settings-section">
          <div className="settings-section-title">Operations</div>
          <div className="glass" style={{ overflow: 'hidden' }}>
            <div className="settings-row">
              <div>
                <div className="fz-13 fw-5 text-h">Auto-create housekeeping tasks</div>
                <div className="text-3 fz-12">Create task on checkout automatically</div>
              </div>
              <div className={`toggle ${autoHK ? 'on' : ''}`} onClick={() => setAutoHK(v => !v)} />
            </div>
            <div className="settings-row">
              <div>
                <div className="fz-13 fw-5 text-h">Currency</div>
                <div className="text-3 fz-12">Display currency</div>
              </div>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                style={{ width: 100, padding: '4px 8px' }}
              >
                {['USD', 'EUR', 'GBP', 'AED', 'SGD'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-section">
          <div className="settings-section-title">About</div>
          <div className="glass" style={{ overflow: 'hidden' }}>
            <div className="settings-row">
              <div className="fz-13 fw-5 text-h">KavPMS</div>
              <div className="text-3 mono fz-11">v0.4 · Boutique Edition</div>
            </div>
            <div className="settings-row">
              <div className="fz-13 text-2">API endpoint</div>
              <div className="text-3 mono fz-11">localhost:3000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Guests      = Guests;
window.Housekeeping = Housekeeping;
window.Calendar    = Calendar;
window.Reports     = Reports;
window.Settings    = Settings;
