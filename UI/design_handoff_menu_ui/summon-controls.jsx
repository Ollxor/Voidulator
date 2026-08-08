// summon-controls.jsx — reusable control primitives for the Voidulator deck.
// Exported to window so summon-app.jsx can use them across babel scopes.
const { useRef: useRefC, useState: useStateC } = React;

// All chrome reads CSS variables defined per-theme in theme.css.
const C = {
  // legacy names mapped to theme vars (kept so existing call sites keep working)
  gold: 'var(--accent)', hot: 'var(--accent2)', pink: 'var(--neg)', teal: 'var(--accent2)',
  accent: 'var(--accent)', accent2: 'var(--accent2)',
  ink: 'var(--ink)', dim: 'var(--dim)', faint: 'var(--faint)',
  border: 'var(--border)', hair: 'var(--hair)',
  rail: 'var(--rail)', panel: 'var(--panel)',
  danger: 'var(--danger)', glow: 'var(--glow)',
  MONO: 'var(--font-mono)', SANS: 'var(--font-sans)', DISP: 'var(--font-disp)',
};

function fmtVal(p, v) {
  const f = (p.unit === 'Hz' || p.unit === 's') ? Number(v).toFixed(2) : v;
  return f + (p.unit || '');
}

/* slider with optional bipolar fill from center */
function Slider({ p, val, onChange }) {
  const ref = useRefC(null);
  const isFloat = p.unit === 'Hz' || p.unit === 's';
  const set = (cx) => {
    const r = ref.current.getBoundingClientRect();
    let f = Math.max(0, Math.min(1, (cx - r.left) / r.width));
    let v = p.min + f * (p.max - p.min);
    v = isFloat ? Math.round(v * 100) / 100 : Math.round(v);
    onChange(v);
  };
  const down = (e) => {
    e.preventDefault(); e.stopPropagation(); set(e.clientX);
    const mv = (ev) => set(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const pct = ((val - p.min) / (p.max - p.min)) * 100;
  const zeroPct = ((0 - p.min) / (p.max - p.min)) * 100;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 13, color: C.dim }}>
        <span>{p.label}</span>
        <span style={{ fontFamily: C.MONO, color: C.ink }}>{fmtVal(p, val)}</span>
      </div>
      <div ref={ref} onPointerDown={down} style={{ position: 'relative', height: 22, cursor: 'pointer', touchAction: 'none' }}>
        <div style={{ position: 'absolute', top: 9, left: 0, right: 0, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.10)' }} />
        {p.bipolar ? (
          <div style={{ position: 'absolute', top: 9, height: 4, borderRadius: 2, background: 'linear-gradient(90deg,' + C.hot + ',' + C.gold + ')',
            left: Math.min(zeroPct, pct) + '%', width: Math.abs(pct - zeroPct) + '%' }} />
        ) : (
          <div style={{ position: 'absolute', top: 9, left: 0, width: pct + '%', height: 4, borderRadius: 2, background: 'linear-gradient(90deg,' + C.hot + ',' + C.gold + ')' }} />
        )}
        {p.bipolar && <div style={{ position: 'absolute', top: 5, left: zeroPct + '%', width: 1, height: 12, background: C.faint }} />}
        <div style={{ position: 'absolute', top: '50%', left: pct + '%', width: 15, height: 15, borderRadius: '50%', background: '#fff', transform: 'translate(-50%,-50%)', boxShadow: '0 1px 4px rgba(0,0,0,.6)' }} />
      </div>
    </div>
  );
}

function Toggle({ p, val, onChange }) {
  return (
    <div onClick={() => onChange(!val)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, cursor: 'pointer' }}>
      <span style={{ fontSize: 13, color: C.dim }}>{p.label}</span>
      <div style={{ width: 38, height: 21, borderRadius: 'var(--radius)', background: val ? C.gold : 'rgba(255,255,255,0.13)', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 2, left: val ? 19 : 2, width: 17, height: 17, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
      </div>
    </div>
  );
}

function Segmented({ p, val, onChange }) {
  // Many options (e.g. 9 shapes) won't fit a single row — wrap into a chip grid.
  if (p.options.length > 4) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 7 }}>{p.label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {p.options.map((o) => (
            <button key={o} onClick={() => onChange(o)} style={{ appearance: 'none', cursor: 'pointer', fontFamily: C.SANS, fontSize: 12.5, padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (o === val ? C.gold : 'rgba(255,255,255,0.1)'), background: o === val ? 'var(--tint-strong)' : 'rgba(255,255,255,0.04)', color: o === val ? '#fff' : C.dim, fontWeight: o === val ? 600 : 400 }}>{o}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13, color: C.dim, marginBottom: 7 }}>{p.label}</div>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
        {p.options.map((o) => (
          <button key={o} onClick={() => onChange(o)} style={{ flex: 1, appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: C.SANS, fontSize: 12.5, padding: '7px 4px', borderRadius: 6, color: o === val ? 'var(--accent-ink)' : C.dim, background: o === val ? C.gold : 'transparent', fontWeight: o === val ? 600 : 400 }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Select({ p, val, onChange }) {
  const [open, setOpen] = useStateC(false);
  const opts = p.options || (p.k === 'scheme' ? VOID.PALETTES.map((x) => x[0]) : []);
  return (
    <div style={{ marginBottom: 14, position: 'relative' }}>
      <div style={{ fontSize: 13, color: C.dim, marginBottom: 7 }}>{p.label}</div>
      <button onClick={() => setOpen((o) => !o)} style={{ width: '100%', appearance: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', border: '1px solid ' + (open ? C.border : C.hair), color: C.ink, fontFamily: C.SANS, fontSize: 13 }}>
        {val}
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--dim)', transform: open ? 'rotate(180deg)' : 'none' }}><path d="M2 4l3.5 3.5L9 4" /></svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 5, background: 'var(--panel)', border: '1px solid ' + C.border, borderRadius: 'var(--radius)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto', boxShadow: '0 16px 40px rgba(0,0,0,.6)' }}>
          {opts.map((o) => (
            <button key={o} onClick={() => { onChange(o); setOpen(false); }} style={{ width: '100%', appearance: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '9px 12px', background: o === val ? 'var(--tint-strong)' : 'transparent', color: o === val ? '#fff' : C.dim, fontFamily: C.SANS, fontSize: 13 }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ p, onRun, active }) {
  const ghost = p.variant === 'ghost';
  const isRec = p.rec;
  return (
    <button onClick={onRun} style={{ appearance: 'none', cursor: 'pointer', width: '100%', marginBottom: 10, border: ghost ? '1px solid ' + C.border : 'none', borderRadius: 'var(--radius)', padding: '12px 0', fontFamily: C.SANS, fontSize: 14, fontWeight: 500,
      color: ghost ? C.ink : 'var(--accent-ink)',
      background: ghost ? 'rgba(255,255,255,0.04)' : (isRec ? 'var(--danger)' : 'linear-gradient(90deg,' + C.gold + ',' + C.hot + ')'),
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {isRec && <span style={{ width: 9, height: 9, borderRadius: '50%', background: ghost ? 'var(--danger)' : '#fff' }} />}
      {p.label}
    </button>
  );
}

function Readout({ p, vals }) {
  const text = p.k === 'status' ? (vals['midi.enabled'] ? 'Connected' : 'Off') : 'listening…';
  if (p.k === 'level') {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: C.dim, marginBottom: 7 }}>{p.label}</div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg,' + C.teal + ',' + C.gold + ')' }} />
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13 }}>
      <span style={{ color: C.dim }}>{p.label}</span>
      <span style={{ fontFamily: C.MONO, color: vals['midi.enabled'] ? C.teal : C.faint }}>{text}</span>
    </div>
  );
}

/* mod matrix grid */
function Matrix() {
  const src = VOID.MOD_SOURCES, tgt = VOID.MOD_TARGETS;
  const [routes, setRoutes] = useStateC(() => { const m = {}; VOID.MOD_ROUTES.forEach((r) => { m[r.src + '|' + r.tgt] = r.amt; }); return m; });
  const cycle = (s, t) => { const k = s + '|' + t, cur = routes[k] || 0, next = cur === 0 ? 0.6 : cur > 0 ? -0.6 : 0; setRoutes((m) => { const n = { ...m }; if (next === 0) delete n[k]; else n[k] = next; return n; }); };
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '78px repeat(' + src.length + ',1fr)', gap: 3 }}>
        <div />
        {src.map((s) => <div key={s} style={{ color: C.gold, textAlign: 'center', fontSize: 8.5, fontFamily: C.MONO, paddingBottom: 3 }}>{s}</div>)}
        {tgt.map((t) => (
          <React.Fragment key={t}>
            <div style={{ color: C.dim, fontSize: 9.5, fontFamily: C.MONO, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 4 }}>{t}</div>
            {src.map((s) => { const a = routes[s + '|' + t] || 0; return <button key={s} onClick={() => cycle(s, t)} style={{ appearance: 'none', border: 'none', cursor: 'pointer', aspectRatio: '1', borderRadius: 3, background: a === 0 ? 'rgba(255,255,255,0.06)' : a < 0 ? C.pink : C.gold, opacity: a === 0 ? 1 : Math.abs(a) + 0.3 }} />; })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginTop: 10, textAlign: 'center' }}>click cell: off → <span style={{ color: C.gold }}>+amt</span> → <span style={{ color: C.pink }}>−amt</span></div>
    </div>
  );
}

/* scenes slot grid */
function ScenesGrid() {
  const [sel, setSel] = useStateC(0);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {VOID.SCENES.map((s, i) => (
          <button key={i} onClick={() => setSel(i)} style={{ appearance: 'none', cursor: 'pointer', aspectRatio: '1', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (i === sel ? C.gold : C.hair), background: i === sel ? 'var(--tint-strong)' : 'rgba(255,255,255,0.03)', color: i === sel ? C.gold : C.dim, fontFamily: C.MONO, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{s.slice(0, 2).toUpperCase()}</button>
        ))}
      </div>
    </div>
  );
}

/* palette grid */
function PaletteGrid({ val, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 8 }}>
      {VOID.PALETTES.map(([name, stops]) => (
        <button key={name} onClick={() => onChange(name)} style={{ appearance: 'none', cursor: 'pointer', padding: 0, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid ' + (name === val ? C.gold : 'rgba(255,255,255,0.08)') }}>
          <div style={{ display: 'flex', height: 26 }}>{stops.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}</div>
          <div style={{ fontSize: 11, color: name === val ? '#fff' : C.dim, padding: '5px 6px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        </button>
      ))}
    </div>
  );
}

/* dispatch a single param to its control */
function ParamControl({ menuId, p, vals, setVal, runAction }) {
  const id = menuId + '.' + p.k;
  const v = vals[id];
  switch (p.type) {
    case 'range': return <Slider p={p} val={v} onChange={(nv) => setVal(id, nv)} />;
    case 'bool': return <Toggle p={p} val={v} onChange={(nv) => setVal(id, nv)} />;
    case 'enum': return <Segmented p={p} val={v} onChange={(nv) => setVal(id, nv)} />;
    case 'select': return <Select p={p} val={v} onChange={(nv) => setVal(id, nv)} />;
    case 'action': return <ActionBtn p={p} onRun={() => runAction && runAction(id)} />;
    case 'readout': return <Readout p={p} vals={vals} />;
    case 'palette': return <PaletteGrid val={v} onChange={(nv) => setVal(id, nv)} />;
    case 'matrix': return <Matrix />;
    case 'scenes': return <ScenesGrid />;
    default: return null;
  }
}

Object.assign(window, { C, Slider, Toggle, Segmented, Select, ActionBtn, Readout, Matrix, ScenesGrid, PaletteGrid, ParamControl, fmtVal });
