# Urge Walk

A simple installable web app (PWA) that helps you ride out an urge by taking a short walk.

**Privacy:** everything stays on your device (browser storage only). No accounts, no server, no tracking.

**Status:**
- **Home** — clean-time tracker (add habits with a start date, see days clean, edit/reset/delete) and a shortcut to the urge walk.
- **Walk** — "I have an urge" button and a 5 / 10 / 15-minute walk timer with pause, end early, and a short check-in afterwards. The timer is based on saved timestamps, so it stays correct if the screen locks or the app is closed.
- **Log**, **Journal** — placeholders.

**iPhone note:** iOS keeps separate data for the Home Screen app and for Safari, and removing the Home Screen icon deletes that app's data. Pick one place to use it.

## Run locally

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install        # first time only
npm run dev        # dev server with hot reload (http://localhost:5173/urge-walk/)
npm test           # unit tests (Vitest)
npm run build      # production build into dist/
npm run preview    # serve the production build (http://localhost:4173/urge-walk/)
```

## Data on the device (localStorage)

| Key | What |
| --- | --- |
| `urgewalk.v1.habits` | `{ version: 1, habits: [{ id, name, startDate: 'YYYY-MM-DD' }] }` |
| `urgewalk.v1.walks` | `{ version: 1, walks: [{ id, startedAt, endedAt, plannedMinutes, actualSeconds, endedEarly, result: 'yes' \| 'kinda' \| 'no' \| null, note }] }` |
| `urgewalk.v1.activeWalk` | the walk in progress (removed when it's saved) |
| `urgewalk.v1.walkPrefs` | `{ version: 1, minutes }` — last chosen walk length |

Damaged data is copied to `<key>.corrupt-<timestamp>` instead of being deleted.

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It opens full-screen and works offline after the first visit.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Icons

`python3 scripts/make_icons.py` regenerates the PNG icons in `public/` (needs Pillow).
