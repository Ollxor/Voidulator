/**
 * ui-gates.mjs — the nine gates the UI has to clear.
 *
 * Built BEFORE the Direction-A redesign, deliberately: a harness that has never
 * caught anything is not evidence of quality. Hence --selftest, which injects
 * deliberate faults and fails if a gate sleeps through one.
 *
 *   node tests/ui-gates.mjs                 # all gates
 *   node tests/ui-gates.mjs --selftest      # prove the gates actually fire
 *   node tests/ui-gates.mjs --only=2,5
 *   node tests/ui-gates.mjs --url=http://localhost:5181/
 *
 * Exit 1 if any enforced gate has findings. Gate 1 is advisory until the
 * redesign lands — until then its output IS the redesign punch list.
 */
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.find(a => a.startsWith(`--${k}=`)) || `=${d}`).split('=').slice(1).join('=');
const URL_ = arg('url', 'http://localhost:5181/');
const ONLY = arg('only', '').split(',').filter(Boolean).map(Number);
const SELFTEST = argv.includes('--selftest');
const want = n => ONLY.length === 0 || ONLY.includes(n);

const LANGS = ['en', 'es', 'pt', 'fr'];
const MODES = ['beams', 'rings', 'both', 'field', 'generative'];
const SHAPES = ['circle', 'ellipse'];           // ellipse is what reveals #eccentricity

/**
 * Controls that legitimately never render. Each needs a reason — an
 * undocumented entry here is how a real "unreachable control" bug hides.
 */
const REACHABILITY_EXEMPT = {
  presetFile:        'hidden <input type=file>, opened programmatically by Load preset',
  segCol:            'only shown when the selected segment has inherit-colour off',
  segItemWavelength: 'only shown when the selected segment has its own drift on',
  segItemSpeed:      'only shown when the selected segment has its own drift on',
};

/** Direction A spec — the fidelity target (see the reference artifact). */
const SPEC = {
  labelPx: 10.5, colGap: 8, groupRadius: 3,
  labelCol: 88, valueCol: 44,
  colors: { panel: '#16191F', label: '#A6ADBB' },
};

const results = [];
const record = (n, name, findings, advisory = false) => results.push({ n, name, findings, advisory });

/* ── browser helpers ────────────────────────────────────────────────── */

async function open(browser, { width = 1400, height = 900, lang = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  if (lang) await page.addInitScript(l => { try { localStorage.setItem('voidulator-language', l); } catch {} }, lang);
  await page.goto(URL_, { timeout: 25000 });
  await page.waitForFunction(() => window.Voidulator && document.readyState === 'complete', { timeout: 25000 });
  await page.evaluate(() => {
    const w = document.getElementById('welcomeModal');
    if (w) w.style.display = 'none';
    document.body.classList.remove('mode-simple');
  });
  await page.waitForTimeout(250);
  return { ctx, page, errors };
}

const setMode  = (page, m) => page.evaluate(v => { const s = document.getElementById('emissionSel'); s.value = v; s.dispatchEvent(new Event('change')); }, m);
const setShape = (page, s) => page.evaluate(v => { const e = document.getElementById('shape'); if (e) { e.value = v; e.dispatchEvent(new Event('change')); } }, s);

/* ── colour maths for the contrast gate ─────────────────────────────── */

const COLOR_UTILS = `
  function parseColor(c){
    const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const p = m[1].split(',').map(s => parseFloat(s.trim()));
    return { r:p[0], g:p[1], b:p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(fg, bg){
    const a = fg.a;
    return { r: fg.r*a + bg.r*(1-a), g: fg.g*a + bg.g*(1-a), b: fg.b*a + bg.b*(1-a), a: 1 };
  }
  function effectiveBg(el){
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement){
      const c = parseColor(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) { chain.push(c); if (c.a >= 0.999) break; }
    }
    if (!chain.length) return { r:255, g:255, b:255, a:1 };
    let base = chain[chain.length-1];
    if (base.a < 0.999) base = over(base, { r:255,g:255,b:255,a:1 });
    for (let i = chain.length - 2; i >= 0; i--) base = over(chain[i], base);
    return base;
  }
  function lum(c){
    const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b);
  }
  function contrast(a, b){
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
  }
`;

/* ── measurements (shared by gates and --selftest) ──────────────────── */

const measureClipping = page => page.evaluate(() => {
  const out = [];
  const sel = '.panel label, .panel .group-title, .panel .btn, .panel .panel-tabs button, .panel .step-val';
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (el.scrollWidth > el.clientWidth + 1) {
      const t = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      out.push(`${t || el.id || el.className} (${el.scrollWidth}px in ${el.clientWidth}px)`);
    }
  }
  return out;
});

/* Deduped by element CLASS, not text — 30 scene tiles with the same problem is
   one finding, not thirty. */
const measureContrast = page => page.evaluate(new Function(`${COLOR_UTILS}
  const worst = new Map();
  for (const el of document.querySelectorAll('.panel *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.15) continue;
    const fg = parseColor(cs.color); if (!fg) continue;
    const bg = effectiveBg(el);
    const ratio = contrast(over(fg, bg), bg);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
    if (ratio >= need) continue;
    const key = el.tagName.toLowerCase() + '.' + (String(el.className).split(' ')[0] || el.id || '?');
    const prev = worst.get(key);
    if (!prev || ratio < prev.ratio) worst.set(key, { ratio, need, count: (prev?.count || 0) + 1 });
    else prev.count++;
  }
  return [...worst.entries()].map(([k, v]) =>
    k + ' — ' + v.ratio.toFixed(2) + ':1, needs ' + v.need + ':1' + (v.count > 1 ? ' (×' + v.count + ')' : ''));
`));

const measureTargets = page => page.evaluate(() => {
  const MIN = 24; // WCAG 2.2 AA "Target Size (Minimum)"
  const worst = new Map();
  const sel = '.panel button, .panel select, .panel input, .panel .btn, .panel .step-btn, .panel .scene-thumb';
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.width >= MIN && r.height >= MIN) continue;
    const key = el.tagName.toLowerCase() + '.' + (String(el.className).split(' ')[0] || el.type || '?');
    const dim = `${Math.round(r.width)}×${Math.round(r.height)}px`;
    const prev = worst.get(key);
    if (!prev) worst.set(key, { dim, count: 1 }); else prev.count++;
  }
  return [...worst.entries()].map(([k, v]) => `${k} — ${v.dim}${v.count > 1 ? ` (×${v.count})` : ''}`);
});

const measureOverflow = page => page.evaluate(() => {
  const p = document.querySelector('.panel');
  return {
    doc: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    panel: p ? p.scrollWidth - p.clientWidth : 0,
  };
});

/* ── the gates ──────────────────────────────────────────────────────── */

async function gate1(browser) {                                   // fidelity (advisory)
  const { ctx, page } = await open(browser);
  const got = await page.evaluate(() => {
    const q = s => document.querySelector(s), cs = e => e ? getComputedStyle(e) : null, n = v => parseFloat(v) || 0;
    const panel = q('.panel'), row = q('.panel .row'), group = q('.panel .group'), label = q('.panel .row label');
    return {
      fontFamily: cs(panel)?.fontFamily || '', labelPx: n(cs(label)?.fontSize),
      rowCols: cs(row)?.gridTemplateColumns || '', rowGap: n(cs(row)?.columnGap),
      groupRadius: n(cs(group)?.borderRadius), panelBg: cs(panel)?.backgroundColor || '',
      labelColor: cs(label)?.color || '',
    };
  });
  const f = [];
  if (!/mono/i.test(got.fontFamily)) f.push(`font-family: "${got.fontFamily.slice(0, 44)}" → monospace`);
  if (got.labelPx !== SPEC.labelPx) f.push(`label size: ${got.labelPx}px → ${SPEC.labelPx}px`);
  if (got.rowGap !== SPEC.colGap) f.push(`row column-gap: ${got.rowGap}px → ${SPEC.colGap}px`);
  if (got.groupRadius !== SPEC.groupRadius) f.push(`group radius: ${got.groupRadius}px → ${SPEC.groupRadius}px`);
  f.push(`row columns: "${got.rowCols}" → "${SPEC.labelCol}px 1fr ${SPEC.valueCol}px"`);
  f.push(`panel bg: ${got.panelBg} → ${SPEC.colors.panel}`);
  f.push(`label colour: ${got.labelColor} → ${SPEC.colors.label}`);
  await ctx.close();
  record(1, 'Fidelity vs Direction A spec', f, true);
}

async function gate2(browser) {                                   // label clipping, 4 languages
  const f = [];
  for (const lang of LANGS) {
    const { ctx, page } = await open(browser, { lang });
    (await measureClipping(page)).forEach(c => f.push(`[${lang}] ${c}`));
    await ctx.close();
  }
  record(2, 'No label clipping in en/es/pt/fr', f);
}

async function gate3(browser) {
  const { ctx, page } = await open(browser);
  record(3, 'Text contrast meets WCAG AA', await measureContrast(page));
  await ctx.close();
}

async function gate4(browser) {
  const { ctx, page } = await open(browser, { width: 375, height: 800 });
  record(4, 'Touch targets ≥24px at 375px', await measureTargets(page));
  await ctx.close();
}

async function gate5(browser) {
  const f = [];
  for (const width of [320, 375, 768, 1280]) {
    const { ctx, page } = await open(browser, { width, height: 820 });
    const o = await measureOverflow(page);
    if (o.doc > 1) f.push(`${width}px — document scrolls ${o.doc}px sideways`);
    if (o.panel > 1) f.push(`${width}px — .panel scrolls ${o.panel}px sideways`);
    await ctx.close();
  }
  record(5, 'No horizontal overflow at 320/375/768/1280', f);
}

/* Catches the v1.52 class of bug: a condition that makes a control impossible
   to show in ANY state. Sweeps emission mode × room shape × simple/advanced. */
async function gate6(browser) {
  const { ctx, page } = await open(browser);
  const SEL = '.panel input, .panel select, .panel button';
  const all = await page.evaluate(s => [...document.querySelectorAll(s)].map(e => e.id).filter(Boolean), SEL);

  const seen = new Set();
  for (const shape of SHAPES) {
    await setShape(page, shape);
    for (const mode of MODES) {
      await setMode(page, mode);
      for (const simple of [false, true]) {
        await page.evaluate(v => document.body.classList.toggle('mode-simple', v), simple);
        await page.waitForTimeout(50);
        (await page.evaluate(s => [...document.querySelectorAll(s)]
          .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
          .map(e => e.id).filter(Boolean), SEL)).forEach(id => seen.add(id));
      }
    }
  }
  await ctx.close();
  const never = all.filter(id => !seen.has(id) && !REACHABILITY_EXEMPT[id]);
  const stale = Object.keys(REACHABILITY_EXEMPT).filter(id => seen.has(id) || !all.includes(id));
  record(6, 'Every control reachable in some state', [
    ...never.map(id => `#${id} — never visible in any mode/shape`),
    ...stale.map(id => `#${id} — exemption no longer needed, remove it`),
  ]);
}

/* Undo + autosave both piggyback on ONE delegated listener on .panel. A control
   that doesn't reach it is silently un-undoable.
   Re-queries per element: dispatching on a colour swatch rebuilds that list,
   detaching later nodes — iterating a stale array reports phantom failures. */
async function gate7(browser) {
  const { ctx, page } = await open(browser);
  const f = await page.evaluate(() => {
    const panel = document.querySelector('.panel');
    if (!panel) return ['no .panel found'];
    const out = [];
    let heard = 0;
    const spy = () => { heard++; };
    panel.addEventListener('input', spy, true);
    panel.addEventListener('change', spy, true);

    const list = [...document.querySelectorAll('.panel input, .panel select')];
    list.forEach((e, i) => e.setAttribute('data-gate-idx', String(i)));
    let skipped = 0;
    for (let i = 0; i < list.length; i++) {
      const el = document.querySelector(`[data-gate-idx="${i}"]`);
      if (!el || !el.isConnected) { skipped++; continue; }   // rebuilt away by an earlier dispatch
      const before = heard;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (heard === before) out.push(`${el.id || el.className || el.tagName} — events never reach .panel`);
    }
    document.querySelectorAll('[data-gate-idx]').forEach(e => e.removeAttribute('data-gate-idx'));
    panel.removeEventListener('input', spy, true);
    panel.removeEventListener('change', spy, true);

    const outside = [...document.querySelectorAll('input, select, button')]
      .filter(e => !panel.contains(e))
      .filter(e => !e.closest('.modal-overlay, #welcomeModal, #splashOverlay, .splash'))
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
      .map(e => `#${e.id || e.className} — outside .panel, no undo/autosave`);
    return out.concat(outside);
  });
  await ctx.close();
  record(7, 'Undo/autosave delegation reaches every control', f);
}

async function gate8() {
  const r = spawnSync(process.execPath, [join(HERE, 'i18n-audit.mjs')], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  record(8, 'i18n audit', (r.status === 0 && /PASS/.test(out)) ? [] : [out.trim().split('\n').slice(-6).join(' | ')]);
}

async function gate9(browser) {
  const { ctx, page, errors } = await open(browser);
  for (const mode of MODES) {
    await setMode(page, mode);
    await page.waitForTimeout(200);
    await page.evaluate(() => { let t = performance.now(); for (let i = 0; i < 12; i++) { t += 16.7; Voidulator.step(t); } });
  }
  const glErr = await page.evaluate(() => {
    const gl = document.getElementById('gl').getContext('webgl2');
    const e = gl.getError();
    return e === 0 ? null : 'gl.getError() = ' + e;
  });
  const f = [...new Set(errors)];
  if (glErr) f.push(glErr);
  await ctx.close();
  record(9, 'No console or GL errors across all modes', f);
}

/* ── selftest: inject a fault, demand the gate notices ───────────────── */

async function selftest(browser) {
  const checks = [
    {
      gate: 2, what: 'a label too narrow for its text',
      async run() {
        const { ctx, page } = await open(browser);
        const before = (await measureClipping(page)).length;
        await page.evaluate(() => {
          const l = document.querySelector('.panel label');
          l.textContent = 'A deliberately overlong label that cannot possibly fit';
          l.style.cssText = 'width:30px;white-space:nowrap;overflow:hidden;display:block';
        });
        const after = (await measureClipping(page)).length;
        await ctx.close();
        return after > before;
      },
    },
    {
      gate: 3, what: 'text set to near-background colour',
      async run() {
        const { ctx, page } = await open(browser);
        const before = (await measureContrast(page)).length;
        await page.evaluate(() => {
          const l = document.querySelector('.panel label');
          l.className = 'gatefault';
          l.style.color = getComputedStyle(document.querySelector('.panel')).backgroundColor;
        });
        const after = (await measureContrast(page)).length;
        await ctx.close();
        return after > before;
      },
    },
    {
      gate: 4, what: 'a button shrunk to 10px',
      async run() {
        const { ctx, page } = await open(browser, { width: 375, height: 800 });
        const before = (await measureTargets(page)).length;
        await page.evaluate(() => {
          const b = document.createElement('button');
          b.className = 'gatefault'; b.textContent = 'x';
          b.style.cssText = 'width:10px;height:10px;padding:0;display:block';
          document.querySelector('.panel').appendChild(b);
        });
        const after = (await measureTargets(page)).length;
        await ctx.close();
        return after > before;
      },
    },
    {
      gate: 5, what: 'an over-wide element inside .panel',
      async run() {
        const { ctx, page } = await open(browser, { width: 375, height: 820 });
        await page.evaluate(() => {
          const d = document.createElement('div');
          d.style.cssText = 'width:2000px;height:4px';
          document.querySelector('.panel').appendChild(d);
        });
        const o = await measureOverflow(page);
        await ctx.close();
        return o.panel > 1;
      },
    },
  ];

  console.log('\n══ SELFTEST ' + '═'.repeat(56));
  let bad = 0;
  for (const c of checks) {
    const caught = await c.run();
    if (!caught) bad++;
    console.log(`${caught ? 'CAUGHT ' : 'MISSED '} gate ${c.gate} — ${c.what}`);
  }
  console.log('\n' + '═'.repeat(68));
  console.log(bad ? `${bad} gate(s) slept through an injected fault.` : 'Every injected fault was caught.');
  return bad;
}

/* ── run ────────────────────────────────────────────────────────────── */

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let selftestFailures = 0;
try {
  if (SELFTEST) {
    selftestFailures = await selftest(browser);
  } else {
    if (want(1)) await gate1(browser);
    if (want(2)) await gate2(browser);
    if (want(3)) await gate3(browser);
    if (want(4)) await gate4(browser);
    if (want(5)) await gate5(browser);
    if (want(6)) await gate6(browser);
    if (want(7)) await gate7(browser);
    if (want(8)) await gate8();
    if (want(9)) await gate9(browser);
  }
} finally {
  await browser.close();
}

if (SELFTEST) process.exit(selftestFailures ? 1 : 0);

let failed = 0;
console.log('\n══ UI GATES ' + '═'.repeat(56));
for (const r of results.sort((a, b) => a.n - b.n)) {
  const bad = r.findings.length > 0;
  if (bad && !r.advisory) failed++;
  const tag = r.advisory ? (bad ? 'NOTE' : 'PASS') : (bad ? 'FAIL' : 'PASS');
  console.log(`\n${tag}  ${r.n}. ${r.name}${bad ? `  (${r.findings.length})` : ''}`);
  r.findings.slice(0, 24).forEach(x => console.log('        · ' + x));
  if (r.findings.length > 24) console.log(`        … ${r.findings.length - 24} more`);
}
console.log('\n' + '═'.repeat(68));
console.log(failed ? `${failed} enforced gate(s) failing.` : 'All enforced gates pass.');
process.exit(failed ? 1 : 0);
