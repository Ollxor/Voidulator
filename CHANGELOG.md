# Changelog

## v0.6.0 — 2025-10-20
### Added
- Beam width slider is **stepless** (`step="any"`) and supports fractional values.

### Changed
- Doubled the **effective beam thickness** internally while keeping UI ranges the same.
- Startup defaults: **1 beam**, **Greyscale** palette.

### Removed
- **Glow system** (UI + engine). Rendering is now **single‑pass beams** for simplicity and performance.
  - Old presets with `glow*` keys load without errors but those values are ignored.

### Fixed
- Self‑test no longer forces `S.beamCount = 10` on startup.
- Restored `buildShape()` in `init()` and forced **black clear color** in both renderers.
