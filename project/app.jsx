/* KavPMS — App router + state */
/* eslint-disable */
const { useState: useApp, useEffect: useEffectApp, useCallback: useCallbackApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "sidebarVariant": "floating"
}/*EDITMODE-END*/;

function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0,
      display:'grid', placeItems:'center',
      background:'var(--bg-0)',
      zIndex:100,
    }}>
      <div style={{ textAlign:'center' }}>
        <div className="sb-logo" style={{ width:48, height:48, fontSize:24, margin:'0 auto 20px', borderRadius:14 }}>F</div>
        <div className="text-h fz-18 fw-5" style={{ letterSpacing:'-0.02em' }}>Fifi Resorts</div>
        <div className="text-3 mono fz-10 uppercase" style={{ marginTop:8, letterSpacing:'0.14em' }}>Loading…</div>
      </div>
    </div>
  );
}

function App() {
  const [ready,   setReady]   = useApp(false);
  const [error,   setError]   = useApp(null);
  const [user,    setUser]    = useApp(() => {
    const stored = localStorage.getItem('kavpms.user');
    return stored ? JSON.parse(stored) : null;
  });
  const [version, setVersion] = useApp(0);
  const [theme,   setTheme]   = useApp(() => localStorage.getItem('kavpms.theme') || 'dark');
  const [route,   setRoute]   = useApp(() => localStorage.getItem('kavpms.route') || 'dashboard');
  const [property,             setProperty]             = useApp(null);
  const [selectedReservation,  setSelectedReservation]  = useApp(null);
  const [activeReservation,    setActiveReservation]    = useApp(null);
  const [newBookingRequest,    setNewBookingRequest]    = useApp(0);
  const [addPropertyRequest,   setAddPropertyRequest]   = useApp(0);
  const [calendarTodayRequest, setCalendarTodayRequest] = useApp(0);
  const [globalSearchRequest,  setGlobalSearchRequest]  = useApp(null);
  const [notifsOpen,           setNotifsOpen]           = useApp(false);
  const [toast,                setToast]                = useApp(null);

  const [t, setTweak] = (typeof useTweaks !== 'undefined') ? useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];

  const handleLogin = useCallbackApp((loggedInUser) => {
    setUser(loggedInUser);
    setError(null);
  }, []);

  const handleLogout = useCallbackApp(() => {
    localStorage.removeItem('kavpms.token');
    localStorage.removeItem('kavpms.user');
    setUser(null);
    setReady(false);
  }, []);

  const loadData = useCallbackApp(async () => {
    if (!user) return;
    try {
      await window.initData();
      if (!property) setProperty(window.MOCK.properties[0]);
      setReady(true);
    } catch(e) {
      console.error('KavPMS init error:', e);
      if (e.message.includes('401') || e.message.includes('Authentication')) {
        handleLogout();
      } else {
        setError(e.message);
      }
    }
  }, [user, property]);

  useEffectApp(() => { if (user) loadData(); }, [user]);

  const refreshData = useCallbackApp(async () => {
    await window.initData();
    setVersion(v => v + 1);
  }, []);

  useEffectApp(() => { window.kavRefresh = refreshData; }, [refreshData]);

  useEffectApp(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kavpms.theme', theme);
  }, [theme]);

  useEffectApp(() => {
    localStorage.setItem('kavpms.route', route);
  }, [route]);

  const pushToast = (msg) => setToast(msg);

  const goCheckIn = (r) => {
    setActiveReservation(r);
    setSelectedReservation(null);
    setRoute('checkin');
  };

  const openNewBooking = () => {
    setSelectedReservation(null);
    setNotifsOpen(false);
    setRoute('reservations');
    setNewBookingRequest(n => n + 1);
  };

  const openAddProperty = () => {
    setSelectedReservation(null);
    setNotifsOpen(false);
    setRoute('properties');
    setAddPropertyRequest(n => n + 1);
  };

  const openCalendar = () => {
    setSelectedReservation(null);
    setNotifsOpen(false);
    setRoute('calendar');
    setCalendarTodayRequest(n => n + 1);
  };

  const runGlobalSearch = (text) => {
    setSelectedReservation(null);
    setNotifsOpen(false);
    setRoute('reservations');
    setGlobalSearchRequest({ text, tick: Date.now() });
  };

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  if (error) {
    return (
      <div style={{ position:'fixed', inset:0, display:'grid', placeItems:'center', background:'var(--bg-0)' }}>
        <div style={{ textAlign:'center', maxWidth:420, padding:32 }}>
          <div className="text-h fz-18 fw-5">Failed to connect to KavPMS server</div>
          <div className="text-2 fz-13" style={{ marginTop:8 }}>{error}</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop:20 }} onClick={() => { setError(null); loadData(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return <LoadingScreen />;

  const currentProperty = property || window.MOCK.properties[0];

  return (
    <div className="app" key={version}>
      <div className="aurora"><span /></div>
      <div className="aurora-grain" />
      <div className={`shell ${t.sidebarVariant}`}>
        <Sidebar route={route} setRoute={setRoute} variant={t.sidebarVariant} user={user} onLogout={handleLogout} />
        <Topbar
          theme={theme} setTheme={setTheme}
          property={currentProperty} setProperty={setProperty}
          openNotifs={() => setNotifsOpen(o => !o)}
          notifsOpen={notifsOpen}
          onNewBooking={openNewBooking}
          onCalendar={openCalendar}
          onAddProperty={openAddProperty}
          onGlobalSearch={runGlobalSearch}
          user={user}
        />
        <main className="main glass" data-screen-label={route}>
          <div className="main-scroll" key={route}>
            {route === 'dashboard'    && <Dashboard property={currentProperty} setRoute={setRoute} setSelectedReservation={setSelectedReservation} />}
            {route === 'properties'   && <Properties property={currentProperty} setProperty={setProperty} setRoute={setRoute} addPropertyRequest={addPropertyRequest} />}
            {route === 'rooms'        && <Rooms property={currentProperty} />}
            {route === 'reservations' && <Reservations setSelectedReservation={setSelectedReservation} newBookingRequest={newBookingRequest} globalSearchRequest={globalSearchRequest} />}
            {route === 'checkin'      && <Checkin activeReservation={activeReservation} setActiveReservation={setActiveReservation} pushToast={pushToast} />}
            {route === 'guests'       && <Guests />}
            {route === 'housekeeping' && <Housekeeping pushToast={pushToast} />}
            {route === 'calendar'     && <Calendar property={currentProperty} pushToast={pushToast} setSelectedReservation={setSelectedReservation} calendarTodayRequest={calendarTodayRequest} />}
            {route === 'reports'      && <Reports />}
            {route === 'settings'     && <Settings theme={theme} setTheme={setTheme} />}
          </div>
        </main>
        {/* Mobile tab bar */}
        <div className="glass mobile-tabbar">
          {NAV.slice(0, 5).map(n => {
            const I = Ic[n.icon];
            return (
              <button key={n.id} className={`sb-item ${route === n.id ? 'active' : ''}`} onClick={() => setRoute(n.id)}>
                <I size={16} />
                <span>{n.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedReservation && (
        <ReservationDrawer
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onCheckIn={goCheckIn}
        />
      )}
      {notifsOpen && <NotifPanel onClose={() => setNotifsOpen(false)} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {typeof TweaksPanel !== 'undefined' && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Sidebar">
            <TweakRadio label="Style" value={t.sidebarVariant} onChange={v => setTweak('sidebarVariant', v)}
              options={[{value:'rail',label:'Rail'},{value:'floating',label:'Floating'},{value:'expanded',label:'Wide'}]} />
          </TweakSection>
          <TweakSection title="Theme">
            <TweakRadio label="Mode" value={theme} onChange={setTheme}
              options={[{value:'dark',label:'Dark'},{value:'light',label:'Light'}]} />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
