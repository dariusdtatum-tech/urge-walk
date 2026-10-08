// Walk data on this device:
// - urgewalk.v1.walks       finished walks (read by the Log tab)
// - urgewalk.v1.activeWalk  the walk in progress, so reopening the app resumes it
// - urgewalk.v1.walkPrefs   last chosen length (5 / 10 / 15 minutes)
import { makeId, readList, readObject, writeList, writeObject } from './storage.js'
import { DEFAULT_MINUTES, WALK_OPTIONS } from './walkTimer.js'

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
    .filter((w) => isNum(w.plannedMinutes) && w.plannedMinutes > 0)
    .filter((w) => isNum(w.actualSeconds) && w.actualSeconds >= 0)
    .map((w) => ({
      id: typeof w.id === 'string' && w.id ? w.id : makeId(),
      startedAt: w.startedAt,
      endedAt: w.endedAt,
      plannedMinutes: w.plannedMinutes,
      actualSeconds: Math.round(w.actualSeconds),
      endedEarly: Boolean(w.endedEarly),
      result: RESULTS.includes(w.result) ? w.result : null,
      note: typeof w.note === 'string' ? w.note.slice(0, MAX_NOTE_LENGTH) : '',
    }))
}

// Returns { walks, recovered }. Oldest first.
export function loadWalks(storage = globalThis.localStorage) {
  const { items, recovered } = readList(WALKS_KEY, 'walks', sanitizeWalks, storage)
  return { walks: items, recovered }
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
    isNum(w.plannedMinutes) && w.plannedMinutes > 0 &&
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

export function loadWalkMinutes(storage = globalThis.localStorage) {
  const prefs = readObject(WALK_PREFS_KEY, storage)
  return prefs && WALK_OPTIONS.includes(prefs.minutes) ? prefs.minutes : DEFAULT_MINUTES
}

export function saveWalkMinutes(minutes, storage = globalThis.localStorage) {
  return writeObject(WALK_PREFS_KEY, { version: 1, minutes }, storage)
}
