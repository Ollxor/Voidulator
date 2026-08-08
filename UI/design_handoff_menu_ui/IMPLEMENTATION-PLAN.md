# Voidulator — Menu / Command-Deck Redesign: Implementation Plan

_Drafted 2026-06-24, for maintainer sign-off. Companion to `README.md` (the spec) and
`CONFLICTS-AND-MAPPING.md` (real-app mapping, now filled in)._

## The core reality

The prototype is **React + Babel JSX**. The real app is a **single ~6,600-line `index.html`**,
vanilla JS, no build step, all state on a global `S` object, panels hand-built and auto-tagged by
`initPanelTools()`. So this is a **reimplementation in vanilla JS against the existing DOM**, not a
port. Two assets survive contact:

- **`theme.css`** → inline its tokens/animations into the `<style>` block in `index.html`.
- **`name-suggestions.js`** → ship as a static map keyed by the real `data-i18n` group keys
  (`roomTitle`, `colors`, `ringsTitle`, …), not the prototype ids.

Everything in the `.jsx` files is **behaviour spec only**.

## Non-negotiables (from the handoff, verified)

- **UI only.** No change to simulation math, ray/wave routing, audio/MIDI, scenes, or serialization.
- **Keep** Classic + Coral themes, Language (EN/ES/PT/FR), Tutorial, Feedback, Simple/Advanced.
- **Don't clobber keys**: W/A/S/D, 1–8, F, U, N, Esc stay. Summon = `/` + `Ctrl/Cmd+K` (never `S`).
- **i18n every new string** in all four language tables.
- **Smoke test green** after each phase (`tests/smoke.mjs`); commit + push + CHANGELOG per phase.

## Decisions needed before Phase 2 (see mapping doc)

1. **Grouping**: restyle existing tabs / adopt prototype sections / hybrid.
2. **Theme**: add Ember (3rd) / Ember-only / restyle existing two.
3. **Palette split** (own tile vs stay inside Colors) and **section-disable** semantics (default: organizational-only).

---

## Phases

### Phase 0 — Prep (no visible change)
- **Wrap the ungrouped top block** (emission, beam count/width, spread, edge softness/intensity,
  blend/layer) into one or two titled `.group`s (e.g. "Beam Source", "Edges & Blend") so every menu
  has a `.group-title` = a tile/rename target. Add their keys to `TAB_OF_GROUP` + `GROUP_RESETS`.
- Add a **UI-prefs store** (reuse the app's localStorage pattern): `order, hidden, collapsed,
  sectionsOff, names, side, idleSeconds` (mode/theme/lang already persisted). Keep separate from `S`.
- Stub i18n keys for all new strings in EN/ES/PT/FR.
- _Exit:_ app looks identical; new groups appear under correct tabs; smoke green.

### Phase 1 — Theme & readability  ← **recommended start; lowest risk, ships value**
- Inline the **Obsidian & Ember** tokens. Per decision: add `[data-theme="ember"]` (3rd theme, wire
  into 🎨 `#btnTheme` cycle + Settings), and/or bump `--ink/--dim/--faint` contrast on Classic & Coral.
- Wordmark (Instrument Serif), mono labels (Spline Sans Mono), Hanken Grotesk body — via existing font loading.
- _Verify:_ preview at desktop + mobile, each theme; check contrast; smoke green.

### Phase 2 — Rail shell + tiles (restyle the existing panel)
- Reshape `.panel` into the **384px rail**: header (wordmark + ✎ Customize + ⚙ Settings), Summon
  button, lens/tab control reconciled with the **existing** tab bar (don't add a parallel system).
- Render each group as a **tile** (glyph · name · blurb · power-dot|chevron); groups with a master
  toggle get the power dot. Section headers get collapse + MiniToggle.
- Clicking a tile opens the group's existing controls in an **in-rail popover** (OBS-safe; reuse the
  real group DOM — move it into the popover, don't rebuild controls).
- Responsive: rail collapses/sizes sanely on mobile.
- _Exit:_ every existing control reachable through the new rail; nothing rewired.

### Phase 3 — Summon (command palette)
- Fuzzy search over groups + individual controls (extend the existing `#panelSearch` index). Bind
  `/` and `Ctrl/Cmd+K`; jump-to opens the relevant popover and highlights the control.

### Phase 4 — Customize: rename · reorder · hide
- Edit mode (✎): per-tile Aa rename / ↑↓ reorder (within section) / ✕ hide + restore tray.
- Rename panel uses `name-suggestions.js` (Scientific/Experiential chips) keyed by real group keys.
- Persist; honour i18n precedence (custom name wins; clear → localised default).

### Phase 5 — Settings additions + fullscreen/idle polish
- Extend the existing ⚙ modal: Menu position, Idle-fade slider, Reset-layout, Keyboard reference,
  Fullscreen entry — **alongside** the existing Theme/Language/Tutorial/Feedback/Mode.
- Idle auto-dim ("VJ mode", default 12s; suppressed while a panel/edit is open).
- Reconcile F/U with existing `toggleFullscreen()`/`toggleUI()`; add `H` (hide) and an Esc precedence
  chain (close panel → exit fullscreen → show menu). `prefers-reduced-motion` honoured throughout.

---

## Risk register
- **i18n drift** — easiest thing to forget; gate each phase on "new strings translated ×4".
- **Mobile** — 384px rail is most of a phone; needs explicit responsive rules (prototype is desktop-framed).
- **Single-file size** — `index.html` is already 447KB; keep additions lean, no new deps.
- **Key collisions** — re-verify against the live `keydown` handlers before binding anything.
- **Don't touch `S`/routing** — popovers must *move/show* existing control DOM, never re-implement it.

## Suggested first move
Phase 0 + Phase 1 together: invisible prep + the theme/readability win. Self-contained, shippable,
and it de-risks everything after it — without needing the grouping decision resolved yet.
