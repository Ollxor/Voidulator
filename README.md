# Voidulator

**A mesmerizing WebGL laser room simulator** — create stunning visual art with bouncing beams, reflections, and hypnotic effects.

🌐 **Live demo:** [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se)

![Voidulator Screenshot](screenshot.png)

## ✨ Features

### Core Simulation
- **Beams + Rings** — Classic rotating beams, plus an independent Rings system: expanding circular wavefronts from their own draggable emitters that fold and reflect like real waves, with bounce-based lifetime, randomized burst spawning, and an optional rainbow swept around each ring
- **Wave field** — A real wave-equation (FDTD) simulation running live on the GPU: emitters become wave sources, walls reflect or absorb, and cavities like the ellipse and parabolic resonator show their true standing-wave and focusing patterns. Click to drop ripples. _(Inspired by [Nils Berglund's](https://www.youtube.com/@NilsBerglund) simulations.)_
- **Multiple room shapes** — Circle, ellipse (with eccentricity and marked foci), triangle, square, pentagon, hexagon, randomgon, organic blob, parabolic resonator
- **Bendable walls** — Curve any polygon's walls from pillow-bulge to pinched focusing mirrors
- **Phosphor walls** — Beams paint decaying glow onto the walls where they strike
- **Realistic reflections** — Adjustable reflectivity with up to 375 bounces
- **Multiple emitters** — Up to 4 draggable laser emitters with WASD movement
- **Beam spread** — Fan beams from focused to wide angles

### Visual Effects
- **Pulse animation** — Sine/square wave patterns traveling along beams with adjustable frequency, speed, amplitude, softness, and duty cycle
- **Shape effects** — Animated circles/ellipses flowing along beams
- **Trails** — Persistent afterglow with hue shifting
- **Glow (bloom)** — Bright beams bleed light like real lasers in haze, with strength and threshold controls
- **Blend modes** — Normal or additive blending

### Color & Style
- **30+ color schemes** — From rainbow and neon to nature-inspired palettes (Aurora Borealis, Coral Reef, Northern Lights, etc.)
- **Per-beam colors** — Custom color picker for each beam
- **2 UI themes** — Classic (amber) and Coral (bioluminescent)

### Scenes & Automation
- **8 scene slots** — Save and recall your favorite configurations
- **Smooth transitions** — Morphing between scenes with adjustable duration
- **Screensaver mode** — Auto-cycle through saved scenes
- **Export/Import** — Share presets as JSON files

### Audio Reactive & Performance
- **Microphone input** — Beams react to sound, with live level meter
- **Modulation matrix** — Route any audio band (bass/mids/highs/full), the beat envelope, or two free-running LFOs to any of 17 parameters (beam width, pulse, spread, speed, hue, brightness, glow…) with bipolar amounts; stack as many routes as you like
- **Beat detection** — Adaptive onset detector with a decaying beat envelope, plus beat-triggered events: spawn ripples and jump the hue on every kick
- **MIDI control** — Plug in a controller, click Learn, twist a knob: hardware control of any parameter (Chrome/Edge)
- **Video recording** — Export WebM at 480p, 720p, 1080p, or true native-rendered 4K

### Accessibility
- **4 languages** — English, Spanish, Portuguese, French
- **Simple/Advanced modes** — Beginner-friendly or full control
- **Interactive tutorial** — Learn the basics step by step
- **Mobile optimized** — Works on phones and tablets

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **F** | Toggle fullscreen |
| **U** | Toggle UI visibility (fullscreen only) |
| **N** | Next saved scene |
| **W/A/S/D** | Move emitter(s) |
| **1-8** | Load scene slot |

## 🚀 Getting Started

### Online
Just visit [voidulator.ollebjerkas.se](https://voidulator.ollebjerkas.se) — no installation needed!

### Self-hosted
1. Clone the repository:
   ```bash
   git clone https://github.com/Ollxor/Voidulator.git
   ```
2. Serve with any static file server:
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   ```
3. Open `http://localhost:8000` in your browser

### Single File
The entire app is contained in `index.html` — just open it in a modern browser!

## 🖥️ Browser Support

- **Chrome/Edge** 80+ (recommended)
- **Firefox** 75+
- **Safari** 14+
- **Mobile browsers** — iOS Safari, Chrome for Android

Requires WebGL2 support.

## 📁 Project Structure

```
Voidulator/
├── index.html      # Complete app (single file)
├── manifest.json   # PWA manifest
├── README.md       # This file
└── LICENSE         # MIT License
```

## 🛠️ Technical Details

- **Pure WebGL2** — No frameworks, no dependencies
- **Single HTML file** — Complete app in ~6000 lines
- **60 FPS** — Smooth animations with requestAnimationFrame
- **Framebuffer effects** — Ping-pong rendering for trails
- **Responsive** — Adapts to any screen size

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙏 Credits

Created by **Olle Bjerkås**

Built with WebGL, creativity, and lots of iterating.

**Acknowledgements**
- The **Wave field** mode was inspired by [Nils Berglund's](https://www.youtube.com/@NilsBerglund) wave-equation simulation videos ([source, CC0](https://github.com/nilsberglund-orleans/YouTube-simulations)). Voidulator's implementation is independent WebGL/GLSL code.
- The branchless `rgb2hsv`/`hsv2rgb` GLSL helpers are by **Sam Hocevar** (public domain).

---

*"Stare into the void, and the void stares back... beautifully."*
