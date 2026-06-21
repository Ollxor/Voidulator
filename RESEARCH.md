# Voidulator — Research & Inspiration Database

A living reference of similar projects, useful code, designs, and ideas. Each
entry notes the **license** (decisive for any code reuse) and **what's worth
borrowing**. Append freely; keep license notes honest.

**Voidulator is MIT.** For *code* reuse that means:
- ✅ **MIT / BSD / Apache-2.0 / CC0 / public-domain** — fine to adapt, with attribution (Apache-2.0 also wants the NOTICE preserved).
- ⚠️ **AGPL / GPL / CC-BY-SA** — copyleft; do **not** copy code into Voidulator. Study for *ideas* only.
- ⚠️ **Custom / non-commercial** — ideas only unless the author grants permission.
- 🟢 **Math & algorithms are never copyrightable** — the wave equation, ray reflection, FFT, gaussian kernels, etc. are free to reimplement from any source.

_Last updated: 2026-06-21._

---

## 1. Optics / ray & beam simulators (relevant to Beams + Rings)

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [ricktu288/ray-optics](https://github.com/ricktu288/ray-optics) (PhyDemo) | **Apache-2.0** ✅ | The gold-standard browser 2D optics sandbox: mirrors, lenses, blockers, gradient-index glass, a scene gallery, and a clean object/handle editor. **Ideas:** draggable optical *components* inside the room (mirrors/lenses/slits that beams interact with), a shareable scene gallery, image export. Apache-2.0 means we could adapt snippets with attribution. |
| [sp01109/3d-laser-engraved-crystal-simulator](https://github.com/sp01109/3d-laser-engraved-crystal-simulator) | verify | WebGL ray-tracing of engraved points in a crystal. Idea: volumetric "dust"/haze that beams light up in 3D. |
| [laserbeamfoam/LaserbeamFoam](https://github.com/laserbeamfoam/LaserbeamFoam) | GPL (OpenFOAM) ⚠️ | Industrial laser ray-tracing (welding/AM). Ideas only: discretising a Gaussian beam into many rays with per-ray energy — mirrors how our rings trace 240–360 rays. |
| [doodlewind/beam](https://github.com/doodlewind/beam) | MIT ✅ | A small expressive WebGL wrapper. Reference for clean WebGL resource/command abstractions if we ever refactor the GL layer. |

## 2. Wave / ripple-tank simulators (relevant to the Wave Field)

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [pfalstad/ripplegl](https://github.com/pfalstad/ripplegl) + [falstad.com/ripple](https://www.falstad.com/ripple/) | **Custom, restricted** ⚠️ | The canonical browser ripple tank (GPU FDTD). Non-commercial reuse allowed *with credit + link*; other uses need permission ([licensing](https://www.falstad.com/licensing.html)). **Code: don't copy.** But it's the best *idea* source for the Wave Field: sources with phase offset, walls/media with variable refractive index, slits & double-slit presets, "stopped"/step controls, intensity vs. displacement views. The FDTD math itself is free to reimplement (we already did). |
| [mattwellings/RippleTank](https://github.com/openforeveryone/RippleTank) | verify | GPU WebGL ripple tank for students — propagation, reflection, diffraction, interference. Ideas: diffraction-grating and barrier presets. |
| [DCtheTall/webgl-ripple](https://github.com/DCtheTall/webgl-ripple) | verify (TS) | Wave equation via **Verlet integration** on the GPU — an alternative integrator to our leapfrog FDTD; cross-check stability/damping behaviour. |
| [dandelany/ripplegl-ts](https://github.com/dandelany/ripplegl-ts) | verify | TS+React port of RippleGL — cleaner reading of the same algorithm than the original. |
| [jasonschattman/WaveInterferenceRippleTank](https://github.com/jasonschattman/WaveInterferenceRippleTank) | verify | Place multiple sources, watch interference. Confirms our multi-emitter field direction. |

**Berglund** ([@NilsBerglund](https://www.youtube.com/@NilsBerglund), [code CC0](https://github.com/nilsberglund-orleans/YouTube-simulations)) ✅ — already the inspiration/credit for the Wave Field. CC0 = freely usable. Mine his parameter files for striking room shapes and colourmaps.

## 3. VJ / live-coding / audio-reactive visual tools (UX, audio, modulation ideas)

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [jberg/butterchurn](https://github.com/jberg/butterchurn) | **MIT** ✅ | WebGL MilkDrop visualizer. **Best reference for the audio analysis pipeline** (bass/mid/treble band extraction, beat detection, smoothing) — MIT, so adaptable with credit. Idea: a "preset morph" that crossfades between two scenes continuously (MilkDrop's signature). |
| [ojack/hydra](https://github.com/hydra-synth/hydra) | **AGPL-3.0** ⚠️ | Live-codable video synth; syntax modelled on **modular synthesis / patching**. **Ideas only (copyleft).** Strong inspiration for our modulation matrix → consider a node/patch view, and feedback loops (output as input) for trails-on-steroids. |
| [Three.js Visual Editor](https://vjun.io/vdmo/reimagining-vjing-with-the-threejs-visual-editor-an-open-source-playground-for-audio-reactive-3d-visuals-3jop) | verify | Browser TouchDesigner-like node editor, mic-driven params at 60fps. Idea: node-graph modulation routing as an advanced alternative to our matrix rows. |
| [willianjusten/awesome-audio-visualization](https://github.com/willianjusten/awesome-audio-visualization) | list (MIT) ✅ | Curated index — a feeder for future entries here. |
| GitHub topics: [music-visualization](https://github.com/topics/music-visualization), [vjing](https://github.com/topics/vjing), [audio-visualizer](https://github.com/topics/audio-visualizer) | — | Browse for more candidates. |

## 4. Shader & graphics technique reference (attribution-safe)

| Source | License | Notes |
|---|---|---|
| [Inigo Quilez — articles](https://iquilezles.org/articles/) | code MIT ✅ | Canonical techniques: [palettes](https://iquilezles.org/articles/palettes/) (cosine palette — could replace/augment our HSL palettes), SDFs, smin, soft shadows, useful small functions. Snippets are MIT — usable with credit. |
| [The Book of Shaders](https://thebookofshaders.com/) | text CC-BY-SA, code usable | Shaping functions, noise, patterns. Great for new effects (domain warping, FBM-driven motion). |
| Shadertoy (general) | per-shader, often CC-BY-NC ⚠️ | Inspiration; check each shader's license before adapting. |
| **Already in Voidulator** | — | Sam Hocevar `rgb2hsv`/`hsv2rgb` (public domain, credited in-shader); LearnOpenGL gaussian bloom weights (non-copyrightable constants). |

## 5. Standing waves / Chladni / cymatics (relevant to the Wave Field)

Chladni patterns are the **eigenmodes** of a vibrating plate — the dark nodal
lines our Wave Field already produces in a resonating cavity. These projects
compute modes *analytically* (fast, exact) rather than time-stepping.

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [luciopaiva/chladni](https://github.com/luciopaiva/chladni) | verify (vanilla JS) | Clean square-plate formula: `cos(nπx/L)cos(mπy/L) − cos(mπx/L)cos(nπy/L)`. **Idea: a "modes" display** — pick integers (n,m) and instantly show that exact standing-wave pattern, no settling time. Cheap and gorgeous. |
| [RorriMaesu/CymaticsVisualizer](https://github.com/RorriMaesu/CymaticsVisualizer) | verify | Square plate `sin(nπx/L)sin(mπy/L)cos(2πft)` + **Bessel-function approximation for circular membranes** — directly applicable to our circle/ellipse rooms as an analytic alternative to FDTD. |
| [flutomax/ChladniPlate2](https://github.com/flutomax/ChladniPlate2) | verify | Models figures from a *set* of waveforms — i.e. summing modes. Idea: drive mode weights from audio bands → cymatics that dance to music. |
| [CymaVis](https://cymavis.com/) | proprietary ⚠️ | Polished commercial reference: Chladni + 3D water surface. Aesthetic target, not code. |

## 6. Reaction-diffusion & generative simulation (candidate new modes)

Same GPU ping-pong machinery as our Wave Field, different equation → organic,
living textures. A natural "3rd simulation mode" sibling.

| Project | License | Notes |
|---|---|---|
| [amandaghassaei/ReactionDiffusionShader](https://github.com/amandaghassaei/ReactionDiffusionShader) | verify (likely MIT) | Gray-Scott with an **underlying vector field steering diffusion** → directed, flowing patterns. Amanda's GPU work is high quality and usually MIT — verify, then it's adaptable. |
| [tdhooper/webgl-grayscott](https://github.com/tdhooper/webgl-grayscott) | verify | Compact TWGL implementation — good reading reference for the two-chemical update. |
| [piellardj/reaction-diffusion-webgl](https://piellardj.github.io/reaction-diffusion-webgl/) | verify (piellardj = usually MIT) | Polished interactive demo; piellardj's repos are consistently clean and MIT-licensed. |
| [GregP-Navdna/InfiniBlend](https://github.com/GregP-Navdna/InfiniBlend) | verify | 16 generative algorithms incl. reaction-diffusion in one WebGL blender — a buffet of mode ideas. |

## 7. Modular synth / modulation UI (relevant to the Modulation Matrix)

| Project | License | Notes |
|---|---|---|
| [ameobea/web-synth](https://github.com/ameobea/web-synth) | verify | Browser DAW with a node-graph patcher and an explicit **"FM synth modulation matrix"**; params are first-class modulation targets with auto-generated UI — exactly our model, more mature. Best reference for a node-graph view and a proper parameter registry. |
| [NoiseCraft](https://noisecraft.app/) ([repo](https://github.com/maximecb/noisecraft)) | verify (maximecb often permissive) | Max/MSP-style modular synth, deliberately beginner-friendly. UX reference for approachable patching. |

## 8. Generative-art techniques (candidate effects / post-FX)

| Source | License | Notes |
|---|---|---|
| [terkelg/awesome-creative-coding](https://github.com/terkelg/awesome-creative-coding) | CC/MIT ✅ | The master index of the whole field — books, tools, shaders, talks. Primary feeder for future entries here. |
| [23x2/generative-flow-field](https://github.com/23x2/generative-flow-field) | verify | Workerized WebGL2 curl-noise flow field. Idea: a **flow-field emission mode** where beams/particles follow a noise field, or curl-noise *advection* of the wave/phosphor textures for smoky drift. |
| [Platane/kaleidoscope](https://github.com/Platane/kaleidoscope) | verify | Idea: a **kaleidoscope/symmetry post-process** (N-fold mirror of the final image) — one small shader pass, huge aesthetic payoff, stacks with every existing mode. |

## 9. Platform / future tech

| Topic | Notes |
|---|---|
| **WebGPU** (Chrome/Edge/Opera desktop, Jan 2026) | Compute shaders give direct GPU buffers + workgroup memory. Quoted real-world: ~5k CPU particles → **1M particles sub-2ms** on WebGPU compute. Path: a particle/flow mode, or moving the FDTD to a compute pass for much higher field resolution. **Caveat:** still no Safari/iOS in stable, and it's a second renderer to maintain — keep the WebGL2 path as the baseline. |
| [Codrops: WebGPU fluid sims](https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/) | Tutorial-grade reference if/when we explore a fluid or high-res field mode. |

## 10. Oscilloscope / Lissajous / vector (XY) art — strongly on-theme

Stereo audio → X/Y deflection draws curves. A beam/laser app is *exactly* the
right home for this: it's the analog-vector aesthetic Voidulator already evokes.

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [macumbista/vectorsynthesis](https://github.com/macumbista/vectorsynthesis) | verify (Pd) | Creating/animating vector *shapes* from audio for oscilloscopes/ILDA. The bible of the "oscilloscope music" aesthetic — idea source for shape-from-signal. |
| [ffd8/xyscopejs](https://github.com/ffd8/xyscopejs) | verify (p5.js) | Render p5 graphics to an analog vector display via audio. Shows the geometry→XY-signal mapping cleanly. |
| [Sean-Bradley/Oscilloscope](https://github.com/Sean-Bradley/Oscilloscope) | verify | Minimal HTML5 XY scope (L→x, R→y) via Web Audio. Smallest readable reference for an in-app XY mode. |
| [ThatXliner/ljv](https://github.com/ThatXliner/ljv) | verify | Real-time Lissajous music visualizer. |

**Idea: a Lissajous/XY emission mode** — feed the *stereo* mic (or two LFOs/audio bands) into X and Y to draw live curves, rendered with the existing beam/glow/trail pipeline. Distinctive, deeply on-brand for a laser app, and reuses everything we have.

## 11. Real laser output / ILDA (a wild but real path)

| Project | License | Notes |
|---|---|---|
| [brendan-w/lzr](https://github.com/brendan-w/lzr) | verify (FOSS@RIT) | Laser projection backend + ILDA parser + realtime preview. Reference for the ILDA point format. |
| [marcan/openlase](https://marcan.st/2010/11/openlase-open-realtime-laser-graphics) | GPL ⚠️ | Realtime laser graphics; ideas only. |
| [Grix/helios_dac](https://github.com/Grix/helios_dac) | open, cross-platform | The common hobbyist USB→ILDA DAC; C++/C#/Python examples. The hardware target if we ever export to real lasers. |
| [echelon/ilda.rs](https://github.com/echelon/ilda.rs) | verify (Rust) | Clean ILDA file reader — reference for the .ild format if we add export. |

**Idea: ILDA frame export.** Voidulator's beams *are* vector paths (point lists), which is precisely what ILDA wants. Exporting a scene as an `.ild` file (or streaming via WebSerial to a Helios DAC) would let it drive a **real laser projector** — turning the simulator into a genuine laser-show authoring tool. Niche but a true differentiator; rings/field (raster) wouldn't translate, but beams would.

---

## Ideas backlog (synthesised from the above)

Concrete features worth considering, roughly high→low leverage:

1. **Optical components inside the room** (from ray-optics): draggable mirrors, lenses, slits, blockers that beams/rings/waves interact with → double-slit interference in the Wave Field, focusing lenses for beams.
2. **Cosine palettes** (from iquilez): a procedural palette generator (4 vec3 params) for smooth, tweakable colour ramps — richer than discrete HSL stops, and trivially animatable.
3. **Scene morph / crossfade** (from MilkDrop/butterchurn): continuously blend between two saved scenes on a slider or LFO, not just timed transitions.
4. **Feedback / video-feedback mode** (from Hydra): feed the previous composited frame back as an input texture with transform → infinite-tunnel and kaleidoscope looks (we have the FBO plumbing from trails/bloom).
5. **Refraction / variable medium in the Wave Field** (from Falstad/RippleTank): regions of different wave speed → lensing, waveguides, slit diffraction presets.
6. **Node-graph modulation view** (from Hydra / Three.js editor): optional visual patching as an alternative to matrix rows.
7. **Verlet vs leapfrog** (from webgl-ripple): evaluate for the field's stability at high Courant numbers.
8. **Preset gallery with shareable URLs + thumbnails** (from ray-optics): we already have thumbnails and URL state — a curated public gallery page is a small step.
9. **Kaleidoscope / N-fold symmetry post-process**: one fragment pass mirroring the final image; stacks on *every* mode (beams, rings, field). Tiny effort, big payoff.
10. **Analytic Chladni "modes" view**: pick (n,m) and show the exact eigenmode instantly — no FDTD settling. A fast, hypnotic addition to the Wave Field, and mode weights could be audio-driven.
11. **Reaction-diffusion mode**: reuse the field's ping-pong float-texture machinery for a Gray-Scott "living texture" emission mode.
12. **Curl-noise advection**: drift the phosphor/trail/field textures along a noise flow field for smoky motion.
13. **Lissajous / XY mode**: stereo audio (or two LFOs) → X/Y → live vector curves through the existing beam/glow pipeline. Deeply on-brand for a laser app.
14. **ILDA frame export**: beams are already vector point-paths = the ILDA format; export `.ild` or stream to a Helios DAC to drive a *real* laser projector.

## Insights, rabbit holes & curious paths

Honest notes from this round of research — what's genuinely promising, what
looks shiny but could swallow weeks, and the unexpected connections.

### Insights
- **Voidulator already sits at a rare intersection.** Most projects are *either* a physics demo (ripple tanks, Chladni) *or* a VJ/audio toy (Hydra, butterchurn). Voidulator does both — real optics/wave physics *and* a performable, audio-reactive, recordable instrument. That combination is the differentiator; lean into "real physics you can play."
- **The same GPU ping-pong pattern powers a whole family of modes.** Our Wave Field, reaction-diffusion, and fluid sims are all "two float textures + an update shader." We've already paid the hard infrastructure cost (float targets, masks, bloom compositing) — each new sim mode is now mostly a new update shader. High reuse, low marginal cost.
- **Analytic ≠ time-stepped, and both have a place.** Chladni eigenmodes give *instant, exact, settling-free* standing-wave beauty; FDTD gives *live, interactive* propagation. Offering both (a "modes" toggle in the Wave Field) is cheap and covers two different aesthetics.
- **The modulation matrix is the real spine.** Mature tools (web-synth) converge on exactly our model: every parameter is a first-class modulation target. The more we register, the more the whole app compounds. This is the highest-ROI architectural bet we've made.
- **A symmetry/kaleidoscope post-process is the cheapest "wow" available.** One pass, multiplies the visual variety of everything that already exists.

### Rabbit holes (proceed with eyes open)
- **WebGPU rewrite.** Tempting (1M particles!), but it's a *parallel renderer* to maintain, has no Safari/iOS in stable as of 2026, and most of Voidulator isn't compute-bound. Worth it only for a specific compute-heavy mode (huge-res field, million-particle flow) — not a wholesale port.
- **Node-graph modulation UI.** Beautiful in Hydra/web-synth, but a big interaction-design and code investment. Our matrix-rows already deliver 90% of the value; a node graph is polish, not capability.
- **Full fluid simulation (Navier-Stokes).** Gorgeous and on-brand, but numerically fiddly (advection, pressure solve, boundaries) and easy to sink weeks into tuning stability. Reaction-diffusion gives 80% of the organic-motion appeal for 20% of the effort — do that first.
- **Licensing temptation around Falstad/Hydra.** They're the best-looking references and it's tempting to lift code. Don't — Falstad is custom/non-commercial and Hydra is AGPL. Reimplement from the (free) math instead, as we did for the Wave Field.

### Curious / unexpected paths
- **Audio → Chladni mode weights.** Map FFT bands to eigenmode (n,m) amplitudes → the plate literally morphs its standing-wave figure to the music. Physically meaningful *and* musical — few tools do this well.
- **Cross-mode feeding.** The phosphor buffer, the wave field, and trails are all textures. Feeding one as a *source/mask* for another (e.g. wave amplitude modulated by the phosphor image, or beams masked by a reaction-diffusion texture) opens a combinatorial space of looks with no new physics.
- **"Real instrument" framing for distribution.** The MIDI-learn + modulation-matrix + recording stack means Voidulator is closer to a VJ *instrument* than a screensaver. A short "live set" demo video (beat-synced scene morphs, MIDI knobs) would communicate that far better than a feature list.
- **Eigenmodes of the bent/parabolic rooms.** We have non-trivial cavity shapes already; their resonant modes are visually unique and not something the square/circle-only Chladni demos show. A genuine novelty.
- **Voidulator's beams are already ILDA-shaped.** They're point-path vectors — the native format of real laser projectors. An `.ild` export (or WebSerial → Helios DAC) would quietly turn the toy into a real laser-show authoring tool. Almost nothing else in the browser does this. The rabbit-hole risk is hardware testing, but file *export* alone is low-risk and verifiable against open ILDA readers.
- **The XY/oscilloscope aesthetic is "free" here.** Other people build whole apps around audio→XY curves; for a beam app it's just another emission source feeding the pipeline we already have.

## How to extend this file

When you find a project: add a row to the right category with **name, URL, license (verified?), and the one concrete thing worth taking**. Promote anything actionable into the Ideas backlog. Verify any `verify`-tagged license before reusing code.
