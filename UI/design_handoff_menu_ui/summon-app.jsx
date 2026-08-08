// summon-app.jsx v4 — menu deck with in-rail popups + nested submenus.
// • Rail shows menu tiles grouped into Field · Look · Perform · Session.
// • Tiles with a `power` param show a glow when on + a power dot to toggle inline.
// • Clicking a tile POPS a panel that covers the tile list INSIDE the rail —
//   the canvas is never covered (OBS-safe). Submenus push a nested view.
// • Beams/Waves/Both lens filters which menus appear.
// • EDIT (✎): inline reorder + show/hide of menu tiles. All state persists.
// • SETTINGS (⚙): app/view config — menu side, idle fade, fullscreen, reset,
//   keyboard reference. Separate from edit so neither erases the other.

const { useState, useRef, useEffect, useMemo, useCallback } = React;

// Tweakable defaults — edited live from the Tweaks panel and persisted by the host.
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "idleSeconds": 12
}/*EDITMODE-END*/;

/* ─── sim config from the new model keys ─────────────────── */
const SHAPE_SIDES = { Circle: 0, Ellipse: 0, Triangle: 3, Square: 4, Pentagon: 5, Hexagon: 6, Randomgon: 7, Blob: 0, Parabolic: 0 };
function simConfig(vals, lens) {
  const palName = vals['palette.palette'];
  const pal = (VOID.PALETTES.find((x) => x[0] === palName) || VOID.PALETTES[0])[1];
  return {
    palette: pal,
    sides: SHAPE_SIDES[vals['room.shape']] ?? 6,
    emitters: Math.max(1, Math.min(4, vals['beams.emitters'] || 2)),
    beams: Math.max(1, Math.min(12, vals['beams.count'] || 7)),
    spread: 0.1 + ((vals['bonus.spread'] || 12) / 90) * 1.3,
    bounces: Math.max(4, Math.round(((vals['room.bounces'] || 140) / 375) * 22)),
    trail: 0.18 - ((vals['trails.on'] ? vals['trails.length'] : 0) / 100) * 0.14,
    beamsOn: lens !== 'waves' && vals['beams.on'] !== false,
    rings: lens === 'beams' ? false : (vals['rings.on'] !== false),
    speed: 0.6 + ((vals['beams.speed'] || 100) / 375) * 1.4,
  };
}
function SimStage({ vals, lens }) {
  const ref = useRef(null);
  const cfg = useMemo(() => simConfig(vals, lens),
    [lens, vals['palette.palette'], vals['room.shape'], vals['beams.emitters'], vals['beams.count'],
     vals['bonus.spread'], vals['room.bounces'], vals['trails.on'], vals['trails.length'],
     vals['beams.on'], vals['rings.on'], vals['beams.speed']]);
  useEffect(() => {
    if (!ref.current || !window.initVoidSim) return;
    const sim = window.initVoidSim(ref.current, cfg);
    return () => sim.stop();
  }, [cfg]);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}

/* ─── lens helpers ───────────────────────────────────────── */
const menuInLens = (m, lens) => lens === 'both' ? true : m.lens === 'both' || m.lens === lens;

/* ─── default flat values from the model ─────────────────── */
function defaultVals() {
  const v = {};
  VOID.MENUS.forEach((m) => {
    m.params.forEach((p) => { if (p.value !== undefined) v[m.id + '.' + p.k] = p.value; });
    (m.submenus || []).forEach((sm) => sm.params.forEach((p) => { if (p.value !== undefined) v[sm.id + '.' + p.k] = p.value; }));
  });
  return v;
}

/* ─── menu tile (collapsed) ──────────────────────────────── */
// Inline customize: when `edit` is on, each tile shows rename + reorder + hide.
function MenuTile({ menu, name, vals, setVal, onOpen, edit, onRename, onMoveUp, onMoveDown, onHide }) {
  const powered = menu.power ? vals[menu.id + '.' + menu.power] : null;
  const on = powered === true;
  return (
    <div style={{ position: 'relative' }}>
      <button className={'void-tile' + (on ? ' is-on' : '')} onClick={(e) => !edit && onOpen(menu.id, e)} style={{
        appearance: 'none', width: '100%', cursor: edit ? 'default' : 'pointer', textAlign: 'left',
        display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', borderRadius: 'var(--radius)',
      }}>
        <span style={{ fontSize: 19, width: 26, textAlign: 'center', color: on ? C.gold : (powered === false ? C.faint : C.dim) }}>{menu.glyph}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, color: on || powered === null ? 'var(--ink)' : C.dim, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontFamily: C.MONO, fontSize: 11.5, color: C.dim, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{menu.blurb}</div>
        </div>
        {/* power dot (only menus with a master toggle) */}
        {menu.power && !edit && (
          <span onClick={(e) => { e.stopPropagation(); setVal(menu.id + '.' + menu.power, !on); }} title="Power" style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: '50%', cursor: 'pointer',
            border: '1px solid ' + (on ? C.gold : 'rgba(255,255,255,0.16)'),
            background: on ? 'radial-gradient(circle at 50% 35%, #fff, ' + C.gold + ')' : 'transparent',
            boxShadow: on ? '0 0 12px var(--glow)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.6px solid ' + (on ? 'var(--accent-ink)' : 'rgba(255,255,255,0.4)'), borderTopColor: 'transparent' }} />
          </span>
        )}
        {!menu.power && !edit && <span style={{ color: C.faint, fontSize: 16, flexShrink: 0 }}>›</span>}
      </button>
      {/* inline edit overlay: rename + reorder + hide */}
      {edit && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius)', background: 'rgba(10,8,5,0.62)', display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <button onClick={(e) => { e.stopPropagation(); onRename(); }} title="Rename" style={editBtn}>Aa</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} title="Move up" style={editBtn}>↑</button>
          <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} title="Move down" style={editBtn}>↓</button>
          <button onClick={(e) => { e.stopPropagation(); onHide(); }} title="Hide" style={{ ...editBtn, color: '#fff', background: 'var(--danger)', borderColor: 'var(--danger)' }}>✕</button>
        </div>
      )}
    </div>
  );
}
const editBtn = { appearance: 'none', cursor: 'pointer', minWidth: 30, height: 30, padding: '0 8px', borderRadius: 'var(--radius-sm)', border: '1px solid ' + C.border, background: 'var(--tint)', color: C.gold, fontSize: 12, fontFamily: C.MONO, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };

/* ─── small on/off switch (sections + sheet rows) ────────── */
function MiniToggle({ on, onClick, title }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} role="switch" aria-checked={on} title={title} style={{
      position: 'relative', width: 34, height: 19, borderRadius: 999, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: on ? 'var(--accent)' : 'rgba(255,255,255,0.15)', transition: 'background .15s',
    }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,0.35)' }} />
    </button>
  );
}

/* ─── collapsible / toggleable section header ────────────── */
function SectionHeader({ sec, label, count, total, collapsed, off, editable, onRename, onToggleCollapse, onToggleOff }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px 10px' }}>
      <button onClick={onToggleCollapse} disabled={off} title={collapsed ? 'Expand' : 'Collapse'} style={{ appearance: 'none', background: 'transparent', border: 'none', padding: 0, cursor: off ? 'default' : 'pointer', color: C.faint, display: 'flex', alignItems: 'center', opacity: off ? 0.4 : 1 }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: (collapsed || off) ? 'rotate(-90deg)' : 'none', transition: 'transform .15s' }}><path d="M2 4l3.5 3.5L9 4" /></svg>
      </button>
      <span style={{ flex: 1, fontFamily: C.MONO, fontSize: 11, letterSpacing: 1.6, color: off ? C.faint : C.dim, textTransform: 'uppercase', opacity: off ? 0.65 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      {editable
        ? <button onClick={(e) => { e.stopPropagation(); onRename(); }} title="Rename section" style={{ appearance: 'none', cursor: 'pointer', height: 22, padding: '0 8px', borderRadius: 6, border: '1px solid ' + C.border, background: 'var(--tint)', color: C.gold, fontFamily: C.MONO, fontSize: 10.5, flexShrink: 0 }}>Aa</button>
        : <span style={{ fontFamily: C.MONO, fontSize: 10, color: C.faint }}>{off ? 'off' : count + (count !== total ? '/' + total : '')}</span>}
      <MiniToggle on={!off} onClick={onToggleOff} title={off ? 'Enable ' + sec : 'Disable ' + sec} />
    </div>
  );
}

/* ─── rename popover (in-rail) ───────────────────────────── */
// Curated suggestions, two angles: Scientific (the math/optics) + Experiential (the feel).
function RenamePanel({ glyph, def, value, suggestions, onChange, onReset, onClose }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) { ref.current.focus(); ref.current.select(); } }, []);
  const custom = value !== def;
  const chipRow = (heading, list) => (list && list.length) ? (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: C.MONO, fontSize: 11, letterSpacing: 1.4, color: C.faint, textTransform: 'uppercase', marginBottom: 9 }}>{heading}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {list.map((s) => {
          const on = s === value;
          return <button key={s} onClick={() => onChange(s)} style={{ appearance: 'none', cursor: 'pointer', fontFamily: C.SANS, fontSize: 13.5, padding: '7px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid ' + (on ? C.gold : C.hair), background: on ? 'var(--tint-strong)' : 'rgba(255,255,255,0.03)', color: on ? '#fff' : C.dim }}>{s}</button>;
        })}
      </div>
    </div>
  ) : null;
  return (
    <div className="void-panel void-popover-in" style={{ zIndex: 8, display: 'flex', flexDirection: 'column', transformOrigin: '50% 50px' }}>
      <div className="void-panelhead" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid ' + C.hair, flexShrink: 0, cursor: 'pointer' }}>
        <button className="void-closebtn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Done" style={{ appearance: 'none', cursor: 'pointer', flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid ' + C.border, background: 'linear-gradient(135deg, var(--tint-strong), rgba(255,255,255,0.015))', color: C.gold, fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</button>
        {glyph ? <span style={{ fontSize: 18, color: C.gold }}>{glyph}</span> : <span style={{ fontSize: 16, color: C.gold }}>Aa</span>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.DISP, fontSize: 17, color: '#fff' }}>Rename</div>
          <div style={{ fontFamily: C.MONO, fontSize: 10, letterSpacing: 0.6, color: C.faint }}>default · {def}</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 24px' }}>
        <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def}
          style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid ' + C.border, borderRadius: 'var(--radius)', padding: '12px 13px', color: '#fff', fontFamily: C.SANS, fontSize: 16, outline: 'none', marginBottom: 14 }} />
        {custom && <button onClick={onReset} style={{ appearance: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px dashed ' + C.border, background: 'transparent', color: C.dim, borderRadius: 'var(--radius-sm)', padding: '7px 12px', fontFamily: C.SANS, fontSize: 13, marginBottom: 18 }}>↺ Reset to “{def}”</button>}
        {chipRow('Scientific', suggestions.sci)}
        {chipRow('Experiential', suggestions.exp)}
      </div>
    </div>
  );
}

/* ─── settings panel (in-rail popover) ───────────────────── */
// App / view configuration — distinct from inline edit. Covers menu side,
// idle fade, fullscreen, layout reset, and the keyboard reference.
function SettingsPanel({ side, setSide, mode, setMode, idleSeconds, setIdle, fullscreen, onFullscreen, onReset, onClose }) {
  const seg = (active) => ({ flex: 1, appearance: 'none', cursor: 'pointer', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 4px', fontFamily: C.SANS, fontSize: 13.5, fontWeight: 500, color: active ? 'var(--accent-ink)' : C.dim, background: active ? 'linear-gradient(90deg,' + C.hot + ',' + C.gold + ')' : 'transparent' });
  const rowLabel = { fontFamily: C.MONO, fontSize: 11, letterSpacing: 1.4, color: C.faint, textTransform: 'uppercase', marginBottom: 9 };
  const SHORTCUTS = [['S', 'Summon (search any function)'], ['F', 'Fullscreen — animation only'], ['U', 'Toggle menu in fullscreen'], ['H', 'Hide / show the menu'], ['Esc', 'Close panel · exit fullscreen']];
  return (
    <div className="void-panel void-popover-in" style={{ zIndex: 8, display: 'flex', flexDirection: 'column', transformOrigin: '50% 50px' }}>
      <div className="void-panelhead" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid ' + C.hair, flexShrink: 0, cursor: 'pointer' }}>
        <button className="void-closebtn" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Done" style={{ appearance: 'none', cursor: 'pointer', flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid ' + C.border, background: 'linear-gradient(135deg, var(--tint-strong), rgba(255,255,255,0.015))', color: C.gold, fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        <span style={{ fontSize: 18, color: C.gold }}>⚙</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.DISP, fontSize: 17, color: '#fff' }}>Settings</div>
          <div style={{ fontFamily: C.MONO, fontSize: 10, letterSpacing: 0.6, color: C.faint }}>view · behavior · shortcuts</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 24px' }}>
        {/* mode — Simple hides the pro sections (Perform / Session); search still finds everything */}
        <div style={{ marginBottom: 20 }}>
          <div style={rowLabel}>Mode</div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', padding: 4 }}>
            <button onClick={() => setMode('simple')} style={seg(mode === 'simple')}>Simple</button>
            <button onClick={() => setMode('advanced')} style={seg(mode === 'advanced')}>Advanced</button>
          </div>
          <div style={{ fontSize: 12, color: C.faint, marginTop: 7, lineHeight: 1.4 }}>{mode === 'simple' ? 'Field & Look only. Press S to summon any hidden function.' : 'All sections — Field, Look, Perform, Session.'}</div>
        </div>
        {/* menu position */}
        <div style={{ marginBottom: 20 }}>
          <div style={rowLabel}>Menu position</div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', padding: 4 }}>
            <button onClick={() => setSide('left')} style={seg(side === 'left')}>◧ Left</button>
            <button onClick={() => setSide('right')} style={seg(side === 'right')}>Right ◨</button>
          </div>
        </div>
        {/* idle fade */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...rowLabel, display: 'flex', justifyContent: 'space-between' }}><span>Menu fades after</span><span style={{ color: C.gold }}>{idleSeconds}s</span></div>
          <input type="range" min={2} max={30} step={1} value={idleSeconds} onChange={(e) => setIdle(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: C.MONO, fontSize: 10, color: C.faint, marginTop: 4 }}><span>2s</span><span>30s</span></div>
        </div>
        {/* fullscreen */}
        <div style={{ marginBottom: 20 }}>
          <div style={rowLabel}>Performance view</div>
          <button onClick={onFullscreen} style={{ appearance: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 'var(--radius)', border: '1px solid ' + C.border, background: fullscreen ? 'var(--tint-strong)' : 'rgba(255,255,255,0.03)', color: 'var(--ink)', fontFamily: C.SANS, fontSize: 14 }}>
            <span style={{ fontSize: 17, color: C.gold }}>⛶</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{fullscreen ? 'Exit fullscreen' : 'Enter fullscreen — animation only'}</span>
            <span style={{ fontFamily: C.MONO, fontSize: 11, color: C.gold, border: '1px solid ' + C.border, borderRadius: 6, padding: '1px 7px' }}>F</span>
          </button>
        </div>
        {/* reset */}
        <div style={{ marginBottom: 22 }}>
          <div style={rowLabel}>Menu layout</div>
          <button onClick={onReset} style={{ appearance: 'none', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 'var(--radius)', border: '1px dashed ' + C.border, background: 'transparent', color: C.dim, fontFamily: C.SANS, fontSize: 14 }}>
            <span style={{ fontSize: 16, color: C.gold }}>↺</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Reset order, hidden &amp; sections</span>
          </button>
        </div>
        {/* shortcuts */}
        <div>
          <div style={rowLabel}>Keyboard</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SHORTCUTS.map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ flexShrink: 0, minWidth: 34, textAlign: 'center', fontFamily: C.MONO, fontSize: 12, color: C.gold, border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 0', background: 'var(--tint-weak)' }}>{k}</span>
                <span style={{ fontSize: 13, color: C.dim }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* version */}
        <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid ' + C.hair, fontFamily: C.MONO, fontSize: 10, letterSpacing: 0.5, color: C.faint }}>VOIDULATOR · Obsidian &amp; Ember · v1.0</div>
      </div>
    </div>
  );
}

/* ─── popup panel (covers the tile list, inside the rail) ── */
function MenuPanel({ menu, sub, vals, setVal, runAction, onBack, onOpenSub, onClose, originY, closing, menuName }) {
  const node = sub || menu;
  const powered = node.power ? vals[node.id + '.' + node.power] : null;
  // params except the master power (shown in header)
  const bodyParams = node.params.filter((p) => !(node.power && p.k === node.power));
  return (
    <div className={'void-panel ' + (closing ? 'void-popover-out' : 'void-popover-in')} style={{ zIndex: 8, transformOrigin: '50% ' + (originY || 150) + 'px', display: 'flex', flexDirection: 'column' }}>
      {/* header */}
      {/* header — clicking anywhere here closes (or goes back from a submenu) */}
      <div className="void-panelhead" onClick={sub ? onBack : onClose} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px', borderBottom: '1px solid ' + C.hair, flexShrink: 0, cursor: 'pointer' }}>
        <button className="void-closebtn" onClick={(e) => { e.stopPropagation(); (sub ? onBack : onClose)(); }} title={sub ? 'Back' : 'Close'} style={{ appearance: 'none', cursor: 'pointer', flexShrink: 0, width: 32, height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid ' + C.border, background: 'linear-gradient(135deg, var(--tint-strong), rgba(255,255,255,0.015))', color: C.gold, fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)' }}>{sub ? '←' : '✕'}</button>
        <span style={{ fontSize: 18, color: C.gold }}>{node.glyph}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.DISP, fontSize: 16, color: '#fff' }}>{sub ? (menuName || menu.name) + ' › ' + node.name : (menuName || node.name)}</div>
          <div style={{ fontFamily: C.MONO, fontSize: 10, letterSpacing: 0.6, color: C.faint }}>{node.blurb}</div>
        </div>
        {/* master power in header */}
        {node.power && (
          <button onClick={(e) => { e.stopPropagation(); setVal(node.id + '.' + node.power, !powered); }} style={{ appearance: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid ' + (powered ? C.border : C.hair), background: powered ? 'var(--tint-strong)' : 'transparent', borderRadius: 'var(--radius-sm)', padding: '6px 10px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: powered ? C.gold : C.faint, boxShadow: powered ? '0 0 8px ' + C.gold : 'none' }} />
            <span style={{ fontFamily: C.MONO, fontSize: 11, color: powered ? C.gold : C.dim }}>{powered ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>
      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 22px', opacity: node.power && powered === false ? 0.45 : 1, transition: 'opacity .15s' }}>
        {bodyParams.map((p) => <ParamControl key={p.k} menuId={node.id} p={p} vals={vals} setVal={setVal} runAction={runAction} />)}
        {/* submenu entries */}
        {!sub && menu.submenus && menu.submenus.map((smi) => {
          const sp = smi.power ? vals[smi.id + '.' + smi.power] : null;
          return (
            <button key={smi.id} onClick={() => onOpenSub(smi.id)} style={{ appearance: 'none', cursor: 'pointer', width: '100%', marginTop: 6, border: '1px solid ' + (sp ? C.border : C.hair), background: sp ? 'var(--tint-weak)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius)', padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ fontSize: 16, color: sp ? C.gold : C.dim, width: 20, textAlign: 'center' }}>{smi.glyph}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 13.5, color: '#fff', fontWeight: 500 }}>{smi.name}</div>
                <div style={{ fontFamily: C.MONO, fontSize: 10, color: C.faint }}>{smi.blurb}</div>
              </div>
              {sp !== null && <span style={{ width: 7, height: 7, borderRadius: '50%', background: sp ? C.gold : C.faint, marginRight: 4 }} />}
              <span style={{ color: C.faint, fontSize: 16 }}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── command palette ────────────────────────────────────── */
function buildIndex(names) {
  const nm = (m) => (names && names[m.id]) || m.name;
  const out = [];
  VOID.MENUS.forEach((m) => {
    out.push({ id: m.id, menuId: m.id, label: nm(m), group: m.section, glyph: m.glyph, lens: m.lens, kind: 'menu' });
    m.params.forEach((p) => out.push({ id: m.id + '.' + p.k, menuId: m.id, label: p.label, group: nm(m), glyph: m.glyph, lens: m.lens, kind: 'param' }));
    (m.submenus || []).forEach((sm) => {
      out.push({ id: sm.id, menuId: m.id, subId: sm.id, label: nm(m) + ' › ' + sm.name, group: nm(m), glyph: sm.glyph, lens: m.lens, kind: 'sub' });
      sm.params.forEach((p) => out.push({ id: sm.id + '.' + p.k, menuId: m.id, subId: sm.id, label: p.label, group: nm(m) + ' › ' + sm.name, glyph: sm.glyph, lens: m.lens, kind: 'param' }));
    });
  });
  return out;
}

function CommandPalette({ index, onPick, onClose, lens }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pool = index.filter((f) => lens === 'both' || f.lens === 'both' || f.lens === lens);
    if (!s) return pool.filter((f) => f.kind !== 'param').slice(0, 8);
    return pool.filter((f) => (f.label + ' ' + f.group).toLowerCase().includes(s)).slice(0, 10);
  }, [q, index, lens]);
  useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(results.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); const r = results[sel]; if (r) onPick(r); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [results, sel]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(6,5,3,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '13vh' }}>
      <div className="void-card void-pop" onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: '92vw', background: 'var(--panel)', borderRadius: 'var(--radius-lg)', border: '1px solid ' + C.border, boxShadow: '0 40px 100px rgba(0,0,0,0.65)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid ' + C.hair }}>
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ color: 'var(--accent)' }}><circle cx="7" cy="7" r="5" /><path d="M11 11l5 5" /></svg>
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} placeholder="Search any menu or parameter…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: C.SANS, fontSize: 17 }} />
          {lens !== 'both' && <span style={{ fontFamily: C.MONO, fontSize: 10.5, color: C.gold, background: 'var(--tint)', border: '1px solid ' + C.border, borderRadius: 6, padding: '3px 9px' }}>{lens} lens</span>}
          <span style={{ fontFamily: C.MONO, fontSize: 11, color: C.faint, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5, padding: '2px 7px' }}>ESC</span>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {results.length === 0 && <div style={{ padding: '24px 20px', color: C.dim, fontSize: 14 }}>No match for "{q}".</div>}
          {results.map((f, i) => (
            <div key={f.id} onMouseEnter={() => setSel(i)} onClick={() => onPick(f)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 20px', cursor: 'pointer', background: i === sel ? 'var(--tint-strong)' : 'transparent' }}>
              <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: C.gold, background: 'var(--tint)' }}>{f.glyph}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, color: '#fff' }}>{f.label}</div>
                <div style={{ fontFamily: C.MONO, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', color: C.dim }}>{f.group}{f.kind === 'menu' ? ' · menu' : ''}</div>
              </div>
              {i === sel && <span style={{ fontFamily: C.MONO, fontSize: 11, color: C.faint }}>↵</span>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '10px 20px', borderTop: '1px solid ' + C.hair, fontFamily: C.MONO, fontSize: 10.5, color: C.faint }}>
          <span>↑↓ navigate</span><span>↵ open menu</span>
        </div>
      </div>
    </div>
  );
}

/* ─── app ────────────────────────────────────────────────── */
const RAIL_W = 384; // wider rail — the sim only needs a square, so the menu gets the room
const LS = {
  vals: 'voidulator.v4.vals', side: 'voidulator.v4.side', lens: 'voidulator.v4.lens',
  order: 'voidulator.v4.order', hidden: 'voidulator.v4.hidden',
  collapsed: 'voidulator.v4.collapsed', sectionsOff: 'voidulator.v4.sectionsOff',
  mode: 'voidulator.v4.mode', names: 'voidulator.v4.names',
};
const loadLS = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } };

function App() {
  const menuById = useMemo(() => Object.fromEntries(VOID.MENUS.map((m) => [m.id, m])), []);

  const [vals, setVals] = useState(() => ({ ...defaultVals(), ...loadLS(LS.vals, {}) }));
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const idleSeconds = tw.idleSeconds || 12;
  const setIdleSeconds = (v) => setTweak('idleSeconds', v);
  const [side, setSide] = useState(() => loadLS(LS.side, 'left'));
  const [lens, setLens] = useState(() => loadLS(LS.lens, 'both'));
  const [order, setOrder] = useState(() => loadLS(LS.order, VOID.MENUS.map((m) => m.id)));
  const [hidden, setHidden] = useState(() => loadLS(LS.hidden, []));
  const [collapsed, setCollapsed] = useState(() => loadLS(LS.collapsed, []));
  const [sectionsOff, setSectionsOff] = useState(() => loadLS(LS.sectionsOff, []));
  const [mode, setMode] = useState(() => loadLS(LS.mode, 'advanced')); // 'simple' | 'advanced'
  const [names, setNames] = useState(() => loadLS(LS.names, {})); // custom titles by id / 'sec:<Section>'
  const index = useMemo(() => buildIndex(names), [names]);
  const [edit, setEdit] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renaming, setRenaming] = useState(null); // id being renamed: menu id or 'sec:<Section>'
  const [chromeHidden, setChromeHidden] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fsMenu, setFsMenu] = useState(false); // menu visibility while in fullscreen
  const rootRef = useRef(null);
  const [idle, setIdle] = useState(false);
  const [openId, setOpenId] = useState(null); // menu id of popup
  const [subId, setSubId] = useState(null);    // submenu id within popup
  const [originY, setOriginY] = useState(150);  // y of clicked tile (popover origin)
  const [closing, setClosing] = useState(false);
  const listWrapRef = useRef(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { try { localStorage.setItem(LS.vals, JSON.stringify(vals)); } catch {} }, [vals]);
  useEffect(() => { try { localStorage.setItem(LS.side, JSON.stringify(side)); } catch {} }, [side]);
  useEffect(() => { try { localStorage.setItem(LS.lens, JSON.stringify(lens)); } catch {} }, [lens]);
  useEffect(() => { try { localStorage.setItem(LS.order, JSON.stringify(order)); } catch {} }, [order]);
  useEffect(() => { try { localStorage.setItem(LS.hidden, JSON.stringify(hidden)); } catch {} }, [hidden]);
  useEffect(() => { try { localStorage.setItem(LS.collapsed, JSON.stringify(collapsed)); } catch {} }, [collapsed]);
  useEffect(() => { try { localStorage.setItem(LS.sectionsOff, JSON.stringify(sectionsOff)); } catch {} }, [sectionsOff]);
  useEffect(() => { try { localStorage.setItem(LS.mode, JSON.stringify(mode)); } catch {} }, [mode]);
  useEffect(() => { try { localStorage.setItem(LS.names, JSON.stringify(names)); } catch {} }, [names]);

  // display-name + rename helpers
  const nameOf = (m) => names[m.id] || m.name;
  const secName = (sec) => names['sec:' + sec] || sec;
  const defFor = (id) => id.startsWith('sec:') ? id.slice(4) : (menuById[id] ? menuById[id].name : id);
  const suggFor = (id) => (window.VOID_NAMES && window.VOID_NAMES[id]) || { sci: [], exp: [] };
  const setNameFor = (id, val) => setNames((n) => {
    const c = { ...n }; const v = (val || '').trim();
    if (!v || v === defFor(id)) delete c[id]; else c[id] = v;
    return c;
  });

  const resetLayout = () => {
    setOrder(VOID.MENUS.map((m) => m.id)); setHidden([]); setCollapsed([]); setSectionsOff([]); setNames({});
  };

  const setVal = useCallback((id, v) => setVals((s) => ({ ...s, [id]: v })), []);
  const runAction = useCallback(() => {}, []);

  // open a menu window, growing from the clicked tile
  const openPanel = useCallback((id, e) => {
    if (e && e.currentTarget && listWrapRef.current) {
      const tr = e.currentTarget.getBoundingClientRect();
      const lr = listWrapRef.current.getBoundingClientRect();
      setOriginY(tr.top - lr.top + tr.height / 2);
    } else { setOriginY(150); }
    setClosing(false); setSubId(null); setOpenId(id);
  }, []);
  const closePanel = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); setOpenId(null); setSubId(null); }, 180);
  }, []);

  const move = (id, dir) => setOrder((o) => {
    // swap with the previous/next menu IN THE SAME SECTION so reorder stays within its group
    const m = menuById[id]; if (!m) return o;
    const sameSec = o.filter((x) => menuById[x] && menuById[x].section === m.section);
    const pos = sameSec.indexOf(id), swap = sameSec[pos + dir];
    if (!swap) return o;
    const n = o.slice(); const i = n.indexOf(id), j = n.indexOf(swap);
    [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const toggleCollapsed = (sec) => setCollapsed((c) => c.includes(sec) ? c.filter((x) => x !== sec) : [...c, sec]);
  const toggleSectionOff = (sec) => setSectionsOff((c) => c.includes(sec) ? c.filter((x) => x !== sec) : [...c, sec]);
  const openSettings = () => { closePanel(); setEdit(false); setRenaming(null); setSettingsOpen(true); };

  // F toggles an immersive "performance" mode: rail hidden, sim centered on black.
  // The real Fullscreen API is attempted as a bonus, but the immersive LAYOUT does
  // not depend on it (a sandboxed preview may block fullscreen).
  const enterFs = useCallback(() => {
    setFullscreen(true); setFsMenu(false);
    const el = rootRef.current || document.documentElement;
    try { const p = (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el); if (p && p.catch) p.catch(() => {}); } catch {}
  }, []);
  const exitFs = useCallback(() => {
    setFullscreen(false); setFsMenu(false);
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try { (document.exitFullscreen || document.webkitExitFullscreen)?.call(document); } catch {}
    }
  }, []);
  const toggleFullscreen = useCallback(() => { (fullscreen ? exitFs : enterFs)(); }, [fullscreen, enterFs, exitFs]);

  // if the browser leaves fullscreen on its own (Esc / F11), leave immersive mode too
  useEffect(() => {
    const sync = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) setFullscreen(false); };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('webkitfullscreenchange', sync); };
  }, []);

  // keyboard: S summon · F fullscreen (animation only) · U toggle menu in fullscreen · H hide chrome · Esc close
  useEffect(() => {
    const k = (e) => {
      const typing = /input|textarea/i.test(document.activeElement?.tagName || '');
      if (typing) return;
      if (!paletteOpen && (e.key === 's' || e.key === 'S' || e.key === '/')) { e.preventDefault(); setPaletteOpen(true); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
      else if ((e.key === 'u' || e.key === 'U') && fullscreen) { e.preventDefault(); setFsMenu((v) => !v); }
      else if ((e.key === 'h' || e.key === 'H') && !fullscreen) { e.preventDefault(); setChromeHidden((v) => !v); }
      else if (e.key === 'Escape') { if (openId) closePanel(); else if (fullscreen) exitFs(); else if (chromeHidden) setChromeHidden(false); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [paletteOpen, openId, chromeHidden, fullscreen, toggleFullscreen, exitFs]);

  // idle auto-dim (VJ mode): rail fades after idleSeconds of no input, wakes on activity
  useEffect(() => {
    let t;
    const wake = () => { setIdle(false); clearTimeout(t); t = setTimeout(() => setIdle(true), Math.max(1, idleSeconds) * 1000); };
    wake();
    ['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach((ev) => window.addEventListener(ev, wake));
    return () => { clearTimeout(t); ['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach((ev) => window.removeEventListener(ev, wake)); };
  }, [idleSeconds]);

  const pick = (f) => {
    setPaletteOpen(false);
    setClosing(false);
    setOriginY(150);
    setOpenId(f.menuId);
    setSubId(f.subId || null);
  };

  // ordered, in-lens menus grouped by section (header shows even when a section is off/empty)
  // Simple mode shows only Field & Look; the command palette still indexes everything.
  const SIMPLE_SECTIONS = ['Field', 'Look'];
  const inLensMenus = order.map((id) => menuById[id]).filter(Boolean).filter((m) => menuInLens(m, lens));
  const sectionData = VOID.SECTIONS.map((sec) => {
    const all = inLensMenus.filter((m) => m.section === sec);
    return { sec, all, tiles: all.filter((m) => !hidden.includes(m.id)), off: sectionsOff.includes(sec), collapsed: collapsed.includes(sec) };
  }).filter((s) => s.all.length && (mode === 'advanced' || SIMPLE_SECTIONS.includes(s.sec)));
  const hiddenMenus = VOID.MENUS.filter((m) => hidden.includes(m.id));
  const showTray = edit && hiddenMenus.length > 0;

  const openMenu = openId ? menuById[openId] : null;
  const openSub = openMenu && subId ? (openMenu.submenus || []).find((s) => s.id === subId) : null;

  const menuOpen = fullscreen ? fsMenu : !chromeHidden;

  const rail = (
    <div className="void-railwrap" style={{
      width: menuOpen ? RAIL_W : 0, minWidth: 0, maxWidth: menuOpen ? RAIL_W : 0,
      flex: '0 0 auto', height: '100%', overflow: 'hidden',
      ...(fullscreen ? { position: 'absolute', top: 0, bottom: 0, [side === 'left' ? 'left' : 'right']: 0, zIndex: 40 } : {}),
    }}>
    <div className={'void-rail' + (idle && !openId && !paletteOpen && !edit && !settingsOpen ? ' is-idle' : '')} style={{ position: 'relative', width: RAIL_W, height: '100%', background: 'var(--rail)', [side === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* header */}
      <div style={{ padding: '16px 16px 13px', borderBottom: '1px solid ' + C.hair, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="void-wordmark">VOIDULATOR</div>
            <div style={{ fontFamily: C.MONO, fontSize: 10.5, letterSpacing: 1.5, color: C.faint, marginTop: 3 }}>COMMAND DECK</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setSettingsOpen(false); setEdit((e) => !e); }} title="Customize menu" style={{ ...iconBtn, borderColor: edit ? C.gold : C.border, color: edit ? C.gold : C.dim, background: edit ? 'var(--tint-strong)' : 'transparent' }}>{edit ? '✓' : '✎'}</button>
            <button onClick={openSettings} title="Settings" style={{ ...iconBtn, borderColor: settingsOpen ? C.gold : C.border, color: settingsOpen ? C.gold : C.dim, background: settingsOpen ? 'var(--tint-strong)' : 'transparent' }}>⚙</button>
          </div>
        </div>
        <button onClick={() => setPaletteOpen(true)} style={{ marginTop: 13, appearance: 'none', cursor: 'text', width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.05)', border: '1px solid ' + C.border, color: C.dim, fontFamily: C.SANS, fontSize: 14.5, whiteSpace: 'nowrap' }}>
          <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ flexShrink: 0 }}><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l4 4" /></svg>
          Summon a function…
          <span style={{ marginLeft: 'auto', fontFamily: C.MONO, fontSize: 11, color: C.gold, border: '1px solid ' + C.border, borderRadius: 6, padding: '1px 7px' }}>S</span>
        </button>
        <div style={{ marginTop: 11, display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius)', padding: 4 }}>
          {[['beams', '◇', 'Beams'], ['waves', '⊚', 'Waves'], ['both', '◐', 'Both']].map(([id, g, lbl]) => {
            const on = lens === id;
            return <button key={id} onClick={() => setLens(id)} style={{ flex: 1, appearance: 'none', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)', padding: '8px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: C.SANS, fontSize: 13.5, fontWeight: 500, color: on ? 'var(--accent-ink)' : C.dim, background: on ? 'linear-gradient(90deg,' + C.hot + ',' + C.gold + ')' : 'transparent' }}><span style={{ fontSize: 14 }}>{g}</span>{lbl}</button>;
          })}
        </div>
      </div>

      {/* tile list, grouped by section */}
      <div ref={listWrapRef} className="void-listwrap" style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '10px 14px 18px' }}>
        {sectionData.map(({ sec, all, tiles, off, collapsed: col }) => (
          <div key={sec} style={{ marginBottom: 16 }}>
            <SectionHeader sec={sec} label={secName(sec)} count={tiles.length} total={all.length} collapsed={col} off={off}
              editable={edit} onRename={() => { setSettingsOpen(false); setRenaming('sec:' + sec); }}
              onToggleCollapse={() => toggleCollapsed(sec)} onToggleOff={() => toggleSectionOff(sec)} />
            {!off && !col && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {tiles.map((m) => (
                  <MenuTile key={m.id} menu={m} name={nameOf(m)} vals={vals} setVal={setVal} edit={edit}
                    onOpen={openPanel} onRename={() => { setSettingsOpen(false); setRenaming(m.id); }}
                    onMoveUp={() => move(m.id, -1)} onMoveDown={() => move(m.id, 1)} onHide={() => setHidden((h) => [...h, m.id])} />
                ))}
                {tiles.length === 0 && <div style={{ fontFamily: C.MONO, fontSize: 11, color: C.faint, padding: '4px 6px 2px' }}>all hidden</div>}
              </div>
            )}
          </div>
        ))}
        {showTray && (
          <div style={{ marginTop: 8, borderTop: '1px solid ' + C.hair, paddingTop: 14 }}>
            <div style={{ fontFamily: C.MONO, fontSize: 10, letterSpacing: 1.8, color: C.faint, marginBottom: 9 }}>HIDDEN · tap to restore</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {hiddenMenus.map((m) => (
                <button key={m.id} onClick={() => setHidden((h) => h.filter((x) => x !== m.id))} style={{ appearance: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, border: '1px dashed ' + C.border, background: 'transparent', color: C.dim, borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontFamily: C.SANS, fontSize: 12 }}>
                  <span style={{ color: C.gold }}>{m.glyph}</span>{m.name} <span style={{ color: C.faint }}>+</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* rename popover — covers the list with its own scrim */}
      {renaming && (
        <React.Fragment>
          <div onClick={() => setRenaming(null)} className="void-scrim void-scrim-in" style={{ zIndex: 7, cursor: 'pointer' }} />
          <RenamePanel glyph={renaming.startsWith('sec:') ? '' : (menuById[renaming] && menuById[renaming].glyph)}
            def={defFor(renaming)} value={names[renaming] != null ? names[renaming] : defFor(renaming)}
            suggestions={suggFor(renaming)}
            onChange={(v) => setNameFor(renaming, v)} onReset={() => setNameFor(renaming, '')}
            onClose={() => setRenaming(null)} />
        </React.Fragment>
      )}

      {/* settings — covers the list with its own scrim */}
      {settingsOpen && (
        <React.Fragment>
          <div onClick={() => setSettingsOpen(false)} className="void-scrim void-scrim-in" style={{ zIndex: 7, cursor: 'pointer' }} />
          <SettingsPanel side={side} setSide={setSide} mode={mode} setMode={setMode} idleSeconds={idleSeconds} setIdle={setIdleSeconds}
            fullscreen={fullscreen} onFullscreen={() => { setSettingsOpen(false); toggleFullscreen(); }}
            onReset={resetLayout} onClose={() => setSettingsOpen(false)} />
        </React.Fragment>
      )}

      {/* popup window grows from the clicked tile; scrim dims the list behind */}
      {openMenu && (
        <React.Fragment>
          <div onClick={closePanel} className={'void-scrim ' + (closing ? 'void-scrim-out' : 'void-scrim-in')} style={{ zIndex: 7, cursor: 'pointer' }} />
          <MenuPanel menu={openMenu} sub={openSub} vals={vals} setVal={setVal} runAction={runAction}
            originY={originY} closing={closing} menuName={nameOf(openMenu)}
            onBack={() => setSubId(null)} onOpenSub={(id) => setSubId(id)} onClose={closePanel} />
        </React.Fragment>
      )}
      </div>
    </div>
    </div>
  );

  return (
    <div ref={rootRef} className="void-root" data-theme="ember" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: side === 'right' ? 'row-reverse' : 'row', color: 'var(--ink)', overflow: 'hidden', background: '#04050a' }}>
      {rail}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#04050a' }}>
        {/* In fullscreen the animation is centered as a square on black; otherwise it fills the stage. */}
        <div style={fullscreen
          ? { position: 'relative', width: 'min(100vw, 100vh)', height: 'min(100vw, 100vh)', aspectRatio: '1 / 1' }
          : { position: 'absolute', inset: 0 }}>
          <SimStage vals={vals} lens={lens} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 100% at 50% 50%, transparent 60%, rgba(5,4,10,0.55) 100%)', pointerEvents: 'none' }} />
        </div>
        {/* TODO: first-run onboarding popup for new users — surface the keyboard
            shortcuts (S = summon · H = hide chrome · Esc = close · click a tile's
            dot to toggle power) in a dismissible card shown once per browser
            (persist a "seen" flag in localStorage). Replaces the old bottom hint
            line + the BASS/shape readout that used to live here. */}
        {!menuOpen && (
          <button onClick={() => fullscreen ? setFsMenu(true) : setChromeHidden(false)} title={fullscreen ? 'Show menu (U)' : 'Show controls (H)'} style={{ position: 'absolute', top: 16, left: side === 'left' ? 16 : 'auto', right: side === 'right' ? 16 : 'auto', appearance: 'none', cursor: 'pointer', width: 42, height: 42, borderRadius: 'var(--radius)', border: '1px solid ' + C.border, background: 'var(--panel)', color: C.gold, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>☰</button>
        )}
      </div>
      {paletteOpen && <CommandPalette index={index} onPick={pick} onClose={() => setPaletteOpen(false)} lens={lens} />}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Idle behavior" />
        <TweakSlider label="Menu fades after" value={idleSeconds} min={2} max={30} step={1} unit="s"
          onChange={(v) => setTweak('idleSeconds', v)} />
      </TweaksPanel>
    </div>
  );
}
const iconBtn = { appearance: 'none', cursor: 'pointer', width: 30, height: 30, borderRadius: 'var(--radius-sm)', border: '1px solid ' + C.border, background: 'transparent', color: C.dim, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' };

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
