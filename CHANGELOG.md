# Changelog

All notable changes to Voidulator will be documented in this file.

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
