// void-sim.js — lightweight 2D laser-room renderer used behind every mock.
// initVoidSim(canvas, opts) -> { stop() }. Cheap enough to run several at once:
// no shadowBlur, glow faked with a wide soft stroke + 'lighter' compositing,
// trails faked with a low-alpha black fill instead of a hard clear.

(function () {
  function initVoidSim(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d', { alpha: false });
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    let raf = 0, t0 = performance.now(), running = true;

    const pal = opts.palette || ['#0b6e4f','#22d3a6','#6ee7ff','#a78bfa'];
    const sides = opts.sides == null ? 6 : opts.sides; // 0 => circle
    const beamCount = opts.beams || 6;
    const maxBounce = opts.bounces || 16;
    const trail = opts.trail == null ? 0.12 : opts.trail; // lower = longer trails
    const speed = opts.speed == null ? 1 : opts.speed;

    function hexToRgb(h) {
      h = h.replace('#', '');
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function sample(p) {
      const n = pal.length - 1, x = Math.max(0, Math.min(0.9999, p)) * n;
      const i = Math.floor(x), f = x - i;
      const a = hexToRgb(pal[i]), b = hexToRgb(pal[Math.min(n, i + 1)]);
      return [lerp(a[0],b[0],f), lerp(a[1],b[1],f), lerp(a[2],b[2],f)];
    }

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H / 2;
      R = Math.min(W, H) * 0.42;
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, W, H);
    }

    function poly(rot) {
      const n = sides === 0 ? 64 : sides;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = rot + (i / n) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
      }
      return pts;
    }

    function hitWall(ox, oy, dx, dy, pts) {
      let best = Infinity, nx = 0, ny = 0;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const ex = b[0] - a[0], ey = b[1] - a[1];
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-6) continue;
        const t = ((a[0] - ox) * ey - (a[1] - oy) * ex) / den;
        const s = ((a[0] - ox) * dy - (a[1] - oy) * dx) / den;
        if (t > 0.01 && s >= 0 && s <= 1 && t < best) {
          best = t;
          const len = Math.hypot(ex, ey) || 1;
          nx = ey / len; ny = -ex / len;
        }
      }
      return best === Infinity ? null : { t: best, nx, ny };
    }

    let rings = [];
    function frame(now) {
      if (!running) return;
      const tt = (now - t0) / 1000;

      // self-heal a mount-time race: if the first resize() ran before layout
      // resolved (W/H came back ~1px), re-measure once the box has real size.
      if ((W <= 1 || H <= 1)) {
        const r = canvas.getBoundingClientRect();
        if (r.width > 1 && r.height > 1) resize();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(5,6,10,' + trail + ')';
      ctx.fillRect(0, 0, W, H);

      const rot = tt * 0.06 * speed;
      const pts = poly(rot);

      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(120,150,200,0.10)';
      ctx.stroke();

      if (opts.beamsOn !== false) {
      const emitters = opts.emitters || 1;
      for (let e = 0; e < emitters; e++) {
        const ea = (tt * 0.18 * speed) + e * (Math.PI * 2 / emitters);
        const ox = cx + Math.cos(ea) * R * 0.28;
        const oy = cy + Math.sin(ea) * R * 0.28;
        const baseAng = tt * 0.25 * speed + e * 1.7;
        const spread = (opts.spread || 0.5);

        for (let b = 0; b < beamCount; b++) {
          const frac = beamCount === 1 ? 0.5 : b / (beamCount - 1);
          const ang = baseAng + (frac - 0.5) * spread;
          let x = ox, y = oy, dx = Math.cos(ang), dy = Math.sin(ang);
          const col = sample(frac * 0.85 + 0.05 + 0.1 * Math.sin(tt * 0.4 + e));
          const pulse = 0.65 + 0.35 * Math.abs(Math.sin(tt * 2.0 + b));
          let bright = 1;

          for (let k = 0; k < maxBounce; k++) {
            const h = hitWall(x, y, dx, dy, pts);
            if (!h) break;
            const hx = x + dx * h.t, hy = y + dy * h.t;
            const a = bright * pulse;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgba(' + (col[0]|0) + ',' + (col[1]|0) + ',' + (col[2]|0) + ',' + (a * 0.10) + ')';
            ctx.lineWidth = 6;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
            ctx.strokeStyle = 'rgba(' + Math.min(255,col[0]+80|0) + ',' + Math.min(255,col[1]+80|0) + ',' + Math.min(255,col[2]+80|0) + ',' + (a * 0.9) + ')';
            ctx.lineWidth = 1.1;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(hx, hy); ctx.stroke();
            const dot = dx * h.nx + dy * h.ny;
            dx = dx - 2 * dot * h.nx; dy = dy - 2 * dot * h.ny;
            x = hx; y = hy;
            bright *= 0.82;
            if (bright < 0.05) break;
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(ox, oy, 2.2, 0, 7); ctx.fill();
      }
      }

      if (opts.rings !== false) {
        const wavesOnly = opts.beamsOn === false;
        const spawnP = wavesOnly ? 0.14 : 0.03;
        if (Math.random() < spawnP) rings.push({ x: cx + (Math.random()-0.5)*R*0.6, y: cy + (Math.random()-0.5)*R*0.6, r: 2, life: 1, hue: Math.random() });
        rings = rings.filter(rg => rg.life > 0);
        rings.forEach(rg => {
          rg.r += 1.4 * speed; rg.life -= wavesOnly ? 0.007 : 0.012;
          const c = sample(rg.hue);
          const aMul = wavesOnly ? 0.85 : 0.5;
          ctx.strokeStyle = 'rgba(' + (c[0]|0) + ',' + (c[1]|0) + ',' + (c[2]|0) + ',' + (rg.life * aMul) + ')';
          ctx.lineWidth = wavesOnly ? 2 : 1.2;
          ctx.beginPath(); ctx.arc(rg.x, rg.y, rg.r, 0, 7); ctx.stroke();
        });
        if (rings.length > 60) rings = rings.slice(-60);
      }

      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    frame(performance.now()); // paint one frame immediately (rAF may be throttled when backgrounded)

    return { stop() { running = false; cancelAnimationFrame(raf); ro.disconnect(); } };
  }

  window.initVoidSim = initVoidSim;
})();
