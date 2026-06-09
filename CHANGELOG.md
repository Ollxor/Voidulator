# Changelog

All notable changes to Voidulator will be documented in this file.

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
