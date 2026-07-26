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
- `S.segments` — beam-length cycle: `on`, global `wavelength`/`speed`, and `items[]` (each `{w, colInherit, col[3], opacity, soft, driftOn, speed, wavelength}`). Replaced the old `S.pulse` in v1.23; old pulse fields migrate via `readSegments()`
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

## Wave field (FDTD simulation)

`S.field` is a fourth emission mode (Emission select → "Wave field"), mutually exclusive with beams/rings. `renderBeamsGL` early-returns to `renderField()` when `S.field.enabled`. It's a real finite-difference wave-equation solver on the GPU:

- **Float ping-pong**: two RGBA16F textures (`fieldTex[0/1]`), each texel storing `(u_n in .r, u_{n-1} in .g)`. Needs `EXT_color_buffer_float` (`fieldFloatOK`); without it `renderFieldUnsupported()` shows a notice.
- **`waveProg`** (update): `u_{n+1} = 2u_n − u_{n−1} + C²·∇²u_n` with a 5-point Laplacian; `C = S.field.speed` must stay < 0.707 (2D stability). Out-of-room neighbours (mask < 0.5) mirror the centre value → **Neumann reflecting walls**; in absorb mode they read 0. Sources injected as gaussian bumps at emitter UVs; `S.field.substeps` passes per frame.
- **Mask**: `buildFieldMask()` rasterizes the current room (circle/polygon/bent/ellipse/parabola — uses `S.vertices`/`S.circle`) into a square texture via the 2D canvas, keyed on geometry so it rebuilds only on change. `fieldMaskMap` stores the px→grid-UV transform; `fieldPxToUV()` maps emitter/click positions in.
- **`waveColorProg`** (colorize): soft tone-map `1−exp(−|u|·gain)` (never harsh-clips a resonating cavity) → spectral/bipolar/mono, into `sceneTex`, then the existing `runBloom`/`compositeWithBloom`.
- Source phase advances in `loopBody` (`S.field.phase`); the FDTD itself is dt-independent (fixed C, fixed substeps). Click-on-stage and the Pulse button push one-shot `fieldImpulses`.
- Inspired by Nils Berglund's wave sims (CC0); this is independent code. Defaults (damping 0.02, amp 0.4, gain 2.5) give clean travelling fronts rather than a saturated standing wave.
- **Aspect handling**: the field grid is square; the colorize pass renders into a *centred square viewport* (`vx,vy,sq` from `fieldMaskMap × dpr`, GL bottom-left origin) on the otherwise-cleared scene target — never stretch the square field across a non-square canvas, or circular waves become ellipses on mobile.
- **Waveform** (`S.field.waveform`): `continuous` (steady sine), `rings` (sine × a per-period gaussian burst window at `pulseRate`, `pulseWidth` sets sharpness → distinct expanding rings), or `off` (manual impulses only). Phases (`phase`, `pulsePhase`) advance in `loopBody`.
- Field has its own draggable wave-source emitters (`S.field.emittersNorm`, magenta) with the shared formation helpers (`arrangeFormationGeometric`/`centerFormation`/`uprightFormation`/`setFormationCount`, `defaultFormationRadius` spreads a collapsed formation).
- Editing Shape/Eccentricity/Wall bend calls `flashRoomOutline()` → `roomOutlineUntil`; `drawOverlay` draws the boundary in fading amber while active (it's normally black-on-black).

## Bloom (Glow) pipeline

`S.bloom = {enabled, strength, threshold}`, persisted per-scene (lerped in transitions) and in presets. GL flow in `renderBeamsGL`:

- **No-trails path**: beams render into `sceneFBO` (full res) instead of the screen, then `runBloom(sceneTex)` → `compositeWithBloom(sceneTex)`.
- **Trails path**: the existing trail composite texture (`writeTex`) is the bloom source; the final screen copy is replaced by `compositeWithBloom(writeTex)`.
- `runBloom`: bright-pass (smooth knee above `threshold`) into a **quarter-res** target, then separable 9-tap gaussian (H then V, taps 1.5 texels apart). Result lands in `bloomTexA`.
- `compositeWithBloom`: blit scene (blend off), then additive blit of `bloomTexA × strength` — **must explicitly set `gl.blendEquation(gl.FUNC_ADD)` before `gl.blendFunc(gl.ONE, gl.ONE)`** (not just the func), since `S.blendMode` can leave `MAX`/`FUNC_REVERSE_SUBTRACT` active (Lighten/Difference — see Blend modes below); the glow layer must always be plain additive regardless. Then `setBlendMode(S.blendMode)` to restore the state beams expect.
- `drawPostQuad` **disables the beam vertex attribs first** — leaving them enabled while pointing into a smaller/empty vertex buffer makes the fullscreen draw `INVALID_OPERATION`.
- All render targets resize lazily by checking `tex._w/_h` against the canvas (same pattern as trails), so recording's resolution switch just works.

## Kaleidoscope, Generative gallery, Vesica & trail controls (v1.16–1.19)

- **Kaleidoscope** (`S.kaleido {enabled, segments, rot, spin, mirror}`): a `kfold(uv)` GLSL snippet shared by BOTH final-blit shaders (`copyFs`/`blitFs`) — the fold lives in the existing last-pass programs rather than a new pass, so every render path (trails/field/generative × bloom on/off) gets it without duplicated pipeline logic. `uploadKscopeUniforms(prog)` must be called at every final-blit program bind (uniforms persist per program, so all sites re-set them each frame). The no-trails+bloom-off beam path routes through `sceneFBO`+`copyProg` only when kaleido needs it. `rot` advances by `spin` in `loopBody`; `kaleidoRot` is a `MOD_PARAMS` target (wrap).
- **Generative** (`S.generative {enabled, style, speed, scale, hue}`): fifth emission mode, mutually exclusive like the field — `renderBeamsGL` early-returns to `renderGenerative()` BEFORE the field check. `GEN_PROGS` registry maps `style` → program (aurora/tunnel/orbs, all original shaders sharing a cosine-palette uniform block; licensing reasoning in RESEARCH.md §22). Renders a fullscreen quad into `sceneTex` via `ensureBloomTargets()` → same bloom/kaleido tail as everything else. **To add a gallery style:** write a fragment shader on `copyVs`, register in `GEN_PROGS`, add the `<option>` + a translated label — nothing else. Emitter dots are hidden in this mode (`drawOverlay` gate); the room-boundary stroke is suppressed like the field's.
- **Vesica piscis** (`polygonType 'vesica'`): two R-circles with centre separation R, √3∶1 lens traced as a closed polyline into `S.vertices` (ellipse/blob pattern — generic `firstHitPoly` collision, no `wallArcs`). Generating centres stored in `S.foci` (reuses the ellipse focus markers). Wall bend exempt (no `baseVertices`).
- **Trail filter & cutoff** (`S.trails.filter 'smooth'|'crisp'`, `S.trails.cutoff` 0–0.06): `applyTrailFilter()` lazily re-stamps LINEAR/NEAREST on both ping-pong textures (reset to null on `ensureTrailFBO` recreate — fresh textures are LINEAR); `cutoff` feeds the trail shader's `u_threshold` residue floor. These are the user-facing dials for the sub-pixel moiré/interference look (thin beams + slow speed + long trails). Note: `S.trails.opacity` is dead state — persisted/lerped for scene compatibility but read by no shader (redundant with `length`); don't wire it without dedup.

## Beat detection

`updateBeat(dtSec)` in the render loop. Adaptive threshold: a beat fires when raw (unsmoothed) bass energy exceeds its ~0.7 s rolling mean × sensitivity, gated by a 0.18 s re-trigger interval and a 0.08 absolute floor. On detect: `S.beat.env = 1` (decays as `exp(-decay·dt)`, usable as a matrix source) and `triggerBeatActions()` fires the enabled one-shots. MIDI note-on can fire the same path when `S.midi.noteBeat` is on.

## Video recording

`startRecording()` overrides the device pixel ratio (`recDprOverride` in `resize()`) so the GL canvas backing store renders **natively** at the chosen height (480/720/1080/2160) — geometry is unaffected because the room works in CSS-pixel space via `S.dpr`. Width follows the window aspect (rounded to even for the encoder). Each frame `captureRecFrame()` composites `#gl` + `#overlay` into an offscreen canvas whose `captureStream(60)` feeds `MediaRecorder` (VP9 → VP8 → WebM fallback; bitrate scales 8–45 Mbps with resolution). Stop downloads a `.webm`. Recording auto-stops when the tab is hidden (the render loop is the frame source). Trail framebuffers re-size automatically on the resolution switch (dimension check in the FBO setup).

## Debug handle

`window.Voidulator` exposes `{S, MOD_PARAMS, triggerBeatActions, startRecording, stopRecording, renderModRoutes, syncBeatUI, onMidiMessage, renderMidiBindings}` for console debugging and testing without hardware — e.g. `Voidulator.S.beat.env = 1` simulates a beat, `Voidulator.onMidiMessage({data:[0xB0, 21, 64]})` simulates a CC message.

## Render pipeline

```
requestAnimationFrame
  → update physics (emitter rotation, segment scroll, audio level)
  → trace rays (WebGL vertex buffer: one call per bounce layer)
  → composite trails (ping-pong framebuffer)
  → draw overlay (2D canvas: emitter dots, drag handles)
```

The WebGL canvas (`#gl`) and the 2D overlay canvas (`#overlay`) are stacked absolutely inside `.stage`. The render loop pauses when the tab is hidden (`visibilitychange`) and resumes cleanly. `dt` is clamped to 100 ms to prevent jumps on tab restore.

### Vertex buffer
Beam geometry writes into a persistent, growable `Float32Array` (`vertBuf`) rather than allocating per frame. When the required size exceeds the allocated size, the buffer doubles.

### Trail ping-pong
Two framebuffers alternate each frame. The previous frame is re-drawn faded (`trailFs`), then the new beams draw on top. Key details:
- **Length → fade** (in the trail render block): `fadeRate = 0.995 * pow((len-1)/179, 0.5)`, so **len=1 → fade 0** (previous frame fully cleared = identical to trails Off) up to ~0.995 at len=180. Do NOT reintroduce a non-zero floor — that's exactly the "minimum still smears" bug fixed in v1.24.
- **Feedback (v1.24–1.25):** `S.trails.fbZoom`/`fbSpin`/`fbDriftX`/`fbDriftY` re-sample the previous frame scaled (`u_fbScale = 1 - fbZoom`) + rotated (`u_fbAngle`, radians) + shifted (`u_fbDrift`, UV/frame) about the centre before fading, turning trails into tunnels/spirals/wind-blown streaks. Sampling at `v_uv - drift` (not `+`) is what makes the *content* appear to move by `+drift` each frame — don't flip that sign. The transform is skipped when scale==1, angle==0 and drift==(0,0), so plain trails are byte-identical to before; out-of-frame samples return black. `trailZoom`/`trailSpin`/`trailDriftX`/`trailDriftY` are `MOD_PARAMS` targets. Trails only run in beam/ring/field modes (square stage), so no aspect correction is needed.
- **Beat echo (v1.25):** `S.trails.beatEcho` (0..1) pushes the trail's effective fade toward a near-freeze in proportion to `S.beat.env`: `effectiveFade = fadeRate + (1-fadeRate) * beatEcho * S.beat.env`. `S.beat.env` already decays every frame regardless of `S.beat.enabled` (see `updateBeat()`) and only ever gets set to 1 by real beat detection, so gating on `beatEcho > 0` alone is sufficient — no extra "is beat detection still on" check needed, and no separate framebuffer: it's a pure fade-rate modulation on the existing ping-pong path.
- `S.trails.opacity` exists in state + persistence but is currently unused by the render (dead field; safe to wire up later).
- **i18n gotcha (bit us twice — v1.24 `hintTrails`, v1.26 `hintRings`/`geometric`):** every user-facing string lives in FIVE places — the inline HTML default plus all 4 `TRANSLATIONS[lang]` tables. Editing only the HTML default silently regresses the moment a user selects any language (including re-selecting English) — `applyTranslations()` overwrites `textContent` from the table, stale or not. When changing a hint/tooltip/label, update every occurrence, not just the HTML. **`tests/i18n-audit.mjs` now enforces this** (and runs first in CI) — it fails on HTML↔en drift, keys missing from any language, state-toggle buttons carrying `data-i18n`, and dead `TAB_OF_GROUP` entries. Run `node tests/i18n-audit.mjs` after touching any string.
- **Never put `data-i18n` on a button whose caption is state.** `applyTranslations()` sets `textContent` from the table, so a toggle reading "On"/"Off" gets clobbered with its static label on every language change (this is what happened to `#emitterGeoToggle`, which read "Geometric" instead of On/Off after any language switch). State toggles carry no `data-i18n`; their neighbouring `<label>` holds the translatable text. Where a button's caption is *both* state-driven and translatable (`#audioToggle`: "Start listening" ⇄ "Stop listening"), `applyTranslations()` re-asserts the live-state caption after the sweep — extend that tail if you add another such button.

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

## Emitters & formation clusters

All three emission systems (beams, rings, wave field) keep their emitters as `{nx,ny}` norm coords and share one set of formation helpers (defined once, used by all):
- `normToRoomPx(arr)` / `writeNormFromPx(arr,i,px)` — convert between norm and room-px via `getRoomBounds()`.
- `roomCenter()` — circle centre or polygon **centroid** (the visual middle; for a triangle this is NOT the bbox centre — that distinction caused the wave-field off-centre bug, fixed by centring the field square on the centroid).
- `defaultFormationRadius()` — 0.28×min room dim; used so a collapsed (all-at-centre) formation spreads instead of stacking.
- `arrangeFormationGeometric(arr, anchorIdx)` — lay out as a regular polygon (2=line, 3=triangle, 4=square…) anchored on one dot; `centerFormation`, `uprightFormation`, `setFormationCount`, and `rotateFormationBy(arr, deltaDeg)` (rotate around centre, preserving radius — drives manual Rotation + auto Spin).

Per-system specifics:
- **Beams** (`S.emitters` / `S.emittersNorm`): cluster params `emitterGeo` (align/drag-follow on), `emitterRot` (deg), `emitterSpin` (deg/s), `emitterRadiusN`. `applyEmitterCluster()` lays them out; `moveEmitterSymmetric(idx,pos)` derives radius+rotation from a drag and re-applies so the rest follow. `setEmitterCount` / `randomizeEmitters` call the cluster when `emitterGeo`.
- **Rings** (`S.rings.emittersNorm`, teal dots) and **field** (`S.field.emittersNorm`, magenta dots): each has `geometric`, `rot`, `spin`; manual rotation applies the delta via `rotateFormationBy`, spin advances in `loopBody`. **Ring spin re-traces the ray cache every frame** (emitter moved → `ensureRingRays` rebuilds) — expensive at high bounce counts; field spin just relocates wave sources (cheap).
- Drag routing in the overlay pointer handlers: `S.draggingIdx` (beam), `S.ringDraggingIdx`, `S.fieldDraggingIdx`. Cluster params persist via scene/preset (beams explicitly; rings/field via whole-object JSON clone, defaulted in the apply migrations).

## Hover tooltips

`TIP` (object keyed by `data-i18n` value) + `initTooltips()` delegate `mousemove` on the panel: any hovered `[data-i18n]` whose key is in `TIP` shows `#vTooltip` and gets a `.has-tip` dotted underline. To document a new control, give its label a `data-i18n` key and add a `TIP[key]` line. Note: room shape selector label is `data-i18n="roomShape"` ("Room shape"); the beam-travelling-shapes effect group is `shapeTitle` = "Beam Shapes" (the two used to both say "Shape"). Eccentricity row (`lblEccentricity`/`eccentricityCtrl`) is shown only for the ellipse via `updateEccentricityVisibility()`.

## Phosphor walls

512 perimeter energy bins (`phosR/G/B`); beam bounce points deposit color via an angle→bin LUT (`phosLUT`, built in `ensurePhosphorGeometry` whenever the wall geometry changes — keyed on the `S.vertices` array reference). Bins decay exponentially in `updatePhosphor`. `appendPhosphorQuads()` writes inward-fading quads into `vertBuf` **after** the beam geometry; `drawBeamGeometry()` draws beams first, then the phosphor range with `u_pulseOn`/`u_edgeIntensity` zeroed so the wall glow doesn't pulse. Because phosphor lives in the same draw call, it inherits trails, bloom, and blend modes with no pipeline changes.

## CI

`.github/workflows/smoke.yml` runs two checks on every push:

1. **`tests/i18n-audit.mjs`** — pure text analysis, no browser, so it runs in well under a second and gates the push before the Playwright install. Catches HTML↔`en` string drift, keys missing from any of the 4 languages, state-toggle buttons carrying `data-i18n`, and `TAB_OF_GROUP` entries pointing at groups that no longer exist. Run locally with plain `node tests/i18n-audit.mjs` (no deps).
2. **`tests/smoke.mjs`** — headless Chromium (SwiftShader WebGL2) loads the app, drives frames via `Voidulator.step()`, exercises all seven room shapes plus trails/bloom/phosphor, and fails on console errors, GL errors, or a black canvas. Run locally with `npm install playwright && npx playwright install chromium && node tests/smoke.mjs`.

## Deployment

Hosted at [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se) via GitHub Pages (CNAME in repo). Push to `main` → live in seconds. No CI needed.

**Service worker is network-first** (`sw.js`): the network copy always wins when reachable; the cache is only an offline fallback. This is deliberate — a cache-first SW once served a broken `index.html` to all visitors indefinitely, regardless of deploys. Do not change the strategy back to cache-first. The `CACHE_NAME` version only matters for clearing old caches, not for delivering updates.

## What to watch out for

- The `S` object snapshot in `saveScene()` must deep-clone arrays (emitter positions, beam colors) — shallow copy causes all scenes to share references.
- `requestAnimationFrame` IDs are tracked in `rafId`; always cancel before re-requesting to avoid duplicate loops.
- Audio context must be created on a user gesture; `audioToggle` handles this gate. Same for `requestMIDIAccess` (the Enable MIDI button).
- The `spread` value (beam fan angle) is in degrees in `S` but converted to radians before the ray-trace loop.
- Beam shader uniforms are uploaded in exactly ONE place: `uploadBeamUniforms()`. It used to be three copy-pasted blocks, and a partial refactor of one copy black-screened the live site. Never duplicate it again. `drawBeamGeometry()` re-sets `u_segOn=0`/`u_edgeIntensity=0` for the phosphor pass so wall glow ignores those.

## Blend modes (v1.26)

`setBlendMode(mode)` is the ONE place `gl.blendFunc`/`gl.blendEquation` get set for beam-adjacent drawing (mirrors the `uploadBeamUniforms()` single-source-of-truth rule above — don't duplicate it). Five modes, all just GL state (no shader changes):
- **normal**: `FUNC_ADD`, `(SRC_ALPHA, ONE_MINUS_SRC_ALPHA)`.
- **additive**: `FUNC_ADD`, `(SRC_ALPHA, ONE)`.
- **screen**: `FUNC_ADD`, `(ONE_MINUS_DST_COLOR, ONE)` — computes `src + dst − src·dst`.
- **lighten**: `gl.blendEquation(gl.MAX)` — per spec, MIN/MAX **ignore** the blendFunc factors entirely, so the `blendFunc(ONE,ONE)` call alongside it is cosmetic only.
- **difference**: `gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)`, `(ONE, ONE)` → `dst − src`, clamped ≥0. GL has no true `|a−b|` blend op, so this is a one-directional approximation, not literal Photoshop Difference.

**Difference is genuinely self-extinguishing — this is expected, not a bug.** It can only ever *subtract* brightness, never add it, so: (a) on a fresh scene with no trails it renders solid black forever (every frame clears to black, then `dst−src` on a black dst is always ≤0); (b) even switched on mid-session against bright built-up trails, it erodes back to black within a handful of frames (measured: an avg-brightness-82 scene dropped to 0 in ~6 frames) and then stays there, since there's no mechanism to ever push it back above 0 once every source drawn while it's active goes through the same subtractive blend. It's a brief live flourish (flip to it momentarily to carve into existing glow), never a steady look — don't try to make it one without adding a genuinely different mechanism (e.g. periodically drawing something in a different mode to replenish brightness).

**Any pass that must stay additive regardless of `S.blendMode` must explicitly reset BOTH `blendEquation` and `blendFunc`, not just one.** `compositeWithBloom`'s glow layer is exactly this case (see above) — it was originally written back when every mode used `FUNC_ADD`, so only resetting `blendFunc` was safe; that assumption broke the moment Lighten/Difference introduced other equations. If you add a mode with yet another `blendEquation`, audit every raw `gl.blendFunc(...)` call that isn't inside `setBlendMode` for the same gap (currently there is exactly one: the bloom glow blit).

## Beam material (per-beam) + Wave-field colour (v1.20–1.21)

- **Beam material is baked on the CPU, not the shader** (v1.21 reworked v1.20's shader-uniform approach). `pushQuad` computes per-*vertex* colour + alpha from a per-beam `mat = {h,s,l, baseRgb, opacity, absorbK, driftPerPx}` via `beamRgbAt(mat,t)`/`beamAlphaAt(mat,alpha,t)`: opacity is a constant alpha multiply, absorption is `exp(-t·absorbK)` (t = the vertex's cumulative path px), hue drift rotates the HSL hue by `t·driftPerPx` and re-runs `hslToRgb`. This keeps the **vertex layout at 8 floats** (shared with rings + phosphor + `appendPhosphorQuads` — do NOT expand it; that's the black-screen hazard) and makes every property **per-beam** with no shader change. The GPU interpolates linearly within a segment; hue rotation across a *very* long single bounce-leg cuts a slight RGB chord (subdivide later if it matters).
- **Master × per-beam trim model.** Globals `S.beamAlpha/beamAbsorb/beamHueDrift` (Modulation targets, "Beam Material" group master sliders) combine with per-beam arrays `S.perBeamOpacity[]`(×,def 1) `S.perBeamAbsorb[]`(×,def 1) `S.perBeamHueDrift[]`(+,def 0): effective opacity=master×trim, absorb=clamp(master×trim,0,2), hueDrift=master+trim. Arrays sized by `ensurePerBeamMaterial(n)` (mirrors `ensureSpeedArrays`), rebuilt in the editor by `rebuildPerBeamEditor()` (chip strip + selected-beam trim sliders; `selectedBeam` is UI-only). Persisted in scene+preset, element-wise lerped in transitions, reset via `GROUP_RESETS.beamMaterial`.
- **Wave-field Prism + Fog** (`S.field.colorMode==='prism'`, `S.field.fog`): Prism (mode 3) computes each RGB channel from the displacement at a 120°-offset cosine phase → soft chromatic gradients (the generic per-channel-phase-offset technique, à la Silexars' "Creation"; independently written, RESEARCH.md §22). Fog lifts calm (low-|displacement|) regions with a slow cosine-drifting haze tint instead of black. Both driven by a `u_ptime` (seconds) uniform on `waveColorProg`; `fieldFog` is a `MOD_PARAMS` target.
- The render loop is `loop()` (try/catch + rAF rescheduling + error badge) wrapping `loopBody()` (the actual frame). A throwing frame must never stop the loop — keep that structure. `Voidulator.step(t)` drives `loopBody` directly for tests (rAF doesn't fire in hidden tabs).
- `applyModulation()` must run **before** the rotation/phase integration in `loopBody()` (so a modulated `rotationSpeed` actually spins faster) and `restoreModulation()` **after** `drawOverlay()`/`captureRecFrame()`. Don't reorder.
- **Segments (v1.23, replaced Pulse).** The beam fragment shader composites up to `MAXSEG` (8) soft-edged segment bands over the solid beam. Non-drift segments tile one global cycle — phase `fract(v_t·u_invSegWl − u_segScroll − start_i)`, active when `< width_i`; drift segments (`u_segDrift[i]`) scroll on their own `fract(v_t·u_segInvWl[i] − u_segTime·u_segRate[i] − start_i)`. Coverage is a periodic soft band around each segment's centre (softness×width); higher-index segments `mix()` over lower, gaps fall back to the beam colour; `u_segCount<1.5` ⇒ solid (a single segment is never a cycle). Two runtime-only clocks in `loopBody`: `S.segScroll` (global cycle offset, integrated from `speed/wavelength`, wrapped to [0,1) — continuous under modulation, don't replace with raw `time×speed`) and `S.segTime` (bounded seconds, for drift). Segment arrays are built + uploaded once in `uploadBeamUniforms()` via reused `_seg*` `Float32Array` scratch + `segLayout()` (normalised widths/starts). `readSegments()` reads the new shape or migrates old pulse fields; `lerpSegments()` interpolates (per-field when counts match, snap at t=0.5 otherwise). UI: `rebuildSegStrip()`/`syncSegmentsUI()`, `selectedSeg` is UI-only.
- `buildShape()` floors the room radius at 10px (`safeR`) — a hidden/collapsed stage reports near-zero size and a negative radius makes canvas `arc()` throw. `resize()` floors the canvas backing store at 2px for the same reason.
- The canvas is sized by `resize()`, called on `window.resize` **and** a `ResizeObserver` on the stage. The observer is essential: it recovers the canvas if the first `resize()` ran before layout settled (otherwise it sticks at the 2px floor → blank stage), and it catches reflow / mobile address-bar changes that don't fire a window resize.
- Wall bending: `buildShape()` caches unbent corners in `S.baseVertices`; `bendWalls()` re-derives both `S.vertices` (drawing/point-in-room polyline) and `S.wallArcs` (collision). **Collision in bent regular/random rooms is analytic**: `buildWallArcs()` turns each wall into a true circular arc (sagitta = bend × len × 0.3); `firstHitArcs()` solves one quadratic per wall and `computePath` reflects off `arcNormal()` — never reintroduce subdivided-segment collision, it caused both lag (720 segment tests/bounce) and normal-step jitter. The polyline samples the SAME arcs so visuals always match physics. Always change bend through `bendWalls()`, never `buildShape()` (re-randomizes Randomgon). Circle, blob, parabolic, ellipse are exempt (`wallArcs` null → `firstHitPoly`).
- Beam vertex layout is **8 floats**: x, y, t, r, g, b, alpha, edge (cross-beam −1…+1, drives the edge-gradient falloff). `stride = 8*4` and `vertCount/8` must stay in sync with `pushQuad`/`pushShape` writes — grep for all of them if you ever change the layout again.
- New UI labels in the modulation/beat/MIDI/record/glow panels are English-only (no `data-i18n` keys yet); add keys to all four language tables if you internationalize them.
