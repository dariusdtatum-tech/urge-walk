# Urge Walk

A simple installable web app (PWA) that helps you ride out an urge by taking a short walk.

**Privacy:** everything stays on your device (browser storage only). No accounts, no server, no tracking.

**Status:**
- **Home** — one ring with your main tracker's clean days. The arc fills toward the **next milestone** (7, 30, 60, 90 days, 6 months, 1 year, then every year), showing only the current stretch — e.g. 165 days = 83% of 90 → 180 — with "15 days to 6 months" underneath ("6 months today" on the day). The **Your walks** card has its own **Week / Month / All time** switch (remembered) that changes only what's inside the card: Walked (walks only, with "N ridden out" underneath once breathing or logged urges are in the range), Passed (any kind) and the line of urges ridden out (Week = daily, Month = 30 days as a 3-day average, All time = weekly since the start). The Streak chip and the ring never change with it. A **Milestones** row shows earned badges plus the next one; tap it for the full list with earned dates. On the day a milestone is reached (on opening, or at midnight) the ring fills, glows once, and a calm sheet says *That's yours.* — once per milestone per tracker. Earned milestones are kept even after a reset and aren't celebrated twice. **Edit** holds every tracker (add, edit, reset, delete, *Show on Home*) and **Backup & restore**.
- **Tabs** — Home · Log · **Ride it out** (the raised wave button in the middle) · Journal · You.
- **Ride it out** — tapping the center button opens a short sheet with two big choices: **Walk** (starts the live walk immediately at your remembered length) and **Breathe** (1 min), plus a quiet **Just log it** for an urge you already rode out (time now, optional note). **Long-press** the center button to start a walk instantly. While walking, the app goes into focus mode (no header, tab bar or toasts): **Finish walk**, a quiet **Pause**, and **+5 min** for timed walks; open walks count up inside a slowly breathing ring. The timer is based on saved timestamps, so it stays correct if the screen locks or the app is closed (reopening goes straight back to the walk).
- **Breathe** — focus mode too: a sea-glass circle grows for 4s ("Breathe in"), holds 1s, and shrinks over 6s ("Breathe out"), about 5.5 breaths in the minute, with a small countdown and a quiet **Finish**. With reduced motion the circle stays still and only the words cross-fade. The screen stays awake. Then the same "Did the urge pass?" check-in as a walk, saved to the Log as a breathing minute.
- **You** — Trackers (same editor as Home's Edit), the full Milestones list, **Walk length** (5 · 10 · 15 · Custom 1–120 min · Open, used by Walk) and Backup & restore.
- **Log** — every urge ridden out (walks, breathing minutes and logged urges, each labelled), "N urges walked off" ("N urges ridden out" with a per-kind line once there are other kinds), a 4-up outcome row (Passed · Kinda · Didn't · No check-in), **This week** day rings coloured by outcome, and history grouped by day; tap a walk to edit its result/note or delete it. "Didn't pass" is how one urge went — it never resets a clean-day count.
- **Journal** — private entries (optional title, mood, writing prompts) with drafts autosaved as you type, search, and notes from walks, breathing and logged urges shown alongside (read from the walk log, not copied).
- **Backup** (You → Backup & restore, or Home → Edit) — export everything to one `urge-walk-backup-YYYY-MM-DD.json` file (Share sheet on iPhone, download elsewhere) and restore it later. Imports are checked before anything changes, replace all data after a confirm, and keep a safety copy so the last import can be undone. Home shows a gentle reminder when there's data and no backup in 7+ days.

Design: "coastal" — cream, sand, navy and sea glass, matching the Urge Walk site. Light (cream) and dark ("coastal night": deep navy, sand-cream text) follow the phone. Sea glass `#a9cbc0` is for the rings, chart and badges, and `#3f7a6b` whenever sea is text on cream; primary buttons and the Ride it out button are navy with cream text in light mode, and sea glass with navy text in dark mode. Outcomes: passed sea (`#3f7a6b` / `#a9cbc0`), kinda ochre (`#85642a` / `#d9bf8c`), didn't / no check-in slate (`#5b6270` / `#a7b0bf`) — no red for outcomes. Slow layered waves drift at the bottom (14–22s, still under reduced motion, paused in the background); other animations are skipped when the phone asks for reduced motion. Every colour is a CSS variable in `src/index.css` (SVG gradients included), and `src/lib/contrast.test.js` checks the key text/background pairs for WCAG AA in both themes.

Fonts are self-hosted, latin subset, in `src/assets/fonts/`, all SIL OFL with licence files alongside; nothing is loaded from a font CDN and the service worker precaches them for offline use: [Cormorant Garamond](https://github.com/CatharsisFonts/Cormorant) (one variable file, 300–700, plus italic) for titles, the ring number, timers and journal text, with lining tabular figures; [Plus Jakarta Sans](https://github.com/tokotype/PlusJakartaSans) for body text, buttons, chips, tabs and small numbers; [Pinyon Script](https://github.com/SorkinType/Pinyon) as decoration in exactly two places (the Home tagline and "That's yours."), never on buttons, inputs, tabs or numbers.

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
| `urgewalk.v1.walks` | `{ version: 1, walks: [{ id, kind: 'walk' \| 'breathe' \| 'logged', startedAt, endedAt, mode: 'timed' \| 'open', plannedMinutes (null for open walks), actualSeconds, endedEarly, result: 'yes' \| 'kinda' \| 'no' \| null, note }] }` — urge records of every kind (the key name is historical). Records without `kind` are walks (nothing is migrated or rewritten); records without `mode` are treated as timed. Breathing: 1 planned minute, `actualSeconds` ≤ 60. Logged: `actualSeconds` 0, `result` 'yes' |
| `urgewalk.v1.activeWalk` | the walk in progress (removed when it's saved); **+5 min** raises its `plannedMinutes` |
| `urgewalk.v1.journal` | `{ version: 1, entries: [{ id, createdAt, updatedAt, title, body, mood }] }` |
| `urgewalk.v1.journalDraft` | the entry being written (removed on Done/Discard) |
| `urgewalk.v1.walkPrefs` | `{ version: 1, choice: 5 \| 10 \| 15 \| 'custom' \| 'open', customMinutes }` — last choice and custom length |
| `urgewalk.v1.milestones` | `{ version: 1, trackers: { [habitId]: { earned: { '180': 'YYYY-MM-DD', … }, seen: [7, 30, …] } } }` — earned milestones (date = start date + milestone days; kept after a reset) and which celebration sheets were already shown. Missing (older versions, or a backup without it): milestones already passed are filled in quietly, with no sheets. Included in backups |
| `urgewalk.v1.homePrefs` | `{ version: 1, walksRange: 'week' \| 'month' \| 'all' }` — last choice in the Your walks card |
| `urgewalk.v1.backupMeta` | `{ version: 1, lastBackupAt, nudgeDismissedAt }` — for "Last backup" and the reminder |
| `urgewalk.v1.importUndo` | `{ version: 1, savedAt, values }` — raw copy of the data keys taken right before an import (replaced by the next import, removed on undo) |

Backup file: `{ app: 'urge-walk', format: 1, exportedAt, data: { habits, walks, journal, walkPrefs, milestones } }` — `milestones` and each record's `kind` are optional, so older backups still import (records without a kind come back as walks) (the walk in progress and unsaved drafts are not included).

Damaged data is copied to `<key>.corrupt-<timestamp>` instead of being deleted.

## Install on iPhone

Open the site in **Safari** → Share → **Add to Home Screen**. It opens full-screen and works offline after the first visit.

## Deploy

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Icons

`python3 scripts/make_icons.py` regenerates the PNG icons in `public/` (needs Pillow).
