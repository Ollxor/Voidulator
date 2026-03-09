# Voidulator

A mesmerizing WebGL2 laser room simulator with reflections, shapes, and visual effects. Create stunning generative visual art in your browser.

🔗 **[Try it live](https://ollxor.github.io/Voidulator/)** (if hosted on GitHub Pages)

## Features

### Core Controls
- **Reflectivity** — How much light bounces off walls (gamma-eased for intuitive control)
- **Max Bounces** — Up to 300 reflections per beam
- **Beam Width** — Thickness of laser beams (0.5–8)
- **Beam Count** — Multiple beams per emitter (1–24)
- **Layer Mode** — Depth or Flat rendering
- **Blend Mode** — Normal or Additive blending

### Color System
- **16+ Color Schemes** — Rainbow, Grayscale, Warm, Cool, Noir, Duotone, and more
- **Per-emitter Palettes** — Each emitter can have its own color scheme
- **Drag-to-reorder** — Rearrange beam layer order by dragging swatches

### Per-beam Rotation
- **Speed Patterns** — Prime, Linear, Exponential, Fibonacci, Alternating, Random
- **Base Speed** — Control rotation intensity
- **Individual Speeds** — Fine-tune each beam's rotation

### Pulse Effect (Shader)
- **Shape** — Sine or Square wave
- **Amplitude, Frequency, Speed** — Full control over pulse animation
- **Softness** — Edge smoothness for square waves
- **Duty Cycle** — Control light/dark ratio

### Shape Flow (Width Wave)
- **Shapes** — Circle, Triangle, Square, Pentagon, Hexagon patterns
- **Density** — Pattern frequency along beams
- **Size** — Shape size (duty cycle)
- **Flow** — Animation direction (inward/outward)
- **Spin** — Rotation of the pattern

### Shader Effects
- **Edge Fade** — Beams fade near room boundary
- **Glow** — Soft halo around shapes

### Trails
- **Length** — Trail persistence (1–180 frames)
- **Hue Shift** — Color rotation over trail length

### Scene System
- **8 Quick Slots** — Save/recall with Shift+Click or keys 1-8
- **Named Scenes** — Organize with custom names
- **Smooth Transitions** — Configurable crossfade duration
- **Screensaver Mode** — Auto-cycle through saved scenes

### Emitters
- **Multiple Emitters** — Up to 4 independent light sources
- **Symmetry Mode** — Mirror emitter movements
- **Draggable** — Position emitters by dragging on canvas
- **Movement Speed** — Control wander/orbit speed

### Room Shapes
- Circle, Triangle, Square, Pentagon, Hexagon
- Randomgon (random polygon)
- Blob (smooth organic shape)

### Audio Reactive
- **Mic Input** — React to ambient sound
- **Targets** — Map audio to angle, spread, width, pulse speed/freq, center range
- **Band Selection** — Full spectrum, bass, mids, or highs
- **Sensitivity & Smoothing** — Fine-tune responsiveness

### UI Themes
- **Classic** — Orange/teal monospace aesthetic
- **Coral** — Bioluminescent deep-sea theme with chromatic gradient sliders

### Additional Features
- **Fullscreen Mode** — Press F or click ⛶
- **Hide UI** — Press H for clean view
- **Share** — Generate URL with encoded state
- **Export/Import** — Save presets as JSON files
- **Autosave** — State saved every 5 seconds
- **PWA Support** — Install as standalone app
- **Keyboard Shortcuts** — 1-8 for scenes, F for fullscreen, H for hide UI

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`8` | Go to scene slot |
| `Shift+1`–`8` | Save to scene slot |
| `F` | Toggle fullscreen |
| `H` | Toggle UI visibility |

## Technical Details

- **Single HTML file** — No build step, no dependencies
- **WebGL2** — Hardware-accelerated rendering
- **~4700 lines** — Complete implementation in one file
- **LocalStorage** — Persistent state and scenes

## Browser Support

Requires WebGL2 support:
- Chrome 56+
- Firefox 51+
- Safari 15+
- Edge 79+

## Development

This project was developed using AI-assisted "vibe coding" — iterative development through conversation with Claude.

### Running Locally

Simply open `index.html` in a modern browser. No server required for basic functionality.

For PWA features, serve over HTTPS:
```bash
npx serve .
```

## License

MIT License — feel free to use, modify, and share.

## Credits

Created by [Ollxor](https://github.com/Ollxor) with AI assistance from Claude (Anthropic).
