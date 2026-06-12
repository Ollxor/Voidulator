# Voidulator — Claude Code Context

## Architecture: intentional single-file design

Everything lives in `index.html` (~6,600 lines). This is not a shortcut — it is the deployment model. The app is meant to be droppable into any static host or opened directly from the filesystem. No build step, no bundler, no npm. Changing to a multi-file structure would break the offline/PWA use case and complicate the zero-dependency guarantee.

Supporting files:
- `manifest.json` — PWA manifest (icons, theme color, display mode)
- `sw.js` — Service worker (**network-first**, cache only as offline fallback — see Deployment)
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
- `S.audio` — mic input state, sensitivity, smoothing; `S.audio.bands` (smoothed per-band energy: all/bass/mid/high) and `S.audio.raw` (unsmoothed, feeds the beat detector)
- `S.modRoutes[]` — modulation matrix routes `{source, target, amount, enabled}`
- `S.beat` — beat detector (enabled, envelope `env`, decay, sensitivity, on-beat actions)
- `S.midi` — WebMIDI state (`bindings`: CC key → param id, `noteBeat` flag)
- `S.rec` — video recorder state (active, recorder, chunks, dimensions)
- `S.hueOffset` — runtime-only global hue rotation (degrees), applied to all beam colors in `renderBeamsGL`; driven by the matrix and beat hue-jumps, never persisted

`S` is serialized to `localStorage` on change (debounced 2 s, skipped when tab is hidden, flushed on `pagehide`). Factory-reset restores hardcoded defaults including 15 curated scenes.

## Parameter registry & modulation matrix

`MOD_PARAMS` is the single registry of programmatically drivable parameters (`{label, get, set, min, max(), range(), wrap?}`). Three systems plug into it — **add new modulatable parameters here, never as one-off switch statements**:

1. **Modulation matrix** (`applyModulation`/`restoreModulation`): routes in `S.modRoutes` add `source × amount × range` to each target. **Non-destructive** — base values are snapshotted into `modBase` before render and restored after (`restoreModulation` runs at the end of `loop()`), so sliders, autosave, and scenes only ever see unmodulated values. Sources: `all`/`bass`/`mid`/`high` (smoothed band energies) and `beat` (the beat envelope). Amounts are bipolar (−1…+1).
2. **MIDI CC bindings**: map a knob absolutely onto min→max of a registry param. CCs set *base* values (events arrive between frames, when bases are restored), so matrix modulation stacks on top.
3. **Beat actions** read/write state directly (`triggerBeatActions`: ripple spawn, hue jump).

Matrix routes + beat settings persist in `localStorage['voidulator-mod']` (global rig config, deliberately **not** per-scene — scenes are visual compositions, the matrix is the performance rig). They are also included in JSON preset export/import. MIDI bindings persist separately in `localStorage['voidulator-midi']`.

## Bloom (Glow) pipeline

`S.bloom = {enabled, strength, threshold}`, persisted per-scene (lerped in transitions) and in presets. GL flow in `renderBeamsGL`:

- **No-trails path**: beams render into `sceneFBO` (full res) instead of the screen, then `runBloom(sceneTex)` → `compositeWithBloom(sceneTex)`.
- **Trails path**: the existing trail composite texture (`writeTex`) is the bloom source; the final screen copy is replaced by `compositeWithBloom(writeTex)`.
- `runBloom`: bright-pass (smooth knee above `threshold`) into a **quarter-res** target, then separable 9-tap gaussian (H then V, taps 1.5 texels apart). Result lands in `bloomTexA`.
- `compositeWithBloom`: blit scene (blend off), then additive blit (`gl.ONE, gl.ONE`) of `bloomTexA × strength`, then `setBlendMode(S.blendMode)` to restore the state beams expect.
- `drawPostQuad` **disables the beam vertex attribs first** — leaving them enabled while pointing into a smaller/empty vertex buffer makes the fullscreen draw `INVALID_OPERATION`.
- All render targets resize lazily by checking `tex._w/_h` against the canvas (same pattern as trails), so recording's resolution switch just works.

## Beat detection

`updateBeat(dtSec)` in the render loop. Adaptive threshold: a beat fires when raw (unsmoothed) bass energy exceeds its ~0.7 s rolling mean × sensitivity, gated by a 0.18 s re-trigger interval and a 0.08 absolute floor. On detect: `S.beat.env = 1` (decays as `exp(-decay·dt)`, usable as a matrix source) and `triggerBeatActions()` fires the enabled one-shots. MIDI note-on can fire the same path when `S.midi.noteBeat` is on.

## Video recording

`startRecording()` overrides the device pixel ratio (`recDprOverride` in `resize()`) so the GL canvas backing store renders **natively** at the chosen height (480/720/1080/2160) — geometry is unaffected because the room works in CSS-pixel space via `S.dpr`. Width follows the window aspect (rounded to even for the encoder). Each frame `captureRecFrame()` composites `#gl` + `#overlay` into an offscreen canvas whose `captureStream(60)` feeds `MediaRecorder` (VP9 → VP8 → WebM fallback; bitrate scales 8–45 Mbps with resolution). Stop downloads a `.webm`. Recording auto-stops when the tab is hidden (the render loop is the frame source). Trail framebuffers re-size automatically on the resolution switch (dimension check in the FBO setup).

## Debug handle

`window.Voidulator` exposes `{S, MOD_PARAMS, triggerBeatActions, startRecording, stopRecording, renderModRoutes, syncBeatUI, onMidiMessage, renderMidiBindings}` for console debugging and testing without hardware — e.g. `Voidulator.S.beat.env = 1` simulates a beat, `Voidulator.onMidiMessage({data:[0xB0, 21, 64]})` simulates a CC message.

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

## Panel tools (tabs / search / reset / thumbnails)

`initPanelTools()` (called early in `init()`, before `loadLanguage()`) tags every `.group` with `data-group-key` (its title's `data-i18n` key) and `data-tab` (from `TAB_OF_GROUP`), builds the search+collapse toolbar and the tab bar, and attaches per-group ↺ reset buttons. Resets restore from `FACTORY` — a deep snapshot of S taken by `snapshotFactory()` at the **top of init(), before autosave/URL loading** — via the `GROUP_RESETS` map (add an entry there when adding a new group). The reset span is a **sibling** of the title, not a child: `applyTranslations()` rewrites title textContent and would destroy children. Tab/search visibility uses `.tab-hidden`/`.search-hidden` classes (`display:none !important`), never inline styles, so it composes with the simple/advanced mode CSS. Scene thumbnails (`captureSceneThumb()`, 96×72 JPEG dataURL) are stored on the scene objects at save; scenes visited without one get captured ~0.5 s after their transition settles (`pendingThumbScene` in `loopBody`).

## UI conventions

- **Simple / Advanced mode:** `body.mode-simple` hides all `[data-advanced]` and `.advanced-only` elements. Toggle is in ⚙️ Settings.
- **i18n:** elements with `data-i18n="key"` are updated by `applyI18n()` when language changes. Four languages: `en`, `es`, `pt`, `fr`. Strings live in the `I18N` object in the JS section.
- **Collapsible groups:** `.group.collapsible` sections toggle with `.collapsed` class; state is not persisted.
- **Clickable labels:** `label.clickable` elements reset their paired slider to default on click.

## Rings system

`S.rings` (own panel) is an independent emission layer that coexists with beams — `renderBeamsGL` calls `buildRingGeometry()` whenever `rings.enabled`, before/alongside the beam loop (`S.beamCount` may be 0 for rings only). Key pieces:

- **Own emitters**: `S.rings.emittersNorm` (norm coords like beam emitters, teal dots in the overlay, draggable via `S.ringDraggingIdx`). `arrangeRingEmittersGeometric(anchor)` places N emitters as a regular polygon around the room center through the anchor dot (the most recently dragged one, `ringLastMoved`).
- **Folded-wavefront renderer**: `RING_RAYS` (240) rays per emitter traced once via `computePath` and cached (`ringRays`, keyed on geometry + ring-emitter positions + bounce cap). The ring at expansion distance `d` is the point at distance `d` along each folded ray. Fold detection skips connections > ~4× the expected arc gap.
- **Lifetime in legs**: per-ray death at `lifetime × ray.firstLeg` (1 = birth→wall, 2 = back at center…), then alpha fades over `rings.fade` seconds. Bounce cap for tracing = `ceil(lifetime/2)+4`, max 64.
- **Spawning**: `advanceRings` runs a randomized scheduler — activation every `randIn(interval)` s, each activation queues `randIn(perActivation)` rings spaced `randIn(spacing)` s apart (`pendingRings` countdowns). `activateRings()` is also the manual button / debug API. Rings are ALWAYS born at d=0 (at the emitter).
- **Dual-range sliders**: `makeDualRange(slotId, …)` builds the two-thumb min/max control; `randIn(range)` draws the value. Reuse this for any future [min,max] randomized parameter.
- Ring width floors at ~1.2px (sub-pixel quads alias into moiré). Taper uses per-ray life progress.

## Phosphor walls

512 perimeter energy bins (`phosR/G/B`); beam bounce points deposit color via an angle→bin LUT (`phosLUT`, built in `ensurePhosphorGeometry` whenever the wall geometry changes — keyed on the `S.vertices` array reference). Bins decay exponentially in `updatePhosphor`. `appendPhosphorQuads()` writes inward-fading quads into `vertBuf` **after** the beam geometry; `drawBeamGeometry()` draws beams first, then the phosphor range with `u_pulseOn`/`u_edgeIntensity` zeroed so the wall glow doesn't pulse. Because phosphor lives in the same draw call, it inherits trails, bloom, and blend modes with no pipeline changes.

## CI

`.github/workflows/smoke.yml` runs `tests/smoke.mjs` on every push: headless Chromium (SwiftShader WebGL2) loads the app, drives frames via `Voidulator.step()`, exercises all seven room shapes plus trails/bloom/phosphor, and fails on console errors, GL errors, or a black canvas. Run locally with `npm install playwright && npx playwright install chromium && node tests/smoke.mjs`.

## Deployment

Hosted at [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se) via GitHub Pages (CNAME in repo). Push to `main` → live in seconds. No CI needed.

**Service worker is network-first** (`sw.js`): the network copy always wins when reachable; the cache is only an offline fallback. This is deliberate — a cache-first SW once served a broken `index.html` to all visitors indefinitely, regardless of deploys. Do not change the strategy back to cache-first. The `CACHE_NAME` version only matters for clearing old caches, not for delivering updates.

## What to watch out for

- The `S` object snapshot in `saveScene()` must deep-clone arrays (emitter positions, beam colors) — shallow copy causes all scenes to share references.
- `requestAnimationFrame` IDs are tracked in `rafId`; always cancel before re-requesting to avoid duplicate loops.
- Audio context must be created on a user gesture; `audioToggle` handles this gate. Same for `requestMIDIAccess` (the Enable MIDI button).
- The `spread` value (beam fan angle) is in degrees in `S` but converted to radians before the ray-trace loop.
- Beam shader uniforms are uploaded in exactly ONE place: `uploadBeamUniforms()`. It used to be three copy-pasted blocks, and a partial refactor of one copy black-screened the live site. Never duplicate it again.
- The render loop is `loop()` (try/catch + rAF rescheduling + error badge) wrapping `loopBody()` (the actual frame). A throwing frame must never stop the loop — keep that structure. `Voidulator.step(t)` drives `loopBody` directly for tests (rAF doesn't fire in hidden tabs).
- `applyModulation()` must run **before** the rotation/phase integration in `loopBody()` (so a modulated `rotationSpeed` actually spins faster) and `restoreModulation()` **after** `drawOverlay()`/`captureRecFrame()`. Don't reorder.
- `S.pulsePhase` (radians, runtime-only) is the pulse clock: integrated in `loopBody` from `pulseFreqCP100 × pulseSpeed`, uploaded as `u_phaseTime`. Don't reintroduce a raw `time × speed` term in the shader — it drifts in long sessions and jumps when speed is modulated.
- `buildShape()` floors the room radius at 10px (`safeR`) — a hidden/collapsed stage reports near-zero size and a negative radius makes canvas `arc()` throw.
- Wall bending: `buildShape()` caches unbent corners in `S.baseVertices`; `bendWalls()` re-derives both `S.vertices` (drawing/point-in-room polyline) and `S.wallArcs` (collision). **Collision in bent regular/random rooms is analytic**: `buildWallArcs()` turns each wall into a true circular arc (sagitta = bend × len × 0.3); `firstHitArcs()` solves one quadratic per wall and `computePath` reflects off `arcNormal()` — never reintroduce subdivided-segment collision, it caused both lag (720 segment tests/bounce) and normal-step jitter. The polyline samples the SAME arcs so visuals always match physics. Always change bend through `bendWalls()`, never `buildShape()` (re-randomizes Randomgon). Circle, blob, parabolic, ellipse are exempt (`wallArcs` null → `firstHitPoly`).
- Beam vertex layout is **8 floats**: x, y, t, r, g, b, alpha, edge (cross-beam −1…+1, drives the edge-gradient falloff). `stride = 8*4` and `vertCount/8` must stay in sync with `pushQuad`/`pushShape` writes — grep for all of them if you ever change the layout again.
- New UI labels in the modulation/beat/MIDI/record/glow panels are English-only (no `data-i18n` keys yet); add keys to all four language tables if you internationalize them.
