/* KavPMS — Properties page + Rooms page */
/* eslint-disable */
const { useState: useRoomState, useEffect: useRoomEffect } = React;

/* ── Properties page ── */
function Properties({ property, setProperty, setRoute, addPropertyRequest }) {
  const [props, setProps]   = useRoomState(MOCK.properties || []);
  const [editing, setEdit]  = useRoomState(null);
  const [adding, setAdding] = useRoomState(false);

  const refresh = async () => {
    const data = await kavAPI.getProperties();
    setProps(data);
    MOCK.properties = data;
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    await kavAPI.deleteProperty(id);
    await refresh();
  };

  const handleSave = async (form) => {
    if (editing?.id) {
      await kavAPI.updateProperty(editing.id, form);
    } else {
      await kavAPI.createProperty(form);
    }
    await refresh();
    setEdit(null);
    setAdding(false);
  };

  useRoomEffect(() => {
    if (addPropertyRequest) setAdding(true);
  }, [addPropertyRequest]);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Management</div>
          <h1>Properties</h1>
          <p>Manage all properties in your portfolio.</p>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <Ic.Plus size={13} /><span>Add property</span>
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: 10 }}>
        {props.map(p => (
          <div key={p.id} className="glass prop-card" onClick={() => { setProperty(p); setRoute('rooms'); }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="avatar" style={{ width: 40, height: 40, fontSize: 13, borderRadius: 10 }}>{p.code}</div>
              <div className="row gap-2">
                <button className="btn btn-ghost btn-xs" onClick={e => { e.stopPropagation(); setEdit(p); }}>
                  <Ic.Edit size={12} />
                </button>
                <button className="btn btn-danger btn-xs" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}>
                  <Ic.X size={12} />
                </button>
              </div>
            </div>
            <div className="text-h fw-6 fz-15" style={{ marginBottom: 4 }}>{p.name}</div>
            <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 12 }}>{p.city} · {p.type}</div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              <div className="glass" style={{ padding: '4px 10px', borderRadius: 20 }}>
                <span className="text-3 mono fz-10">{p.rooms} rooms</span>
              </div>
              <div className="glass" style={{ padding: '4px 10px', borderRadius: 20 }}>
                <span className="text-3 mono fz-10">{p.floors} floors</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <PropertyForm
          initial={editing}
          onSave={handleSave}
          onClose={() => { setEdit(null); setAdding(false); }}
        />
      )}
    </div>
  );
}

function PropertyForm({ initial, onSave, onClose }) {
  const [form, setForm] = useRoomState({
    name: '', code: '', city: '', type: 'Boutique', rooms: 20, floors: 4,
    ...(initial || {})
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Modal onClose={onClose} width={520}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)' }}>
          <h2>{initial ? 'Edit property' : 'Add property'}</h2>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Property name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Code</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} maxLength={4} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                {['Boutique', 'Business', 'Resort', 'Hostel', 'Apartment'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Total rooms</label>
              <input type="number" value={form.rooms} onChange={e => set('rooms', +e.target.value)} min={1} />
            </div>
            <div className="form-group">
              <label>Floors</label>
              <input type="number" value={form.floors} onChange={e => set('floors', +e.target.value)} min={1} />
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm">Save</button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Rooms page ── */
function Rooms({ property }) {
  const [rooms, setRooms]       = useRoomState(() => MOCK.rooms.filter(r => r.propertyId === property.id));
  const [filter, setFilter]     = useRoomState('all');
  const [view, setView]         = useRoomState('grid');
  const [selected, setSelected] = useRoomState(null);
  const [adding, setAdding]     = useRoomState(false);

  useRoomEffect(() => {
    setRooms(MOCK.rooms.filter(r => r.propertyId === property.id));
  }, [property.id]);

  const refresh = async () => {
    const data = await kavAPI.getRooms({ propertyId: property.id });
    setRooms(data);
    MOCK.rooms = MOCK.rooms.filter(r => r.propertyId !== property.id).concat(data);
  };

  const handleStatus = async (id, status) => {
    await kavAPI.setRoomStatus(id, status);
    await refresh();
    setSelected(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    await kavAPI.deleteRoom(id);
    await refresh();
    setSelected(null);
  };

  const handleSaveRoom = async (form) => {
    if (selected?.id && form._isEdit) {
      await kavAPI.updateRoom(selected.id, form);
    } else {
      await kavAPI.createRoom({ ...form, propertyId: property.id });
    }
    await refresh();
    setAdding(false);
    setSelected(null);
  };

  const STATUSES = ['all', 'available', 'occupied', 'dirty', 'maintenance'];
  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter);

  const counts = {
    all: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    dirty: rooms.filter(r => r.status === 'dirty').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Inventory · {property.name}</div>
          <h1>Rooms</h1>
          <p>{rooms.length} rooms across {property.floors} floors.</p>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm" onClick={() => setView(v => v === 'grid' ? 'floor' : 'grid')}>
            <Ic.Dashboard size={13} /><span>{view === 'grid' ? 'Floor view' : 'Grid view'}</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
            <Ic.Plus size={13} /><span>Add room</span>
          </button>
        </div>
      </div>

      <div className="row gap-2" style={{ marginBottom: 14 }}>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
            style={{ textTransform: 'capitalize' }}
          >
            {s === 'all' ? `All (${counts.all})` : `${s} (${counts[s]})`}
          </button>
        ))}
      </div>

      {view === 'grid' ? (
        <div className="rooms-grid">
          {filtered.map(room => (
            <RoomCard key={room.id} room={room} onClick={() => setSelected(room)} />
          ))}
        </div>
      ) : (
        <FloorView rooms={filtered} floors={property.floors} onSelect={setSelected} />
      )}

      {selected && (
        <RoomDrawer
          room={selected}
          onClose={() => setSelected(null)}
          onStatus={handleStatus}
          onDelete={handleDelete}
          onEdit={() => { /* open inline edit */ }}
        />
      )}

      {adding && (
        <RoomFormModal
          property={property}
          onSave={handleSaveRoom}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}

function RoomCard({ room, onClick }) {
  const rtype = helpers.rtype(room.typeId);
  return (
    <div className={`room-card st-${room.status}`} onClick={onClick}>
      <div className="row between">
        <div className="room-num">{room.number}</div>
        <Pill status={room.status} />
      </div>
      <div className="room-type">{rtype?.name || '—'}</div>
      <div className="room-info">
        {room.beds} bed{room.beds > 1 ? 's' : ''} · {room.sqm}m²
      </div>
      <div className="room-floor">Floor {room.floor}</div>
    </div>
  );
}

function FloorView({ rooms, floors, onSelect }) {
  const byFloor = Array.from({ length: floors }, (_, i) => i + 1).map(f => ({
    floor: f,
    rooms: rooms.filter(r => r.floor === f),
  }));

  return (
    <div className="col gap-3">
      {byFloor.filter(f => f.rooms.length > 0).map(f => (
        <div key={f.floor} className="glass" style={{ padding: '14px 18px' }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 10, letterSpacing: '0.1em' }}>
            Floor {f.floor}
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            {f.rooms.map(r => (
              <div
                key={r.id}
                onClick={() => onSelect(r)}
                className={`room-card st-${r.status}`}
                style={{ width: 80, cursor: 'pointer', padding: '10px 12px' }}
              >
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-0)' }}>{r.number}</div>
                <div className="room-floor" style={{ marginTop: 4 }}>
                  <span className={`pill s-${r.status}`} style={{ padding: '2px 6px', fontSize: 9 }}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoomDrawer({ room, onClose, onStatus, onDelete }) {
  const rtype = helpers.rtype(room.typeId);
  const STATUSES = ['available', 'occupied', 'dirty', 'maintenance'];

  return (
    <Drawer onClose={onClose} width={420}>
      <div className="drawer-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Room {room.number}</div>
          <h2 style={{ fontSize: 18 }}>Room details</h2>
        </div>
        <button className="tb-icon-btn" onClick={onClose}><Ic.X size={16} /></button>
      </div>
      <div className="drawer-body">
        <div style={{ marginBottom: 18 }}>
          <Pill status={room.status} />
        </div>

        <div className="field">
          <div className="field-label">Type</div>
          <div className="field-value">{rtype?.name || '—'}</div>
        </div>
        <div className="field">
          <div className="field-label">Floor</div>
          <div className="field-value">{room.floor}</div>
        </div>
        <div className="field">
          <div className="field-label">Beds</div>
          <div className="field-value">{room.beds}</div>
        </div>
        <div className="field">
          <div className="field-label">Size</div>
          <div className="field-value">{room.sqm} m²</div>
        </div>
        {room.amenities && room.amenities.length > 0 && (
          <div className="field">
            <div className="field-label">Amenities</div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {room.amenities.map(a => (
                <span key={a} className="glass" style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11, color: 'var(--fg-2)' }}>{a}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div className="text-3 mono fz-10 uppercase" style={{ marginBottom: 10, letterSpacing: '0.1em' }}>Change status</div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`btn btn-sm ${room.status === s ? 'btn-primary' : 'btn-ghost'}`}
                style={{ textTransform: 'capitalize' }}
                onClick={() => onStatus(room.id, s)}
                disabled={room.status === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="drawer-foot">
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(room.id)}>Delete room</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
    </Drawer>
  );
}

function RoomFormModal({ property, onSave, onClose }) {
  const types = MOCK.roomTypes || [];
  const [form, setForm] = useRoomState({
    number: '', floor: 1, typeId: types[0]?.id || '', beds: 1, sqm: 24, status: 'available', amenities: []
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <Modal onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)' }}>
          <h2>Add room</h2>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div className="form-row">
            <div className="form-group">
              <label>Room number</label>
              <input value={form.number} onChange={e => set('number', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Floor</label>
              <input type="number" value={form.floor} onChange={e => set('floor', +e.target.value)} min={1} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Room type</label>
              <select value={form.typeId} onChange={e => set('typeId', e.target.value)}>
                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Beds</label>
              <input type="number" value={form.beds} onChange={e => set('beds', +e.target.value)} min={1} />
            </div>
          </div>
          <div className="form-group">
            <label>Size (m²)</label>
            <input type="number" value={form.sqm} onChange={e => set('sqm', +e.target.value)} min={1} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              {['available', 'occupied', 'dirty', 'maintenance'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--hairline)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-sm">Add room</button>
        </div>
      </form>
    </Modal>
  );
}

window.Properties = Properties;
window.Rooms = Rooms;
