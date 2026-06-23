# Voidulator — Research & Inspiration Database

A living reference of similar projects, useful code, designs, and ideas. Each
entry notes the **license** (decisive for any code reuse) and **what's worth
borrowing**. Append freely; keep license notes honest.

**Voidulator is MIT.** For *code* reuse that means:
- ✅ **MIT / BSD / Apache-2.0 / CC0 / public-domain** — fine to adapt, with attribution (Apache-2.0 also wants the NOTICE preserved).
- ⚠️ **AGPL / GPL / CC-BY-SA** — copyleft; do **not** copy code into Voidulator. Study for *ideas* only.
- ⚠️ **Custom / non-commercial** — ideas only unless the author grants permission.
- 🟢 **Math & algorithms are never copyrightable** — the wave equation, ray reflection, FFT, gaussian kernels, etc. are free to reimplement from any source.

_Last updated: 2026-06-23._

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
| [amandaghassaei/ReactionDiffusionShader](https://github.com/amandaghassaei/ReactionDiffusionShader) | **no LICENSE file** ⚠️ | Gray-Scott with an **underlying vector field steering diffusion** → directed, flowing patterns. High-quality work, but this repo carries *no licence* (Amanda's *other* repos are MIT) — **ideas only** unless clarified; the Gray-Scott math itself is free to reimplement. |
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
| [macumbista/vectorsynthesis](https://github.com/macumbista/vectorsynthesis) | **MIT** ✅ (Pd) | Creating/animating vector *shapes* from audio for oscilloscopes/ILDA. The bible of the "oscilloscope music" aesthetic — idea source for shape-from-signal. |
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

## 12. Sound-reactive techniques & libraries (deep dive)

This is the engine room of a VJ instrument. **Where Voidulator is today:**
`AnalyserNode.getByteFrequencyData` → RMS+peak per band (bass/mid/high/full) →
attack/release smoothing → adaptive-threshold beat on the bass rolling mean →
decaying beat envelope, plus manual tap-tempo. That's a solid *energy-based*
rig. The ladder below shows what's beyond it.

### Libraries

| Library | License | Notes |
|---|---|---|
| [meyda/meyda](https://github.com/meyda/meyda) | **MIT** ✅ | 50+ features (RMS, spectral centroid/rolloff/flatness, ZCR, MFCC, chroma, **spectral flux**) over the Web Audio API, real-time. MIT = adoptable. The pragmatic upgrade path: drop in Meyda for spectral flux + centroid without writing DSP. |
| [essentia.js](https://mtg.github.io/essentia.js/) | **AGPL-3.0** ⚠️ | Full MIR (BPM, beats, key, chords, chroma, melody, mood) via WASM. Powerful but copyleft — **ideas/algorithms only**, don't bundle. |
| [audiojs/beat-detection](https://github.com/audiojs/beat-detection) | verify | Compact tempo/onset algorithms — readable reference for spectral-flux + autocorrelation tempo. |
| [michaelkrzyzaniak/Beat-and-Tempo-Tracking](https://github.com/michaelkrzyzaniak/Beat-and-Tempo-Tracking) | verify (C) | Serious real-time beat/tempo tracker (BTT). Algorithm reference for auto-BPM. |
| [sandner-art/Audio-Shader-Studio](https://github.com/sandner-art/Audio-Shader-Studio) | verify | WebGL + Web Audio: passes a bank of precomputed audio features straight to shaders. Reference for the feature→uniform plumbing. |

### Techniques ladder (simplest → most sophisticated)

1. **Energy per band** *(we do this)* — sum FFT bins in bass/mid/high, RMS, smooth. Cheap, robust.
2. **Perceptual band mapping** — FFT bins are linear in Hz, so mids/highs get crushed. Map to **log / mel bins** (or just widen high bands) so treble actually reacts. Small change, big musical improvement. *(Easy win for Voidulator.)*
3. **Spectral flux onset detection** — sum of *positive* bin-to-bin changes between frames; spikes on note onsets. More accurate than our energy-threshold beat and catches non-bass hits (hi-hats, snares). Meyda gives it for free.
4. **Autocorrelation tempo** — autocorrelate the onset signal to find periodicity → **automatic BPM** (complement the manual tap; auto-sync the LFOs).
5. **Loudness weighting** — A-weighting / true RMS for a stable "overall level" that tracks perceived loudness, not raw energy.
6. **Pitch / chroma → colour (chromesthesia)** — dominant pitch class → hue. Maps *melody* to colour, not just amplitude. Distinctive and musical.
7. **FFT-as-texture on the GPU** — upload the ~256–512 frequency bins as a 1-D texture each frame; sample it in shaders. Then reactivity can vary *spatially*: e.g. the **wave-field source amplitude around its circumference = the live spectrum**, or beam colour indexed by frequency. We already have the float-texture infrastructure — this is the highest-ceiling idea.

### What's worth it for Voidulator (vs overkill)
- **Worth it:** perceptual/log band mapping (#2, easy), spectral flux onset via Meyda (#3, MIT), FFT-texture for spatial spectral reactivity (#7, big payoff, reuses our infra).
- **Nice:** autocorrelation auto-BPM (#4), chroma→hue (#6).
- **Probably overkill:** full MIR (key/chord/mood via Essentia) — heavy WASM + AGPL; the instrument doesn't need musical *understanding*, just responsiveness.

## 13. GPGPU particle systems (candidate emission mode)

Hundreds of thousands–millions of points advected on the GPU. A natural sibling
to the wave field, and a great host for audio + curl-noise flow.

| Project | License | Notes |
|---|---|---|
| [soulwire/WebGL-GPU-Particles](https://github.com/soulwire/WebGL-GPU-Particles) | **MIT** ✅ | 1M+ particles; state in texture+FBO, velocity on GPU. Classic readable reference — MIT, adaptable with credit. |
| [jherman3/webgl-particle-toy](https://github.com/jherman3/webgl-particle-toy) | verify | WebGL2 **transform feedback** (no texture ping-pong) — 2M particles; the cleaner WebGL2 idiom for our stack. |
| [poeti8/one-million-particles](https://github.com/poeti8/one-million-particles) | verify | three.js GPGPU; tidy demo. |
| [gpfault.net: GPU particles with WebGL2](https://gpfault.net/posts/webgl2-particles.txt.html) | article | Best tutorial for transform-feedback particles — the technique we'd use. |

**Idea: a particle emission mode** — particles spawned at emitters, advected by a flow field and/or bouncing off the room walls (we already have arc/poly collision), coloured by speed or audio band. Transform feedback keeps it on-GPU. Pairs perfectly with curl-noise (§8) and FFT-texture audio (§12).

## 14. Export & sharing (how these tools actually spread)

We already record WebM via `MediaRecorder`. These are faster/wider-format paths.

| Tool | License | Notes |
|---|---|---|
| [dmnsgn/canvas-record](https://github.com/dmnsgn/canvas-record) | **MIT** ✅ | Records a canvas to MP4/WebM/MKV/MOV/GIF/PNG-seq via **WebCodecs + WASM**. WebCodecs is ~5–10× faster than MediaRecorder-style encoders and gives real **MP4** (far more shareable than WebM). MIT — adoptable. |
| [jnordberg/gif.js](https://github.com/jnordberg/gif.js) | **MIT** ✅ | Worker-based GIF encoder. A looping GIF/short MP4 is the unit of social spread for generative art. |
| [mattdesl/canvas-sketch](https://github.com/mattdesl/canvas-sketch) | MIT ✅ | Generative-art framework; its [exporting docs](https://github.com/mattdesl/canvas-sketch/blob/master/docs/exporting-artwork.md) are the reference for clean frame export + naming. |

**Idea: MP4 + looping-GIF export** (via canvas-record/WebCodecs) alongside the existing WebM, plus a one-click "share" that produces a short seamless loop. This is the single biggest *distribution* lever — silent WebM doesn't travel; an MP4/GIF loop does.

## 15. Colour science & perceptual palettes (relevant to colour schemes, transitions, glow)

Voidulator's palettes and scene-transition lerps run in HSL/RGB, which is *not*
perceptually uniform — equal numeric steps make uneven visual steps, and blends
through blue/purple go muddy or shift hue. These fix that — and a real *laser*
deserves real spectral colour.

| Source | License | Notes & ideas to borrow |
|---|---|---|
| [Björn Ottosson — Oklab](https://bottosson.github.io/posts/oklab/) | **public domain / MIT** ✅ | The reference `linear_srgb_to_oklab()` + inverse, stated public-domain *or* MIT by the author — directly usable. **Idea:** interpolate scene transitions and colour ramps in **OKLab/OKLCH** instead of HSL → perceptually even fades, vivid (not muddy) midpoints, stable hue. The single highest-quality colour upgrade available. |
| [CSS Color 4](https://www.w3.org/TR/css-color-4/) + [Evil Martians: OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl) | spec / article ✅ | Why OKLCH won for gradients (it's the recommended `color-mix` space; Tailwind v4 default). Reference for *which* space to lerp in: `oklab` for straight-line blends, `oklch` for hue-preserving ones. |
| Spectral **wavelength→RGB** ([FourmiLab specrend, John Walker](https://www.fourmilab.ch/documents/specrend/); Dan Bruton's algorithm) | algorithm — **math, free** 🟢 | Map true laser wavelengths (405 nm violet, 532 nm green, 650 nm red…) through the CIE colour-matching functions to sRGB. **Idea:** a "real laser" palette where beam colour is chosen by nm — the green sits exactly where a 532 nm DPSS laser does. On-brand and physically grounded. |
| Blue-noise dithering — [demofox: void-and-cluster](https://blog.demofox.org/2019/06/25/generating-blue-noise-textures-with-void-and-cluster/), [frost.kiwi: fixing banding](https://blog.frost.kiwi/GLSL-noise-and-radial-gradient/) (+ Christoph Peters' free blue-noise textures) | posts/textures freely shared; **math free** 🟢 | 8-bit output + smooth glow/trail gradients = visible **banding**. Add ~1/255 of blue-noise (or even cheap interleaved-gradient noise) *before* quantisation to dissolve the bands into imperceptible grain. One line in the composite shader; biggest cleanliness win for the bloom look. frost.kiwi shows how (and how *not*) to do it. |

## 16. HDR tone-mapping & advanced bloom (upgrades the Glow pipeline)

Today's glow does a smooth-knee bright-pass + one separable 9-tap gaussian, then
clips to white. Two orthogonal upgrades: a *filmic* tone-map so bright beams roll
off to colour-rich white instead of harsh clipping, and a *pyramidal* bloom for a
wider, more cinematic, energy-stable glow.

| Source | License | Notes & ideas to borrow |
|---|---|---|
| **AgX** — [Troy Sobotka AgX-S2O3](https://github.com/sobotka/AgX-S2O3), [iolite minimal impl](https://iolite-engine.com/blog_posts/minimal_agx_implementation) | verify (curve fit — **math free** 🟢) | Blender 4's default view transform. Desaturates highlights *gradually* as they brighten → saturated lasers bloom to warm white instead of clipping to flat clamped RGB. The minimal version is a 3×3 matrix + a polynomial; reimplement the fit (don't copy unlicensed code). |
| **ACES filmic** — [Krzysztof Narkowicz fit](https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/) | published "use freely"; **math free** 🟢 | The one-liner `(x(ax+b))/(x(cx+d)+e)` filmic curve everyone uses. Cheaper than AgX, slightly more contrasty/saturated. Good default if AgX feels heavy. |
| [Jorge Jimenez — Next-Gen Post Processing in CoD:AW](https://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare/) | slides — **technique** | The standard modern bloom: a **mip pyramid**, 13-tap filtered downsample, 3×3 tent-filter upsample with progressive add. Wide, soft, temporally stable, energy-preserving — far better than one fixed-radius gaussian and not much more code. |
| [frost.kiwi — dual-Kawase explained](https://blog.frost.kiwi/dual-kawase/) (technique: Marius Bjørge, *Bandwidth-Efficient Rendering*, SIGGRAPH 2015) | technique | Cheaper cousin of the pyramid: ping-pong down/up with a 5-tap kernel; frost.kiwi is the clearest read. Good if the full pyramid is overkill on mobile. |

## 17. Caustics & volumetric light (optics depth — lasers in haze)

A laser room *is* light scattering in a medium. Two cheap fakes add huge
atmosphere: screen-space "god rays" from a bright emitter, and animated caustic
ripples cast on the walls.

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [evanw/webgl-water](https://github.com/evanw/webgl-water) ([writeup](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c)) | **MIT** (per-file headers) ✅ | The canonical WebGL **caustics** demo — derives caustic intensity from how light rays converge, using GLSL **derivative** functions (`dFdx`/`dFdy`). **Idea:** caustic shimmer cast by the wave-field surface onto the room, or animated caustics rippling under the beams. |
| [GPU Gems 3, ch.13 — Volumetric Light Scattering as a Post-Process](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process) (Kenny Mitchell) | technique — **algorithm free** 🟢 | The classic **god-rays** fake: render occluders black + light bright, then a **radial blur** toward the light, additively composite. **Idea:** volumetric shafts radiating from a bright emitter through "haze" — two passes, deeply on-brand for a beam room. |
| [math-araujo/screen-space-godrays](https://github.com/math-araujo/screen-space-godrays) + [fabiensanglard.net: light scattering](https://fabiensanglard.net/lightScattering/) | **MIT** ✅ / tutorial | Clean reference impl + the smallest readable GLSL walkthrough of the radial-blur god-ray pass. |

## 18. Strange attractors & harmonographs (curve generators — sibling to Lissajous §10)

If §10 (Lissajous) is "two sines → a curve", these are the richer cousins:
iterated chaotic maps and damped many-pendulum figures. All are **point paths**,
so they feed straight into the existing beam/glow/trail pipeline.

| Source | License | Notes & ideas to borrow |
|---|---|---|
| [Paul Bourke — Clifford](https://paulbourke.net/fractals/clifford/) & [Peter de Jong attractors](https://paulbourke.net/fractals/peterdejong/) | equations — **math, free** 🟢 (reuse w/ acknowledgement) | Two-line iterated maps (`x' = sin(a·y)+c·cos(a·x)`, …) that trace dense, organic, parameter-morphable figures. **Idea:** an **attractor emission mode** — iterate the map, draw the point cloud/path with glow; sweep `a,b,c,d` slowly (or from audio) and the whole figure breathes. |
| [Softology — 2D strange attractors](https://softologyblog.wordpress.com/2017/03/04/2d-strange-attractors/) | catalogue | A buffet of attractor families (Bedhead, Hopalong, Gumowski-Mira…) with formulas — feeder for variety. |
| [Harmonograph](https://en.wikipedia.org/wiki/Harmonograph) ([Paul Bourke](https://paulbourke.net/geometry/harmonograph/), [bit-101 coding curves](https://www.bit-101.com/2017/2022/11/coding-curves-05-harmonographs/)) | **math, free** 🟢 | Sum of **exponentially-damped sinusoids** on X and Y → the Victorian "decaying Lissajous": `x(t)=Σ Aᵢ·e^(−dᵢt)·sin(fᵢt+φᵢ)`. **Idea:** a harmonograph curve that draws itself and slowly decays — gorgeous, evolving, and a near-free extension of the planned Lissajous/XY mode. Damping + frequencies are natural modulation/audio targets. |

## 19. Quantum wave mode (Schrödinger cavity — extends the Wave Field)

The Wave Field solves the *classical* wave equation. The **Schrödinger** equation
runs on the *same* two-float-texture ping-pong machinery (complex ψ = real + imag),
and the room mask becomes an infinite potential well → **quantum billiards**: the
stadium/bent/blob rooms turn into quantum-chaos cavities showing scarring and
interference no classical mode can. A novel, high-reuse new mode.

| Project | License | Notes & ideas to borrow |
|---|---|---|
| [marl0ny/QM-Simulator-2D](https://github.com/marl0ny/QM-Simulator-2D) | **BSD-2-Clause** ✅ | WebGL 2D particle-in-a-box: draw potentials, scatter Gaussian wave-packets. Default integrator is **Visscher's staggered real/imaginary leapfrog** — an *explicit, real-valued* scheme that maps almost 1:1 onto our existing FDTD ping-pong (no FFT needed). BSD = adaptable with credit. |
| [davidar.io — Shaders of Schrödinger](https://davidar.io/post/quantum-glsl) | blog — **technique** | Schrödinger in a single fragment shader; the clearest walkthrough of doing it the GPU way. |
| [georgestagg/webgl_gpe](https://github.com/georgestagg/webgl_gpe) | **MIT** ✅ | WebGL **superfluid** (Gross–Pitaevskii = *nonlinear* Schrödinger) — quantised vortices and interference. A wilder variant once the linear version works. |
| [quantum-visualizations/qmsolve](https://github.com/quantum-visualizations/qmsolve) | verify (Python) | Eigenstate solver — reference for displaying the cavity's **stationary states** analytically (the quantum cousin of §5's Chladni modes). |

**Wave-field numerical upgrades** (math, all free to implement 🟢) — improvements to the *classical* field we already ship:
- **PML absorbing boundaries** ([Wikipedia](https://en.wikipedia.org/wiki/Perfectly_matched_layer), [Bérenger lecture](https://www.ece.mcmaster.ca/faculty/bakr/ECE757/PMLlecture_Berenger.pdf)) — replace the current "read 0" absorb mode with a graded damping layer at the rim → **reflection-free open boundaries** (true ripple-tank feel, no edge echoes).
- **Variable medium** `C(x,y)` as a texture — spatially-varying wave speed → lenses, waveguides, and the Falstad-style **double-slit / refraction** presets. Our solver already has a scalar `C`; promoting it to a sampled field is the unlock.
- **9-point Laplacian** stencil — the 5-point Laplacian is grid-anisotropic (wavefronts go slightly square at high speed); the isotropic 9-point keeps circular fronts circular.

## 20. Performance & profiling (app-health methods)

| Source | License | Notes & ideas to borrow |
|---|---|---|
| [figma/webgl-profiler](https://github.com/figma/webgl-profiler) | **MIT** ✅ | GPU-side profiler built on `EXT_disjoint_timer_query`. Reference for *per-pass* GPU timing (trace vs. trails vs. bloom vs. field). |
| [EXT_disjoint_timer_query_webgl2](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/) ([MDN: WebGLQuery](https://developer.mozilla.org/en-US/docs/Web/API/WebGLQuery)) | spec ✅ | Real GPU timings in ns (CPU-side `performance.now()` lies — the GPU runs async). **Idea:** an **adaptive-quality** governor — measure frame GPU time and auto-drop field resolution / bloom taps / bounce count when over a ~16 ms budget, so mobile and 4K-record stay smooth. |

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
15. **Perceptual (log/mel) audio bands**: remap FFT bins so mids/highs react properly — small change, big musical feel. (Easy win.)
16. **Spectral-flux onset detection** (via MIT Meyda): more accurate beats that catch hi-hats/snares, not just bass thumps.
17. **FFT-as-texture → spatial spectral reactivity**: upload the live spectrum as a 1-D texture; e.g. wave-field source amplitude around its rim = the spectrum, or beam hue indexed by frequency. Reuses our float-texture infra; highest ceiling.
18. **Auto-BPM (autocorrelation)** + **chroma→hue**: detect tempo automatically to sync LFOs; map dominant pitch class to colour.
19. **GPGPU particle mode** (transform feedback): emitter-spawned particles advected by flow field, bouncing off the room walls (reuse arc/poly collision), coloured by speed/audio.
20. **MP4 + looping-GIF export** (canvas-record/WebCodecs, MIT): real MP4 + seamless-loop GIF beside the WebM — the biggest distribution lever.
21. **OKLab/OKLCH colour interpolation** (§15, Ottosson, public-domain): lerp scene transitions and palettes perceptually → even fades, no muddy midpoints. Highest-quality colour upgrade, small change.
22. **Blue-noise dithering** (§15): add sub-LSB noise before 8-bit output to kill glow/trail gradient banding. One line in the composite shader.
23. **Filmic tone-map + pyramidal bloom** (§16, AgX/ACES + Jimenez): roll highlights off to colour-rich white instead of clipping; wider, energy-stable glow. Directly upgrades the signature Glow look.
24. **Spectral "real laser" palette** (§15): pick beam colours by wavelength (nm) via the CIE wavelength→RGB curve — physically grounded and on-brand.
25. **Volumetric god-rays** (§17, GPU Gems 3 radial-blur; MIT impl): light shafts from a bright emitter through haze — two passes.
26. **Caustics from the wave field** (§17, evanw/webgl-water, MIT): cast shimmering caustics from the field surface onto the room.
27. **Attractor / harmonograph emission mode** (§18, Paul Bourke math): iterated-map and damped-pendulum curves through the beam/glow pipeline — Lissajous's richer, audio-morphable cousins.
28. **Quantum (Schrödinger) cavity sub-mode** (§19, marl0ny BSD / Visscher scheme): complex ψ on the existing float ping-pong; the room becomes a quantum-billiard well — scarring & interference no classical mode shows.
29. **PML absorbing boundaries + variable-medium field** (§19, math): reflection-free open walls, plus `C(x,y)` as a texture for lenses / waveguides / double-slit presets.
30. **GPU-timer adaptive quality** (§20, EXT_disjoint_timer_query): auto-tune field res / bloom / bounces to a frame budget so mobile + 4K stay at 60.

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
- **Our audio rig is good but linear-banded.** The single cheapest musical improvement is perceptual (log/mel) band mapping — right now treble barely moves because linear FFT bins bunch all the high frequencies into one wide band. Fixing the mapping makes the *whole* modulation matrix feel more alive at no UI cost.
- **Spectral reactivity wants to be spatial, and we're uniquely set up for it.** Most audio-shader work feeds the spectrum as a texture to a fullscreen quad. We have emitters, rooms, and a wave field — feeding the FFT texture so that *different angles/positions respond to different frequencies* (a spectrum wrapped around the wave source, beams coloured by their frequency band) is a look almost no one else can do, because almost no one else has the physical-emitter substrate.
- **Don't confuse responsiveness with understanding.** Full MIR (key/chord/mood) is seductive but it's the wrong axis for an instrument: a VJ tool needs to *react fast and feel right*, not *know the song's key*. Invest in flux/onset/loudness fidelity, not musicology.
- **The biggest growth lever isn't a feature — it's the export format.** Voidulator records silent WebM, which barely travels (no autoplay-with-sound, poor social support). A real **MP4 / looping GIF** (WebCodecs, MIT canvas-record) is how generative-art tools actually spread. High impact, low risk, MIT-licensed path.
- **One GPU substrate, many modes.** We now have three reusable GPU patterns: ping-pong float textures (wave field / reaction-diffusion / fluid), transform-feedback buffers (particles), and post-process passes (bloom / kaleidoscope). Almost every "new mode" idea in this file is a recombination of those three — the hard infrastructure is already built.
- **One ping-pong, two physics.** The Wave Field's two-float-texture machinery already *is* a Schrödinger solver waiting to happen — classical waves and quantum ψ differ mainly in the update shader, and the reflecting-wall mask doubles as an infinite potential well. So our oddball cavities (stadium, bent, blob) become quantum-billiard scars almost for free. Highest novelty-per-line idea on the list (§19).
- **Colour is the cheapest fidelity win we haven't taken.** Everything renders and blends in HSL/RGB. Moving transitions/palettes to OKLab, dithering the 8-bit output with blue noise, and offering a real wavelength-indexed "laser" palette would visibly clean up and authenticate *every* scene with no new features — pure polish that compounds (§15).
- **Tone-mapping is the missing half of bloom.** We brighten and blur, but clip to white — adding a filmic curve (AgX/ACES) is what makes bright beams read as *hot* instead of *blown*. Small shader, big perceived-quality jump, and it composes with a wider pyramidal bloom (§16).

## How to extend this file

When you find a project: add a row to the right category with **name, URL, license (verified?), and the one concrete thing worth taking**. Promote anything actionable into the Ideas backlog. Verify any `verify`-tagged license before reusing code.
