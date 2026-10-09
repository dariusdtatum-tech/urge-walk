# Urge Walk

A simple installable web app (PWA) that helps you ride out an urge by taking a short walk.

**Privacy:** everything stays on your device (browser storage only). No accounts, no server, no tracking.

**Status:**
- **Home** — one ring with your main tracker's clean days. The arc fills toward the **next milestone** (7, 30, 60, 90 days, 6 months, 1 year, then every year), showing only the current stretch — e.g. 165 days = 83% of 90 → 180 — with "15 days to 6 months" underneath ("6 months today" on the day). The **Your walks** card has its own **Week / Month / All time** switch (remembered) that changes only what's inside the card: Walked, Passed and the "urges walked" line (Week = daily, Month = 30 days as a 3-day average, All time = weekly since the start). The Streak chip and the ring never change with it. A **Milestones** row shows earned badges plus the next one; tap it for the full list with earned dates. On the day a milestone is reached (on opening, or at midnight) the ring fills, glows once, and a calm sheet says *That's yours.* — once per milestone per tracker. Earned milestones are kept even after a reset and aren't celebrated twice. **Edit** holds every tracker (add, edit, reset, delete, *Show on Home*) and **Backup & restore**.
- **Walk** — one big "I have an urge" button starts right away at your remembered length; **Change length** reveals 5 · 10 · 15 · Custom (1–120 min) · Open. The cyan **+** in the tab bar opens this screen but never starts the timer. While walking, the app goes into focus mode (no header or tab bar): **Finish walk**, a quiet **Pause**, and **+5 min** for timed walks; open walks count up inside a slowly breathing ring. The timer is based on saved timestamps, so it stays correct if the screen locks or the app is closed (reopening goes straight back to the walk).
- **Log** — "N urges walked off", a 4-up outcome row (Passed · Kinda · Didn't · No check-in), **This week** day rings coloured by outcome, and history grouped by day; tap a walk to edit its result/note or delete it. "Didn't pass" is how one urge went — it never resets a clean-day count.
- **Journal** — private entries (optional title, mood, writing prompts) with drafts autosaved as you type, search, and your walk notes shown alongside (read from the walk log, not copied).
- **Backup** (Home → Edit → Backup & restore) — export everything to one `urge-walk-backup-YYYY-MM-DD.json` file (Share sheet on iPhone, download elsewhere) and restore it later. Imports are checked before anything changes, replace all data after a confirm, and keep a safety copy so the last import can be undone. Home shows a gentle reminder when there's data and no backup in 7+ days.

Design: dark navy/teal (light mode follows the phone), cyan rings, mint actions, amber for "kinda", grey for "didn't pass" — no red for outcomes. Animations are skipped when the phone asks for reduced motion. Fonts are self-hosted ([Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) for text, [Nunito](https://github.com/googlefonts/nunito) for numbers, both SIL OFL, latin subset in `src/assets/fonts/`); nothing is loaded from a font CDN.

**iPhone note:** iOS keeps separate data for the Home Screen app and for Safari, and removing the Home Screen icon deletes that app's data. Pick one place to use it, and export a backup now and then (save it to Files / iCloud Drive). The backup file includes your journal, so keep it private.

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
| `urgewalk.v1.habits` | `{ version: 1, habits: [{ id, name, startDate: 'YYYY-MM-DD' }] }` — the first one is shown on Home |
| `urgewalk.v1.walks` | `{ version: 1, walks: [{ id, startedAt, endedAt, mode: 'timed' \| 'open', plannedMinutes (null for open walks), actualSeconds, endedEarly, result: 'yes' \| 'kinda' \| 'no' \| null, note }] }` — records without `mode` are treated as timed |
| `urgewalk.v1.activeWalk` | the walk in progress (removed when it's saved); **+5 min** raises its `plannedMinutes` |
| `urgewalk.v1.journal` | `{ version: 1, entries: [{ id, createdAt, updatedAt, title, body, mood }] }` |
| `urgewalk.v1.journalDraft` | the entry being written (removed on Done/Discard) |
| `urgewalk.v1.walkPrefs` | `{ version: 1, choice: 5 \| 10 \| 15 \| 'custom' \| 'open', customMinutes }` — last choice and custom length |
| `urgewalk.v1.milestones` | `{ version: 1, trackers: { [habitId]: { earned: { '180': 'YYYY-MM-DD', … }, seen: [7, 30, …] } } }` — earned milestones (date = start date + milestone days; kept after a reset) and which celebration sheets were already shown. Missing (older versions, or a backup without it): milestones already passed are filled in quietly, with no sheets. Included in backups |
| `urgewalk.v1.homePrefs` | `{ version: 1, walksRange: 'week' \| 'month' \| 'all' }` — last choice in the Your walks card |
| `urgewalk.v1.backupMeta` | `{ version: 1, lastBackupAt, nudgeDismissedAt }` — for "Last backup" and the reminder |
| `urgewalk.v1.importUndo` | `{ version: 1, savedAt, values }` — raw copy of the data keys taken right before an import (replaced by the next import, removed on undo) |

Backup file: `{ app: 'urge-walk', format: 1, exportedAt, data: { habits, walks, journal, walkPrefs, milestones } }` — `milestones` is optional, so older backups still import (the walk in progress and unsaved drafts are not included).

Damaged data is copied to `<key>.corrupt-<timestamp>` instead of being deleted.

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It opens full-screen and works offline after the first visit.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Icons

`python3 scripts/make_icons.py` regenerates the PNG icons in `public/` (needs Pillow).
