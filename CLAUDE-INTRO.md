# Orientation for a new Claude session

You're joining a fork of **Voidulator**, a WebGL2 laser-room visualizer. This file is a fast on-ramp — read `CLAUDE.md` when you need the deep reference, but you don't need all of it to get oriented.

## The big picture

- **Everything lives in one file, `index.html`** (~6,600+ lines: HTML, CSS, and JS all inline). This is deliberate, not neglect — the deployed app is meant to be droppable into any static host or opened straight from disk, with zero build step and zero external script dependencies. `CLAUDE.md`'s opening section ("Architecture: intentional single-file design") explains the reasoning in full.
- **This is someone's fork for open-ended experimentation.** Whoever you're working with may want to restructure the whole thing — split it into modules, add a build step, rearrange it around conventions from a different background (game dev, for instance). That's fine and expected *in a fork*. The single-file constraint applies to the original deployed project, not to what happens here — don't assume you need to preserve it unless your human tells you they want to keep merge compatibility with upstream.
- **The state model**: one plain object `S` holds everything — every slider, toggle, and mode reads from and writes to it. `CLAUDE.md`'s "State object: `S`" section maps out the major sub-trees (`S.beams`, `S.trails`, `S.particles`, `S.rings`, `S.field`, `S.generative`, etc.) if you need to find where something lives.
- **Emission modes are mutually exclusive families**: Beams (+ optionally Rings), Wave Field, Particles, and Generative each "take over the room" — only one renders at a time, gated by an `enabled` flag on its own `S` sub-object. If you're adding a new visual mode, search `CLAUDE.md` for "exclusive mode" — there's a whole checklist of places a new mode needs wiring (mode picker, visibility rules, scene serialization, factory reset, etc.) written after several rounds of finding gaps the hard way.

## Before you build something from scratch, check if it already exists

This codebase has a lot of proven, non-obvious math already built and battle-tested — reusing it is almost always better than re-deriving it:
- **Wall collision / reflection** for any room shape (circle, polygon, bent walls) — see `computePath()` and the `firstHitCircle`/`firstHitArcs`/`firstHitPoly`/`reflectByNormal` functions.
- **Color palette generation** — `generatePalette(scheme, count)` covers ~30 named schemes (rainbow, monochrome, nature-inspired sets, etc.).
- **The trails/feedback-buffer system**, the **bloom** post-process, and **kaleidoscope** fold are all shared, reusable pipeline stages most new rendering work should hook into rather than reinvent.

## Testing

Three test scripts, all runnable with plain `node` (Playwright + SwiftShader for the headless GL ones):
- `node tests/smoke.mjs` — loads the app, checks for GL/console errors across shapes and modes.
- `node tests/ui-gates.mjs` — nine UI-quality gates (label clipping, contrast, touch targets, overflow, control reachability, undo/autosave delegation, i18n audit, console errors). `--selftest` verifies the gates themselves still catch injected faults.
- `node tests/i18n-audit.mjs` — pure text analysis (no browser) checking the four language tables for drift or missing keys.

If you touch the UI, run `ui-gates.mjs` before considering the work done — it's caught real, previously-unnoticed bugs multiple times, not just style nits.

## Verify empirically, not by reading the code and assuming

This project's own history (documented at length in `CLAUDE.md`) has repeatedly bitten a confident-sounding explanation that turned out to be wrong on inspection — a rendering bug attributed to the wrong cause twice before the real one was found, a test harness that silently passed when it should have failed, that kind of thing. If you're fixing or verifying something non-trivial, prefer scripting a real check (Playwright, a direct function call via the `window.Voidulator` debug handle) over reasoning from the source alone.
