// Voidulator smoke test — loads the app in headless Chromium, drives frames
// via the Voidulator.step() debug API, and fails on console errors, GL
// errors, or a (nearly) black canvas. Run: node tests/smoke.mjs
import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

const server = createServer(async (req, res) => {
  try {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const data = await readFile(join(root, p));
    res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(r => server.listen(8765, r));

// SwiftShader gives headless machines a software WebGL2 implementation
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto('http://localhost:8765/');
await page.waitForFunction(() => window.Voidulator, null, { timeout: 15000 });

const result = await page.evaluate(() => {
  const V = window.Voidulator;
  let t = performance.now();
  const drive = n => { for (let i = 0; i < n; i++) { t += 16.7; V.step(t); } };

  // Plain render
  drive(30);
  const gl = document.getElementById('gl');
  const ctx = gl.getContext('webgl2');
  const countLit = () => {
    const buf = new Uint8Array(gl.width * gl.height * 4);
    ctx.readPixels(0, 0, gl.width, gl.height, ctx.RGBA, ctx.UNSIGNED_BYTE, buf);
    let lit = 0;
    for (let i = 0; i < buf.length; i += 4) if (buf[i] + buf[i + 1] + buf[i + 2] > 10) lit++;
    return lit;
  };
  const litPlain = countLit();

  // Exercise the major render-path combinations
  V.S.trails.enabled = true; drive(10);
  V.S.bloom.enabled = true; V.S.phosphor.enabled = true; drive(10);
  const litKitchen = countLit();
  V.S.trails.enabled = false; V.S.phosphor.enabled = false;

  // Exercise every room shape
  const shapes = ['regular-3', 'regular-6', 'random-5', 'blob', 'ellipse', 'parabolic', 'circle'];
  const sel = document.getElementById('shape');
  const shapeLit = {};
  for (const s of shapes) {
    sel.value = s;
    sel.dispatchEvent(new Event('change'));
    drive(5);
    shapeLit[s] = countLit();
  }

  return { litPlain, litKitchen, shapeLit, glError: ctx.getError(), canvas: gl.width + 'x' + gl.height };
});

await browser.close();
server.close();

console.log('Smoke result:', JSON.stringify(result, null, 2));
if (errors.length) {
  console.error('FAIL: page/console errors:\n' + errors.join('\n'));
  process.exit(1);
}
if (result.glError !== 0) {
  console.error('FAIL: WebGL error code ' + result.glError);
  process.exit(1);
}
if (result.litPlain < 50) {
  console.error('FAIL: canvas (nearly) black on plain render — lit=' + result.litPlain);
  process.exit(1);
}
const blackShapes = Object.entries(result.shapeLit).filter(([, lit]) => lit < 50);
if (blackShapes.length) {
  console.error('FAIL: black canvas for shapes: ' + blackShapes.map(([s]) => s).join(', '));
  process.exit(1);
}
console.log('PASS');
