# Voidulator

A real-time laser beam simulation built with HTML5/WebGL2. Create mesmerizing visual patterns with bouncing laser beams, trails, pulse effects, and more.

![Voidulator](https://img.shields.io/badge/version-0.7.0-orange) ![WebGL2](https://img.shields.io/badge/WebGL2-required-blue)

## Features

### Core Simulation
- **Ray Tracing**: Realistic laser beam reflections with adjustable reflectivity and bounce limits
- **Multiple Room Shapes**: Circle, triangle, square, pentagon, hexagon, random polygons, and organic blobs
- **Multi-Emitter System**: Up to 4 draggable laser emitters with symmetric positioning options
- **Per-Beam Rotation**: Individual beam speeds with prime number patterns

### Visual Effects
- **Pulse Effect** (GPU shader): Sine and square wave patterns along beams
  - Adjustable amplitude, frequency, speed, softness
  - Duty cycle control (0 = black, 1 = full brightness)
- **Width Wave**: Beam thickness oscillates along its length
  - Amount, frequency, speed controls
  - Duty cycle for gaps/thick sections
- **Trails**: Persistent afterglow with framebuffer ping-pong rendering
  - Adjustable length (fade duration)
  - Hue shift (0° = same color, 180° = complementary)
- **Brightness Oscillation**: Global brightness pulsing over time
- **Blend Modes**: Normal and Additive blending

### Color System
- **Color Schemes**: Rainbow, Triad, Analogous, Warm, Cool, Monochrome, Grayscale, Muted, Earth tones, Noir, Duotones, and more
- **Custom Palettes**: Click any color swatch to customize
- **Per-Emitter Colors**: Each emitter can have its own palette
- **Hue Rotation**: Continuous color shifting over time
- **Drag-to-Reorder**: Reorder beam layers by dragging swatches

### Scenes & Presets
- **8 Scene Slots**: Save and recall complete configurations
- **Keyboard Shortcuts**: Keys 1-8 to trigger scenes, Shift+Click to save
- **Smooth Transitions**: Adjustable crossfade between scenes
- **File Presets**: Export/import JSON preset files

### Controls
- **WASD Keys**: Move emitter position
- **Fullscreen**: F key or button
- **Speed Multiplier**: Fine control with 0.01/0.001 step buttons
- **Symmetric Emitters**: Auto-position emitters in circular pattern

## Quick Start

1. Open `index.html` in a modern browser (Chrome, Firefox, Safari, Edge)
2. Adjust beam count, enable some effects (Pulse, Width Wave, Trails)
3. Drag the emitter dot around
4. Experiment with color schemes and rotation patterns
5. Save your favorite looks to scene slots

## Browser Requirements

- WebGL2 support (Chrome 56+, Firefox 51+, Safari 15+, Edge 79+)
- Modern JavaScript (ES6+)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| W/A/S/D | Move emitter |
| F | Toggle fullscreen |
| 1-8 | Load scene slot |
| Shift + 1-8 | Save to scene slot |

## Technology

- Pure HTML5/CSS3/JavaScript — no dependencies
- WebGL2 with custom GLSL shaders
- Framebuffer ping-pong for trail rendering
- Real-time ray tracing

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

MIT License - feel free to use, modify, and share.

---

*Built with Claude AI assistance*
