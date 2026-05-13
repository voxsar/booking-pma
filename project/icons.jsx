/* KavPMS — icon set (lucide-style stroked SVGs) */
/* eslint-disable */
const Ic = {};
const _i = (path, opts={}) => ({ size = 16, stroke = 'currentColor', ...rest } = {}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
       strokeWidth={opts.sw || 1.6} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {path}
  </svg>
);

Ic.Dashboard = _i(<><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>);
Ic.Building  = _i(<><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01M15 9h.01M15 12h.01M15 15h.01M15 18h.01"/></>);
Ic.Bed       = _i(<><path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8"/><path d="M3 14h18"/><path d="M7 11V9a1 1 0 0 1 1-1h3v3"/><path d="M3 18v3"/><path d="M21 18v3"/></>);
Ic.Calendar  = _i(<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>);
Ic.Logout    = _i(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></>);
Ic.Users     = _i(<><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" transform="translate(2 0)"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>);
Ic.Sparkles  = _i(<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.8 2.4L22 17l-2.2.6L19 20l-.8-2.4L16 17l2.2-.6z"/></>);
Ic.Broom     = _i(<><path d="M14 4l6 6"/><path d="M11 7l6 6"/><path d="M5 21l4-9 6 6-9 4z"/><path d="M14 11l3-3"/></>);
Ic.Chart     = _i(<><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></>);
Ic.Settings  = _i(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.15.7.36 1 .61"/></>);
Ic.Search    = _i(<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></>);
Ic.Bell      = _i(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></>);
Ic.Sun       = _i(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>);
Ic.Moon      = _i(<><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>);
Ic.Plus      = _i(<><path d="M12 5v14M5 12h14"/></>);
Ic.Chevron   = _i(<><polyline points="9 18 15 12 9 6"/></>);
Ic.ChevronD  = _i(<><polyline points="6 9 12 15 18 9"/></>);
Ic.Filter    = _i(<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>);
Ic.More      = _i(<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>);
Ic.X         = _i(<><path d="M18 6L6 18M6 6l12 12"/></>);
Ic.Check     = _i(<><polyline points="20 6 9 17 4 12"/></>);
Ic.ArrowR    = _i(<><path d="M5 12h14M13 5l7 7-7 7"/></>);
Ic.ArrowU    = _i(<><path d="M12 19V5M5 12l7-7 7 7"/></>);
Ic.ArrowD    = _i(<><path d="M12 5v14M5 12l7 7 7-7"/></>);
Ic.Coin      = _i(<><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 9.5c0-1.1.9-2 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2c1.1 0 2-.9 2-2"/></>);
Ic.Door      = _i(<><path d="M5 22V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v18"/><path d="M3 22h18"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></>);
Ic.Sparkle2  = _i(<><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>);
Ic.Wrench    = _i(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>);
Ic.Phone     = _i(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></>);
Ic.Mail      = _i(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></>);
Ic.Map       = _i(<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></>);
Ic.Star      = _i(<><polygon points="12 2 15 8.5 22 9.5 17 14.5 18 21 12 17.5 6 21 7 14.5 2 9.5 9 8.5 12 2"/></>);
Ic.Card      = _i(<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>);
Ic.Drag      = _i(<><circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/></>);
Ic.Eye       = _i(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>);
Ic.Edit      = _i(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>);
Ic.Bolt      = _i(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>);
Ic.Logo      = _i(<><path d="M3 21V3l9 9 9-9v18"/><path d="M3 12l9 9 9-9"/></>);
Ic.Pin       = _i(<><path d="M12 22s-8-7.5-8-13a8 8 0 1 1 16 0c0 5.5-8 13-8 13z"/><circle cx="12" cy="9" r="3"/></>);
Ic.Check2    = _i(<><circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/></>);
Ic.Sidebar   = _i(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></>);

window.Ic = Ic;
