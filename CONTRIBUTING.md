# Contributing — how to riff without overwriting

This repo holds one **canonical** design on `main`. To explore your own direction, work on a branch named after you. Nobody can overwrite `main` directly, and everyone's variations live side by side.

## One-time setup

```bash
git clone https://github.com/livewiremarkets1/remix.git
cd remix
```

No build step — it's static HTML + Tailwind (CDN). Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Start your riff

```bash
git checkout main
git pull
git checkout -b riff/your-name      # e.g. riff/joseph, riff/sam-mobile
```

Edit freely, commit as you go:

```bash
git add -A
git commit -m "Try a denser homepage grid"
git push -u origin riff/your-name
```

Your branch is yours. `main` stays untouched.

## Conventions

- **Branch names:** `riff/<name>` for a personal direction, `feat/<short-desc>` for a focused change meant to land on `main`.
- **No direct commits to `main`** — it's protected. Changes reach `main` only via Pull Request.
- **Compare ideas:** open a PR from your branch to see the diff and let others react — even if you never intend to merge it.
- **Versioning:** milestones on `main` are tagged (`v1.0`, `v1.1`), not baked into file or repo names.
- **Keep it static:** no build tooling, no frameworks — Tailwind via CDN, vanilla JS in `assets/app.js`. Keep it openable with a double-click.

## Want your riff live?

`main` deploys to GitHub Pages automatically. To preview a branch publicly, either open a PR (and use a preview-deploy host like Cloudflare Pages / Vercel if we wire one up later) or just share it by pushing the branch and running it locally.

## Notes

Concept/demo only. Headshots and the Buy Hold Sell thumbnail are real Livewire assets; other imagery is placeholder stock — confirm licensing before any production use.
