# Conflicts & Mapping — read before implementing

This UI was prototyped with a **stand-in menu model**, not the real Voidulator menu tree.
Before you change any label, grouping, or keybinding in the real app, work through the
conflicts below. **When a conflict is flagged �amber/🔴red, ASK THE MAINTAINER which way to
go — do not guess, and do not change functional behavior to fit a label.**

The guiding rule for this whole task:

> **Labels, order, grouping, theme, and visibility are UI. Routing, math, audio/MIDI, scenes,
> and serialization are functionality. This handoff only touches the first list.**

---

## 0. How to use this doc
1. Open `Voidulator Summon (standalone).html` and the live app side by side.
2. For each prototype menu/section, find the real-app equivalent and fill the "real id/label" column.
3. Resolve each �amber/🔴 conflict **with the maintainer** before writing code.
4. Apply names from `name-suggestions.js` only to whatever the maintainer approves.

---

## ✅ Resolved against the live app (2026-06-24)

Verified directly against `index.html`. Line numbers are approximate anchors.

**Real menu architecture.** The app's panel is one `.panel` of titled `.group`s, auto-tagged
by `initPanelTools()` (~L10446): each group's `data-group-key` = its title's `data-i18n` key,
and `TAB_OF_GROUP` (~L10358) assigns it to a tab. The real tabs (`PANEL_TABS`, ~L10350) are
**All · Beams · Effects · Room · Live · Scenes** — *not* the prototype's Field/Look/Perform/Session.
There is already a **search box + collapse/expand toolbar** and **per-group ↺ reset** (`GROUP_RESETS`, ~L10280).

**⚠️ Two prototype "menus" have no discrete group.** `emission`, beam count/width, `spread`,
`edgeSoftness`, `edgeIntensity`, blend/layer mode live in an **ungrouped block above the first
titled group** (~L1909–1978, before `roomTitle` at L1979). So the prototype's **Beams** and
**Edges & Blend** tiles have no `.group-title` to hang a tile/rename on — they must be wrapped in
titled groups first (markup-only; no functional change). See Phase 0 in `IMPLEMENTATION-PLAN.md`.

**§2 Settings — verified.** ⚙ `#btnSettings` modal (~L1795) has **Theme, Language (`#languageSelect`
EN/ES/PT/FR), Tutorial (`#btnReplayTutorial`), Feedback (`#btnFeedback`)**, plus Mode + version.
→ Keep all; **add** the prototype's Menu-position, Idle-fade, Reset-layout, Keyboard-ref, Fullscreen entry.

**§3 Theme — verified.** `<html data-theme="classic">` default; themes are **`classic`** (L33) and
**`coral`** (L52); 🎨 `#btnTheme` toggles them. → **DECISION (maintainer):** add `ember` as a 3rd
theme, vs Ember-only, vs just bump contrast on the two. Default rec: **add Ember + bump contrast on all.**

**§4 Keyboard — verified, conflict confirmed.** Bound: **W/A/S/D** emitters (L6944), **1–8** scene slots
(L7493, Shift = save), **F** fullscreen (L8445), **U** UI toggle (L8448), **N** next scene (L8451),
**Esc** exit fullscreen. → `S` **is taken** → Summon = **`/` and `Ctrl/Cmd+K`** (not `S`). Reuse the
app's `toggleFullscreen()` / `toggleUI()` for F/U rather than adding parallel handlers. `H` is free.

**§5 Toolbar — verified (minor correction).** Top toolbar: ⚙ Settings, 🎨 **Theme-toggle** (the doc
said "palette" — it's theme; colour *palettes* live in the **Colors** group), ⛶ Fullscreen, 🌙
Screensaver, 🔗 Share (advanced). Keep it. Note: prototype **idle auto-dim ≠ 🌙 screensaver** (which
cycles scenes) — they coexist.

**§7 Section disable — default set.** Organizational-only (hide tiles, don't power-down). Confirm.

**NEW — i18n (not in original doc).** The app is fully translated (`data-i18n`, 4 langs, `I18N` ~L9300+).
**Every** new string (Summon, Customize, Command Deck, settings additions, rename UI) needs keys in
**EN/ES/PT/FR**. Define rename precedence vs. language: rec **custom name wins in all languages;
clearing restores the localised default.**

### Open decisions for the maintainer (need sign-off)
1. **Grouping** — keep the app's Beams/Effects/Room/Live/Scenes tabs (restyle only), adopt the
   prototype's Field/Look/Perform/Session, or hybrid (keep tabs, use the prototype section names as
   rename *suggestions*)? Note the app files **Rings, Wave Field under *Beams*** and **Bonus, and Record
   under *Room*/*Live*** — not where the prototype's sections put them.
2. **Theme** — Ember as 3rd theme / Ember-only / restyle existing two (see §3).

---

## 1. Menu / section mapping (real ids filled — 2026-06-24)

The prototype groups functions into **Field · Look · Perform · Session**. The real app's
grouping may differ. Map each row to the real menu, then decide whether to adopt the prototype's
section names or keep the app's.

### Field
| Prototype | What it is | Real-app group · `data-i18n` · tab | Map quality / notes |
|---|---|---|---|
| Room | polygon billiard: shape, walls, bounces | **Room** · `roomTitle` · *room* | ✅ 1:1 (shape, eccentricity, wall-bend, reflectivity, max-bounces). |
| Beams | rotating laser rays from movable emitters | **(ungrouped top block)** emission/count/width/spread **+ Colors** `colors` **+ Per-beam Rotation** `perBeamRotation` **+ Pulse** `pulse` · *beams* | ⚠️ **1:many** — no single "Beams" group. Wrap the top block in a titled group (Phase 0) if it needs a tile. |
| Rings | expanding reflecting wavefronts | **Rings** · `ringsTitle` · *beams* | ✅ 1:1. Note: app files this under the **Beams** tab, not "Field". |
| Wave field | wave-equation field, standing waves | **Wave Field** · `fieldTitle` · *beams* | ✅ 1:1. Also under **Beams** tab in the app. |

### Look
| Prototype | What it is | Real-app group · `data-i18n` · tab | Map quality / notes |
|---|---|---|---|
| Edges & Blend | edge feather + compositing | **(ungrouped top block)** `edgeSoftness`, `edgeIntensity` + blend/layer mode · *(no tab)* | ⚠️ **No discrete group.** Wrap in a titled group (Phase 0) to get a tile/rename. |
| Trails | framebuffer afterglow / decay | **Trails** · `trails` · *fx* | ✅ 1:1. |
| Glow | bloom above a threshold | **Glow** · `glow` · *fx* | ✅ 1:1. |
| Phosphor walls | caustic-like wall excitation | **Phosphor Walls** · `phosphorWalls` · *fx* | ✅ 1:1. |
| Palette | color schemes / colormaps | **Colors** · `colors` · *beams* | ⚠️ **Overlaps "Beams"** — colour schemes *and* per-beam colours share the one `colors` group. Decide whether to split a Palette-only tile from per-beam colours. |

### Perform
| Prototype | What it is | Real-app group · `data-i18n` · tab | Map quality / notes |
|---|---|---|---|
| Audio reactive | mic / system audio in | **Audio Reactive** · `audio` · *live* | ✅ 1:1. |
| Modulation matrix | route sources → params | **Modulation Matrix** · `modMatrix` · *live* | ✅ 1:1. |
| Beat detection | onset + envelope | **Beat Detection** · `beatDetection` · *live* | ✅ 1:1. |
| MIDI | controller learn & bind | **MIDI** · `midiTitle` · *live* | ✅ 1:1. |
| Bonus | emitter symmetry & motion | **Bonus** · `bonus` · *room* | ✅ 1:1 — but app files it under the **Room** tab, not "Perform". |

### Session
| Prototype | What it is | Real-app group · `data-i18n` · tab | Map quality / notes |
|---|---|---|---|
| Record video | encode frames | **Record Video** · `recordVideo` · *live* | ✅ 1:1 — but app files it under the **Live** tab, not "Session". |
| Scenes | save/recall/morph configs | **Scenes** · `scenes` · *scenes* | ✅ 1:1. |
| File presets | JSON export / import | **File Presets** · `filePresets` · *scenes* | ✅ 1:1. |

> 🟡 **The prototype's menu names are themselves placeholders.** The whole point of the rename
> feature is to let the maintainer choose. So: implement the *renaming mechanism + the suggestion
> data*, but the **default** label for each menu should be whatever the real app already ships —
> don't silently rename anything. Renames are opt-in via the Aa UI.

---

## 2. Settings panel — 🔴 known divergence

The real app's **⚙ Settings** contains (verify against the live app): **Mode (Simple/Advanced),
Theme (Classic/Coral), Language (EN/ES/PT/FR), Tutorial, Send Feedback, version.**

The prototype's ⚙ contains: **Mode, Menu position, Idle fade, Performance/Fullscreen, Reset layout,
Keyboard reference, version.**

**Ask the maintainer how to merge these.** Recommended default:
- **Keep** the real app's Mode, Theme, Language, Tutorial, Feedback, version (functional / content — don't drop).
- **Add** the prototype's new UI controls: Menu position, Idle fade, Reset layout, Keyboard reference, and the Fullscreen entry.
- Do **not** remove Theme/Language just because the prototype is Ember-only (that was a prototype scoping choice — see §3).

---

## 3. Theme — 🔴 conflict

Prototype is **Ember-only** (the two cold themes were removed for readability and the warm palette
was brightened). The real app ships **Classic + Coral** themes.

**Ask:** keep both real themes (and just apply the readability/contrast bumps to each), or adopt a
single warm theme? Default recommendation: **keep the app's theme switch**, and port the readability
work as contrast/opacity tweaks to the existing theme variables rather than deleting themes.

---

## 4. Keyboard — 🟠 reconcile, don't clobber

The real app already binds keys (verify on the live app): **`F` fullscreen, `U` UI toggle,
`N` next scene, `W/A/S/D` move emitters, `1–8` scene slots.**

This design **adds**: **`S` / `/` Summon (command palette)** and **`H` hide menu**, and gives
**`F`/`U`** the specific "menu hidden, animation centered" behavior.

Conflicts to resolve with the maintainer:
- `S` — prototype uses it for Summon. If the app uses `S` for "move emitter down" (WASD), pick a
  different key for Summon (e.g. `/` only, or `Space`, or `Cmd/Ctrl+K`). **Ask.**
- `F` / `U` — align the prototype's fullscreen/menu-toggle semantics with the app's existing ones
  rather than adding parallel handlers.
- Leave `N`, `W/A/S/D`, `1–8` **untouched** (functional).

---

## 5. Toolbar buttons — 🟡 optional

The real app has top-toolbar buttons (verify): **🎨 palette, 🌙 screensaver, 🔗 share.** The
prototype folds discovery into the Summon search + Settings instead. Keep the app's toolbar; this
redesign doesn't require removing it. If desired, the rail header can host equivalents — **ask first.**

---

## 6. Features present in the real app but only stubbed here — DO NOT rebuild functionality

These exist in the real app and must keep working. The prototype only shows *menu rows* for some of
them; it does **not** reimplement their internals, and you shouldn't change them:

- Per-beam **Rotation pattern** (Prime/Linear/Fibonacci…)
- Per-beam **custom colors** with draggable swatch/gradient layers
- Wave-field **Waveform / Walls / Resolution**
- Modulation **Tap-tempo** and **Add-route**
- **Factory Reset Scenes**
- **Tutorial**, **Send Feedback**, **Language**, **Simple/Advanced** mode logic

Your job for these: make sure the **redesigned rail/tiles/panels present them** with the new
look and (if approved) new names — **not** to alter what they do.

---

## 7. Section enable/disable semantics — 🟡 confirm

In the prototype, turning a **section** off just hides its tiles from the rail (organizational).
**Ask** whether the maintainer wants that, or whether disabling a section should also power-down
those effects. Default: **organizational only** (safer, UI-only).

---

## 8. Checklist before merging
- [ ] Real menu ids mapped (§1); defaults remain the app's existing labels.
- [ ] Settings merge decided with maintainer (§2); Theme/Language/Tutorial/Feedback retained.
- [ ] Theme decision made (§3).
- [ ] Keybindings reconciled; no functional keys clobbered (§4).
- [ ] No simulation/routing/audio/MIDI/scene/serialization code changed.
- [ ] Rename mechanism + suggestion data ported; nothing auto-renamed.
- [ ] Persistence uses the app's existing UI-prefs mechanism.
- [ ] `prefers-reduced-motion` respected.
