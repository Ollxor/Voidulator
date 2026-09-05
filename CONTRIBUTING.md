# Contributing to Voidulator

Hi — if you're reading this, you've probably been pointed here to go play with the project (hi, Johanna 👋), or you found it and want to poke around. Either way, welcome.

## What this is

Voidulator is a WebGL2 laser-room visualizer — beams, rings, wave fields and bouncing particles reflecting around a room, with a deep effects/color/audio-reactive stack on top. The [README](README.md) has the full feature list and a live demo link. [CLAUDE.md](CLAUDE.md) is a dense, version-by-version architecture log built up over a long solo session history — genuinely useful as a reference once you're in the code, not something you need to read cover to cover first.

The whole app is one `index.html` file (no build step, no bundler, no npm) — deliberately, so it can be dropped into any static host or opened straight from disk. That constraint is about the *deployed* version. What you do in your own fork is entirely up to you.

## How to get your own copy

The repo is public, so you don't need an invite from anyone — just fork it on GitHub:

```bash
git clone https://github.com/<your-username>/Voidulator.git
cd Voidulator
python -m http.server 8000   # or: npx serve
```

Then open `http://localhost:8000`, or just open `index.html` directly in a browser.

**Your fork is yours.** Restructure it however makes sense to you — split it into files, add a build step, rearrange the whole thing around patterns you're used to from game dev. Nothing about the single-file setup is a rule you need to follow in your own copy; it's a constraint on *this* deployed version, not a design philosophy you're obligated to preserve.

## Sharing things back

There's no obligation to contribute anything back, but if you build something worth showing:
- Open a pull request if you want it reviewed/merged into the main repo, or
- Just send the fork URL — it's public, so anything in it can be looked at, pulled from, or cherry-picked at any time without you doing anything further.

## The license

Voidulator is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [LICENSE](LICENSE) for the full text. In plain language:

- **You can do basically anything with it, including commercially** — sell it, build a product on it, whatever.
- **The one condition: if you distribute a modified version, or run a modified version as a live service other people can use, you have to make that version's source available too**, under the same license. This is what makes it different from the old MIT license the project used to carry — MIT would have let someone take improvements private forever; AGPL keeps the whole ecosystem's improvements open, including yours.
- This doesn't restrict what you do in your own fork for your own experimentation — the obligation only kicks in if/when you distribute or publicly run a modified version.
- Keeping your fork public on GitHub (the default when you fork a public repo) already satisfies this by construction — the source is right there.

If you're doing something where AGPL's terms are a genuine problem for you, talk to Olle directly rather than guessing — licensing exceptions for specific cases are a conversation, not something this document can pre-decide.

## For your AI assistant

If you're bringing your own Claude (or another coding assistant) into your fork, point it at [CLAUDE-INTRO.md](CLAUDE-INTRO.md) first — it's a short orientation written for an assistant that's never seen this codebase, as a lighter on-ramp before the full [CLAUDE.md](CLAUDE.md) reference.
