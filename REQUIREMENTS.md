# Voidulator Laser Room System - Requirements Document

## 1. System Overview

The Voidulator is a real-time laser beam simulation system built in HTML5/WebGL2 that renders animated laser beams bouncing within various geometric room shapes. The system provides comprehensive controls for beam physics, visual effects, and performance optimization.

## 2. Core Architecture

### 2.1 Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Rendering**: WebGL2 with custom shaders
- **Canvas**: Dual-canvas system (WebGL + 2D overlay)
- **Performance**: Hardware-accelerated GPU rendering with path caching

### 2.2 File Structure
- **Single HTML file**: Self-contained application (~1,200 lines)
- **Embedded CSS**: Custom dark theme styling
- **Inline JavaScript**: Complete simulation engine
- **No external dependencies**: Fully standalone

## 3. Room Geometry System

### 3.1 Supported Room Shapes
- **Circle**: Perfect circular boundary with configurable radius
- **Regular Polygons**: Triangle (3), Square (4), Pentagon (5), Hexagon (6)
- **Random Polygons**: 5-10 sided irregular shapes with controlled randomness
- **Blob**: Smooth organic shapes using harmonic oscillations (720 segments)

### 3.2 Room Generation Algorithm
- **Circle**: Centered with margin-based radius calculation
- **Regular**: Even angular distribution with centered positioning
- **Random**: Base angles with ±45% deviation, normalized scaling
- **Blob**: 3-harmonic wave function with amplitude 0.06, random phases

### 3.3 Dynamic Geometry
- **Automatic sizing**: Adapts to canvas dimensions with 16px margin
- **Responsive scaling**: Maintains aspect ratio across window sizes
- **Collision boundaries**: Precise mathematical intersection detection

## 4. Laser Physics Engine

### 4.1 Ray Tracing System
- **Precision**: Floating-point ray-segment intersection
- **Tolerance**: 1e-4 minimum ray distance, 1e-9 denominator threshold
- **Algorithm**: Parametric line intersection with boundary testing

### 4.2 Reflection Physics
- **Surface normals**: Calculated per collision point
- **Reflection formula**: `d' = d - 2(d·n)n` where d=direction, n=normal
- **Offset positioning**: 0.02 pixel offset to prevent self-intersection

### 4.3 Beam Attenuation
- **Reflectivity**: 0-100% with gamma 3.2 easing curve
- **Intensity decay**: Multiplicative per bounce
- **Termination**: Stops at intensity < 0.01 or max bounces reached
- **Max bounces**: 1-300 configurable limit

## 5. Multi-Emitter System

### 5.1 Emitter Configuration
- **Count**: 1-4 simultaneous emitters
- **Positioning**: Drag-and-drop interactive placement
- **Auto-centering**: Geometric center with 14px spacing
- **Random placement**: Uniform distribution within room boundaries

### 5.2 Beam Generation
- **Per-emitter beams**: 1-24 beams per emitter
- **Angular spread**: 0-180° configurable fan
- **Base angle**: 0-360° global rotation
- **Beam width**: 1-8 pixel thickness

## 6. Advanced Rotation System

### 6.1 Global Rotation
- **Speed range**: 0-5°/s (ultra slow) to 0-1440°/s (ultra fast)
- **Dynamic ranges**: User-selectable speed limits
- **Real-time control**: Live angle adjustment with UI sync

### 6.2 Per-Beam Individual Rotation
- **Speed arrays**: Independent rotation per beam
- **Prime number presets**: Raw or scaled prime speed distribution
- **Speed inheritance**: Adds to global rotation speed
- **Phase tracking**: Individual beam position state

### 6.3 Speed Multiplier System
- **Global scaling**: 0-2x multiplier for all individual speeds
- **Performance control**: Allows speed reduction without losing ratios
- **Real-time adjustment**: Immediate response to slider changes

## 7. Color Management System

### 7.1 Color Schemes
- **Rainbow**: Even HSL distribution across spectrum
- **Triad**: 120° spaced harmonious colors with ±10° variation
- **Analogous**: 60° span adjacent colors
- **Warm**: 0-60° hue range (reds, oranges, yellows)
- **Cool**: 140-320° hue range (blues, greens, purples)
- **Monochrome**: Single hue with lightness variation
- **Random**: Completely randomized HSL values
- **Custom**: Manual color picker per beam

### 7.2 Color Space
- **Format**: HSL (Hue 0-360°, Saturation 0-100%, Lightness 0-100%)
- **Conversion**: Real-time HSL↔RGB conversion for WebGL
- **Interpolation**: Smooth color transitions during scheme changes

## 8. WebGL Rendering Engine

### 8.1 Shader System
- **Vertex Shader**: Position transformation, attribute passing
- **Fragment Shader**: Pulse effects, gradient shading, alpha blending
- **Attributes**: Position (2D), time offset, color (RGB), alpha, gradient position
- **Uniforms**: Resolution, time, pulse parameters

### 8.2 Gradient Shading
- **Implementation**: Fragment shader with smoothstep falloff
- **Profile**: Center-to-edge gradient (1.0 → 0.0)
- **Quality**: Hardware-accelerated smooth transitions
- **Per-vertex**: Gradient position attribute (0=edge, 0.5=center, 1=edge)

### 8.3 Geometry Generation
- **Quad-based**: Each beam segment rendered as oriented rectangle
- **Triangle pairs**: 6 vertices per quad (2 triangles)
- **Normal calculation**: Perpendicular to beam direction
- **Width scaling**: Half-width offset from centerline

## 9. Glow Effects System

### 9.1 Multi-Layer Rendering
- **Layer count**: 0-3 glow layers (Off, Single, Double, Triple)
- **Layer ordering**: Outside-in rendering for proper blending
- **Width scaling**: Progressive increase per outer layer
- **Intensity falloff**: Reduced alpha for outer layers

### 9.2 Glow Parameters
- **Intensity**: 0.1-3.0 brightness multiplier
- **Spread**: 1-15 width expansion factor
- **Core brightness**: 0.5-2.0 inner beam intensity
- **Layer formula**: `width = baseWidth * (layer === 1 ? 0.5 : spread * layer * 0.5)`

### 9.3 Blend Modes
- **Normal**: Standard alpha blending `(src_alpha, 1-src_alpha)`
- **Additive**: Bright accumulation `(one, one)`
- **Screen**: Photographic dodge `(1-dst_color, one)`

## 10. Pulse Effects System

### 10.1 Wave Functions
- **Sine wave**: `0.5 + 0.5 * sin(freq * distance - speed * time)`
- **Square wave**: Smoothstep-based square with configurable softness
- **Frequency**: 0.05-6 cycles per 100 pixels
- **Speed**: 0-900 pixels/second wave propagation

### 10.2 Pulse Application
- **Alpha modulation**: `alpha *= (1-amplitude) + amplitude * wave`
- **Distance-based**: Wave position determined by cumulative path length
- **Time synchronization**: Global time parameter for animation
- **Quality control**: Edge softness 0-1 for square waves

## 11. Performance Optimization

### 11.1 Path Caching System
- **Cache key**: Geometry + physics parameters hash
- **Storage**: Map-based with automatic cleanup at 1000 entries
- **Invalidation**: Automatic on geometry/physics changes
- **Precision**: Position rounded to 0.1px, direction to 0.001 radians

### 11.2 Adaptive Frame Rate
- **Target FPS**: 60fps normal, 30fps for complex scenes
- **Trigger conditions**: >2 glow layers AND >100 segments
- **Frame limiting**: Minimum interval enforcement
- **Performance monitoring**: Real-time FPS and segment count display

### 11.3 Memory Management
- **Buffer reuse**: Single WebGL buffer with dynamic updates
- **Data streaming**: Float32Array allocation per frame
- **Cache cleanup**: Automatic purging to prevent memory leaks

## 12. Preset System

### 12.1 Preset Storage Format
```json
{
  "polygonType": "circle|regular-N|random-N|blob",
  "sides": 3-10,
  "beamWidth": 1-8,
  "reflectSlider": 0-1,
  "maxBounces": 1-300,
  "beamCount": 1-24,
  "spreadDeg": 0-180,
  "angleDeg": 0-360,
  "rotationSpeed": 0-speedMax,
  "speedMax": 5|30|360|720|1440,
  "speedMultiplier": 0-2,
  "emitters": [{x,y}],
  "beamScheme": "rainbow|triad|analogous|warm|cool|mono|random|custom",
  "beamPalette": [{h,s,l}],
  "perBeamSpeed": [numbers],
  "perBeamPhase": [0-360],
  "pulse": {on, shape, amp, freq, speed, soft},
  "glow": {layers, intensity, spread, core, blend, bloom}
}
```

### 12.2 Built-in Presets
- **✨ Spectacular glow**: Multi-layer rainbow with dramatic effects
- **💫 Subtle elegance**: Hexagon room with cool colors, minimal glow
- **🌈 Rainbow burst**: 12-beam 360° explosion with maximum effects
- **⚡ Cyberpunk**: Square room, neon colors, sharp pulse effects

## 13. Video Rendering System

### 13.1 Fixed Resolution Export
- **Resolution**: Custom width×height (default 1920×1080)
- **Frame rate**: 1-120 fps (default 60)
- **Duration**: 1-600 seconds (default 8)
- **Format**: WebM with VP9/VP8 codec selection

### 13.2 Encoding Parameters
- **Bitrate**: Dynamic 4-40 Mbps based on resolution and framerate
- **Quality**: `bitrate = max(4e6, min(4e7, W*H*fps*0.07))`
- **Capture**: MediaRecorder API with canvas stream
- **Download**: Automatic blob download with filename

### 13.3 Rendering Pipeline
- **Dual canvas**: Separate WebGL and 2D overlay rendering
- **Composition**: Real-time canvas combination
- **Timing**: Fixed delta-time for consistent playback
- **Progress**: Real-time rendering with stop capability

## 14. User Interface System

### 14.1 Layout Structure
- **Grid system**: CSS Grid with responsive breakpoints
- **Panel width**: 460px fixed, collapses on mobile
- **Control groups**: Logical organization with visual separation
- **Input types**: Range sliders, number inputs, dropdowns, buttons

### 14.2 Real-time Synchronization
- **Bidirectional sync**: Slider ↔ number input automatic updates
- **Live preview**: Immediate visual feedback on parameter changes
- **Value clamping**: Automatic range enforcement
- **UI state persistence**: Settings maintained during preset loading

### 14.3 Interactive Elements
- **Emitter dragging**: Pointer events with capture and boundary checking
- **File operations**: JSON preset save/load with error handling
- **Preset buttons**: One-click configuration application
- **Visual feedback**: Hover states and active indicators

## 15. Mathematical Constants and Limits

### 15.1 Physical Constants
- **π approximation**: Math.PI (JavaScript native)
- **Degree conversion**: `degrees * Math.PI / 180`
- **Collision epsilon**: 1e-4 for ray intersection
- **Float precision**: 1e-9 for denominator checking

### 15.2 Performance Limits
- **Max emitters**: 4 (UI enforced)
- **Max beams per emitter**: 24 (UI enforced)
- **Max bounces**: 300 (UI enforced)
- **Max glow layers**: 3 (UI enforced)
- **Cache size**: 1000 entries (automatic cleanup)

### 15.3 Rendering Constraints
- **Canvas size**: Viewport dependent with device pixel ratio
- **WebGL context**: Requires WebGL2 support
- **Shader precision**: `highp float` throughout
- **Blend equation**: Standard alpha or additive modes

## 16. Error Handling and Edge Cases

### 16.1 Graceful Degradation
- **WebGL2 unavailable**: Alert with fallback message
- **Invalid preset JSON**: User notification with error catching
- **File load errors**: Silent failure with user feedback
- **Geometry edge cases**: Intersection tolerance handling

### 16.2 Boundary Conditions
- **Zero-length rays**: Prevented by minimum distance checking
- **Degenerate geometry**: Handled by epsilon comparisons
- **Division by zero**: Protected denominators
- **Array bounds**: Automatic array sizing and modulo indexing

### 16.3 Performance Safeguards
- **Frame rate limiting**: Automatic reduction on complex scenes
- **Memory cleanup**: Cache size limits and automatic purging
- **Infinite loops**: Max bounce limits and intensity thresholds

## 17. Browser Compatibility

### 17.1 Required Features
- **WebGL2**: Core rendering requirement
- **ES6+**: Arrow functions, template literals, destructuring
- **Canvas API**: 2D context for overlay
- **MediaRecorder**: Video export functionality
- **File API**: Preset import/export

### 17.2 Performance Characteristics
- **Desktop**: Optimized for 60fps at 1080p
- **Mobile**: Automatic frame rate reduction
- **GPU**: Benefits from hardware acceleration
- **Memory**: ~10-50MB typical usage

---

*This comprehensive requirements document captures the full functionality, implementation details, and operational characteristics of the Voidulator laser room system as currently implemented.*