/* KavPMS — Check-in / Check-out page */
/* eslint-disable */
const { useState: useCIState, useEffect: useCIEffect } = React;

function Checkin({ activeReservation, setActiveReservation, pushToast }) {
  const [reservations, setReservations] = useCIState(
    MOCK.reservations.filter(r => r.status === 'pending' || r.status === 'active')
  );
  const [search, setSearch] = useCIState('');

  const refresh = async () => {
    const data = await kavAPI.getReservations();
    MOCK.reservations = data;
    setReservations(data.filter(r => r.status === 'pending' || r.status === 'active'));
  };

  const handleDone = async () => {
    await refresh();
    setActiveReservation(null);
    pushToast('Check-in complete');
  };

  const handleCheckoutDone = async () => {
    await refresh();
    setActiveReservation(null);
    pushToast('Check-out complete');
  };

  if (activeReservation) {
    if (activeReservation.status === 'active') {
      return (
        <CheckoutFlow
          reservation={activeReservation}
          onDone={handleCheckoutDone}
          onCancel={() => setActiveReservation(null)}
        />
      );
    }
    return (
      <CheckinFlow
        reservation={activeReservation}
        onDone={handleDone}
        onCancel={() => setActiveReservation(null)}
      />
    );
  }

  const arrivals   = reservations.filter(r => r.status === 'pending' && r.checkIn === helpers.d(0));
  const departures = reservations.filter(r => r.status === 'active'  && r.checkOut === helpers.d(0));
  const inHouse    = reservations.filter(r => r.status === 'active');

  const filtered = search
    ? reservations.filter(r => {
        const g = helpers.guest(r.guestId);
        const q = search.toLowerCase();
        return g?.name?.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
      })
    : null;

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Front Office</div>
          <h1>Check-in / out</h1>
          <p>Today: {arrivals.length} arrivals · {departures.length} departures · {inHouse.length} in-house</p>
        </div>
      </div>

      <div className="tb-search" style={{ marginBottom: 16, maxWidth: 360 }}>
        <Ic.Search size={14} stroke="var(--fg-3)" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search guest or booking ID…"
        />
      </div>

      {search && filtered ? (
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map(r => <CIListRow key={r.id} r={r} onSelect={setActiveReservation} />)}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>No results</div>
          )}
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: 10, alignItems: 'start' }}>
          <CIGroup title="Today's arrivals" icon="ArrowR" items={arrivals} onSelect={setActiveReservation} accent="var(--st-available)" />
          <CIGroup title="Today's departures" icon="Logout" items={departures} onSelect={setActiveReservation} accent="var(--st-occupied)" />
          <CIGroup title="In-house" icon="Bed" items={inHouse} onSelect={setActiveReservation} accent="var(--accent)" />
        </div>
      )}
    </div>
  );
}

function CIGroup({ title, icon, items, onSelect, accent }) {
  const I = Ic[icon] || Ic.Calendar;
  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="icon" style={{ background: `${accent}22`, color: accent, borderColor: 'transparent' }}>
          <I size={13} />
        </div>
        <div>
          <div className="text-3 mono fz-10 uppercase">{title}</div>
          <div className="fz-18 fw-5 text-h">{items.length}</div>
        </div>
      </div>
      <div>
        {items.slice(0, 8).map(r => <CIListRow key={r.id} r={r} onSelect={onSelect} />)}
        {items.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--fg-3)', fontSize: 12 }}>None scheduled</div>
        )}
      </div>
    </div>
  );
}

function CIListRow({ r, onSelect }) {
  const g    = helpers.guest(r.guestId);
  const room = helpers.room(r.roomId);
  if (!g || !room) return null;
  return (
    <div
      onClick={() => onSelect(r)}
      style={{ padding: '10px 16px', borderBottom: '1px solid var(--hairline)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 120ms' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{helpers.initials(g.name)}</div>
      <div className="col flex-1" style={{ minWidth: 0 }}>
        <div className="text-h fz-13 fw-5">{g.name}</div>
        <div className="text-3 mono fz-10">RM {room.number} · {r.id}</div>
      </div>
      <Pill status={r.status} />
    </div>
  );
}

/* ── Check-in flow ── */
function CheckinFlow({ reservation, onDone, onCancel }) {
  const [step, setStep]           = useCIState(0);
  const [pickedRoom, setPickedRoom] = useCIState(reservation.roomId);
  const [paymentAmount, setPaymentAmount] = useCIState('');
  const [paymentMethod, setPaymentMethod] = useCIState('Card');
  const [saving, setSaving]       = useCIState(false);

  const g    = helpers.guest(reservation.guestId);
  const room = helpers.room(pickedRoom || reservation.roomId);

  const STEPS = ['Guest', 'Room', 'Documents', 'Preferences', 'Payment', 'Confirm'];

  const handleCheckin = async () => {
    setSaving(true);
    try {
      const amount = parseFloat(paymentAmount) || 0;
      if (amount > 0) {
        const balance = reservation.total - reservation.paid;
        await kavAPI.updatePayment(reservation.id, {
          amountPaid: amount,
          paymentStatus: amount >= balance ? 'completed' : 'partial',
        });
      }
      await kavAPI.checkinReservation(reservation.id, pickedRoom !== reservation.roomId ? pickedRoom : undefined);
      if (window.kavRefresh) await window.kavRefresh();
      onDone();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Check-in · {reservation.id}</div>
          <h1>{g?.name || 'Guest'}</h1>
          <p>RM {room?.number} · {helpers.fmt.date(reservation.checkIn)} → {helpers.fmt.date(reservation.checkOut)}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><Ic.X size={13} /> Cancel</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="checkin-wrap">
        {step === 0 && <StepGuest g={g} reservation={reservation} />}
        {step === 1 && <StepRoom picked={pickedRoom} setPicked={setPickedRoom} reservation={reservation} />}
        {step === 2 && <StepDocuments g={g} />}
        {step === 3 && <StepPreferences g={g} />}
        {step === 4 && (
          <StepPayment
            reservation={reservation}
            amount={paymentAmount}
            setAmount={setPaymentAmount}
            method={paymentMethod}
            setMethod={setPaymentMethod}
          />
        )}
        {step === 5 && <StepConfirm reservation={reservation} g={g} room={room} pickedRoom={pickedRoom} />}

        <div className="row" style={{ marginTop: 18, gap: 10 }}>
          {step > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setStep(s => s + 1)}>
              Continue <Ic.ArrowR size={13} />
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleCheckin} disabled={saving}>
              {saving ? 'Processing…' : 'Complete check-in'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepGuest({ g, reservation }) {
  if (!g) return <div className="text-3">Guest not found</div>;
  return (
    <div className="glass step-card">
      <div className="row gap-3" style={{ marginBottom: 18 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: 18 }}>{helpers.initials(g.name)}</div>
        <div>
          <div className="fz-18 fw-5 text-h">{g.name}</div>
          <div className="text-3 mono fz-11" style={{ marginTop: 2 }}>{g.nationality} · {g.email}</div>
          {g.vip && <Pill status="vip" style={{ marginTop: 6 }} />}
        </div>
      </div>
      <div className="grid grid-2" style={{ gap: 12 }}>
        <Field label="Phone" value={g.phone || '—'} />
        <Field label="ID / Passport" value={g.passport || '—'} />
        <Field label="Stays" value={g.stays || 0} />
        <Field label="Booking source" value={reservation.source} />
      </div>
      {g.notes && g.notes.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--accent-soft)', borderRadius: 'var(--radius-sm)', border: '1px solid oklch(from var(--accent) l c h / 0.2)' }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 5 }}>Guest notes</div>
          {g.notes.map((n, i) => <div key={i} className="fz-12 text-2">{n}</div>)}
        </div>
      )}
    </div>
  );
}

function StepRoom({ picked, setPicked, reservation }) {
  const available = MOCK.rooms.filter(r => r.status === 'available' || r.id === reservation.roomId);
  return (
    <div className="glass step-card">
      <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>Assign room</div>
      <div className="rooms-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }}>
        {available.map(room => {
          const rtype = helpers.rtype(room.typeId);
          const isSelected = room.id === picked;
          return (
            <div
              key={room.id}
              onClick={() => setPicked(room.id)}
              className={`room-card st-${isSelected ? 'occupied' : 'available'}`}
              style={{
                border: isSelected ? '2px solid var(--accent)' : undefined,
                background: isSelected ? 'var(--accent-soft)' : undefined,
              }}
            >
              <div className="room-num">{room.number}</div>
              <div className="room-type">{rtype?.name || '—'}</div>
              <div className="room-info">{room.beds}bd · {room.sqm}m²</div>
              {isSelected && <div style={{ marginTop: 6 }}><Ic.Check size={12} stroke="var(--accent)" /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepDocuments({ g }) {
  return (
    <div className="glass step-card">
      <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>ID verification</div>
      <div className="confirm-card">
        <div className="row gap-2">
          <Ic.Check2 size={16} stroke="var(--accent)" />
          <div>
            <div className="fz-13 fw-5 text-h">Identity pre-verified</div>
            <div className="text-3 fz-12" style={{ marginTop: 2 }}>Passport on file · {g?.passport || 'Not provided'}</div>
          </div>
        </div>
      </div>
      <div className="form-group" style={{ marginTop: 14 }}>
        <label>Scan / enter document number (optional)</label>
        <input placeholder="e.g. AB1234567" defaultValue={g?.passport || ''} />
      </div>
      <div className="form-group">
        <label>Notes</label>
        <textarea placeholder="Any document observations…" style={{ minHeight: 60 }} />
      </div>
    </div>
  );
}

function StepPreferences({ g }) {
  const prefs = [
    'High floor', 'Low floor', 'Non-smoking', 'Extra pillows',
    'Late checkout', 'Early checkin', 'Quiet room', 'City view'
  ];
  const [selected, setSelected] = useCIState([]);
  const toggle = (p) => setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);
  return (
    <div className="glass step-card">
      <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>Guest preferences</div>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {prefs.map(p => (
          <button
            key={p}
            className={`btn btn-sm ${selected.includes(p) ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => toggle(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="form-group">
        <label>Special requests</label>
        <textarea placeholder="Any special requests from the guest…" style={{ minHeight: 70 }} />
      </div>
    </div>
  );
}

function StepPayment({ reservation, amount, setAmount, method, setMethod }) {
  const balance = reservation.total - reservation.paid;
  return (
    <div className="glass step-card">
      <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>Payment summary</div>
      <ChargeRow label="Total charges" value={reservation.total} bold />
      <ChargeRow label="Paid" value={reservation.paid} positive />
      <ChargeRow label="Balance due" value={balance} bold />

      {balance > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Collect deposit / payment</label>
            <input
              type="number"
              placeholder={`$${balance.toFixed(2)} due`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="row gap-2">
            {['Card', 'Cash', 'Bank transfer'].map(m => (
              <button
                key={m}
                className={`btn btn-sm ${method === m ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setMethod(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}

      {balance === 0 && (
        <div className="confirm-card" style={{ marginTop: 14 }}>
          <div className="row gap-2">
            <Ic.Check2 size={16} stroke="var(--accent)" />
            <div className="fz-13 fw-5 text-h">Fully paid</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepConfirm({ reservation, g, room, pickedRoom }) {
  const rtype = helpers.rtype(reservation.typeId);
  const nights = helpers.daysBetween(reservation.checkIn, reservation.checkOut);
  return (
    <div className="glass step-card">
      <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>Confirm check-in</div>
      <div className="confirm-card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div className="text-3 mono fz-10 uppercase">Summary</div>
          <Pill status="active" label="Checking in" />
        </div>
        <Field label="Guest" value={g?.name} />
        <Field label="Room" value={`RM ${room?.number} · ${rtype?.name}`} />
        <Field label="Stay" value={`${helpers.fmt.date(reservation.checkIn)} → ${helpers.fmt.date(reservation.checkOut)} (${nights} nights)`} />
        <Field label="Total" value={helpers.fmt.money(reservation.total)} />
      </div>
      <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-3)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--fg-2)' }}>
        Pressing "Complete check-in" will mark this reservation as active and set the room to occupied.
      </div>
    </div>
  );
}

/* ── Check-out flow ── */
function CheckoutFlow({ reservation, onDone, onCancel }) {
  const [amountPaid, setAmountPaid] = useCIState('');
  const [paymentMethod, setPaymentMethod] = useCIState('Card');
  const [checks, setChecks] = useCIState([]);
  const [saving, setSaving]         = useCIState(false);
  const g    = helpers.guest(reservation.guestId);
  const room = helpers.room(reservation.roomId);
  const balance = reservation.total - reservation.paid;

  const handleCheckout = async () => {
    setSaving(true);
    try {
      const extra = parseFloat(amountPaid) || 0;
      await kavAPI.checkoutReservation(reservation.id, extra > 0 ? extra : undefined);
      if (window.kavRefresh) await window.kavRefresh();
      onDone();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCheck = (name) => {
    setChecks(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Check-out · {reservation.id}</div>
          <h1>{g?.name || 'Guest'}</h1>
          <p>RM {room?.number} · Departure {helpers.fmt.date(reservation.checkOut)}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}><Ic.X size={13} /> Cancel</button>
      </div>

      <div className="checkin-wrap">
        <div className="glass step-card" style={{ marginBottom: 10 }}>
          <div className="fz-14 fw-5 text-h" style={{ marginBottom: 14 }}>Final folio</div>
          <ChargeRow label="Room charges" value={reservation.total} bold />
          <ChargeRow label="Paid" value={reservation.paid} positive />
          <ChargeRow label="Balance" value={balance} bold />

          {balance > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Collect remaining balance ({helpers.fmt.money(balance)})</label>
                <input
                  type="number"
                  placeholder={`${balance.toFixed(2)}`}
                  value={amountPaid}
                  onChange={e => setAmountPaid(e.target.value)}
                />
              </div>
              <div className="row gap-2">
                {['Card', 'Cash', 'Bank transfer'].map(m => (
                  <button
                    key={m}
                    className={`btn btn-sm ${paymentMethod === m ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass step-card" style={{ marginBottom: 10 }}>
          <div className="fz-14 fw-5 text-h" style={{ marginBottom: 12 }}>Room inspection</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {['No damage', 'Mini-bar checked', 'Keys returned', 'Safe cleared'].map(c => (
              <button
                key={c}
                className={`btn btn-sm ${checks.includes(c) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => toggleCheck(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="form-group" style={{ marginTop: 12 }}>
            <label>Notes</label>
            <textarea placeholder="Any damage or notes…" style={{ minHeight: 60 }} />
          </div>
        </div>

        <div className="confirm-card">
          <div className="text-3 fz-12" style={{ marginBottom: 6 }}>
            Checking out will mark the reservation as completed and set the room status to dirty (housekeeping will be notified).
          </div>
        </div>

        <div className="row" style={{ marginTop: 16, gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={handleCheckout} disabled={saving}>
            {saving ? 'Processing…' : 'Complete check-out'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.Checkin = Checkin;
window.CheckinFlow = CheckinFlow;
window.CheckoutFlow = CheckoutFlow;
