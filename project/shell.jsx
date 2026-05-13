/* KavPMS — shell components: sidebar, topbar, primitives */
/* eslint-disable */
const { useState, useEffect, useRef } = React;

const NAV = [
  { id:'dashboard',    label:'Dashboard',      icon:'Dashboard' },
  { id:'properties',   label:'Properties',     icon:'Building'  },
  { id:'rooms',        label:'Rooms',          icon:'Door'      },
  { id:'reservations', label:'Reservations',   icon:'Calendar', badge:'12' },
  { id:'checkin',      label:'Check-in / out', icon:'Logout'    },
  { id:'guests',       label:'Guests',         icon:'Users'     },
  { id:'housekeeping', label:'Housekeeping',   icon:'Broom'     },
  { id:'calendar',     label:'Calendar',       icon:'Calendar'  },
  { id:'reports',      label:'Reports',        icon:'Chart'     },
  { id:'settings',     label:'Settings',       icon:'Settings'  },
];

function Sidebar({ route, setRoute, variant='floating', user, onLogout }) {
  const isRail = variant === 'rail';
  return (
    <div className="sidebar">
      <div className="glass" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
        <div className="sb">
          <div className="sb-brand">
            <div className="sb-logo">K</div>
            <div className="sb-brand-text">
              <div className="sb-name">KavPMS</div>
              <div className="sb-tag">v0.4 · Boutique</div>
            </div>
          </div>
          {!isRail && <div className="sb-section-label">Operate</div>}
          {NAV.slice(0, 7).map(n => {
            const I = Ic[n.icon];
            return (
              <button key={n.id}
                className={`sb-item ${route === n.id ? 'active' : ''}`}
                onClick={() => setRoute(n.id)}>
                <I size={17} className="sb-icon" />
                <span className="sb-label">{n.label}</span>
                {n.badge && !isRail && <span className="sb-badge">{n.badge}</span>}
              </button>
            );
          })}
          {!isRail && <div className="sb-section-label">Insights</div>}
          {NAV.slice(7).map(n => {
            const I = Ic[n.icon];
            return (
              <button key={n.id}
                className={`sb-item ${route === n.id ? 'active' : ''}`}
                onClick={() => setRoute(n.id)}>
                <I size={17} className="sb-icon" />
                <span className="sb-label">{n.label}</span>
              </button>
            );
          })}
          <div className="sb-foot">
            <div className="avatar">{user ? helpers.initials(user.name) : 'EK'}</div>
            <div className="avatar-meta flex-1">
              <div className="n">{user ? user.name : 'Elena K.'}</div>
              <div className="r">{user ? user.role : 'Front Office Mgr'}</div>
            </div>
            <button className="tb-icon-btn" onClick={onLogout} title="Logout">
              <Ic.Logout size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Topbar({ theme, setTheme, property, setProperty, openNotifs, notifsOpen }) {
  const [date] = useState(new Date('2026-05-09'));
  return (
    <div className="topbar glass">
      <div className="tb">
        <div className="tb-search">
          <Ic.Search size={15} stroke="var(--fg-3)" />
          <input placeholder="Search guests, bookings, rooms..." />
          <span className="kbd">⌘ K</span>
        </div>
        <div className="tb-spacer" />
        <PropertySelect property={property} setProperty={setProperty} />
        <button className="tb-pill hide-mobile">
          <Ic.Calendar size={14} stroke="var(--fg-2)" />
          <span className="label">Today</span>
          <span className="val">{date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</span>
          <Ic.ChevronD size={12} stroke="var(--fg-3)" />
        </button>
        <button className="tb-icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme">
          {theme === 'dark' ? <Ic.Sun size={16} /> : <Ic.Moon size={16} />}
        </button>
        <button className="tb-icon-btn" onClick={openNotifs} title="Notifications">
          <Ic.Bell size={16} />
          <span className="dot" />
        </button>
        <button className="btn btn-primary btn-sm hide-mobile">
          <Ic.Plus size={14} />
          <span>New booking</span>
        </button>
      </div>
    </div>
  );
}

function PropertySelect({ property, setProperty }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  if (!property) return null;
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button className="tb-pill" onClick={() => setOpen(o => !o)}>
        <Ic.Pin size={14} stroke="var(--fg-2)" />
        <span className="label">{property.code}</span>
        <span className="val">{property.name}</span>
        <Ic.ChevronD size={12} stroke="var(--fg-3)" />
      </button>
      {open && (
        <div className="menu glass-strong" style={{ top:'46px', right:0, minWidth:'280px' }}>
          <div className="menu-label">Switch property</div>
          {(MOCK.properties || []).map(p => (
            <button key={p.id} className="menu-item" onClick={() => { setProperty(p); setOpen(false); }}>
              <div className="avatar" style={{ width:28, height:28, fontSize:10, borderRadius:8 }}>{p.code}</div>
              <div className="col" style={{ flex:1 }}>
                <div className="text-h fw-5" style={{ fontSize:13 }}>{p.name}</div>
                <div className="text-3 mono" style={{ fontSize:10.5 }}>{p.city} · {p.rooms} rooms · {p.type}</div>
              </div>
              {property.id === p.id && <Ic.Check size={14} stroke="var(--accent)" />}
            </button>
          ))}
          <div className="menu-divider" />
          <button className="menu-item"><Ic.Plus size={14} /><span>Add property</span></button>
        </div>
      )}
    </div>
  );
}

function NotifPanel({ onClose }) {
  const [notifs, setNotifs] = useState([...(MOCK.notifications || [])]);
  const unread = notifs.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await kavAPI.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      MOCK.notifications = MOCK.notifications.map(n => ({ ...n, read: true }));
    } catch(e) { console.error(e); }
  };

  const markRead = async (id) => {
    try {
      await kavAPI.markNotifRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch(e) { console.error(e); }
  };

  return (
    <>
      <div className="scrim" onClick={onClose} style={{ background:'transparent' }} />
      <div className="notif-panel glass-strong">
        <div className="row between" style={{ padding:'16px 18px', borderBottom:'1px solid var(--hairline)' }}>
          <div className="col">
            <div className="text-h fw-5" style={{ fontSize:14 }}>Notifications</div>
            <div className="text-3 mono fz-10" style={{ marginTop:2 }}>{unread} unread · live feed</div>
          </div>
          <button className="btn-quiet btn btn-sm" onClick={markAllRead}>Mark all read</button>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {notifs.map(n => (
            <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`} onClick={() => markRead(n.id)}>
              <div className="notif-dot" />
              <div className="col flex-1" style={{ gap:2 }}>
                <div className="text-h fw-5" style={{ fontSize:13 }}>{n.title}</div>
                <div className="text-2 fz-12">{n.sub}</div>
                <div className="text-3 mono" style={{ fontSize:10.5, marginTop:2 }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Pill({ status, label }) {
  const map = {
    available:'Available', occupied:'Occupied', dirty:'Dirty', clean:'Clean',
    maintenance:'Maintenance', pending:'Pending', completed:'Completed',
    cancelled:'Cancelled', noshow:'No-show', active:'Active', cleaning:'Cleaning',
    inspected:'Inspected', vip:'VIP'
  };
  const cls = ['active','cleaning','inspected'].includes(status) ? 'occupied' : status;
  return (
    <span className={`pill s-${cls}`}>
      <span className="dot" />
      {label || map[status] || status}
    </span>
  );
}

function Drawer({ children, onClose, width=540 }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer glass-strong" style={{ width: `min(${width}px, 92vw)` }}>
        {children}
      </div>
    </>
  );
}

function Modal({ children, onClose, width=640 }) {
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal glass-strong" style={{ width: `min(${width}px, 92vw)` }}>
        {children}
      </div>
    </>
  );
}

function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={i} className={`step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
          <div className="num">{i < current ? <Ic.Check size={12} /> : i+1}</div>
          <div className="label">{s}</div>
        </div>
      ))}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.id} className={`tab ${active === t.id ? 'active' : ''}`} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count != null && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

function Sparkline({ data, w=280, h=40 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const r = max - min || 1;
  const pts = data.map((v, i) => [i * (w / (data.length-1)), h - ((v - min) / r) * (h-4) - 2]);
  const line = pts.map((p,i) => `${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
        <linearGradient id="sparkArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} className="sp-area" />
      <path d={line} className="sp-line" />
    </svg>
  );
}

function Ring({ pct, label, sub, size=140 }) {
  const r   = (size - 16) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  return (
    <div className="ring" style={{ width:size, height:size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size/2} cy={size/2} r={r} />
        <circle className="ring-fill" cx={size/2} cy={size/2} r={r}
                strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="ring-center">
        <div className="col" style={{ alignItems:'center', gap:2 }}>
          <div style={{ fontSize: size*0.24, fontWeight:500, letterSpacing:'-0.03em', color:'var(--fg-0)' }}>{pct}<span style={{ fontSize:14, color:'var(--fg-3)', fontFamily:'var(--font-mono)' }}>%</span></div>
          {sub && <div className="text-3 mono" style={{ fontSize:10 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2400);
    return () => clearTimeout(timer);
  }, [msg]);
  return (
    <div className="toast-stack">
      <div className="toast glass-strong">
        <div className="ic"><Ic.Check size={12} /></div>
        <span>{msg}</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  NAV, Sidebar, Topbar, NotifPanel, Pill, Drawer, Modal, Stepper, Tabs, Sparkline, Ring, Toast
});
