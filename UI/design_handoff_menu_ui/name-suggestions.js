// name-suggestions.js — curated rename suggestions per menu + section.
// Two angles for every entry:
//   sci — grounded in the math/physics/optics of what the function actually does
//   exp — experiential / evocative names for how it FEELS on screen
// Keyed by menu id (matches voidulator-model.js) and 'sec:<Section>' for groups.
window.VOID_NAMES = {
  /* ── sections (gatherings of function) ── */
  'sec:Field':   { sci: ['Cavity', 'Domain', 'Resonator', 'Boundary'], exp: ['The Room', 'The Chamber', 'Space', 'Stage'] },
  'sec:Look':    { sci: ['Render', 'Optics', 'Composite', 'Shading'],   exp: ['Style', 'Finish', 'Mood', 'The Eye'] },
  'sec:Perform': { sci: ['Control', 'Modulation', 'Input', 'Drive'],    exp: ['Live', 'Play', 'Hands', 'The Pulse'] },
  'sec:Session': { sci: ['State', 'I/O', 'Archive', 'Persistence'],     exp: ['Library', 'Memory', 'Vault', 'Acts'] },

  /* ── FIELD ── */
  // polygon billiard: shape, reflectivity, bounces, bendable walls
  room:      { sci: ['Cavity', 'Resonator', 'Billiard', 'Boundary', 'Geometry'], exp: ['The Chamber', 'Walls', 'The Vessel', 'Arena', 'Shell'] },
  // rotating laser rays from movable emitters
  beams:     { sci: ['Rays', 'Emitters', 'Pencils', 'Trajectories', 'Geodesics'], exp: ['Lances', 'Blades', 'Threads', 'Spokes', 'The Fan'] },
  // expanding circular wavefronts that reflect & decay by bounce count
  rings:     { sci: ['Wavefronts', 'Huygens', 'Fronts', 'Pulses', 'Shells'], exp: ['Echoes', 'Halos', 'Ripples', 'Sonar', 'Bloom'] },
  // FDTD wave-equation field — standing waves, resonance, diffraction
  wavefield: { sci: ['Interference', 'Standing Waves', 'Eigenmodes', 'Helmholtz', 'Diffraction'], exp: ['The Pond', 'Surface', 'Membrane', 'Ether', 'Tide'] },

  /* ── LOOK ── */
  // edge feather + blend/layer compositing
  edges:     { sci: ['Compositing', 'Falloff', 'Feather', 'Antialias', 'Blending'], exp: ['Softness', 'Edges', 'Bleed', 'The Seam'] },
  // framebuffer afterglow with decay + hue shift
  trails:    { sci: ['Persistence', 'Decay', 'Hysteresis', 'Afterimage', 'Integration'], exp: ['Afterglow', 'Memory', 'Wake', 'Comet', 'Ghosts'] },
  // bloom on bright areas above a threshold
  glow:      { sci: ['Bloom', 'Halation', 'Diffusion', 'Scatter', 'Threshold'], exp: ['Haze', 'Halo', 'Radiance', 'Aura', 'Shine'] },
  // beams excite decaying glow on the walls = caustics
  phosphor:  { sci: ['Caustics', 'Phosphorescence', 'Excitation', 'Luminance Decay'], exp: ['Scorch', 'Burn', 'Embers', 'Searing', 'Stains'] },
  // color schemes / colormaps
  palette:   { sci: ['Spectrum', 'Chroma', 'Gamut', 'Colormap', 'Hue Map'], exp: ['Colors', 'Pigment', 'Ink', 'Dye', 'Tones'] },

  /* ── PERFORM ── */
  // mic / system audio amplitude in
  audio:     { sci: ['Audio Input', 'Amplitude', 'Signal', 'Spectrum In'], exp: ['Listen', 'Ears', 'Sound In', 'The Mic'] },
  // route sources → parameters (LFOs, bands, beat) with bipolar amounts
  mod:       { sci: ['Routing', 'Modulation', 'Patch Bay', 'Mapping', 'Cross-couple'], exp: ['Wiring', 'Patch', 'Nerves', 'Links', 'The Web'] },
  // adaptive onset detector + decaying envelope
  beat:      { sci: ['Onset', 'Envelope', 'Transient', 'Tempo'], exp: ['Pulse', 'Heartbeat', 'The Kick', 'Groove'] },
  // hardware controller learn & bind
  midi:      { sci: ['Controller', 'MIDI I/O', 'Bindings'], exp: ['Knobs', 'Hardware', 'The Desk'] },
  // emitter symmetry & motion
  bonus:     { sci: ['Kinematics', 'Symmetry', 'Dynamics', 'Orbits'], exp: ['Movement', 'Drift', 'Choreography', 'Swarm', 'Flux'] },

  /* ── SESSION ── */
  // encode frames to WebM
  record:    { sci: ['Capture', 'Encode', 'Frame Export'], exp: ['Record', 'Film', 'Tape'] },
  // save/recall configurations, morph, screensaver
  scenes:    { sci: ['States', 'Snapshots', 'Configurations', 'Presets'], exp: ['Moments', 'Moods', 'Saves', 'Acts'] },
  // serialize state to/from JSON
  presets:   { sci: ['Serialization', 'Export / Import', 'State File'], exp: ['Files', 'Backup', 'Share'] },
};
