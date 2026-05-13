/* KavPMS — Dashboard page */
/* eslint-disable */
function Dashboard({ property, setRoute, setSelectedReservation }) {
  const propRooms   = MOCK.rooms.filter(r => r.propertyId === property.id);
  const total       = propRooms.length;
  const occupied    = propRooms.filter(r => r.status === 'occupied').length;
  const available   = propRooms.filter(r => r.status === 'available').length;
  const dirty       = propRooms.filter(r => r.status === 'dirty').length;
  const maintenance = propRooms.filter(r => r.status === 'maintenance').length;
  const today       = helpers.d(0);
  const arrivals    = MOCK.reservations.filter(r => r.checkIn === today);
  const departures  = MOCK.reservations.filter(r => r.checkOut === today);
  const active      = MOCK.reservations.filter(r => r.status === 'active');
  const pending     = MOCK.reservations.filter(r => r.paymentStatus === 'pending');
  const revenue7d   = MOCK.paymentsTimeline.reduce((s, p) => s + p.value, 0);
  const todayRevenue = MOCK.paymentsTimeline[MOCK.paymentsTimeline.length - 1]?.value || 0;
  const maxRevenue  = Math.max(...MOCK.paymentsTimeline.map(p => p.value), 1);
  const adr         = MOCK.roomTypes.length
    ? Math.round(MOCK.roomTypes.reduce((s, rt) => s + Number(rt.baseRate || 0), 0) / MOCK.roomTypes.length)
    : 0;
  const occPct      = total ? Math.round((occupied / total) * 100) : 0;
  const peakOcc     = Math.max(...(MOCK.occupancyHistory || [occPct]));

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Front Office · {property.name}</div>
          <h1>Good morning, Sasi <span className="accent-italic">— here's today.</span></h1>
          <p>Friday, May 9. Five villa suites in focus, with direct arrivals, a pending checkout, and housekeeping turns before afternoon check-in.</p>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setRoute('reports')}><Ic.Filter size={13} /><span>Filters</span></button>
          <button className="btn btn-primary btn-sm" onClick={() => setRoute('reports')}><Ic.Bolt size={13} /><span>Daily report</span></button>
        </div>
      </div>

      {/* Top row */}
      <div className="grid grid-4" style={{ marginBottom:14 }}>
        <div className="glass metric feature" style={{ gridColumn:'span 2' }}>
          <div className="top">
            <div>
              <div className="label">Occupancy · today</div>
              <div className="v" style={{ marginTop:14, fontSize:48 }}>{occPct}<span className="unit">%</span></div>
              <div className="delta up" style={{ marginTop:8 }}><Ic.ArrowU size={11} /> +6.2 vs last Fri · {occupied}/{total} rooms</div>
            </div>
            <div className="icon" style={{ background:'var(--accent-soft)', color:'var(--accent)', borderColor:'transparent' }}>
              <Ic.Sparkle2 size={14} />
            </div>
          </div>
          <div style={{ marginTop:'auto' }}>
            <div className="row between" style={{ marginBottom:8 }}>
              <div className="text-3 mono fz-10">14-DAY TREND</div>
              <div className="text-3 mono fz-10">PEAK {peakOcc}%</div>
            </div>
            <Sparkline data={MOCK.occupancyHistory} w={400} h={48} />
          </div>
        </div>
        <div className="glass metric">
          <div className="top">
            <div className="label">Today's revenue</div>
            <div className="icon"><Ic.Coin size={14} /></div>
          </div>
          <div className="v">{helpers.fmt.money(todayRevenue)}</div>
          <div className="delta up"><Ic.ArrowU size={11} /> Web20 and direct offers pacing well</div>
        </div>
        <div className="glass metric">
          <div className="top">
            <div className="label">Active bookings</div>
            <div className="icon"><Ic.Calendar size={14} /></div>
          </div>
          <div className="v">{active.length}</div>
          <div className="delta"><span className="text-3">{pending.length} pending payment</span></div>
        </div>
      </div>

      {/* Room status row */}
      <div className="grid grid-4" style={{ marginBottom:14 }}>
        <RoomStat label="Available"   value={available}   status="available"   />
        <RoomStat label="Occupied"    value={occupied}    status="occupied"    />
        <RoomStat label="Dirty"       value={dirty}       status="dirty"       />
        <RoomStat label="Maintenance" value={maintenance} status="maintenance" />
      </div>

      {/* Arrivals / departures / housekeeping */}
      <div className="grid grid-3" style={{ marginBottom:14 }}>
        <div className="glass" style={{ padding:18 }}>
          <div className="row between" style={{ marginBottom:14 }}>
            <div>
              <div className="text-3 mono fz-10 uppercase">Today's arrivals</div>
              <div className="fz-22 fw-5 text-h" style={{ marginTop:4, letterSpacing:'-0.02em' }}>{arrivals.length}</div>
            </div>
            <div className="icon"><Ic.ArrowR size={14} /></div>
          </div>
          <div className="col gap-2">
            {arrivals.slice(0,3).map(r => {
              const g    = helpers.guest(r.guestId);
              const room = helpers.room(r.roomId);
              if (!g || !room) return null;
              return (
                <div key={r.id} className="row" style={{ padding:'8px 0', borderTop:'1px solid var(--hairline)' }}>
                  <div className="avatar" style={{ width:28, height:28, fontSize:11 }}>{helpers.initials(g.name)}</div>
                  <div className="col flex-1" style={{ minWidth:0 }}>
                    <div className="text-h fz-12 fw-5">{g.name} {g.vip && <Pill status="vip" />}</div>
                    <div className="text-3 mono" style={{ fontSize:10.5 }}>RM {room.number} · {helpers.rtype(r.typeId)?.name}</div>
                  </div>
                  <div className="text-2 mono fz-11">15:00</div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-quiet btn-sm" style={{ marginTop:8, padding:0 }} onClick={() => setRoute('checkin')}>See all <Ic.ArrowR size={12} /></button>
        </div>

        <div className="glass" style={{ padding:18 }}>
          <div className="row between" style={{ marginBottom:14 }}>
            <div>
              <div className="text-3 mono fz-10 uppercase">Today's departures</div>
              <div className="fz-22 fw-5 text-h" style={{ marginTop:4, letterSpacing:'-0.02em' }}>{departures.length}</div>
            </div>
            <div className="icon"><Ic.Logout size={14} /></div>
          </div>
          <div className="col gap-2">
            {departures.slice(0,3).map(r => {
              const g    = helpers.guest(r.guestId);
              const room = helpers.room(r.roomId);
              if (!g || !room) return null;
              return (
                <div key={r.id} className="row" style={{ padding:'8px 0', borderTop:'1px solid var(--hairline)' }}>
                  <div className="avatar" style={{ width:28, height:28, fontSize:11 }}>{helpers.initials(g.name)}</div>
                  <div className="col flex-1" style={{ minWidth:0 }}>
                    <div className="text-h fz-12 fw-5">{g.name}</div>
                    <div className="text-3 mono" style={{ fontSize:10.5 }}>RM {room.number} · ${r.total - r.paid} due</div>
                  </div>
                  <div className="text-2 mono fz-11">11:00</div>
                </div>
              );
            })}
            {departures.length === 0 && <div className="text-3 fz-12">No departures scheduled.</div>}
          </div>
          <button className="btn btn-quiet btn-sm" style={{ marginTop:8, padding:0 }} onClick={() => setRoute('checkin')}>Process check-outs <Ic.ArrowR size={12} /></button>
        </div>

        <div className="glass" style={{ padding:18 }}>
          <div className="row between" style={{ marginBottom:14 }}>
            <div>
              <div className="text-3 mono fz-10 uppercase">Housekeeping alerts</div>
              <div className="fz-22 fw-5 text-h" style={{ marginTop:4, letterSpacing:'-0.02em' }}>{MOCK.housekeepingTasks.filter(t => t.priority === 'high').length}</div>
            </div>
            <div className="icon"><Ic.Broom size={14} /></div>
          </div>
          <div className="col gap-2">
            {MOCK.housekeepingTasks.filter(t => t.priority === 'high').slice(0,3).map(t => {
              const room = helpers.room(t.roomId);
              if (!room) return null;
              return (
                <div key={t.id} className="row" style={{ padding:'8px 0', borderTop:'1px solid var(--hairline)' }}>
                  <Pill status={t.status} />
                  <div className="col flex-1" style={{ minWidth:0 }}>
                    <div className="text-h fz-12 fw-5">RM {room.number} · {t.notes || 'Standard turn-over'}</div>
                    <div className="text-3 mono" style={{ fontSize:10.5 }}>{t.assignedTo || 'Unassigned'} · due {t.due}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-quiet btn-sm" style={{ marginTop:8, padding:0 }} onClick={() => setRoute('housekeeping')}>Open board <Ic.ArrowR size={12} /></button>
        </div>
      </div>

      {/* Recent reservations */}
      <div className="section-head">
        <h2>Recent reservations</h2>
        <div className="row gap-2">
          <span className="meta">Updated 14:02</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setRoute('reservations')}>All bookings <Ic.ArrowR size={12} /></button>
        </div>
      </div>
      <div className="glass table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Booking</th><th>Guest</th><th>Room</th><th>Stay</th>
              <th>Source</th><th>Status</th><th style={{ textAlign:'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {MOCK.reservations.slice(0, 6).map(r => {
              const g    = helpers.guest(r.guestId);
              const room = helpers.room(r.roomId);
              if (!g || !room) return null;
              return (
                <tr key={r.id} onClick={() => setSelectedReservation(r)}>
                  <td className="num strong">{r.id}</td>
                  <td>
                    <div className="cell-guest">
                      <div className="avatar">{helpers.initials(g.name)}</div>
                      <div className="meta">
                        <div className="name">{g.name}</div>
                        <div className="sub">{g.nationality} · {g.email.split('@')[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="strong">RM {room.number}</span> <span className="text-3">· {helpers.rtype(r.typeId)?.name}</span></td>
                  <td className="num">{helpers.fmt.date(r.checkIn)} → {helpers.fmt.date(r.checkOut)}</td>
                  <td className="text-2">{r.source}</td>
                  <td><Pill status={r.status} /></td>
                  <td className="num strong" style={{ textAlign:'right' }}>{helpers.fmt.money(r.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Revenue + Room status overview */}
      <div className="grid grid-2" style={{ marginTop:14 }}>
        <div className="glass" style={{ padding:22 }}>
          <div className="row between">
            <div>
              <div className="text-3 mono fz-10 uppercase">Revenue · 7 days</div>
              <div className="fz-28 fw-5 text-h" style={{ marginTop:6, letterSpacing:'-0.02em' }}>{helpers.fmt.money(revenue7d)}</div>
              <div className="text-3 fz-12" style={{ marginTop:2 }}>{helpers.fmt.money(adr)} ADR · villa-suite mix</div>
            </div>
            <Pill status="completed" label="On target" />
          </div>
          <div style={{ marginTop:18, display:'flex', gap:6, alignItems:'flex-end', height:120 }}>
            {MOCK.paymentsTimeline.map((p, i) => (
              <div key={i} className="col flex-1" style={{ alignItems:'center', gap:8 }}>
                <div style={{
                  width:'100%', height: `${(p.value / maxRevenue) * 100}%`,
                  background: i === MOCK.paymentsTimeline.length - 1 ? 'linear-gradient(180deg, var(--accent), var(--accent-2))' : 'var(--surface-3)',
                  borderRadius:6, transition:'all 240ms', boxShadow: i === MOCK.paymentsTimeline.length - 1 ? '0 8px 20px -8px var(--accent-glow)' : 'none'
                }} />
                <div className="text-3 mono" style={{ fontSize:10 }}>{p.day}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass" style={{ padding:22 }}>
          <div className="row between" style={{ marginBottom:18 }}>
            <div>
              <div className="text-3 mono fz-10 uppercase">Room status overview</div>
              <div className="fz-22 fw-5 text-h" style={{ marginTop:4, letterSpacing:'-0.02em' }}>{total} rooms total</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setRoute('rooms')}>Open grid</button>
          </div>
          <div className="col gap-3">
            {[
              { k:'available',   n:available,   c:'st-available'   },
              { k:'occupied',    n:occupied,    c:'st-occupied'    },
              { k:'dirty',       n:dirty,       c:'st-dirty'       },
              { k:'maintenance', n:maintenance, c:'st-maintenance' },
            ].map(s => (
              <div key={s.k}>
                <div className="row between" style={{ marginBottom:6 }}>
                  <div className="row gap-2">
                    <span style={{ width:8, height:8, borderRadius:'50%', background:`var(--${s.c})` }} />
                    <span className="text-1 fz-12" style={{ textTransform:'capitalize' }}>{s.k}</span>
                  </div>
                  <span className="text-h mono fz-12 fw-5">{s.n}<span className="text-3"> / {total}</span></span>
                </div>
                <div className="bar"><div className="bar-fill" style={{
                  width: `${(s.n / total) * 100}%`,
                  background: `linear-gradient(90deg, var(--${s.c}), oklch(from var(--${s.c}) calc(l - 0.06) c h))`
                }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomStat({ label, value, status }) {
  return (
    <div className="glass metric">
      <div className="top">
        <div className="label">{label}</div>
        <Pill status={status} />
      </div>
      <div className="v">{value}</div>
      <div className="text-3 mono fz-10" style={{ textTransform:'uppercase', letterSpacing:'0.1em' }}>rooms</div>
    </div>
  );
}

window.Dashboard = Dashboard;
