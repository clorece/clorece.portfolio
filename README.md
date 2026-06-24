# Clarence Grimaldo — Portfolio

Personal portfolio for **clorece** (Clarence Grimaldo) — graphics, game development & 3D modelling.

Live site: deployed to GitHub Pages from `main`.

## Stack

Plain static site — no build step, no framework.

- `index.html` — markup for every view (home, Serie, Allium, Until Journey's End, 3D & Design, Legacy) plus the gallery lightbox
- `styles.css` — all styling (ported 1:1 from the Claude Design source)
- `app.js` — SPA routing, the YouTube-backed audio player + mini player, gallery lightbox, scroll-reveal, in-view video autoplay, and hover states
- `uploads/` — local media (Until Journey's End screenshots & gameplay clips, profile art)
- `favicon.svg`

External runtime dependencies (CDN): Google Fonts (Space Grotesk, DM Mono), Phosphor Icons, and the YouTube IFrame API for the audio player. Shader screenshots for Serie/Allium are served from GitHub's `user-attachments` CDN.

## Develop locally

It's a static site — open `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which uploads the
repository root and publishes it to GitHub Pages. `.nojekyll` is present so
Pages serves files as-is (no Jekyll processing).

## Design source

This site is a faithful implementation of the Claude Design project
"Game development portfolio redesign" (`Portfolio.dc.html`).
