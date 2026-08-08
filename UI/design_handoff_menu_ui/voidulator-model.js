// voidulator-model.js — full menu tree for the Summon command deck.
// Sections → menus → params (+ submenus). Mirrors the real Voidulator panels.
// Param types: range | bool | enum | select | palette | action | matrix | scenes | readout
// menu.power: key of a bool param that acts as the menu's master on/off (shown on tile)
// menu.lens : 'beams' | 'waves' | 'both'  — which engine lens the menu belongs to
(function () {
  const R = (k, label, value, min, max, unit, opts) => Object.assign({ k, label, type: 'range', value, min, max, unit: unit || '' }, opts || {});
  const B = (k, label, value) => ({ k, label, type: 'bool', value });
  const E = (k, label, value, options) => ({ k, label, type: 'enum', value, options });
  const SEL = (k, label, value, options) => ({ k, label, type: 'select', value, options });
  const ACT = (k, label, opts) => Object.assign({ k, label, type: 'action' }, opts || {});

  const SHAPES = ['Circle','Ellipse','Triangle','Square','Pentagon','Hexagon','Randomgon','Blob','Parabolic'];

  const MENUS = [
    /* ───────────── FIELD ───────────── */
    {
      id: 'room', name: 'Room', glyph: '◇', section: 'Field', lens: 'both',
      blurb: 'Cavity shape & reflections',
      params: [
        E('shape', 'Shape', 'Hexagon', SHAPES),
        R('ecc', 'Eccentricity', 0, 0, 100, '%'),
        R('bend', 'Wall bend', -18, -100, 100, '%', { bipolar: true }),
        R('reflect', 'Reflectivity', 92, 0, 100, '%'),
        R('bounces', 'Max bounces', 140, 1, 375, ''),
      ],
    },
    {
      id: 'beams', name: 'Beams', glyph: '⊙', section: 'Field', lens: 'beams', power: 'on',
      blurb: 'Beam sources & motion',
      params: [
        B('on', 'Beams', true),
        R('count', 'Beam count', 7, 1, 64, ''),
        R('emitters', 'Center emitters', 2, 1, 4, ''),
        R('speed', 'Speed', 100, 0, 375, ''),
      ],
      submenus: [
        {
          id: 'beams.pulse', name: 'Pulse', glyph: '∿', power: 'on', blurb: 'Brightness pulse along beams',
          params: [
            B('on', 'Pulse', true),
            E('shape', 'Shape', 'Sine', ['Sine','Square']),
            R('amp', 'Amplitude', 65, 0, 100, '%'),
            R('freq', 'Frequency', 3.2, 0, 20, 'Hz'),
            R('speed', 'Speed', 100, 0, 375, ''),
            R('soft', 'Softness', 30, 0, 100, '%'),
            R('duty', 'Duty cycle', 50, 0, 100, '%'),
          ],
        },
        {
          id: 'beams.shape', name: 'Shape', glyph: '✦', power: 'on', blurb: 'Particle shapes along beams',
          params: [
            B('on', 'Shape', false),
            E('shape', 'Shape', 'Diamond', ['Dot','Diamond','Ring','Star','Cross']),
            R('density', 'Density', 40, 0, 100, '%'),
            R('size', 'Size', 30, 0, 100, '%'),
            R('flow', 'Flow', 50, 0, 100, '%'),
            R('spin', 'Spin', 0, -100, 100, '%', { bipolar: true }),
          ],
        },
      ],
    },
    {
      id: 'rings', name: 'Rings', glyph: '◎', section: 'Field', lens: 'waves', power: 'on',
      blurb: 'Expanding ring wavefronts',
      params: [
        B('on', 'Rings', true),
        ACT('activate', 'Activate now', { variant: 'primary' }),
        ACT('clear', 'Clear', { variant: 'ghost' }),
        B('autospawn', 'Auto spawn', true),
        B('align', 'Align center upright', false),
        B('geometric', 'Geometric', false),
        R('speed', 'Speed', 100, 0, 375, ''),
        R('lifetime', 'Lifetime', 60, 0, 100, '%'),
        R('taper', 'Taper', 40, 0, 100, '%'),
        E('color', 'Color', 'Rainbow', ['Rainbow','Palette']),
        R('interval', 'Interval', 50, 0, 100, '%'),
        R('peract', 'Per activation', 3, 1, 12, ''),
        R('spacing', 'Spacing', 40, 0, 100, '%'),
      ],
    },
    {
      id: 'wavefield', name: 'Wave field', glyph: '⌬', section: 'Field', lens: 'waves', power: 'on',
      blurb: 'FDTD interference field',
      params: [
        B('on', 'Wave field', false),
        R('emitters', 'Emitters', 2, 1, 8, ''),
        R('sharp', 'Ring sharpness', 50, 0, 100, '%'),
        B('align', 'Align center upright', false),
        R('freq', 'Frequency', 40, 0, 100, '%'),
        R('amp', 'Amplitude', 60, 0, 100, '%'),
        R('speed', 'Speed', 100, 0, 375, ''),
        R('damping', 'Damping', 30, 0, 100, '%'),
        R('bright', 'Brightness', 70, 0, 100, '%'),
        B('emitteron', 'Emitter', true),
        SEL('scheme', 'Color scheme', 'Aurora Borealis', null),
      ],
    },

    /* ───────────── LOOK ───────────── */
    {
      id: 'edges', name: 'Edges & Blend', glyph: '◈', section: 'Look', lens: 'both',
      blurb: 'Edge feather & compositing',
      params: [
        R('softness', 'Edge softness', 30, 0, 100, '%'),
        R('intensity', 'Edge intensity', 72, 0, 100, '%'),
        E('blend', 'Blend mode', 'Additive', ['Normal','Additive']),
        E('layer', 'Layer mode', 'Over', ['Over','Under','Screen','Multiply']),
      ],
    },
    {
      id: 'trails', name: 'Trails', glyph: '☄', section: 'Look', lens: 'both', power: 'on',
      blurb: 'Afterglow persistence',
      params: [
        B('on', 'Trails', true),
        R('length', 'Length', 58, 0, 100, '%'),
        R('hueshift', 'Hue shift', 0, -100, 100, '%', { bipolar: true }),
      ],
    },
    {
      id: 'glow', name: 'Glow', glyph: '✺', section: 'Look', lens: 'both', power: 'on',
      blurb: 'Bloom on bright areas',
      params: [
        B('on', 'Glow', true),
        R('strength', 'Strength', 72, 0, 100, '%'),
        R('threshold', 'Threshold', 28, 0, 100, '%'),
      ],
    },
    {
      id: 'phosphor', name: 'Phosphor walls', glyph: '▤', section: 'Look', lens: 'beams', power: 'on',
      blurb: 'Beams paint glowing caustics',
      params: [
        B('on', 'Enable', true),
        R('persistence', 'Persistence', 4.9, 0, 10, 's'),
        R('intensity', 'Intensity', 60, 0, 100, '%'),
        R('width', 'Width', 6, 1, 24, 'px'),
      ],
    },
    {
      id: 'palette', name: 'Palette', glyph: '◐', section: 'Look', lens: 'both',
      blurb: '31 color palettes',
      params: [
        { k: 'palette', label: 'Palette', type: 'palette', value: 'Aurora Borealis' },
        B('perbeam', 'Per-beam color', false),
      ],
    },

    /* ───────────── PERFORM ───────────── */
    {
      id: 'audio', name: 'Audio reactive', glyph: '◉', section: 'Perform', lens: 'both', power: 'mic',
      blurb: 'Mic / system audio input',
      params: [
        B('mic', 'Microphone', true),
        ACT('listen', 'Start listening', { variant: 'primary' }),
        R('sensitivity', 'Sensitivity', 4, 0, 10, ''),
        R('smoothing', 'Smoothing', 55, 0, 100, '%'),
        { k: 'level', label: 'Level', type: 'readout' },
      ],
    },
    {
      id: 'mod', name: 'Modulation matrix', glyph: '⊞', section: 'Perform', lens: 'both',
      blurb: 'Route sources → parameters',
      params: [
        { k: 'matrix', label: 'Routes', type: 'matrix' },
        R('tempo', 'Tempo (BPM)', 120, 40, 300, ''),
        SEL('lfo1sync', 'LFO 1 sync', 'Free (Hz)', ['Free (Hz)','1/1','1/2','1/4','1/8','1/16']),
        R('lfo1hz', 'LFO 1 (Hz)', 0.25, 0, 5, 'Hz'),
        SEL('lfo2sync', 'LFO 2 sync', 'Free (Hz)', ['Free (Hz)','1/1','1/2','1/4','1/8','1/16']),
        R('lfo2hz', 'LFO 2 (Hz)', 0.05, 0, 5, 'Hz'),
      ],
    },
    {
      id: 'beat', name: 'Beat detection', glyph: '◍', section: 'Perform', lens: 'both', power: 'detect',
      blurb: 'Onset → events',
      params: [
        B('detect', 'Detect', true),
        R('sensitivity', 'Sensitivity', 1.4, 0, 5, ''),
        R('decay', 'Envelope decay', 45, 0, 100, '%'),
        B('onrip', 'On beat: ripples', false),
        B('onhue', 'On beat: hue', false),
        R('huestep', 'Hue step', 30, 0, 360, '°'),
      ],
    },
    {
      id: 'midi', name: 'MIDI', glyph: '⎓', section: 'Perform', lens: 'both', power: 'enabled',
      blurb: 'Learn & bind controllers',
      params: [
        B('enabled', 'MIDI', false),
        { k: 'status', label: 'Status', type: 'readout' },
        SEL('learn', 'Learn', 'Beam width', ['Beam width','Pulse freq','Glow','Trail','Reflectivity','Wall bend','Bounces','Hue']),
        ACT('learnbtn', 'Learn', { variant: 'ghost' }),
        B('notesbeat', 'Notes → beat', false),
      ],
    },
    {
      id: 'bonus', name: 'Bonus', glyph: '✷', section: 'Perform', lens: 'beams',
      blurb: 'Emitter symmetry & motion',
      params: [
        R('emitters', 'Emitters', 1, 1, 4, ''),
        E('symmetry', 'Symmetry', 'On', ['On','Off']),
        R('movespeed', 'Move speed', 150, 0, 375, ''),
        R('spread', 'Spread', 0.4, 0, 90, '°'),
        R('angle', 'Angle', 180, 0, 360, '°'),
        R('globalspeed', 'Global speed', 0, -100, 100, '', { bipolar: true }),
        SEL('speedrange', 'Speed range', 'Ultra slow', ['Ultra slow','Slow','Medium','Fast','Hyper']),
      ],
    },

    /* ───────────── SESSION ───────────── */
    {
      id: 'record', name: 'Record video', glyph: '⏺', section: 'Session', lens: 'both',
      blurb: 'Export WebM',
      params: [
        SEL('res', 'Resolution', '1080p', ['480p','720p','1080p','4K']),
        ACT('record', 'Start', { variant: 'primary', rec: true }),
      ],
    },
    {
      id: 'scenes', name: 'Scenes', glyph: '▦', section: 'Session', lens: 'both',
      blurb: '11 slots · morph · screensaver',
      params: [
        { k: 'scenes', label: 'Slots', type: 'scenes' },
        SEL('select', 'Scene', '— Select scene —', ['— Select scene —','Cathedral','Bloom','Knife','Tide']),
        ACT('save', 'Save', { variant: 'ghost' }),
        ACT('go', 'Go', { variant: 'ghost' }),
        ACT('delete', 'Delete', { variant: 'ghost' }),
        R('transition', 'Transition', 6, 0, 20, ''),
        R('screensaver', 'Screensaver', 12, 0, 60, ''),
      ],
    },
    {
      id: 'presets', name: 'File presets', glyph: '⤓', section: 'Session', lens: 'both',
      blurb: 'Export / import JSON',
      params: [
        ACT('export', 'Export', { variant: 'ghost' }),
        ACT('import', 'Import', { variant: 'ghost' }),
      ],
    },
  ];

  const SECTIONS = ['Field', 'Look', 'Perform', 'Session'];

  // 31 palettes (name, stops)
  const PALETTES = [
    ['Aurora Borealis', ['#0b6e4f','#22d3a6','#6ee7ff','#a78bfa']],
    ['Rainbow', ['#ff3b3b','#ffb13b','#ffe93b','#3bff6e','#3bb6ff','#a13bff']],
    ['Neon', ['#ff2bd6','#7a2bff','#2bffd6','#f6ff2b']],
    ['Coral Reef', ['#ff6f61','#ffac81','#ffd6a5','#6bd0d6']],
    ['Northern Lights', ['#1b3a4b','#2bd6b4','#9cff8f','#c8a2ff']],
    ['Sunset', ['#ff5e62','#ff9966','#ffcf6b','#7b4397']],
    ['Ember', ['#3a0a0a','#b21f1f','#ff6a00','#ffd166']],
    ['Ice', ['#0a2540','#3a86ff','#8ecae6','#e8f7ff']],
    ['Toxic', ['#0d2818','#39ff14','#aaff00','#eaff7a']],
    ['Infrared', ['#1a0000','#7a0019','#ff2e2e','#ff8c69']],
    ['Ultraviolet', ['#1a0033','#6a00ff','#b388ff','#e0c3ff']],
    ['Lava', ['#1a0a00','#7a1f00','#ff5400','#ffd000']],
    ['Ocean', ['#011627','#0353a4','#2ec4b6','#a7ffeb']],
    ['Forest', ['#0b2014','#1f5d3a','#5fbf6a','#c2f0a0']],
    ['Candy', ['#ff5fa2','#ff9ecd','#a0e7ff','#fff3a0']],
    ['Vapor', ['#ff71ce','#b967ff','#01cdfe','#05ffa1']],
    ['Gold', ['#3a2a00','#7a5b00','#d4af37','#fff1c1']],
    ['Plasma', ['#0d0887','#7e03a8','#cc4778','#f89540']],
    ['Spectrum', ['#440154','#3b528b','#21918c','#5ec962']],
    ['Dusk', ['#21243d','#88527f','#d96c75','#f2c14e']],
    ['Magma', ['#000004','#51127c','#b73779','#fc8961']],
    ['Mint', ['#04372c','#0d9276','#5ad7a0','#d9fff0']],
    ['Sakura', ['#5c2a3e','#c2587b','#ff9ebb','#ffe0ec']],
    ['Cobalt', ['#04143a','#1455c0','#4f9bff','#bfe0ff']],
    ['Citrus', ['#2a3a00','#7aa800','#d8ff00','#fbffd0']],
    ['Nebula', ['#1b0a3a','#5b2a86','#c34fbf','#f5a3ff']],
    ['Moss', ['#16240f','#3f6d2c','#8bc34a','#e6ffcf']],
    ['Ruby', ['#2a0010','#7a0033','#e0115f','#ff9ec4']],
    ['Slate', ['#10141a','#39414d','#7b8696','#cdd6e0']],
    ['Phosphor', ['#001a00','#0a5a0a','#39ff14','#d6ffd0']],
    ['Glacier', ['#0a1a2a','#2a6f97','#61a5c2','#cfeaff']],
  ];

  const MOD_SOURCES = ['Bass','Mids','Highs','Full','Beat','LFO 1','LFO 2'];
  const MOD_TARGETS = ['Beam width','Pulse freq','Pulse amp','Spread','Speed','Hue','Brightness',
    'Glow','Trail','Reflectivity','Wall bend','Ring rate','Bounces','Phosphor','Spawn','Softness','Duty'];
  const MOD_ROUTES = [
    { src: 'Bass', tgt: 'Brightness', amt: 0.62 },
    { src: 'Beat', tgt: 'Spawn', amt: 0.90 },
    { src: 'Highs', tgt: 'Hue', amt: -0.35 },
    { src: 'LFO 1', tgt: 'Wall bend', amt: 0.48 },
    { src: 'Full', tgt: 'Glow', amt: 0.30 },
  ];
  const SCENES = ['Cathedral','Bloom','Knife','Tide','Lattice','Ember','Null','Drift','Veil','Prism','Static'];

  window.VOID = { MENUS, SECTIONS, PALETTES, MOD_SOURCES, MOD_TARGETS, MOD_ROUTES, SCENES, SHAPES };
})();
