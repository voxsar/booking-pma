/* KavPMS — Tweaks panel (floating design tool) */
/* eslint-disable */
const { useState: useTweakState, useRef: useTweakRef, useCallback: useTweakCb, useEffect: useTweakEffect } = React;

function useTweaks(defaults) {
  const [vals, setVals] = useTweakState({ ...defaults });
  const set = useTweakCb((key, val) => setVals(prev => ({ ...prev, [key]: val })), []);
  return [vals, set];
}

function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = useTweakState(true);
  const [pos, setPos]   = useTweakState({ x: null, y: null });
  const dragging = useTweakRef(false);
  const offset   = useTweakRef({ x: 0, y: 0 });
  const panelRef = useTweakRef(null);

  const onMouseDown = (e) => {
    dragging.current = true;
    const rect = panelRef.current.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!dragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const onMouseUp = () => {
    dragging.current = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  useTweakEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const style = pos.x !== null
    ? { position: 'fixed', left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div ref={panelRef} className="tweaks-panel glass-strong" style={style}>
      <div className="tweaks-drag-handle" onMouseDown={onMouseDown}>
        <span className="tweaks-title">{title}</span>
        <button
          className="tb-icon-btn"
          style={{ width: 20, height: 20 }}
          onClick={() => setOpen(o => !o)}
        >
          <Ic.ChevronD size={12} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 200ms' }} />
        </button>
      </div>
      {open && <div className="tweaks-body">{children}</div>}
    </div>
  );
}

function TweakSection({ title, children }) {
  return (
    <div className="tweaks-section">
      {title && <div className="tweaks-section-title">{title}</div>}
      {children}
    </div>
  );
}

function TweakRadio({ label, value, onChange, options }) {
  return (
    <div>
      {label && <div className="tweak-label">{label}</div>}
      <div className="tweak-radio">
        {options.map(o => (
          <button
            key={o.value}
            className={`tweak-radio-btn ${value === o.value ? 'active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { useTweaks, TweaksPanel, TweakSection, TweakRadio });
