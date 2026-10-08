// Walk data on this device:
// - urgewalk.v1.walks       finished walks (read by the Log tab)
// - urgewalk.v1.activeWalk  the walk in progress, so reopening the app resumes it
// - urgewalk.v1.walkPrefs   last choice (5 / 10 / 15 / custom / open) and last custom length
import { makeId, readList, readObject, writeList, writeObject } from './storage.js'
import { DEFAULT_CUSTOM_MINUTES, DEFAULT_MINUTES, WALK_OPTIONS, clampCustomMinutes } from './walkTimer.js'

export const WALKS_KEY = 'urgewalk.v1.walks'
export const ACTIVE_WALK_KEY = 'urgewalk.v1.activeWalk'
export const WALK_PREFS_KEY = 'urgewalk.v1.walkPrefs'
export const RESULTS = ['yes', 'kinda', 'no']
export const MAX_NOTE_LENGTH = 280

const isNum = (n) => typeof n === 'number' && Number.isFinite(n)
const isTime = (s) => typeof s === 'string' && !Number.isNaN(Date.parse(s))

// ---------- Saved walks ----------

export function sanitizeWalks(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((w) => w && typeof w === 'object')
    .filter((w) => isTime(w.startedAt) && isTime(w.endedAt))
    // Timed walks have a positive plannedMinutes; open walks have null (or mode 'open').
    .filter((w) => (isNum(w.plannedMinutes) && w.plannedMinutes > 0) || w.plannedMinutes == null)
    .filter((w) => isNum(w.actualSeconds) && w.actualSeconds >= 0)
    .map((w) => {
      // Older records have no `mode`; they were all timed walks.
      const open = w.mode === 'open' || w.plannedMinutes == null
      return {
        id: typeof w.id === 'string' && w.id ? w.id : makeId(),
        startedAt: w.startedAt,
        endedAt: w.endedAt,
        mode: open ? 'open' : 'timed',
        plannedMinutes: open ? null : w.plannedMinutes,
        actualSeconds: Math.round(w.actualSeconds),
        endedEarly: open ? false : Boolean(w.endedEarly),
        result: RESULTS.includes(w.result) ? w.result : null,
        note: typeof w.note === 'string' ? w.note.slice(0, MAX_NOTE_LENGTH) : '',
      }
    })
}

// Returns { walks, recovered }. Oldest first.
export function loadWalks(storage = globalThis.localStorage) {
  const { items, recovered } = readList(WALKS_KEY, 'walks', sanitizeWalks, storage)
  return { walks: items, recovered }
}

// Replace the whole list (used by the Log tab after an edit or delete).
export function saveWalks(walks, storage = globalThis.localStorage) {
  return writeList(WALKS_KEY, 'walks', walks, storage)
}

// Add one finished walk. Returns true if it was saved.
export function appendWalk(record, storage = globalThis.localStorage) {
  const { walks } = loadWalks(storage)
  return writeList(WALKS_KEY, 'walks', [...walks, record], storage)
}

// ---------- Walk in progress ----------

function validActiveWalk(w) {
  return (
    w && typeof w === 'object' &&
    typeof w.id === 'string' &&
    (w.plannedMinutes === null || (isNum(w.plannedMinutes) && w.plannedMinutes > 0)) &&
    isNum(w.startedAt) &&
    (w.pausedAt === null || isNum(w.pausedAt)) &&
    isNum(w.pausedMs) && w.pausedMs >= 0 &&
    (w.endedAt === null || isNum(w.endedAt)) &&
    isNum(w.messageOffset)
  )
}

export function loadActiveWalk(storage = globalThis.localStorage) {
  const w = readObject(ACTIVE_WALK_KEY, storage)
  if (!validActiveWalk(w)) {
    if (w != null) writeObject(ACTIVE_WALK_KEY, null, storage) // drop unusable data
    return null
  }
  return { ...w, endedEarly: Boolean(w.endedEarly) }
}

export function saveActiveWalk(walk, storage = globalThis.localStorage) {
  return writeObject(ACTIVE_WALK_KEY, walk ? { version: 1, ...walk } : null, storage)
}

// ---------- Preferences ----------
// choice: 5 | 10 | 15 | 'custom' | 'open'; customMinutes: last custom length (1-120)

export const WALK_CHOICES = [...WALK_OPTIONS, 'custom', 'open']

export function loadWalkPrefs(storage = globalThis.localStorage) {
  const prefs = readObject(WALK_PREFS_KEY, storage) || {}
  // Older versions only saved { minutes }.
  let choice = WALK_CHOICES.includes(prefs.choice) ? prefs.choice : null
  if (choice == null) choice = WALK_OPTIONS.includes(prefs.minutes) ? prefs.minutes : DEFAULT_MINUTES
  const customMinutes = prefs.customMinutes == null ? DEFAULT_CUSTOM_MINUTES : clampCustomMinutes(prefs.customMinutes)
  return { choice, customMinutes }
}

export function saveWalkPrefs({ choice, customMinutes }, storage = globalThis.localStorage) {
  return writeObject(WALK_PREFS_KEY, { version: 1, choice, customMinutes: clampCustomMinutes(customMinutes) }, storage)
}

// What to pass to startWalk(): minutes for a timed walk, or null for an open walk.
export function plannedMinutesFor({ choice, customMinutes }) {
  if (choice === 'open') return null
  if (choice === 'custom') return clampCustomMinutes(customMinutes)
  return choice
}
