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
- `compositeWithBloom`: blit scene (blend off), then additive blit (`gl.ONE, gl.ONE`) of `bloomTexA × strength`, then `setBlendMode(S.blendMode)` to restore the state beams expect.
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

`.github/workflows/smoke.yml` runs `tests/smoke.mjs` on every push: headless Chromium (SwiftShader WebGL2) loads the app, drives frames via `Voidulator.step()`, exercises all seven room shapes plus trails/bloom/phosphor, and fails on console errors, GL errors, or a black canvas. Run locally with `npm install playwright && npx playwright install chromium && node tests/smoke.mjs`.

## Deployment

Hosted at [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se) via GitHub Pages (CNAME in repo). Push to `main` → live in seconds. No CI needed.

**Service worker is network-first** (`sw.js`): the network copy always wins when reachable; the cache is only an offline fallback. This is deliberate — a cache-first SW once served a broken `index.html` to all visitors indefinitely, regardless of deploys. Do not change the strategy back to cache-first. The `CACHE_NAME` version only matters for clearing old caches, not for delivering updates.

## What to watch out for

- The `S` object snapshot in `saveScene()` must deep-clone arrays (emitter positions, beam colors) — shallow copy causes all scenes to share references.
- `requestAnimationFrame` IDs are tracked in `rafId`; always cancel before re-requesting to avoid duplicate loops.
- Audio context must be created on a user gesture; `audioToggle` handles this gate. Same for `requestMIDIAccess` (the Enable MIDI button).
- The `spread` value (beam fan angle) is in degrees in `S` but converted to radians before the ray-trace loop.
- Beam shader uniforms are uploaded in exactly ONE place: `uploadBeamUniforms()`. It used to be three copy-pasted blocks, and a partial refactor of one copy black-screened the live site. Never duplicate it again. **Exception by design:** `drawBeamGeometry()` re-sets a few uniforms to *neutral* for the phosphor pass (`u_pulseOn=0`, `u_edgeIntensity=0`, and — since v1.20 — `u_beamAlpha=1`, `u_absorbK=0`, `u_hueDriftK=0`) so wall glow ignores beam-path effects. Add any new *beam-path* uniform to both the upload site AND that phosphor-neutralize block.

## Beam material + Wave-field colour (v1.20)

- **Beam material** (`S.beamAlpha`, `S.beamAbsorb`, `S.beamHueDrift`): the beam fragment shader now varies colour/alpha along the path using `v_t` (cumulative px travelled — already interpolated for the pulse). `u_beamAlpha` = global opacity multiply; `u_absorbK` = `pow(absorb,1.5)*0.008` haze attenuation (`exp(-v_t·k)`, a per-beam brightness gradient through bounces); `u_hueDriftK` = `hueDrift/360/1000` hue rotation per px (uses the same Hocevar hsv helpers as the trail shader). All three are `MOD_PARAMS` targets. Note: hue drift is a no-op on desaturated (white/grey) palettes — it rotates hue, so it needs colour to act on; opacity's visible magnitude is capped by 8-bit saturation in dense overlap (very visible in sparse/additive scenes — the intended use).
- **Wave-field Prism + Fog** (`S.field.colorMode==='prism'`, `S.field.fog`): Prism (mode 3) computes each RGB channel from the displacement at a 120°-offset cosine phase → soft chromatic gradients (the generic per-channel-phase-offset technique, à la Silexars' "Creation"; independently written, RESEARCH.md §22). Fog lifts calm (low-|displacement|) regions with a slow cosine-drifting haze tint instead of black. Both driven by a new `u_ptime` (seconds) uniform passed into `waveColorProg`; `fieldFog` is a `MOD_PARAMS` target.
- The render loop is `loop()` (try/catch + rAF rescheduling + error badge) wrapping `loopBody()` (the actual frame). A throwing frame must never stop the loop — keep that structure. `Voidulator.step(t)` drives `loopBody` directly for tests (rAF doesn't fire in hidden tabs).
- `applyModulation()` must run **before** the rotation/phase integration in `loopBody()` (so a modulated `rotationSpeed` actually spins faster) and `restoreModulation()` **after** `drawOverlay()`/`captureRecFrame()`. Don't reorder.
- `S.pulsePhase` (radians, runtime-only) is the pulse clock: integrated in `loopBody` from `pulseFreqCP100 × pulseSpeed`, uploaded as `u_phaseTime`. Don't reintroduce a raw `time × speed` term in the shader — it drifts in long sessions and jumps when speed is modulated.
- `buildShape()` floors the room radius at 10px (`safeR`) — a hidden/collapsed stage reports near-zero size and a negative radius makes canvas `arc()` throw. `resize()` floors the canvas backing store at 2px for the same reason.
- The canvas is sized by `resize()`, called on `window.resize` **and** a `ResizeObserver` on the stage. The observer is essential: it recovers the canvas if the first `resize()` ran before layout settled (otherwise it sticks at the 2px floor → blank stage), and it catches reflow / mobile address-bar changes that don't fire a window resize.
- Wall bending: `buildShape()` caches unbent corners in `S.baseVertices`; `bendWalls()` re-derives both `S.vertices` (drawing/point-in-room polyline) and `S.wallArcs` (collision). **Collision in bent regular/random rooms is analytic**: `buildWallArcs()` turns each wall into a true circular arc (sagitta = bend × len × 0.3); `firstHitArcs()` solves one quadratic per wall and `computePath` reflects off `arcNormal()` — never reintroduce subdivided-segment collision, it caused both lag (720 segment tests/bounce) and normal-step jitter. The polyline samples the SAME arcs so visuals always match physics. Always change bend through `bendWalls()`, never `buildShape()` (re-randomizes Randomgon). Circle, blob, parabolic, ellipse are exempt (`wallArcs` null → `firstHitPoly`).
- Beam vertex layout is **8 floats**: x, y, t, r, g, b, alpha, edge (cross-beam −1…+1, drives the edge-gradient falloff). `stride = 8*4` and `vertCount/8` must stay in sync with `pushQuad`/`pushShape` writes — grep for all of them if you ever change the layout again.
- New UI labels in the modulation/beat/MIDI/record/glow panels are English-only (no `data-i18n` keys yet); add keys to all four language tables if you internationalize them.
