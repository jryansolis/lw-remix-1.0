# Livewire Remix 1.0

A concept redesign of [Livewire Markets](https://www.livewiremarkets.com) — an editorial, *Atlantic*-inspired direction for an investment-insights publication. Shared team artifact: explore the direction, then riff on your own branch (see [CONTRIBUTING](CONTRIBUTING.md)).

**Live preview:** _set after the repo lands in the org — `https://livewiremarkets1.github.io/remix/`_

## What's here

Static HTML + Tailwind (CDN). No build step — open `index.html` or serve the folder.

| Page | File |
| --- | --- |
| Homepage (Latest / Following toggle) | `index.html` |
| Topics index | `topics.html` |
| Contributors index | `contributors.html` |
| Contributor profile | `author.html` |
| Article — standard | `article.html` |
| Article — video (YouTube embed) | `article-video.html` |
| Article — immersive feature | `article-feature.html` |

## Design

- **Type:** Fraunces (display serif), Newsreader (body serif), Spline Sans Mono (metadata)
- **Palette:** warm ivory canvas, ink, gold-only accent (oxblood on the feature)
- **Patterns:** tight ruled grids, photo-credit lines, ad-unit slots, mono bylines
- **Interactions** (`assets/app.js`): Follow buttons (persisted to `localStorage`), Latest/Following feed toggle, author follow-popover

## Notes

Concept/demo only. Headshots and the Buy Hold Sell thumbnail are real Livewire assets; article imagery is licensed-stock used as placeholders — confirm licensing before any production use. Not affiliated endorsement; general information only, not financial advice.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
