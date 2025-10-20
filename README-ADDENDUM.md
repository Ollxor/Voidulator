# Voidulator

## What’s New (v0.6.0)
- Removed the Glow system (UI + engine). Cleaner visuals, faster rendering.
- Beam width is stepless (fractional), pulse still works.
- Defaults on startup: **1 beam**, **Greyscale**.

## Quick Start
Open `voidulator.html` in a modern browser (Chrome/Edge/Firefox). WebGL2 required.

## Development Notes
- Keep edits **surgical**.
- Do not reintroduce `glow*` fields; old presets may still include them and will be ignored.
- Defaults reside near `const S = { ... }`.
- See `tests/SMOKE.md` for a short regression list.
