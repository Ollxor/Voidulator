# Voidulator — Research & Inspiration Database

A living reference of similar projects, useful code, designs, and ideas. Each
entry notes the **license** (decisive for any code reuse) and **what's worth
borrowing**. Append freely; keep license notes honest.

**Voidulator is MIT.** For *code* reuse that means:
- ✅ **MIT / BSD / Apache-2.0 / CC0 / public-domain** — fine to adapt, with attribution (Apache-2.0 also wants the NOTICE preserved).
- ⚠️ **AGPL / GPL / CC-BY-SA** — copyleft; do **not** copy code into Voidulator. Study for *ideas* only.
- ⚠️ **Custom / non-commercial** — ideas only unless the author grants permission.
- 🟢 **Math & algorithms are never copyrightable** — the wave equation, ray reflection, FFT, gaussian kernels, etc. are free to reimplement from any source.

_Last updated: 2026-06-14._

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

## How to extend this file

When you find a project: add a row to the right category with **name, URL, license (verified?), and the one concrete thing worth taking**. Promote anything actionable into the Ideas backlog. Verify any `verify`-tagged license before reusing code.
