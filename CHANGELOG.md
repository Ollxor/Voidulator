# Changelog

All notable changes to Voidulator will be documented in this file.

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
