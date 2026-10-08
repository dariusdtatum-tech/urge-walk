// Saves habits in this device's localStorage. Nothing ever leaves the phone.
import { isValidISODate } from './cleanTime.js'

export const HABITS_KEY = 'urgewalk.v1.habits'
export const MAX_NAME_LENGTH = 60

// Make an id without relying on crypto.randomUUID (missing on some older iPhones).
export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// Keep only well-formed habits; quietly drop anything broken.
export function sanitizeHabits(list) {
  if (!Array.isArray(list)) return []
  return list
    .filter((h) => h && typeof h === 'object')
    .filter((h) => typeof h.name === 'string' && h.name.trim() !== '')
    .filter((h) => isValidISODate(h.startDate))
    .map((h) => ({
      id: typeof h.id === 'string' && h.id ? h.id : makeId(),
      name: h.name.trim().slice(0, MAX_NAME_LENGTH),
      startDate: h.startDate,
    }))
}

// Returns { habits, recovered } where `recovered` is true if saved data was damaged.
// Damaged data is copied to a backup key instead of being thrown away.
export function loadHabits(storage = globalThis.localStorage) {
  let raw
  try {
    raw = storage.getItem(HABITS_KEY)
  } catch {
    return { habits: [], recovered: false } // storage blocked (e.g. strict privacy mode)
  }
  if (raw == null) return { habits: [], recovered: false }

  try {
    const data = JSON.parse(raw)
    const list = Array.isArray(data) ? data : data && data.habits
    if (!Array.isArray(list)) throw new Error('unexpected shape')
    const habits = sanitizeHabits(list)
    return { habits, recovered: habits.length !== list.length }
  } catch {
    try {
      storage.setItem(`${HABITS_KEY}.corrupt-${Date.now()}`, raw)
    } catch {
      // ignore: backup is best-effort
    }
    return { habits: [], recovered: true }
  }
}

export function saveHabits(habits, storage = globalThis.localStorage) {
  try {
    storage.setItem(HABITS_KEY, JSON.stringify({ version: 1, habits }))
    return true
  } catch {
    return false
  }
}
