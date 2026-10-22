// Verification for the particle spawn-spread work: determinism at zero,
// emergent divergence just above zero, energy conservation under the new
// smaller wall epsilon, containment, and persistence round-trips.
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.REPO || root;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const data = await readFile(join(REPO, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(8791, r));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
await page.addInitScript(() => { try { localStorage.clear(); } catch {} });
await page.goto('http://localhost:8791/');
await page.waitForFunction(() => !!window.Voidulator);
await page.waitForTimeout(800);

const results = [];
const ok = (name, pass, detail) => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

// Shared setup helper, run inside the page.
await page.evaluate(() => {
  window.__setup = (opts) => {
    const V = window.Voidulator, S = V.S;
    const shapeSel = document.getElementById('shape');
    if (opts.shape && shapeSel.value !== opts.shape) {
      shapeSel.value = opts.shape;
      shapeSel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const bendEl = document.getElementById('wallBend');
    if (bendEl && opts.bend !== undefined) {
      bendEl.value = opts.bend;
      bendEl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    S.particles.enabled = true;
    Object.assign(S.particles, opts.particles || {});
    V.clearLiveParticles();
  };
  // Advance the physics only (no rendering) at a fixed dt, so the result is
  // reproducible and not tied to real frame timing.
  window.__sim = (seconds, dt = 1 / 60) => {
    const n = Math.round(seconds / dt);
    for (let i = 0; i < n; i++) window.Voidulator.advanceParticles(dt);
  };
  window.__spread = () => {
    const ps = window.Voidulator.liveParticles;
    let max = 0;
    for (let i = 0; i < ps.length; i++)
      for (let j = i + 1; j < ps.length; j++)
        max = Math.max(max, Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y));
    return max;
  };
  window.__center = () => {
    const S = window.Voidulator.S;
    return S.isCircle ? { x: S.circle.cx, y: S.circle.cy, R: S.circle.R } : null;
  };
});

// ---- 1. Exact determinism at zero spread / zero cone / single speed ----
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'circle', particles: { spawnSpread: 0, spawnCone: 0, spawnAngle: 30, spawnSpeed: [90, 90], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 3000 } });
    const c = __center();
    Voidulator.spawnParticleBurst(c.x, c.y - 40, 200, 0);
    const at0 = __spread();
    __sim(60);
    return { at0, at60: __spread(), n: Voidulator.liveParticles.length };
  });
  ok('zero spread → 200 particles stay literally one point after 60 s',
    r.at0 === 0 && r.at60 === 0 && r.n === 200,
    `n=${r.n}, spread t=0: ${r.at0}, t=60s: ${r.at60}`);
}

// ---- 2. Divergence just above zero is emergent, and shape-dependent ----
// Metric is the swarm's RMS radius about its own centroid, not the max
// pairwise distance: the latter saturates at the room's diameter, after
// which it wanders instead of growing, so it cannot say anything about a
// run long enough to actually spread out.
const divergence = {};
for (const [label, opts] of [
  ['circle', { shape: 'circle', bend: 0 }],
  ['ellipse', { shape: 'ellipse', bend: 0 }],
  ['hexagon', { shape: 'regular-6', bend: 0 }],
  ['bent hexagon', { shape: 'regular-6', bend: 0.6 }],
  ['blob', { shape: 'blob', bend: 0 }]
]) {
  divergence[label] = await page.evaluate((o) => {
    __setup({ ...o, particles: { spawnSpread: 0, spawnCone: 0.2, spawnAngle: 30, spawnSpeed: [90, 90], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 3000 } });
    const S = Voidulator.S;
    const b = S.isCircle
      ? { x: S.circle.cx, y: S.circle.cy - S.circle.R * 0.35 }
      : (() => { let sx = 0, sy = 0; for (const v of S.vertices) { sx += v.x; sy += v.y; } let r = 0; for (const v of S.vertices) r = Math.max(r, Math.hypot(v.x - sx / S.vertices.length, v.y - sy / S.vertices.length)); return { x: sx / S.vertices.length, y: sy / S.vertices.length - r * 0.35 }; })();
    Voidulator.spawnParticleBurst(b.x, b.y, 60, 0);
    const cloud = () => {
      const ps = Voidulator.liveParticles;
      let mx = 0, my = 0;
      for (const p of ps) { mx += p.x; my += p.y; }
      mx /= ps.length; my /= ps.length;
      let s = 0;
      for (const p of ps) s += (p.x - mx) ** 2 + (p.y - my) ** 2;
      return Math.sqrt(s / ps.length);
    };
    const out = { t0: +cloud().toFixed(4) };
    // Time (s) for the burst to visibly stop being one dot
    let tTo5 = null, elapsed = 0;
    for (let i = 0; i < 120 * 10; i++) {
      __sim(0.1); elapsed += 0.1;
      if (tTo5 === null && cloud() >= 5) { tTo5 = +elapsed.toFixed(1); break; }
    }
    out.secondsToVisiblySplit = tTo5;
    __sim(Math.max(0, 60 - elapsed));
    out.t60 = +cloud().toFixed(1);
    return out;
  }, opts);
  console.log(`      divergence ${label.padEnd(13)}`, JSON.stringify(divergence[label]));
}
ok('near-zero cone starts as one point in every room shape',
  Object.values(divergence).every(d => d.t0 === 0),
  Object.entries(divergence).map(([k, d]) => `${k}:${d.t0}`).join(' '));
// These two encode what the panel hint actually promises the user, so a
// change that made the hint wrong would fail here rather than silently.
ok('bent walls separate a near-identical burst far faster than flat ones',
  divergence['bent hexagon'].t60 > divergence['hexagon'].t60 * 5 &&
  divergence['bent hexagon'].t60 > divergence['circle'].t60 * 5,
  `bent ${divergence['bent hexagon'].t60}px vs hexagon ${divergence['hexagon'].t60}px vs circle ${divergence['circle'].t60}px`);
ok('a plain circle is integrable: 0.2° barely separates them at all',
  divergence['circle'].t60 < 5 && divergence['ellipse'].t60 > divergence['circle'].t60,
  `circle ${divergence['circle'].t60}px, ellipse ${divergence['ellipse'].t60}px after 60 s`);

// ---- 3. Infinite bounces: energy conserved over a long run ----
for (const shape of ['circle', 'regular-3', 'regular-6', 'blob', 'ellipse']) {
  const r = await page.evaluate((sh) => {
    __setup({ shape: sh, bend: 0, particles: { spawnSpread: 0, spawnCone: 0, spawnAngle: 17, spawnSpeed: [120, 120], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 100 } });
    const S = Voidulator.S;
    const c = S.isCircle ? { x: S.circle.cx, y: S.circle.cy }
      : (() => { let sx = 0, sy = 0; for (const v of S.vertices) { sx += v.x; sy += v.y; } return { x: sx / S.vertices.length, y: sy / S.vertices.length }; })();
    Voidulator.spawnParticleBurst(c.x, c.y, 1, 0);
    const p = Voidulator.liveParticles[0];
    const v0 = Math.hypot(p.vx, p.vy);
    let maxR = 0;
    for (let i = 0; i < 300 * 60; i++) {
      Voidulator.advanceParticles(1 / 60);
      maxR = Math.max(maxR, Math.hypot(p.x - c.x, p.y - c.y));
    }
    // Room's own extent, for a containment sanity bound
    let roomR = S.isCircle ? S.circle.R : 0;
    if (!S.isCircle) for (const v of S.vertices) roomR = Math.max(roomR, Math.hypot(v.x - c.x, v.y - c.y));
    return { v0, v1: Math.hypot(p.vx, p.vy), maxR, roomR };
  }, shape);
  const drift = Math.abs(r.v1 - r.v0) / r.v0;
  ok(`${shape}: speed conserved over 300 simulated seconds`, drift < 1e-9,
    `v ${r.v0.toFixed(6)} → ${r.v1.toFixed(6)} (drift ${drift.toExponential(2)})`);
  ok(`${shape}: stayed inside the room`, r.maxR <= r.roomR + 1.5,
    `maxR ${r.maxR.toFixed(1)} vs room extent ${r.roomR.toFixed(1)}`);
}

// ---- 4. Containment stress at high speed with the smaller wall epsilon ----
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'regular-3', bend: 0, particles: { spawnSpread: 0, spawnCone: 360, spawnSpeed: [5000, 5200], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 200 } });
    const S = Voidulator.S;
    let sx = 0, sy = 0; for (const v of S.vertices) { sx += v.x; sy += v.y; }
    const c = { x: sx / S.vertices.length, y: sy / S.vertices.length };
    let roomR = 0; for (const v of S.vertices) roomR = Math.max(roomR, Math.hypot(v.x - c.x, v.y - c.y));
    Voidulator.spawnParticleBurst(c.x, c.y, 50, 0);
    let maxR = 0;
    for (let i = 0; i < 30 * 60; i++) {
      Voidulator.advanceParticles(1 / 60);
      for (const p of Voidulator.liveParticles) maxR = Math.max(maxR, Math.hypot(p.x - c.x, p.y - c.y));
    }
    return { maxR, roomR, speeds: Voidulator.liveParticles.map(p => Math.hypot(p.vx, p.vy)) };
  });
  ok('50 particles at ~5000 px/s stay contained for 30 s (sharp triangle)',
    r.maxR <= r.roomR + 1.5, `maxR ${r.maxR.toFixed(1)} vs ${r.roomR.toFixed(1)}`);
  ok('…and none lost or gained energy', r.speeds.every(v => v >= 4999 && v <= 5201),
    `speed range ${Math.min(...r.speeds).toFixed(1)}–${Math.max(...r.speeds).toFixed(1)}`);
}

// ---- 5. Persistence: scene + preset round-trip of the new fields ----
{
  const r = await page.evaluate(() => {
    const S = Voidulator.S;
    Object.assign(S.particles, { enabled: true, spawnSpread: 0.4, spawnAngle: 123.5, spawnCone: 7.5 });
    const scene = JSON.parse(JSON.stringify(Voidulator.captureScene()));
    const preset = JSON.parse(JSON.stringify(Voidulator.currentPreset()));
    Object.assign(S.particles, { spawnSpread: 33, spawnAngle: 3, spawnCone: 300 });
    Voidulator.applyPreset(preset);
    const afterPreset = { sp: S.particles.spawnSpread, an: S.particles.spawnAngle, co: S.particles.spawnCone };
    Object.assign(S.particles, { spawnSpread: 33, spawnAngle: 3, spawnCone: 300 });
    // captureScene()-shaped restore is what scenes, undo and the gallery use
    Voidulator.applyPreset({ ...preset, particles: scene.particles });
    const afterScene = { sp: S.particles.spawnSpread, an: S.particles.spawnAngle, co: S.particles.spawnCone };
    // An OLD payload with no spawn* fields at all must fall back to the
    // defaults, not keep whatever is live (the v1.49 bug class).
    const old = JSON.parse(JSON.stringify(preset));
    delete old.particles.spawnSpread; delete old.particles.spawnAngle; delete old.particles.spawnCone;
    Object.assign(S.particles, { spawnSpread: 33, spawnAngle: 3, spawnCone: 300 });
    Voidulator.applyPreset(old);
    const afterOld = { sp: S.particles.spawnSpread, an: S.particles.spawnAngle, co: S.particles.spawnCone };
    return { afterPreset, afterScene, afterOld };
  });
  const want = { sp: 0.4, an: 123.5, co: 7.5 };
  ok('preset export/import round-trips the new fields', JSON.stringify(r.afterPreset) === JSON.stringify(want), JSON.stringify(r.afterPreset));
  ok('scene capture/restore round-trips the new fields', JSON.stringify(r.afterScene) === JSON.stringify(want), JSON.stringify(r.afterScene));
  ok('a payload predating the fields falls back to defaults, not live state',
    JSON.stringify(r.afterOld) === JSON.stringify({ sp: 3, an: 0, co: 360 }), JSON.stringify(r.afterOld));
}

// ---- 6. Clickable label resets (were entirely dead for this group) ----
{
  const r = await page.evaluate(async () => {
    const S = Voidulator.S;
    const ids = ['particlesSize', 'particlesMaxCount', 'particlesGravityStrength', 'particlesBounciness',
      'particlesFriction', 'particlesSpawnRate', 'particlesSpawnSpread', 'particlesSpawnAngle',
      'particlesSpawnCone', 'particlesBurstCount', 'particlesGroups'];
    const keys = { particlesSize: 'size', particlesMaxCount: 'maxCount', particlesGravityStrength: 'gravityStrength', particlesBounciness: 'bounciness', particlesFriction: 'friction', particlesSpawnRate: 'spawnRate', particlesSpawnSpread: 'spawnSpread', particlesSpawnAngle: 'spawnAngle', particlesSpawnCone: 'spawnCone', particlesBurstCount: 'burstCount', particlesGroups: 'groups' };
    const expect = { size: 6, maxCount: 600, gravityStrength: 500, bounciness: 0.8, friction: 0.15, spawnRate: 0, spawnSpread: 3, spawnAngle: 0, spawnCone: 360, burstCount: 60, groups: 3 };
    const bad = [];
    for (const id of ids) {
      const input = document.getElementById(id);
      const lbl = document.querySelector(`label.clickable[data-reset="${id}"]`);
      if (!input || !lbl) { bad.push(id + ':missing'); continue; }
      // Move it off the default first, then click the label
      input.value = input.max;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      lbl.click();
      if (S.particles[keys[id]] !== expect[keys[id]]) bad.push(`${id}: got ${S.particles[keys[id]]} want ${expect[keys[id]]}`);
    }
    return bad;
  });
  ok('every clickable particle label resets to its factory default', r.length === 0, r.join('; '));
}

// ---- 7. Renders clean ----
{
  const r = await page.evaluate(async () => {
    __setup({ shape: 'circle', particles: { spawnSpread: 0.2, spawnCone: 1, spawnSpeed: [40, 40], gravityMode: 'off', friction: 0, bounciness: 1 } });
    const c = __center();
    Voidulator.spawnParticleBurst(c.x, c.y, 300, 0);
    let t = performance.now();
    for (let i = 0; i < 90; i++) { t += 16.7; Voidulator.step(t); }
    const gl = document.getElementById('gl').getContext('webgl2');
    const cv = document.getElementById('gl');
    const px = new Uint8Array(cv.width * cv.height * 4);
    gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let lit = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 24) lit++;
    return { glError: gl.getError(), lit };
  });
  ok('renders with no GL error and non-black output', r.glError === 0 && r.lit > 0, `glError=${r.glError}, litPixels=${r.lit}`);
}

// ---- 8. Particles collide as discs, not points ----
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'circle', particles: { size: 24, spawnSpread: 0, spawnCone: 360, spawnSpeed: [200, 200], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 200 } });
    const c = __center();
    Voidulator.spawnParticleBurst(c.x, c.y, 40, 0);
    let worst = -Infinity;
    for (let i = 0; i < 20 * 60; i++) {
      Voidulator.advanceParticles(1 / 60);
      for (const p of Voidulator.liveParticles)
        worst = Math.max(worst, Math.hypot(p.x - c.x, p.y - c.y) + 24 - c.R);
    }
    return { pxPastWall: +worst.toFixed(2) };
  });
  ok('a size-24 shape never overlaps the wall (disc collider, not a point)',
    r.pxPastWall <= 0.1, `worst edge overshoot ${r.pxPastWall}px`);
}

// ---- 9. Restitution damps the normal component only ----
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'circle', particles: { size: 1, spawnSpread: 0, spawnCone: 0, spawnSpeed: [300, 300], gravityMode: 'off', friction: 0, bounciness: 0.5, maxCount: 10 } });
    const c = __center();
    // One head-on hit (straight at the wall) vs one grazing skim along it.
    const shot = (angDeg, fromR) => {
      Voidulator.clearLiveParticles();
      const a = angDeg * Math.PI / 180;
      Voidulator.spawnParticleBurst(c.x, c.y + fromR, 1, 0);
      const p = Voidulator.liveParticles[0];
      p.x = c.x; p.y = c.y + fromR;
      p.vx = Math.cos(a) * 300; p.vy = Math.sin(a) * 300;
      const before = Math.hypot(p.vx, p.vy);
      for (let i = 0; i < 120; i++) Voidulator.advanceParticles(1 / 60);
      return +(Math.hypot(p.vx, p.vy) / before).toFixed(3);
    };
    return { headOn: shot(90, c.R * 0.5), grazing: shot(2, c.R * 0.985) };
  });
  ok('a grazing skim keeps far more speed than a head-on hit at bounciness 0.5',
    r.headOn <= 0.55 && r.grazing > 0.9,
    `head-on kept ${r.headOn}, grazing kept ${r.grazing}`);
}

// ---- 10. Max particles caps a pool that is already live ----
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'circle', particles: { size: 4, maxCount: 3000, spawnSpread: 10, spawnCone: 360, spawnSpeed: [80, 120], gravityMode: 'off', friction: 0, bounciness: 1 } });
    const c = __center();
    Voidulator.spawnParticleBurst(c.x, c.y, 500, 0);
    const before = Voidulator.liveParticles.length;
    Voidulator.S.particles.maxCount = 40;
    Voidulator.advanceParticles(1 / 60);
    return { before, after: Voidulator.liveParticles.length };
  });
  ok('lowering Max particles trims a pool that is already in flight',
    r.before === 500 && r.after === 40, `${r.before} → ${r.after}`);
}

// ---- 11. Dense-polyline rooms stay affordable ----
// Guards the inradius early-out + per-particle hit cache. Before them this
// was 71ms of physics a frame; a regression would put the O(vertices) scan
// back on every particle every frame. Generous threshold — this only has to
// catch "the optimisation is gone", not measure it.
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'blob', particles: { size: 4, maxCount: 3000, spawnSpread: 30, spawnCone: 360, spawnSpeed: [150, 250], gravityMode: 'off', friction: 0, bounciness: 1 } });
    const S = Voidulator.S;
    let sx = 0, sy = 0; for (const v of S.vertices) { sx += v.x; sy += v.y; }
    Voidulator.spawnParticleBurst(sx / S.vertices.length, sy / S.vertices.length, 2000, 0);
    for (let i = 0; i < 30; i++) Voidulator.advanceParticles(1 / 60);
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) Voidulator.advanceParticles(1 / 60);
    return { verts: S.vertices.length, msPerFrame: +((performance.now() - t0) / 60).toFixed(2) };
  });
  ok('2000 particles in a 720-point blob room cost <8ms of physics a frame',
    r.msPerFrame < 8, `${r.msPerFrame}ms/frame over ${r.verts} boundary points`);
}

// ---- 12. Glow stays a glow, not a smudge stuck to each ball ----
// Particles run bloom at half res, not the quarter res beams use: at quarter
// res a texel is 4 device px and the 9-tap blur steps 1.5 texels apart, so an
// 8px ball wore a faceted 24px aura that reads as a shadow attached to it.
{
  const r = await page.evaluate(() => {
    __setup({ shape: 'circle', particles: { size: 8, spawnSpread: 0, spawnCone: 360, spawnSpeed: [0, 0], gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 10, groups: 1 } });
    Voidulator.S.particles.palette = [{ h: 0, s: 100, l: 50 }];
    Voidulator.S.trails.enabled = false;
    Voidulator.S.bloom.enabled = true; Voidulator.S.bloom.strength = 0.85; Voidulator.S.bloom.threshold = 0.3;
    const c = __center();
    Voidulator.spawnParticleBurst(c.x, c.y, 1, 0);
    const p = Voidulator.liveParticles[0];
    p.x = c.x; p.y = c.y; p.vx = 0; p.vy = 0;
    let t = performance.now();
    for (let i = 0; i < 30; i++) { t += 1000 / 60; Voidulator.step(t); }
    const cv = document.getElementById('gl');
    const gl = cv.getContext('webgl2');
    const px = new Uint8Array(cv.width * cv.height * 4);
    gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const bx = Math.round(p.x * Voidulator.S.dpr);
    const by = cv.height - 1 - Math.round(p.y * Voidulator.S.dpr);   // readPixels is bottom-up
    let reach = 0;
    for (let d = 1; d < 120; d++) {
      const i = (by * cv.width + (bx + d)) * 4;
      if (px[i] + px[i + 1] + px[i + 2] > 6) reach = d;
    }
    return { reach, ballRadiusPx: Math.round(8 * Voidulator.S.dpr) };
  });
  ok('the glow hugs the ball instead of trailing a wide faceted aura',
    r.reach > 0 && r.reach < 18, `lit out to ${r.reach}px from an ${r.ballRadiusPx}px ball (was 24px)`);
}

// ---- 13. Point shape, and every shape at the minimum size ----
{
  const r = await page.evaluate(() => {
    const S = Voidulator.S, cv = document.getElementById('gl'), gl = cv.getContext('webgl2');
    const litCount = () => {
      const px = new Uint8Array(cv.width * cv.height * 4);
      gl.readPixels(0, 0, cv.width, cv.height, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let n = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] + px[i + 1] + px[i + 2] > 20) n++;
      return n;
    };
    // 60 shapes laid out on deliberately NON-integer coordinates: a shape too
    // small to rasterise reliably shows up as a count below 60, because
    // whether it lights a pixel depends on its sub-pixel position.
    const grid = (shape, size) => {
      __setup({ shape: 'circle', particles: { shape, size, gravityMode: 'off', friction: 0, bounciness: 1, maxCount: 200, groups: 1, spawnSpread: 0, spawnCone: 360, spawnSpeed: [0, 0] } });
      S.particles.palette = [{ h: 0, s: 100, l: 50 }];
      S.trails.enabled = false; S.bloom.enabled = false;
      const c = __center();
      Voidulator.spawnParticleBurst(c.x, c.y, 60, 0);
      Voidulator.liveParticles.forEach((p, i) => {
        p.x = c.x - 100 + (i % 20) * 10 + (i % 7) * 0.13;
        p.y = c.y + Math.floor(i / 20) * 10 + (i % 5) * 0.17;
        p.vx = 0; p.vy = 0;
      });
      let t = performance.now();
      for (let i = 0; i < 3; i++) { t += 1000 / 60; Voidulator.step(t); }
      return litCount();
    };
    const out = { min: {}, mid: {} };
    for (const sh of ['point', 'circle', 'triangle', 'square', 'pentagon', 'hexagon']) {
      out.min[sh] = grid(sh, 0.5);
      out.mid[sh] = grid(sh, 3);
    }
    out.glError = gl.getError();
    return out;
  });
  ok('every shape at the minimum size draws exactly one pixel per particle, none dropped',
    Object.values(r.min).every(v => v === 60), JSON.stringify(r.min));
  ok('Point scales with the Size slider like the other shapes',
    r.mid.point > r.min.point * 8, `${r.min.point} lit at size 0.5 → ${r.mid.point} at size 3`);
  ok('the polygon shapes are still polygons above the point threshold',
    r.mid.triangle < r.mid.hexagon && r.mid.hexagon < r.mid.circle && r.glError === 0,
    `triangle ${r.mid.triangle} < hexagon ${r.mid.hexagon} < circle ${r.mid.circle}`);
}

ok('no console or page errors during the run', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
server.close();
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
