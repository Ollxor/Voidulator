# Changelog

All notable changes to Voidulator will be documented in this file.

## [1.38.0] - 2026-07-31

### 🩹 Beat detection was completely dead at the default setting
Audio-reactive effects and beat detection "didn't work well". They didn't work at all out of the box, and the reason was a self-inflicted one: **at the default Sensitivity of 4, beat detection never fired a single time.**

Sensitivity multiplied each band's energy and then hard-clamped the result to 1.0. At 4, any normal-loudness music pinned every band at exactly 1.0 — measured 100% clipped with a standard deviation of zero. The beat detector looks for a spike above the recent average, and a signal with no variance has no spikes, so it sat silent. The same clamp flattened the Modulation Matrix's audio sources (63% clipped at the default), which is why routing audio to effects produced so little movement. Counter-intuitively, *lowering* Sensitivity was the only thing that made either work.

Measured against a synthetic 128 BPM techno track, 20 seconds, ~43 kicks:

| Audio Sensitivity | 0.5 | 1 | 2 | 3 | 4 (old default) | 5 |
|---|---|---|---|---|---|---|
| Beats detected — before | 40 | 42 | 7 | 0 | **0** | 0 |
| Beats detected — after | 42 | 42 | 42 | 42 | **42** | 42 |

What changed:
- **Beat detection no longer reads a Sensitivity-scaled signal at all.** It now uses the true, unscaled acoustic energy, so where you park that slider can't break it — hence the flat row above.
- **A dedicated narrow kick band (40–120 Hz)** drives detection instead of the general "bass" band. With a snare added on beats 2 and 4, detection still tracks 42/42 kicks rather than double-triggering.
- **Bands are now defined in Hz** (bass 20–250, mid 250–2000, high 2000–16000) rather than as fractions of the FFT bin array. The old scheme made "bass" mean 0–3400 Hz, which swept in snares, vocals and stabs.
- **FFT size raised from 128 to 2048**, giving ~23 Hz resolution instead of ~375 Hz — a kick and a vocal previously landed in the same bin.
- **A soft knee replaces the hard clamp**, so pushing Sensitivity up now compresses gracefully instead of pinning at 1.0 and going flat. Modulation sources keep their movement.
- **The default Sensitivity is now 1.5.** Existing saved scenes keep whatever value they had — and thanks to the first item, beat detection works regardless.
- **The adaptive threshold compares against preceding frames only.** The current sample used to be added to the history before being tested against its own average, blunting the very spikes being looked for.

Also verified: zero false positives on silence and on a sustained tone with no transients, and correct tracking from 100 to 174 BPM (house through drum'n'bass). Beat Sensitivity has a wide usable plateau — 1.05 through 1.8 all score full marks, with the 1.4 default comfortably centred; 2.0 and above starts dropping beats.

The in-app hints now explain the calibration too: set Sensitivity so the Level bar *moves* rather than sitting pinned, and lower Beat Sensitivity for more beats.

## [1.37.0] - 2026-07-31

### ⚡ Cut the two largest sources of per-frame garbage
No visible change — the rendered output is bit-for-bit identical. Both of these ran once per beam segment (~670 segments/frame at maximum settings, so roughly 40,000 short-lived objects a second each):

- **`computePath` no longer clones the segment start point.** The value it was copying is already a private copy that the tracing loop only ever reassigns, never modifies in place, so the copy was pure waste. (The code now carries a warning: if anything ever does start modifying that value in place, the copy has to come back — ring ray caches hold these segment objects across frames, so an in-place edit would silently rewrite already-cached geometry.)
- **The depth-sort staging objects are pooled** instead of rebuilt every frame.

**Honest note on the speedup: there isn't a number here, because this machine couldn't produce a trustworthy one.** Timing the same unmodified build three times gave medians of 27 ms, 2.8 ms and 0.5 ms, with samples inside a single run ranging 3.7 ms to 205 ms. Switching to paired sampling (both builds running at once, measured alternately) didn't help — the new build won 9 of 15 paired rounds, which is chance. Earlier runs suggesting "~58%" are inside that noise and aren't quotable. What is verified is that the allocations are gone and the output is unchanged; any real timing needs an idle machine with hardware GL.

Correctness was checked properly even though the timing wasn't: output is bit-identical to the previous build across beams in four room shapes plus spinning rings, and the pooling was additionally tested with the segment count swung 672 → 28 → 672 repeatedly, which is exactly where a stale-reuse bug would surface. The comparison harness itself was validated first by running a build against itself — worth noting because the first attempt at this test was silently broken (both pages shared saved state, so a build differed from *itself*) and would otherwise have reported a false regression.

## [1.36.0] - 2026-07-31

### ⚡ Performance pass — ring spin is up to 25× cheaper
No visible changes; this release is entirely about CPU and memory.

- **Ring spin (the big one).** With 2 or more ring emitters and Spin on, every frame re-traced 360 rays per emitter through the full bounce engine, because the emitters had moved and invalidated the ray cache — 3–9 ms/frame, up to half a 60fps budget, and the app's single most expensive operation. In a **circle** room this turns out to be avoidable *exactly*: a circle is rotationally symmetric about its centre, and the spin code already re-places each emitter at its own preserved radius, so the path from a rotated emitter **is** the path from the unrotated one, rotated. Rays are now traced once per radius and rotated at draw time; pure spin never invalidates the cache. Measured **90–98% faster** (7.8 ms → 0.75 ms, 9.2 ms → 0.33 ms, 9.2 ms → 0.19 ms across three configurations). Non-circular rooms aren't rotationally symmetric, so they deliberately keep the original behaviour.

  This is the kind of change that caused the v1.29 jittery-beam bug, so it was built as a mathematical identity rather than an approximation, and verified as one: frame-to-frame brightness discontinuity across 200 spinning frames is statistically identical to the old code (same number of >5% jumps, zero >15% jumps in both), and all room-shape × spin × emitter-count combinations still render. Worth recording for anyone revisiting this — the output is deliberately *not* compared bit-for-bit against a fresh trace, because tracing from a rotated canonical point differs by ~1e-13 and billiard paths amplify that over 8–16 bounces; that's a different arrangement of the same chaotic system, not instability, which is why the jitter measurement rather than a pixel diff is the correct check here.

- **Rainbow rings** called `hslToRgb` once per ray, per ring, per emitter — up to ~46,000 calls a frame at 64 rings, each also allocating a throwaway array. Replaced by a table rebuilt only when the global hue/saturation/lightness offsets actually change. Verified byte-for-byte identical output, including with those offsets animated every frame.

- **Overlap only** held two full-resolution textures (~66 MB together at 4K) for the whole session after first use; they're now released as soon as the mode is switched off.

- **Attribute locations** are memoized like uniform locations already were — `drawPostQuad` was making a string-keyed GL query on every call, several times per frame.

- **The 2D overlay** no longer clears itself on frames where it's already blank (fullscreen, hide-UI, emitters hidden), which was a full-canvas clear per frame to erase nothing.

- **Ring colour** was resolved once per emitter although it only depends on the ring.

## [1.35.0] - 2026-07-31

### ✨ Overlap only
New **Overlap only** toggle (top Beams section, next to Blend mode) hides everything except where beams/rings actually cross — a **Min overlap** stepper sets how many need to stack up (2 = any crossing, higher = only denser knots).

Built as a second render pass rather than a colour trick: the same beam/ring/phosphor geometry is drawn again into a coverage texture, every fragment adding a small fixed amount with additive blending (a standard 8-bit render target clamps additive blending at 1.0, so a naive "+1 per shape" scheme couldn't count past the first overlap — each fragment instead contributes 1/64, keeping counts up to 64 distinguishable without needing a float render target). A mask pass then blacks out anything under the threshold, running on the fresh beam draw *before* Trails/Bloom/Kaleidoscope see it, so those compose with it automatically — Bloom glows only the surviving overlap regions, Kaleidoscope folds the already-masked result exactly like it folds everything else.

Scope for this pass: Beams and Rings only (Wave field and Generative have no discrete shapes to overlap), and **no effect yet while Trails is on** — masking only the fresh per-frame contribution inside the trail ping-pong's write step needs more restructuring than this pass covered; the toggle stays visible but is a no-op there for now rather than silently half-working.

Verified, not assumed: swept the Min overlap threshold from 2 to 8 on a 6-beam scene and confirmed strictly decreasing lit-pixel coverage at each step (28% → 5% → 0.02%), confirmed Overlap+Bloom and Overlap+Kaleidoscope (and both together) all render without error, and confirmed the actual toggle/stepper UI controls update state correctly via real clicks.

## [1.34.0] - 2026-07-30

### ✨ Trails — wall Reflect mode, alongside Clip
Followed up on the "Contain in room" toggle from v1.32.0 with the option originally set aside as too big a lift: **trails can now actually bounce off the walls, like beams and the wave field already do**, not just stop dead at them. The old On/Off toggle is now a three-way **Walls** select — **Off** (today's default, unclipped), **Clip** (v1.32's behaviour, unchanged), or **Reflect** (new).

Reflect works by building a second field alongside the existing room-shape mask: for every point in a grid, the nearest point on the room's boundary and the wall's normal there (computed the same way beam collision already derives a wall normal from the nearest polygon edge — circles get an exact analytic reflection, no search needed). When the trail feedback's zoom/spin/drift would sample from outside the room, the shader reflects that sample position across the nearest wall instead of clipping it to black — up to two bounces, since a single reflection can undershoot near concave walls. This is a genuine approximation, not a physically exact multi-bounce simulation (a real bounce needs the incoming direction, which a pixel position alone doesn't carry) — most accurate on simple, convex rooms, and reasonable everywhere else.

Verified, not assumed: confirmed Off and Clip are byte-for-byte unchanged from v1.32 (same leak reproduction, same instant cleanup). For Reflect, since positive zoom on a convex room provably never samples outside the wall in the first place (shrinking any interior point toward an interior centre point stays interior — the original corner-leak bug turned out to be about *output* pixels outside the room showing magnified interior content, not about samples crossing the wall, which is exactly why the v1.32 output-position clip was already sufficient for that case), the differentiating tests specifically used negative zoom (samples pulled from *outside* the wall) and pure rotation on a hexagon (which can cross a non-circular boundary at constant radius) — both showed Reflect producing measurably different, more energy-preserving results than Clip (2.3× brighter interior under negative zoom; broader lit coverage under rotation), on both the analytic circle path and the general polygon path, with zero corner leaks and zero GL errors throughout.

## [1.33.0] - 2026-07-30

### ✨ Click a label to reset that control
Every numeric slider in the panel (~60 of them, across every group — Beam material, Beam glow, Segments, Rings, Wave field, Generative, Trails, Glow, Kaleidoscope, Phosphor walls, Scenes, Audio, Beat Detection, Emitters) now resets to its factory default when you click its label — the same behaviour four Beam Shapes labels (Density/Size/Flow/Spin) already had, now everywhere.

Rather than hand-writing ~60 near-identical click handlers, this is one small data-driven mechanism: labels carry a `data-reset="<id>"` attribute, a single delegated click listener looks up that control's default and writes it into the slider, then dispatches a real `input` event — which replays the *exact* handler a manual drag would have fired, so every side effect (paired number-input sync, `rebuildSegStrip()`, `applyEmitterCluster()`, autosave, whatever that control already does) happens correctly with no duplicated logic to keep in sync.

Defaults are read from `FACTORY` — the same deep-cloned snapshot the per-group ↺ reset buttons already use — rather than a second hand-copied set of numbers. That mattered in practice: while wiring this up, two controls turned up with a stale fallback-on-NaN literal in their existing input handler that didn't match the real shipped default (`fieldGain` handler fell back to 1.4, real default 2.5; `audioSensitivity` fell back to 1.5, real default 4) — reading live from `FACTORY` sidesteps that class of bug entirely instead of reproducing it. A handful of controls (`reflect`/`bounces`/`beamWidth`/`transitionDuration`/`emitterRot`/`emitterSpin`) aren't part of the FACTORY snapshot at all (a pre-existing gap, same one `GROUP_RESETS.bonus`/`roomTitle` already have) and use a literal default instead; `screensaverDuration` has no backing state whatsoever (read straight from the DOM), so it does too.

Deliberately excluded: per-beam trim sliders (Opacity/Absorption/Hue drift under Beam Material) already have their own dedicated reset button for the selected beam; per-segment-item sliders (Width/Opacity/Softness/Length/Speed under the segment strip) are selected-item-dependent with no single global default to return to. Both would need a different, item-aware design, not a bigger version of this one.

Verified, not assumed: cross-checked all 60 `data-reset` ids against the map and against real DOM elements (exact match, no orphans either direction); scripted clicks confirmed correct resets across a representative sample spanning every category, including the two corrected fallback-literal bugs above; the one non-trivial transform case (`speedMultiplier`'s slider position and stored value are related by a logarithmic curve, not equal) was checked against the app's own pre-existing, independently-coded `bonus` group-reset button and produces an identical result; and the user's own example control (Trails → Zoom) was confirmed with a real mouse click in a live browser, not just a script.

## [1.32.0] - 2026-07-30

### ✨ Trails — Contain in room
With Kaleidoscope on and long trails using the Zoom/Spin/Drift feedback controls, trail content could escape past the room's walls into the square canvas's corners — the feedback transform re-samples the trail buffer each frame with a pure UV scale/rotate/shift that has no idea where the walls are, so a strong zoom keeps pulling content out to ever-larger radii. Because the kaleidoscope fold preserves radius-from-centre and only folds the angle, whatever escaped out there got folded straight back into the visible pattern — a leak, not a rendering bug in the fold itself.

New **Contain in room** toggle (off by default) in the Trails group clips the trail buffer to the actual room shape (circle or polygon, whatever's active) — any pixel outside the room reads as black every frame, so escaped content can never accumulate there regardless of how aggressive the zoom/spin/drift settings are. Reuses the same rasterize-shape-to-a-texture technique already proven for the wave-field's boundary mask, with simpler framing (the trail buffer's own square-canvas UV space, no padding/centroid math needed).

This clips rather than reflects — an earlier "make trails bounce off the walls like beams" idea was scoped and set aside: it would need a new per-pixel wall-normal field to approximate, real bounce direction isn't recoverable from a pixel's position alone, and it'd still only be an approximation, especially near corners. Clipping was the cheaper, exact fix for the actual complaint (trails escaping the room), so that's what shipped.

Verified, not assumed: reproduced the leak first (circle room, Kaleidoscope on, Zoom 0.35, 150 frames → all four canvas corners fully saturated, 255/255), then confirmed the toggle both cleans up an already-escaped buffer immediately (3 frames after enabling → corners back to 0) and prevents the leak entirely when on from the start (150 frames, same aggressive zoom → corners stay 0 throughout). A separate large-region sample confirmed the room's interior renders fully unaffected (100% coverage, avg brightness 254/255) — the toggle bounds the effect without dulling it.

## [1.31.0] - 2026-07-30

### 🩹 Fixed stretched image on Android fullscreen
Going fullscreen on Android stretched the room out of square instead of keeping it a centred square. Root cause: the fullscreen `.stage` rules used `position: fixed; inset: 0`, which pins all four edges and makes both width and height definite — leaving `aspect-ratio: 1/1` nothing to compute, so it was silently ignored and the stage just filled the whole (non-square) viewport.

Fixed by switching to `position: fixed` with explicit `width`/`height: min(100svw, 100svh)` (centred via `top/left: 50%` + `translate(-50%, -50%)`), which sizes a true square directly instead of relying on `aspect-ratio` to rescue a pre-stretched box. Getting this right took three passes, each caught by testing a different screen shape rather than assuming one fix covered all of them: an unconditional `min-height: 100vh` (left over from the old rule) was still forcing height above the square on short/wide windows; the same floor also existed in the plain desktop fullscreen rule, only exposed by a landscape-phone-width viewport falling outside the mobile breakpoint; and a leftover `max-width: calc(100vh - 16px)` from the base (non-fullscreen) `.stage` rule was silently shaving width down in both the mobile and hide-ui fullscreen rules. All three were overridden with matching `!important` weight, reasoned through via CSS specificity against the native `:fullscreen` pseudo-class rules (which can't easily be triggered headlessly to test directly).

Verified, not assumed: measured actual computed styles and canvas backing-store size across desktop-with-panel (1600×900 → 884×884), desktop + hide-ui (1600×900 → 900×900, previously 884×900), phone portrait (412×915 → 412×412), and phone landscape (915×412 → 396×396, previously 396×412) — all perfect squares, zero GL errors after a rendered test frame in each.

## [1.30.0] - 2026-07-27

### ✨ Beam glow — a proper menu for edge softness, plus new effects
Edge softness/intensity were two loose sliders in the main panel; they now have their own **Beam glow** group, alongside three new controls:

- **Shape** — the edge fade now follows a chosen curve: **Soft** (the original ease, byte-identical default), **Linear** (constant-rate fade), or **Gaussian** (stays bright longer, then tapers into a glowy tail).
- **Tint** — the fading edge can shift toward a chosen colour instead of just dimming, for a coloured halo around the beam's own colour (toggle + colour picker + amount).
- **Hot core** — an independent bright, whitened centreline down the middle of the beam (width + intensity) — the classic real-laser look of a searing core inside a softer glow. Off by default; existing beams look unchanged until it's turned on.

Tint amount, core width and core intensity are new Modulation Matrix targets. Fully persisted in scenes/presets, interpolated through transitions, translated in all four languages.

Caught and fixed during development: the hot core initially rendered with zero visible effect. Root cause was `smoothstep(coreWidth, 0.0, d)` — reversed-order arguments (edge0 > edge1), which the GLSL spec explicitly leaves undefined, and this driver evidently just returns 0 for it. Rewritten with correctly-ordered arguments (`1.0 - smoothstep(0.0, coreWidth, d)`), same result, well-defined. Verified after the fix with a saturated (non-white) test beam — an all-white test beam had also been masking the effect, since "mix toward white" is a no-op when the color is already white (the same false-negative class documented from earlier hue-drift testing).

## [1.29.0] - 2026-07-27

### 🩹 Fixed jittery beams in Vesica Piscis
Beams in the Vesica Piscis room would occasionally take a very long "step" a couple of bounces after reflecting, breaking the smooth flow — a long-standing complaint. Root cause: Vesica Piscis is the only curved room shape that was represented as a 258-segment polygon approximation instead of true analytic arcs (every other bent/curved shape already uses exact arc math for collision — Vesica just hadn't been ported to it). Near the room's two sharp cusps, reflecting off the wrong one of many near-identical tiny segments sent beams on a wildly wrong path, compounding on the next bounce into what read as a sudden large jump.

Fixed by giving Vesica Piscis the same true analytic-arc collision every other bent room already has (exact circle-ray intersection, exact normal at the hit point) — the 258-point polygon is still used for the drawn boundary/wave-field mask, but beams now reflect off the two exact circles the shape is built from.

Verified, not assumed: a fine angular sweep (20,000 emission angles × 8 bounces) showed the analytic-arc fix cuts large segment-length discontinuities by 86% (232 → 32 occurrences) versus the segment approximation. More importantly, measured live in the running app across 400 animated frames of continuous beam rotation: the old code had 12 frames where the rendered beam pattern's total brightness jumped by more than 15% in a single frame (visible jank); the fixed code had zero, with average frame-to-frame variation 2.6× smaller and worst-case jumps 2.8× smaller. A small residual sensitivity remains right at the cusps themselves — that's genuine billiard-dynamics behavior inherent to any exact simulation of a sharp corner, not fixable without rounding off the cusps (which would defeat the shape's whole point), and it's now roughly a tenth as frequent as before.

## [1.28.0] - 2026-07-27

### 🩹 Removed the room boundary line for good
The room boundary was drawn permanently, always, in every emission mode except Wave field/Generative — a thin black stroke traced around the room shape at rest. Because it's static in room-space while the beam/kaleidoscope pattern rotates underneath it, bright pattern content periodically swept across that fixed black line, reading as a stray line cutting across the animation that appeared to pulse in and out of sync with the rotation — worst with Kaleidoscope and Wave field, where the room is densely filled with bright content right up to the wall. This is a long-standing complaint (previously attempted, not resolved).

Fixed by removing the resting stroke entirely — the boundary is now drawn **only** as the brief amber flash that already existed for visual feedback while editing room shape/eccentricity/wall-bend, and nothing at rest, in every emission mode (previously Wave field/Generative had a special-case skip; now all modes are consistent, and it's the *right* behavior, not a mode-specific patch).

Verified, not assumed: measured pixel brightness precisely along the traced room boundary vs. just inside it, at points where the pattern is actually bright. Manually re-injecting the old stroke showed the boundary point averaging **95.9 units darker** than 6–14px inward at bright spots (some forced to literal pure black, `rgb(0,0,0)`, immediately next to clearly-lit content) — the exact signature of a black line cutting across the animation. With the fix, that dip drops to **14.5** (an 85% reduction, consistent with ordinary pattern variation, no forced-black pixels). Also confirmed no rotation is ever applied to the boundary itself, and no collateral breakage across all 10 room shapes in both Beams+Kaleidoscope and Wave-field+Kaleidoscope.

## [1.27.0] - 2026-07-27

### 🩹 Readable panel in every language, new Trail brightness, faster render loop
- **Panel labels no longer run underneath their own sliders.** The label columns were fixed-width with `white-space: nowrap`, so anything past ~10 characters was clipped — 13 labels in English and **26 in French** (which needs up to 223px in an 85px column). Labels now wrap instead of clipping and the columns are a little wider; measured 0 clipped labels in all four languages, with sliders still ≥110px. The four Trails feedback controls are now simply **Zoom / Spin / Drift X / Drift Y** — inside the TRAILS group the "Feedback" prefix was redundant, and the short names fit on one line in every language.
- **~20 panel labels were never translated at all** (Global speed, Reflectivity, Beam count, Blend mode, Mirror, Emitters, Speed range…) — they had no `data-i18n`, so they stayed English no matter the language. Most already had translations sitting unused in all four tables; the rest were written. 
- **New: Trails → Brightness.** Dims the accumulated trail *independently of how long it lasts*, so you can keep beams crisp and bright while their smear sits back quietly. (Length still controls the fade rate — this is a genuinely separate axis, not a second decay knob.) It's a Modulation Matrix target too. This value was already being saved in every scene and preset since long ago but was silently ignored by the renderer; existing scenes now honour it.
- **Faster render loop:** the post-process passes were re-resolving ~30 shader uniform locations *by string, every frame* (~1800 lookups/sec at 60fps). They're now cached per program. Verified pixel-identical on deterministic scenes.
- Fixes: the emitter **Geometric** toggle showed the word "Geometric" instead of On/Off after any language change; the mic button reverted to "Start listening" while still listening; the ▶️ on the Tutorial button was dropped when translating; two hint texts had drifted out of sync with their translations (one contradicted the tooltip about what ring lifetime counts). Removed dead state (`emitterSymmetry`/`symRadius`/`symAngle`) and a lookup for an element id that doesn't exist.
- **New CI check — `tests/i18n-audit.mjs`**, running ahead of the smoke test (pure text analysis, no browser, sub-second). Fails on HTML↔English drift, keys missing from any language, panel labels with no `data-i18n`, state-toggle buttons carrying `data-i18n`, dead panel-registry entries, and — after a stray apostrophe in a French string blanked the whole app mid-change — any inline `<script>` that doesn't parse.

## [1.26.0] - 2026-07-26

### 🎨 Three new Blend modes + Segment speed recalibrated
- **Blend mode** now offers **Screen**, **Lighten** and **Difference** alongside the existing Normal/Additive:
  - **Screen** — a softer brighten than Additive: eases toward white instead of overshooting past it.
  - **Lighten** — overlapping beams show whichever is brighter instead of summing, so dense or kaleidoscoped scenes stay colorful instead of washing out to flat white the way Additive can.
  - **Difference** — new beams erode/carve into whatever's already drawn (trails, glow) rather than adding to it. This one is genuinely experimental and worth knowing going in: it only shows anything once there's existing brightness to carve into (a fresh scene with no trails stays black), and it **self-extinguishes fast** — a few frames of Difference against built-up trails and the screen settles to black and stays there, since it can only ever subtract, never add. Best used as a brief live flourish (build up glow under Normal/Additive, then flip to Difference for a moment) rather than a steady look.
  - _Under the hood: `gl.blendEquation` now also uses `MAX` (Lighten) and `FUNC_REVERSE_SUBTRACT` (Difference) alongside the existing `FUNC_ADD`. Fixed a latent bug this surfaced: the bloom glow-layer composite only reset `blendFunc` between draws, silently inheriting whatever equation the beam blend mode had left active — harmless while every mode used `FUNC_ADD`, but would have broken bloom under Lighten/Difference. Now resets both explicitly._
- **Segment speed** (both the global Speed slider and the per-segment Drift speed) was only visually useful in roughly its bottom quarter — capped the range at 225 (was 900) so the whole slider now covers the useful range.

## [1.25.0] - 2026-07-25

### 🌬️ Trails: Feedback drift + Beat echo
Completes the Feedback trio from v1.24 (zoom, spin) and adds a rhythmic option:

- **Feedback drift X/Y** — shifts the fading trail sideways a little each frame, like wind pushing it in a direction. Combine X and Y for a diagonal drift; pair with zoom/spin for a tunnel that also blows sideways.
- **Beat echo** — on each detected beat, the trail briefly holds near-frozen instead of continuously fading, so a rhythmic ghost "stamps" and decays before the next beat. Rides the existing beat-detection envelope (needs **Beat Detection** on + audio active), and its decay pace follows Beat Detection's own **Decay** control — no separate pacing to learn. 0 = off, unaffected.
- All three are new **Modulation Matrix** targets (`Trail drift X/Y`, `Trail beat echo`), saved in scenes/presets, interpolated through transitions, i18n (en/es/pt/fr) + tooltips.
- Also fixed: the Trails panel hint (`hintTrails`) had gone stale in all four languages since before v1.24's Feedback zoom/spin shipped — switching language (or re-selecting English) silently reverted the hint text and hid the newest controls' explanation. All four are now current and verified to round-trip correctly across every language switch.

## [1.24.0] - 2026-07-25

### 🌀 Trails: minimum is finally invisible + Feedback tunnels
- **Fixed: Trail Length at minimum now means _no_ trail.** The length→fade curve had a floor of 0.75 — so even at the bottom of the slider, every frame kept 75% of the previous one (a ~10–15 frame smear). It now maps len=1 → fade 0 (previous frame fully cleared, identical to Trails Off) and ramps smoothly to very-long at the top, so the low end of the slider is a genuine range of subtle → short trails instead of jumping straight to a heavy smear. _(Existing scenes' trails may read a touch shorter than before, since the whole curve was recalibrated — nudge Length up if you want the old length back.)_
- **New: Feedback (zoom + spin)** — two sliders in the Trails group that re-sample the fading trail buffer slightly scaled and rotated each frame, so the trails curl into **tunnels, vortexes and spirals**:
  - **Feedback zoom** — `+` pushes the trail outward (expanding tunnel), `−` pulls it inward (falling into a black hole).
  - **Feedback spin** — rotates the trail a little each frame; combine with zoom for a spiral.
  - Both are new **Modulation Matrix** targets — route audio/LFO to Feedback zoom for a tunnel that breathes with the music. Saved in scenes/presets and interpolated through transitions.

## [1.23.0] - 2026-07-24

### 🧩 Segments — Pulse, reimagined
Pulse is gone; **Segments** takes its place and is far more expressive. A beam's length is now a repeating **cycle** you slice into **segments**, each with its own **colour, opacity, width and softness**.

- **1 segment = a solid beam** (the standard look). Click **+** to add segments — the beam splits into a repeating, scrolling cycle. Click any segment in the strip to edit it.
- **A "hole" is just a segment at 0 opacity** — and you can now set the hole's *colour and opacity* independently (e.g. a half-transparent blue stretch, or an opaque dark-red one). This dissolves the old amplitude-vs-opacity confusion: there is no amplitude any more, you set each segment's colour and opacity directly.
- **Colour** per segment can be **Beam** (inherits that beam's own palette colour, so it still works across every beam) or a **Custom** picked colour.
- **Length** (cycle wavelength) and **Speed** (scroll) are global per beam by default. Toggle **Drift** on a segment to give it *its own* Length/Speed — it detaches from the cycle and slides freely through the others for organic, desynced motion.
- Clickable **segment strip** shows every segment proportionally (striped = inherits beam colour, solid = custom, faint = a hole), with the selected one highlighted; **+ / −** add and remove (up to 8).
- **Segment speed** and **Segment length** are new **Modulation Matrix** targets.
- Fully saved in scenes and JSON presets and interpolated through scene transitions. **Old Pulse settings migrate automatically** — every saved scene/preset that used Pulse loads as the equivalent two-segment cycle, so nothing looks different than before until you start editing.
- _Under the hood: the beam fragment shader composites up to 8 soft-edged segment bands over the solid beam; non-drift segments tile one global cycle, drift segments scroll on their own. The 8-float beam/ring/phosphor vertex layout is untouched._

## [1.22.0] - 2026-07-24

### 🧭 Emission-aware panel + true-fullscreen Generative
- **The panel now shows only the controls that apply to the active emission mode.** Switch to **Wave field** or **Generative** and the beam-only controls (Reflectivity, Max bounces, Beam width, Edge softness/intensity, Layer/Blend mode, Beam count, and the Colors / Per-beam Rotation / Beam Material / Pulse / Beam Shapes groups) fold away; the Rings, Wave Field and Generative groups likewise appear only for their own mode. This clears up the old confusion where, say, *Edge softness* or *Blend mode* were on screen in Wave-field mode but only ever affected beams. (Rows/groups declare their mode-family via a `data-emit` attribute; a single `updateEmissionVisibility()` keeps it in sync.)
  - _For the record: Edge softness only bites once **Edge intensity** is above 0 (intensity is the master, softness is its reach) — that gate is unchanged; the control is just no longer shown where it does nothing._
- **Generative now fills the whole window**, edge-to-edge behind the panel, instead of being boxed into the square stage — it's the one mode with no room, so it can go full-bleed. The three shaders gained aspect-ratio correction (`u_aspect`), so tunnels and orbs stay perfectly round on the now-wide canvas instead of stretching into ellipses. Every other mode still uses the square stage.

## [1.21.0] - 2026-07-23

### 🎛️ Per-beam material
- The **Opacity / Absorption / Hue-drift** controls are now **per-beam**, in a new **Beam Material** group. The three sliders at the top are the *master* for all beams (and stay Modulation-Matrix targets); below them, a **Per-beam trim** editor lets you pick any beam from a colour-coded chip strip and dial in its own Opacity (×), Absorption (×) and Hue drift (+). A dot on a chip marks beams you've customised; ↺ resets the selected one.
- So you can, e.g., make one beam a faint hazy ghost while another blazes with a rainbow gradient down its length — each beam its own material.
- Fully saved in scenes/presets and interpolated through scene transitions; new beams start neutral.
- _Under the hood: beam material now bakes into per-vertex colour/alpha on the CPU (was three shader uniforms in 1.20), which is what makes it per-beam while keeping the render path rock-solid — no change to the shared beam/ring/phosphor vertex layout._

## [1.20.0] - 2026-07-23

### 🌫️ Richer colour, gradients & transparency
- **Wave field — Prism colour mode**: a new option in the field's Color selector. Each RGB channel responds to the wave displacement at a slightly offset phase, so the waves separate into soft chromatic gradients and prism-like fringes (the technique behind classics like Silexars' "Creation" — independently implemented on our own wave physics; see RESEARCH.md §22).
- **Wave field — Fog**: a slider that lifts the calm regions of the field into a soft, slowly-drifting haze instead of leaving them black — the waves glow through mist. Pairs beautifully with Prism. Also a Modulation Matrix target.
- **Beams — Opacity**: a global transparency slider for the beams (top of panel). Especially striking with Additive blend, and audio-drivable via the matrix.
- **Beams — Absorption**: beams fade with distance travelled, like light through haze — each beam gains an internal brightness gradient across its whole bounce path.
- **Beams — Hue drift**: rotates the hue continuously along each beam's path (°/1000px) — a colour gradient that flows unbroken through every bounce. This is the "complexity within the beams — gradients and shades" that flat single-colour beams couldn't give.
- All five are saved in scenes/presets, interpolated through transitions, translated in all four languages, and (except Prism, an enum) are Modulation Matrix targets.

## [1.19.0] - 2026-07-23

### 🎚️ Trail interference controls + review-pass fixes
- Two new Trails controls giving direct command of the emergent interference/moiré patterns that thin, slow beams with long trails produce:
  - **Filtering** — *Smooth* (the classic look: the trail buffer bilinearly re-blends sub-pixel detail every frame, which is what feeds the interference) or *Crisp* (pixel-exact re-sampling: sharp trails, no moiré).
  - **Cutoff** — the brightness floor below which a trail pixel cuts to black. Lower keeps faint interference layers alive far longer; higher scrubs the buffer clean sooner. Also a new **Modulation Matrix** target (audio-driven cutoff makes the pattern "breathe").
- Both persist in scenes/presets and interpolate through scene transitions.
- Review-pass fixes: emitter dots no longer drawn over the Generative shader (they have no meaning there); README and CLAUDE.md caught up with the v1.16–1.18 features (Kaleidoscope, Generative gallery, Vesica Piscis).

## [1.18.0] - 2026-07-23

### 👁️ Vesica Piscis room shape
- New room shape: **Vesica Piscis** (Room shape selector) — the classical "eye"/almond lens formed by two equal circles, each centred on the other's circumference, in the canonical √3∶1 height-to-width proportion. Beams, rings, and the wave field all bounce and resonate inside it like any other room.
- The two generating circle centres are marked in the overlay, the same way the ellipse marks its foci.

## [1.17.0] - 2026-07-23

### 🌀 Generative — a shader gallery
- New **Generative** emission mode (Emission selector) — a fifth alternative alongside Beams/Rings/Both/Wave field, standing in for the room simulation with a curated gallery of original fullscreen shaders. Same full-mode-swap pattern as Wave Field: beams/rings step aside, and it composites through the existing Glow and Kaleidoscope pipeline for free.
- Three styles to start the gallery: **Aurora** (domain-warped noise flow), **Tunnel** (a classic polar zoom), and **Orbs** (glowing orbiting point-lights — a callback to the "dreamy pills" style that inspired this feature). All independently written from generic, freely-documented techniques — see RESEARCH.md §22 for the licensing reasoning.
- Controls: **Style**, **Speed**, **Scale**, and **Colour** (a shared cosine-palette hue phase, so every style stays coherent with one dial — Inigo Quilez's classic palette formula, already credited elsewhere in the app).
- Speed and Colour are new **Modulation Matrix** targets.
- Fully saved in scenes and JSON presets, interpolated during scene transitions.

## [1.16.0] - 2026-07-23

### 🔺 Kaleidoscope
- New **Kaleidoscope** post-process (Effects tab) — mirrors the entire final frame into N radial wedges, stacking on top of beams, rings, and the wave field alike. Controls: **Enable**, **Segments** (2–16), **Rotation (°)**, **Spin (°/s)** for auto-rotation, and **Mirror** (on = the classic reflected kaleidoscope fold, off = a plain rotational repeat).
- Rotation is a new **Modulation Matrix** target — route audio or a beat envelope to spin the fold with the music.
- Fully saved in scenes and JSON presets, and smoothly interpolated during scene transitions.
- _Independently written from the standard polar angular-fold technique; math is not copyrightable — see RESEARCH.md §22 for the licensing research behind this one._

## [1.15.0] - 2026-06-22

### Rotation + spin for ring and wave-field emitters
- The **ring** and **wave-field** emitter clusters now have the same **Rotation (°)** and **Spin (°/s)** controls as the beam emitters — set the orientation by hand or let the whole cluster rotate automatically (negative = counter-clockwise). Saved in scenes/presets.
- _Note: spinning **ring** emitters re-traces their reflection paths every frame, so keep Max bounces modest if it stutters. Field spin is cheap._

## [1.14.0] - 2026-06-22

### Emitter cluster geometry + wave-field centering
- **Emitters arrange geometrically again** — adding emitters no longer stacks them in one spot. They form a regular shape (2 = line, 3 = triangle, 4 = square, …) around the room centre, and dragging any one keeps the rest aligned (resizes/rotates the whole cluster).
- **Align** button snaps them into the regular polygon; a **Geometric** toggle turns the drag-follow alignment on/off.
- **Rotation (°)** sets the cluster orientation manually; **Spin (°/s)** rotates it automatically (negative = counter-clockwise). Cluster settings save in scenes/presets.
- **Wave field centering fix** — the field now centres on the room's centroid (its visual middle) instead of the bounding box, so non-symmetric rooms like the triangle no longer look off-centre.

## [1.13.0] - 2026-06-22

### Hover help + clarity fixes
- **Hover tooltips**: hovering a control label, section title, or option now shows a short plain-language explanation of what it does (dotted underline marks the ones with help).
- **"Shape" disambiguated**: the room selector is now **Room shape**, and the beam shape-travelling effect is **Beam Shapes** (it used to also be titled "Shape").
- **Eccentricity** only appears when the room is an Ellipse (it did nothing for other shapes).
- **Wave field**: the room boundary is no longer stroked over the bright field (it was showing as a thin black rim). _Note: the curved black lines inside the field are the wave's real nodal lines, not an error._
- **Bent-wall corners**: widened the arc overlap so beams no longer slip through the sub-pixel gap between two walls at a corner and escape the room.

## [1.12.1] - 2026-06-15

### Fix
- **Canvas could get stuck tiny (blank stage) if the page laid out slowly.** `resize()` only ran on window-resize events, so if the very first layout was late the canvas stayed at its 2px floor and never recovered. A `ResizeObserver` on the stage now re-sizes the canvas whenever its box actually changes — also hardening mobile (address-bar show/hide, panel reflow, orientation).

## [1.12.0] - 2026-06-14

### Audio-reactive wave field + bigger mobile room
- The **Wave Field is now modulatable**: Wave amplitude, Wave frequency, and Wave brightness are new Modulation Matrix targets — route bass to Wave amplitude or the beat envelope to Wave brightness and the field pulses with the music
- **Mobile room is now a proper centred square** instead of a wide letterbox strip, so the room fills the screen and its aspect never shifts as the address bar/viewport changes

## [1.11.0] - 2026-06-14

### Mobile fix + room visibility + distinct wave rings
- **Mobile wave field fixed**: the wave field no longer stretches into a wide ellipse on non-square (mobile) canvases — it now renders into the room's centred square, so circular waves stay circular at any aspect ratio
- **Room outline now visible while editing**: changing Shape, Eccentricity, or Wall bend briefly highlights the room boundary in amber so you can see the shape you're adjusting (it fades back to invisible)
- **Distinct wave rings**: the Wave Field has a new **Waveform** control — Continuous (steady tone), **Rings (pulsed)** which emits distinct expanding rings, or Manual only — plus **Ring rate** and **Ring sharpness** to shape them

## [1.10.1] - 2026-06-13

### Wave field: dedicated emitters
- The wave field now has its **own draggable wave-source emitters** (magenta dots) instead of borrowing the beam emitters — fixes the source not rendering clearly
- Same formation controls as the rings: **emitter count, Geometric arrangement, Center, and Upright**. Adding emitters from a collapsed centre now spreads them into a proper polygon. Persisted in scenes/presets.

## [1.10.0] - 2026-06-12

### 🌊 Wave Field

A whole new emission mode: a **real wave-equation simulation** running live on the GPU inside the room — the genuine physics that geometric rays (beams and rings) can only approximate. Choose **Wave field** in the Emission selector.

- A finite-difference (FDTD) solver evolves the 2D wave equation on a float texture grid. Emitters are continuous wave sources; **click the stage to drop a ripple**, or use the Pulse button
- **Reflecting (Neumann) walls** turn any room into a resonator — the ellipse with a source on a focus, the parabolic resonator, bent rooms — all the cavities now show their true standing-wave and focusing patterns, nodal lines and all. **Absorbing** walls give an open, ripple-tank feel
- Controls: frequency, amplitude, wave speed, damping, brightness, speed× (substeps), wall type, colour mode (spectral / bipolar / mono), and resolution (Low/Medium/High)
- Runs through the existing Glow for a luminous look; works with every room shape; saved in scenes and presets
- **Credit:** the wave-field mode was inspired by [Nils Berglund's](https://www.youtube.com/@NilsBerglund) wave-equation simulations (his code is released under CC0). The simulation here is an independent WebGL implementation.

### Credits / licensing
- Added an attribution comment for the public-domain `rgb2hsv`/`hsv2rgb` GLSL helpers by Sam Hocevar
- Requires `EXT_color_buffer_float`; on the rare device without it, Wave field shows a notice and the other modes are unaffected

## [1.9.1] - 2026-06-12

### 🔧 Rings refinement
- **Clear** button removes all live rings instantly
- **Align** row: *Center* moves the emitter formation's centroid to the room center; *Upright* rotates the formation so the anchor emitter points straight up
- Fade slider removed — fade-out is fixed at 1.3 s
- Corner rendering: ring resolution raised to 360 rays, and wavefront sheets that stay continuous through corners no longer get severed by the bounce-count bookkeeping (very close neighbours always connect; distant crossing branches still don't)
- A collapsed window (0-width canvas) no longer spams GL framebuffer errors

## [1.9.0] - 2026-06-12

### 🪞 Analytic Mirrors Update

#### Bent walls: fixed for real
- Bent walls are now **true circular arcs solved analytically** — one equation per wall instead of 720 subdivided segments. Bent rooms are now as fast as the circle (a bent triangle traces *faster* than the circle: 0.49 ms vs 0.63 ms at 8 beams × 375 bounces) and perfectly smooth: no more segment-normal jumps, no lag
- The drawn wall samples the exact same arcs the physics reflects off, so what you see is what beams hit

#### Rings: lifetime and rendering fixes
- **Lifetime counts wall bounces only** (the center is never a bounce): 1 = first wall hit, 2 = second wall hit, 0.5 = halfway to the wall. A center-emitted ring collapses through the center between wall bounces — that's the wave focusing, not dying
- Rings fade smoothly along their length (per-vertex fade) instead of being cut off
- Folded ring branches that drift close together no longer falsely reconnect (corner-reflection artifact fixed): segments only connect between rays on the same bounce
- **Auto spawn toggle** (default off): rings only appear when you press Activate, unless you turn the randomized scheduler on
- Turning rings off clears all live rings immediately

#### New controls
- **Emission selector** (top of panel): Beams / Rings / Both
- **Center emitters** buttons for both beam and ring emitters — moves the formation's centroid to the room center
- **Room** is its own section (Shape, Eccentricity, Wall bend) — no longer buried in Bonus
- Dual-range sliders: either handle can now push past the other, so stacked markers can be separated in both directions

## [1.8.0] - 2026-06-12

### 🗂️ Workbench Update

#### Panel overhaul
- **Tabs**: All / Beams / Effects / Room / Live / Scenes — the core sliders stay on top, groups filter by tab (remembered across sessions)
- **Search**: filter box that finds any control by name across all tabs, hiding everything else
- **Per-group reset**: a ↺ on each section restores its factory defaults (Scenes and File Presets deliberately have none)
- **Collapse all / expand all** buttons
- **Scene thumbnails**: saved scenes show a snapshot grid — click a tile to load. Thumbs are captured on save, and older scenes get one automatically the first time you visit them

#### More randomness + smoother bends
- Ring **Speed** and **Lifetime** are min/max ranges drawn per ring — slow long-lived rings interleave with fast brief ones
- Beat **hue jump** is a min/max range — varied but bounded color jumps
- The matrix "Ring speed ×" target is now a live multiplier over per-ring speeds
- Wall bend subdivisions now scale to ~720 segments per room regardless of shape (triangle 240/wall) — bend animation is much smoother, at 0.58 ms/frame worst case

## [1.7.0] - 2026-06-11

### 💍 Rings Update

The wave/burst system is reborn as **Rings** — an independent emission system with its own panel that coexists with beams (set Beam count 0 for rings only).

#### Rings panel
- **Own emitters** (teal dots, center by default, up to 6, draggable). **Geometric** mode: drag one dot and the rest arrange as a perfect regular polygon around the room center
- **Lifetime in bounces**: 1 = born→wall, 2 = back through the center, 3 = wall again… up to 60; each direction lives the same number of legs in its own geometry, then **fades out** over a configurable time (default 1 s)
- Rings are always **born at the emitter** (no more pre-grown rings popping into existence) and no longer vanish mid-flight
- **Activate button** for manual firing
- **Predictable spawning**: Interval (s between activations), Per activation (rings per burst), Spacing (s between rings in a burst) — each on a **dual-handle range slider** that draws a random value between your min/max markers
- Speed, Taper, Rainbow, Fade controls; speed/lifetime/taper are matrix targets

#### Fixes
- Sub-pixel ring widths no longer alias into moiré (width floored at ~1.2px)
- Eccentricity slider now always does something: moving it switches the room to Ellipse
- Bent-wall beam jumpiness reduced (wall subdivisions 24→48). Note: some jumpiness at high bounce counts is physics — bent rooms are chaotic billiards where tiny wall changes amplify per bounce
- UI polish: collapse chevrons on section titles, hover highlight, subtle group separators, calmer hint text

## [1.6.0] - 2026-06-11

### 💥 Burst Update

#### Wave bursts
- **Wave burst** selector: spawn one-shot expanding rings on the **detected beat** or on **BPM clock divisions** (2 per beat, 1 per beat, 1 per 2/4/8 beats — uses the tap tempo)
- Bursts work in **both** emission modes: shockwaves ripple over your rotating beams too
- MIDI note-on (Notes → beat) also fires bursts

#### Wave controls
- **Wave reach** slider (0.5–6 room diagonals): how far rings travel before recycling/dying — from clean single-bounce rings to long folded chaos
- **Wave taper** slider (−1…+1): rings thin to nothing (+) or swell (−) as they expand
- Both are modulation matrix targets and persist in scenes/presets

#### Beam count zero
- Beam count can now be 0 — no rotating beams / no continuous rings, useful when bursts are the only emission

## [1.5.0] - 2026-06-11

### 🌊 Wave Update

#### Wave emission mode
- New **Emission** selector: "Beams" (the classic rotating lines) or **"Waves (circles)"** — the emitter radiates expanding circular wavefronts that bend, fold, and reflect off the walls like real waves
- Beam count = number of rings; each ring expands at its own per-beam speed; Beam width = ring thickness
- **Wave rainbow** toggle: hue sweeps around each ring's circumference (the hue-shift modulation rotates the rainbow); off = rings use your palette colors
- Wavefronts re-converge on the second focus in an ellipse, collimate in the parabolic resonator, and fold into caustics against bent walls
- Pulse (radial rings), edge gradient, trails, glow, and phosphor all work on waves — phosphor lights up exactly where a ring strikes the wall
- Saved in scenes and presets

## [1.4.0] - 2026-06-11

### 🌒 Resonance Update

#### Ellipse room
- New room shape with an **Eccentricity** slider (0 = circle … 0.95): beams through one focus reflect through the other forever — emitter on a focus gives resonator orbits, off-focus gives whispering-gallery caustics
- Both foci are marked with subtle crosses (the parabolic resonator's focus too); eccentricity is a matrix target

#### Phosphor Walls
- Beams paint glow onto the walls where they strike, fading over a configurable persistence — hot spots reveal the caustics of bent walls
- Enable / Persistence / Intensity / Width controls; works with trails, bloom, and both blend modes; intensity is a matrix target; saved per-scene

#### Tempo
- **Tap tempo** + BPM input in the Modulation Matrix panel
- LFOs can sync to musical divisions (4 bars … 1/8) derived from the tempo instead of free-running Hz

#### Languages
- The Modulation Matrix, Beat Detection, MIDI, Record, Glow, and Phosphor panels are now translated to Spanish, Portuguese, and French

#### Infrastructure
- CI smoke test: every push renders the app headlessly (all seven room shapes + trails/bloom/phosphor) and fails on errors or a black canvas

## [1.3.1] - 2026-06-10

### 🔧 Fix
- Randomgon and Blob no longer change shape on window resize (or when starting/stopping a recording, which switches resolution internally). Their randomness is cached; re-selecting the shape in the dropdown still rolls a new one.

## [1.3.0] - 2026-06-10

### 🔬 Optics Update

#### Beam edge gradient
- New per-pixel shader falloff across the beam width: **Edge softness** (how far the gradient reaches toward the core) and **Edge intensity** (how strongly the sides fade) sliders next to Beam width
- At full softness/intensity beams take on a gaussian laser profile; shape-wave shapes get soft rims too
- Both controls are modulation matrix targets and persist in scenes/presets

#### Bent walls & parabolic resonator
- **Wall bend** slider (−0.8…+1): curves the straight walls of any polygon room — positive bulges outward (pillow), negative pinches inward, turning walls into focusing mirrors that concentrate beams into caustics
- Bending never re-randomizes the Randomgon (base corners are cached)
- **Wall bend is a matrix target** — route an LFO to it and the room itself breathes
- New room shape: **Parabolic resonator** — a parabolic mirror closed by a flat cap; place an emitter near the focus and watch beams collimate
- Persisted in scenes (smoothly interpolated during transitions) and presets

## [1.2.0] - 2026-06-10

### ✨ Glow Update

#### Glow (Bloom)
- New post-process: bright beams bleed light like real lasers in haze
- Enable / Strength / Threshold controls in the new Glow panel, on by default
- "Glow strength" is a modulation matrix target — route bass to it and the room breathes with the music
- Saved per-scene with smooth interpolation during transitions; ~0.1 ms/frame

#### Modulation Matrix expansion
- 8 new targets (17 total): Saturation, Brightness, Reflectivity, Beam anim speed, Trail length, Shape wave density/flow/spin, Glow strength
- 2 new sources: free-running LFOs with rate controls (0.01–4 Hz) — the matrix now works without a microphone

#### Stability & fixes
- A crashing frame now shows a dismissible on-screen error badge and the animation keeps running — no more silent black canvas
- Fixed pulse stutter when pulse speed/frequency changed mid-flight (e.g. driven by audio): the shader now gets a continuous bounded phase
- Fixed crash when the window/stage became extremely small (negative room radius)
- The beam shader uniform upload now lives in exactly one function (a stale triple-copy of it caused the March black-screen bug)
- `Voidulator.step()` debug API: drive frames manually in hidden tabs

## [1.1.0] - 2026-06-09

### 🎛️ Performance Update

#### Modulation Matrix
- Route audio bands (full/bass/mids/highs) or the beat envelope to any parameter: beam width, spread, global speed, pulse speed/freq/amp/duty, hue shift, shape wave size
- Bipolar amounts (negative inverts), unlimited stacked routes
- Non-destructive: slider values are never overwritten by modulation
- Replaces the old single audio target/strength controls (your old setting migrates to a route automatically)
- Routes persist across sessions and are included in JSON preset export/import

#### Beat Detection
- Adaptive bass-onset detector with sensitivity and envelope decay controls
- Beat envelope available as a modulation source ("thump on the kick")
- Beat-triggered events: spawn a center ripple and/or jump the global hue
- Live beat indicator dot

#### MIDI (Chrome/Edge)
- MIDI Learn: click Learn, move a hardware knob, done
- CC bindings map absolutely onto any parameter; persist across sessions
- Note-on can fire the beat actions (drum-pad triggering)

#### Video Recording
- Record WebM at 480p, 720p, 1080p, or 4K — higher resolutions are rendered natively, not upscaled
- Width follows your window aspect; VP9 encoding with resolution-scaled bitrate

#### Fixes & Infrastructure
- Audio modulation no longer "ratchets" values upward permanently
- Service worker is now network-first: deploys reach users immediately, cache is only an offline fallback
- New `window.Voidulator` debug handle for console scripting

## [1.0.0] - 2026-03-17

### 🚀 Initial Public Release

#### Core Features
- WebGL2 laser beam simulation with realistic reflections
- 7 room shapes: circle, triangle, square, pentagon, hexagon, randomgon, blob
- Up to 375 bounces with adjustable reflectivity
- 1-4 draggable emitters with WASD keyboard control
- Beam spread from focused to 180° fan

#### Visual Effects
- Pulse animation (sine/square wave) with frequency, speed, amplitude, softness, duty cycle
- Shape effects (circles/ellipses flowing along beams) with density, size, flow, spin
- Trails with persistence and hue shifting
- Normal and additive blend modes

#### Color System
- 30+ color schemes organized by theme (nature, artistic, technical)
- Per-beam custom colors
- Stable color generation using golden angle

#### Scenes & Automation
- 8 scene save slots with naming
- Smooth transitions between scenes (1-10 seconds)
- Screensaver mode with auto-cycling
- JSON export/import for sharing presets

#### Audio Reactive
- Microphone input support
- Targets: beam width, pulse speed, pulse frequency
- Adjustable sensitivity, smoothing, and strength

#### UI/UX
- 2 themes: Classic (amber) and Coral (bioluminescent)
- Simple/Advanced mode toggle
- Interactive tutorial for beginners
- 4 languages: English, Spanish, Portuguese, French
- Fullscreen mode with hideable UI
- Mobile-optimized responsive layout

#### Keyboard Shortcuts
- F: Toggle fullscreen
- U: Toggle UI (in fullscreen)
- N: Next saved scene
- W/A/S/D: Move emitters
- 1-8: Load scene slots
