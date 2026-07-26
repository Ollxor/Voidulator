// Static i18n + panel-registry audit. No browser needed — pure text analysis,
// so it runs in a fraction of a second and can gate every push.
//
// Why this exists: every user-facing string lives in FIVE places — the inline
// HTML default plus the en/es/pt/fr tables in TRANSLATIONS. applyTranslations()
// overwrites textContent from the table, so editing only the HTML silently
// regresses the moment a user picks any language (including re-picking
// English). That exact bug shipped twice (hintTrails, hintRings/geometric)
// before this check existed. It also catches:
//   - a key used in HTML that no language defines
//   - a key defined in en but missing from es/pt/fr
//   - a state-driven toggle button carrying data-i18n (its caption would get
//     clobbered with a static label on every language change)
//   - GROUP_RESETS / TAB_OF_GROUP entries pointing at group titles that no
//     longer exist
//
// Run: node tests/i18n-audit.mjs
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = await readFile(join(root, 'index.html'), 'utf8');
const problems = [];

// Decode the entities actually used in the panel markup, and collapse
// whitespace so multi-line HTML compares equal to a single-line JS string.
const decode = s => s
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&rarr;/g, '→')
  .replace(/&deg;/g, '°').replace(/&nbsp;/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/\s+/g, ' ').trim();

// applyTranslations() preserves a leading emoji/glyph, so strip the same
// prefix before comparing or every decorated button reads as a false positive.
const GLYPH = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{25A0}-\u{25FF}][\u{FE00}-\u{FE0F}]?\s*/u;
const stripGlyph = s => s.replace(GLYPH, '');

// ---- Parse the TRANSLATIONS tables -----------------------------------------
const tStart = src.indexOf('const TRANSLATIONS');
const tBlock = src.slice(tStart, src.indexOf('\n  };', tStart));
const marks = [...tBlock.matchAll(/^\s{4}([a-z]{2}):\s*\{/gm)].map(m => [m[1], m.index]);
const T = {};
marks.forEach(([lang, a], i) => {
  const chunk = tBlock.slice(a, i + 1 < marks.length ? marks[i + 1][1] : tBlock.length);
  const map = new Map();
  // Handles both quote styles and escaped quotes inside the string.
  for (const m of chunk.matchAll(/^\s{6}([A-Za-z0-9_]+):\s*(['"])((?:\\.|(?!\2)[\s\S])*)\2/gm)) {
    map.set(m[1], m[3].replace(/\\(['"])/g, '$1').replace(/\s+/g, ' ').trim());
  }
  T[lang] = map;
});
const langs = Object.keys(T);
if (!langs.includes('en')) problems.push('Could not parse the en translation table');

// ---- 1. Every data-i18n key must exist in every language --------------------
const htmlKeys = new Set([...src.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]));
for (const k of htmlKeys) {
  const missing = langs.filter(l => !T[l].has(k));
  if (missing.length) problems.push(`key "${k}" used in HTML but missing from: ${missing.join(', ')}`);
}
for (const k of T.en.keys()) {
  const missing = langs.filter(l => l !== 'en' && !T[l].has(k));
  if (missing.length) problems.push(`key "${k}" defined in en but missing from: ${missing.join(', ')}`);
}

// ---- 2. Inline HTML text must match its en translation ----------------------
// (otherwise first-visit text differs from post-language-switch text)
const elRe = /<(div|label|button|span|option)\b[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;
for (const m of src.matchAll(elRe)) {
  const key = m[2];
  const htmlText = stripGlyph(decode(m[3].replace(/<[^>]+>/g, '')));
  if (!htmlText) continue;
  const enText = T.en.get(key);
  if (enText === undefined) continue; // already reported above
  if (stripGlyph(enText) !== htmlText) {
    problems.push(`drift for "${key}":\n      HTML: ${htmlText}\n      en  : ${enText}`);
  }
}

// ---- 3. State-driven toggles must not carry data-i18n -----------------------
// A button whose caption is written at runtime (On/Off, etc.) gets overwritten
// with its static label by applyTranslations on every language change.
for (const m of src.matchAll(/<button\b[^>]*\bid="([^"]+)"[^>]*data-i18n="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)) {
  const [, id, key, text] = m;
  const caption = decode(text.replace(/<[^>]+>/g, ''));
  if (/^(On|Off)$/i.test(caption)) {
    problems.push(`button #${id} shows state text "${caption}" but carries data-i18n="${key}" — it will be clobbered on language change; drop the attribute`);
  }
}

// ---- 4. Panel registry maps must point at real groups -----------------------
const groupTitles = new Set([...src.matchAll(/<div class="group-title" data-i18n="([^"]+)"/g)].map(m => m[1]));
function mapKeys(name) {
  const i = src.indexOf(`const ${name}`);
  if (i < 0) return new Set();
  const chunk = src.slice(i, src.indexOf('\n  };', i));
  // Only top-level keys: `key:` appearing right after `{` or `,` or line start.
  return new Set([...chunk.matchAll(/(?:^\s{4}|[{,]\s*)([A-Za-z0-9_]+)\s*:/gm)].map(m => m[1]));
}
for (const [name, keys] of [['TAB_OF_GROUP', mapKeys('TAB_OF_GROUP')]]) {
  for (const k of keys) {
    if (!groupTitles.has(k)) problems.push(`${name} has entry "${k}" with no matching .group-title — dead entry or renamed group`);
  }
}
for (const g of groupTitles) {
  if (!mapKeys('TAB_OF_GROUP').has(g)) problems.push(`group "${g}" has no TAB_OF_GROUP entry — it will only appear under the "All" tab`);
}

// ---- Report -----------------------------------------------------------------
console.log(`i18n audit: ${htmlKeys.size} HTML keys, ${langs.map(l => `${l}=${T[l].size}`).join(' ')}`);
if (problems.length) {
  console.error(`\nFAIL — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('PASS — no missing keys, no HTML/en drift, no clobbered toggles, registry maps intact.');
