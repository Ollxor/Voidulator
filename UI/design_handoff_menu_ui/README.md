# Handoff: Voidulator Menu / Command-Deck UI Redesign

> **Scope is UI ONLY.** This package changes how the menu *looks and is organized* —
> theme, readability, layout, fullscreen behavior, customization, and naming.
> It must **not** change any simulation math, signal routing, audio/MIDI, scene
> serialization, or any other functional behavior of Voidulator. Wherever a label
> or grouping in this design differs from the real app, that is a **naming/layout**
> change to confirm with the maintainer — never a reason to rewire a function.

---

## Overview

This is a redesign of Voidulator's control surface: the left **rail** (the menu) and
its in-rail panels. The goals were:

1. **Readability** — one warm dark theme ("Obsidian & Ember"), larger/brighter menu text.
2. **Roomier menu** — wider rail; the animation only needs a square.
3. **Performance / fullscreen mode** — `F` hides the menu and centers the animation.
4. **Customization** — reorder, show/hide, **rename** menus and section groups inline.
5. **Settings** — a dedicated panel (Mode, menu position, idle fade, fullscreen, reset, shortcuts).
6. **Renaming with curated suggestions** — every menu/section can be renamed; the rename
   UI offers "Scientific" and "Experiential" name ideas grounded in what each function does.

## About the design files

The files in this bundle are **design references created in HTML/React (Babel JSX)** —
prototypes that show the intended *look and behavior*. They are **not** production code
to copy verbatim. The task is to **recreate these UI changes inside the real Voidulator
codebase** (`github.com/Ollxor/Voidulator`) using its existing structure, framework, and
state model. Treat the HTML as the spec for appearance and interaction, not as files to drop in.

**Reference, do not import:** the prototype uses a fake `voidulator-model.js` menu tree and a
toy 2D `void-sim.js` canvas purely so the mock renders. The real app already has its own
menus, parameters, and renderer. **Do not** port `void-sim.js` or the prototype's model —
map this UI onto the real menus instead (see `CONFLICTS-AND-MAPPING.md`).

## Fidelity

**High-fidelity.** Colors, typography, spacing, sizes, and interactions are final and exact.
Recreate them pixel-faithfully using the codebase's own CSS/component conventions.

---

## Design tokens (Obsidian & Ember)

Single warm dark theme. All chrome reads CSS variables:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0705` | app background |
| `--rail` | `rgba(23,15,10,0.94)` | menu rail background |
| `--panel` | `rgba(25,16,10,0.99)` | in-rail popover background |
| `--tile` | `rgba(255,238,214,0.05)` | menu tile rest |
| `--tile-on` | `rgba(245,166,35,0.14)` | menu tile active/powered |
| `--tint` / `--tint-strong` / `--tint-weak` | `rgba(245,166,35, .15 / .22 / .09)` | accent washes |
| `--border` | `rgba(245,166,35,0.28)` | accent border |
| `--hair` | `rgba(255,228,196,0.11)` | hairline divider |
| `--ink` | `#fbf4ea` | primary text **(brightened for readability)** |
| `--dim` | `rgba(244,231,213,0.82)` | secondary text **(brightened)** |
| `--faint` | `rgba(244,231,213,0.55)` | tertiary/labels **(brightened)** |
| `--accent` | `#f5a623` | ember gold (primary accent) |
| `--accent2` | `#ff6a00` | hot orange (gradient partner) |
| `--accent-ink` | `#2a1606` | text on gold fills |
| `--danger` | `#e0445a` | destructive (hide/remove) |
| `--glow` | `rgba(245,166,35,0.5)` | active glow / box-shadow |
| `--radius` / `--radius-sm` / `--radius-lg` | `12px / 9px / 16px` | corner radii |

**Type:**
- Display / wordmark / panel titles: **Instrument Serif** (italic for the wordmark), Georgia fallback.
- Body / labels / tiles: **Hanken Grotesk**, system-ui fallback.
- Mono (blurbs, section labels, version, keycaps): **Spline Sans Mono**, ui-monospace fallback.

> The readability fix was: drop the two cold themes (was Observatory/Aurora/Ember → now
> **Ember only**), and raise `--ink`/`--dim`/`--faint` opacity well above the originals.
> If the real app keeps Classic/Coral themes, see the theme conflict in the mapping doc.

---

## Layout & screens

### The Rail (menu)
- **Width: `384px`** (was 322). Full viewport height. Border on the inner edge (`1px solid var(--border)`).
- Flips to the right edge when "Menu position" = Right (see Settings).
- **Header:** italic serif wordmark (~29px), a `COMMAND DECK` mono kicker (10.5px, letter-spacing 1.5),
  and a button cluster: **✎ Customize** and **⚙ Settings**.
- **Summon search button** below the header: a pill (`fontSize 14.5`, `whiteSpace:nowrap`) reading
  "Summon a function…" with a magnifier glyph — opens the command palette. Also bound to `S` / `/`.
- **Lens toggle** (Beams / Waves / Both): segmented control, active segment uses the
  `linear-gradient(90deg, --accent2, --accent)` fill with `--accent-ink` text, 13.5px.
- **Scroll region:** sections stacked vertically, `padding: 10px 14px 18px`.

### Menu tile (collapsed row)
- `display:flex; align-items:center; gap:13px; padding:13px 15px; border-radius:var(--radius)`.
- Glyph (19px, width 26, centered) · **name (15px, weight 500, --ink)** · **blurb (11.5px mono, --dim)**.
  Name + blurb each `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`.
- Right side: either a **power dot** (26px circle; gold radial fill + `0 0 12px var(--glow)` when on)
  for menus with a master toggle, or a `›` chevron.
- Active/powered tile: `--tile-on` background, `--border`, and `inset 0 0 26px var(--glow)`.
- Hover: `translateY(-1px)`, border → `--border`.

### Section header (group)
- A row above each section's tiles: a **collapse chevron** (rotates −90° when collapsed),
  the **section label** (mono, 11px, letter-spacing 1.6, uppercase), a **count** (`n` or `n/total`)
  or — in edit mode — an **Aa rename** button, and a **MiniToggle** (34×19 pill switch) to
  enable/disable the whole section.
- Collapsing hides the tiles but keeps the header. Disabling a section drops it from the rail
  (organizational only — **does not** power-down the underlying effects; confirm desired behavior).

### In-rail popovers (cover the list, never the canvas)
All of these animate in with `void-popover-in` (scale .42→1, 0.2s) over a blurred scrim
(`void-scrim`, `rgba(6,5,3,0.6)`, 3px backdrop blur). They live **inside the rail** so the
animation/canvas is never occluded (OBS-safe). Header has a circular close button (✓ or ✕).

1. **Menu panel** — opens when a tile is clicked; shows that menu's parameters; submenus push a nested view. Title shows the menu's (possibly renamed) name; submenu shows `Parent › Child`.
2. **Settings panel** (⚙) — see below.
3. **Rename panel** (Aa) — see below.
4. **Command palette** (`S`) — fuzzy search across every menu, submenu, and parameter; jumps to it.

### Settings panel (⚙)
Sections, top to bottom:
- **Mode** — segmented `Simple` / `Advanced`. Simple shows only the first two sections (Field & Look in the prototype); Advanced shows all. The command palette still finds everything in either mode. *(See mapping doc — the real app already has a Simple/Advanced concept; align with it.)*
- **Menu position** — `◧ Left` / `Right ◨` segmented control.
- **Menu fades after** — slider, `2–30s`, default **12s** (see idle behavior).
- **Performance view** — button that toggles fullscreen; shows an `F` keycap.
- **Menu layout** — "Reset order, hidden & sections" (also clears custom names).
- **Keyboard** — reference list of shortcuts.
- **Version line** — `VOIDULATOR · Obsidian & Ember · v1.0` (mono, faint).

### Rename panel (Aa)
- Opens from the Aa button on any tile or section header (edit mode).
- A **text input** (16px) prefilled with the current name; placeholder = default name.
- A **"Reset to '<default>'"** chip appears when the name differs from default.
- Two suggestion groups, each a wrap of tappable chips (active chip = `--tint-strong` + gold border):
  - **Scientific** — grounded in the math/optics of the function.
  - **Experiential** — how it feels on screen.
- Suggestions are data, defined per menu/section id. See `name-suggestions.js` in this bundle for the full curated set; reproduce it as a static map keyed by the real app's menu ids.

---

## Interactions & behavior

### Keyboard (added/!changed by this design)
| Key | Action |
|---|---|
| `S` or `/` | Open Summon / command palette |
| `F` | Toggle **performance fullscreen** — menu hidden, animation centered as a square on black |
| `U` | While in fullscreen: toggle the menu overlay on/off |
| `H` | Hide / show the menu (windowed) |
| `Esc` | Close an open panel → else exit fullscreen → else show menu |

> Keys are ignored while focus is in an `input`/`textarea`. The real app already binds
> `F`, `U`, and others (scene/emitter keys) — **reconcile, do not clobber.** See mapping doc.

### Fullscreen / performance mode
- `F` enters an **immersive layout**: the rail collapses to width 0 and the animation is centered
  as a **square** (`min(100vw,100vh)`) on `#04050a` (with a soft radial vignette overlay).
- The browser Fullscreen API is *attempted* as a bonus but the layout does **not** depend on it
  (sandboxed/embedded contexts may block it). Keep this decoupling.
- `U` toggles a **menu overlay** while fullscreen (absolute, over the animation, same 384px rail).
- A small `☰` button appears when the menu is hidden to bring it back (click-equivalent of U/H).
- `Esc` exits.

### Idle auto-dim ("VJ mode")
- After **`idleSeconds`** (default **12s**, was 4s — tripled) with no pointer/key/wheel activity,
  the rail dims to `opacity: 0.16` (`.is-idle`, 0.5s ease). Any input wakes it instantly.
- Suppressed while a panel, palette, edit mode, or settings is open.
- The delay is user-configurable (Settings slider + a Tweaks control), persisted.

### Inline customize (✎)
- Toggling ✎ puts each tile into an **edit overlay**: shows the name plus **Aa** (rename),
  **↑ / ↓** (reorder within its section), **✕** (hide). Section headers gain an **Aa** rename too.
- Reorder is **constrained to the same section**.
- Hidden menus appear in a "HIDDEN · tap to restore" tray at the bottom of the list while editing.
- All edits persist (see state).

### Animations
- Popovers: `void-popover-in` 0.2s `cubic-bezier(.18,.9,.3,1)`, scale 0.42→1 from a top-ish origin.
- Scrim: fade 0.18s. Rail width transitions 0.34s ease; opacity 0.5s ease.
- Respect `prefers-reduced-motion: reduce` (durations collapse to ~0).

---

## State (UI-only; persist locally)

All keys are UI/presentation state — **none** affect the simulation. In the prototype they're
`localStorage`; in the app use whatever persistence the codebase already uses for UI prefs.

| State | Type | Default | Meaning |
|---|---|---|---|
| menu **order** | id[] | natural order | tile order (within sections) |
| **hidden** | id[] | `[]` | hidden menus |
| **collapsed** | section[] | `[]` | collapsed section groups |
| **sectionsOff** | section[] | `[]` | disabled (hidden) section groups |
| **names** | `{ [id]: string }` | `{}` | custom display names for menus & sections (`sec:<Section>` keys for groups) |
| **mode** | `'simple' \| 'advanced'` | `advanced` | Simple/Advanced section visibility |
| **side** | `'left' \| 'right'` | `left` | rail side |
| **idleSeconds** | number | `12` | idle-dim delay |
| **lens** | `'beams' \| 'waves' \| 'both'` | `both` | (prototype filter; map to real filtering if any) |

Renaming rules: storing a value equal to the default removes the override (keeps state clean);
"Reset layout" clears order/hidden/collapsed/sectionsOff/names together.

---

## Files in this bundle

- `Voidulator Summon (standalone).html` — the full, self-contained prototype. Open it to see/feel everything described above. **This is the canonical visual reference.**
- `Voidulator Summon.html` — the non-bundled entry (shows script/asset wiring).
- `summon-app.jsx` — the app: rail, tiles, section headers, Settings/Rename/Menu panels, command palette, keyboard, fullscreen, idle.
- `summon-controls.jsx` — control primitives + the `C` token alias map.
- `theme.css` — the Obsidian & Ember theme + structural animations.
- `name-suggestions.js` — the curated Scientific/Experiential rename suggestions (full set).
- `tweaks-panel.jsx` — the in-design tweaks shell (idle slider). Optional; ignore if the app has its own settings surface.
- `CONFLICTS-AND-MAPPING.md` — **read this second.** Maps prototype menus to the real app and lists every place to **ask the maintainer** before changing a label or key.

## Assets

No raster assets. Fonts are Google Fonts (Instrument Serif, Hanken Grotesk, Spline Sans Mono) —
use the app's existing font-loading approach. All glyphs are Unicode characters / inline SVG.
