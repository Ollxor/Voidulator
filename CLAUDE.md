# Voidulator — Claude Code Context

## Architecture: intentional single-file design

Everything lives in `index.html` (~6,600 lines). This is not a shortcut — it is the deployment model. The app is meant to be droppable into any static host or opened directly from the filesystem. No build step, no bundler, no npm. Changing to a multi-file structure would break the offline/PWA use case and complicate the zero-dependency guarantee.

Supporting files:
- `manifest.json` — PWA manifest (icons, theme color, display mode)
- `sw.js` — Service worker (cache-first, offline support)
- `icon.svg` — Source icon (512×512 vector)
- `apple-touch-icon.png` — Generated from icon.svg at 180×180 for iOS home screen

## State object: `S`

The entire application state is a single plain object `S`. Sliders, dropdowns, toggles, and animations all read from and write to `S`. Key sub-trees:

- `S.beams` — beam count, width, colors, per-beam rotation speeds/phases
- `S.pulse` — pulse on/off, shape, amplitude, frequency, speed, duty, quality
- `S.widthWave` — shape-effect on/off, shape type, density, size, flow, rotation
- `S.trails` — on/off, length, hue shift
- `S.emitters[]` — array of emitter positions and per-emitter state
- `S.scenes[]` — 8 save slots (each is a snapshot of S minus ephemeral state)
- `S.audio` — mic input state, sensitivity, smoothing, target, band

`S` is serialized to `localStorage` on change (debounced 2 s, skipped when tab is hidden, flushed on `pagehide`). Factory-reset restores hardcoded defaults including 15 curated scenes.

## Render pipeline

```
requestAnimationFrame
  → update physics (emitter rotation, pulse phase, audio level)
  → trace rays (WebGL vertex buffer: one call per bounce layer)
  → composite trails (ping-pong framebuffer)
  → draw overlay (2D canvas: emitter dots, drag handles)
```

The WebGL canvas (`#gl`) and the 2D overlay canvas (`#overlay`) are stacked absolutely inside `.stage`. The render loop pauses when the tab is hidden (`visibilitychange`) and resumes cleanly. `dt` is clamped to 100 ms to prevent jumps on tab restore.

### Vertex buffer
Beam geometry writes into a persistent, growable `Float32Array` (`vertBuf`) rather than allocating per frame. When the required size exceeds the allocated size, the buffer doubles.

### Trail ping-pong
Two framebuffers (`fbA`, `fbB`) alternate each frame. The previous frame is blended back at `reflectivity` opacity, creating motion blur/persistence. Additive and normal blend modes are both supported.

## Scene / preset / localStorage system

- **Scenes (slots 0–7):** stored in `S.scenes[]`, persisted in `localStorage` under `voidulator_state`. Load/save via the Scenes panel or keyboard `1–8`. Smooth transitions interpolate all numeric `S` properties over a configurable duration.
- **Screensaver:** cycles through non-empty slots at a configurable interval (minutes). Activated by the 🌙 button or `N` key advances one slot.
- **JSON export/import:** `savePreset` serializes full `S` to a `.json` file; `loadPreset` merges it back, then triggers a redraw.
- **Factory reset:** replaces `S.scenes` with the 15 hardcoded curated scenes and reseeds 8 screensaver slots.

## WebGL2 specifics

- Requires WebGL2 (no fallback to WebGL1); shows `#fallbackMessage` if unavailable.
- Shaders are inlined as template-literal strings in the JS section.
- `ANGLE_instanced_arrays` is not used — each bounce layer is a separate draw call.
- The beam width uniform is modulated per-frame by pulse and audio values before upload.

## UI conventions

- **Simple / Advanced mode:** `body.mode-simple` hides all `[data-advanced]` and `.advanced-only` elements. Toggle is in ⚙️ Settings.
- **i18n:** elements with `data-i18n="key"` are updated by `applyI18n()` when language changes. Four languages: `en`, `es`, `pt`, `fr`. Strings live in the `I18N` object in the JS section.
- **Collapsible groups:** `.group.collapsible` sections toggle with `.collapsed` class; state is not persisted.
- **Clickable labels:** `label.clickable` elements reset their paired slider to default on click.

## Deployment

Hosted at [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se) via GitHub Pages (CNAME in repo). Push to `main` → live in seconds. No CI needed.

## What to watch out for

- The `S` object snapshot in `saveScene()` must deep-clone arrays (emitter positions, beam colors) — shallow copy causes all scenes to share references.
- `requestAnimationFrame` IDs are tracked in `rafId`; always cancel before re-requesting to avoid duplicate loops.
- Audio context must be created on a user gesture; `audioToggle` handles this gate.
- The `spread` value (beam fan angle) is in degrees in `S` but converted to radians before the ray-trace loop.
