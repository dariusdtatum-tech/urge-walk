# Urge Walk

A simple installable web app (PWA) that helps you ride out an urge by taking a short walk.

**Privacy:** everything stays on your device (browser storage only). No accounts, no server, no tracking.

**Status:** skeleton only — one screen with placeholder tabs (Home, Walk, Log, Journal).

## Run locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install        # first time only
npm run dev        # dev server with hot reload (http://localhost:5173/urge-walk/)
npm run build      # production build into dist/
npm run preview    # serve the production build (http://localhost:4173/urge-walk/)
```

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It opens full-screen and works offline after the first visit.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Icons

`python3 scripts/make_icons.py` regenerates the PNG icons in `public/` (needs Pillow).
