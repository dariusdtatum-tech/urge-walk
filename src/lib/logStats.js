// Pure helpers for the Log tab: summary numbers, grouping by day, and edits.
import { daysBetween, parseISODate, todayISO } from './cleanTime.js'
import { MAX_NOTE_LENGTH, RESULTS } from './walkStorage.js'

// Totals for the summary card.
export function summarize(walks) {
  const s = { total: walks.length, yes: 0, kinda: 0, no: 0, skipped: 0, totalSeconds: 0 }
  for (const w of walks) {
    if (RESULTS.includes(w.result)) s[w.result] += 1
    else s.skipped += 1
    s.totalSeconds += w.actualSeconds
  }
  s.totalMinutes = Math.round(s.totalSeconds / 60)
  return s
}

// The local calendar day a walk started on, as 'YYYY-MM-DD'.
export function localDayKey(isoTime) {
  return todayISO(new Date(isoTime))
}

// "Today", "Yesterday", "Sat, Oct 3", or "Wed, Dec 31, 2025" for other years.
export function dayLabel(dayKey, todayKey) {
  const diff = daysBetween(dayKey, todayKey)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  const d = parseISODate(dayKey)
  const sameYear = d.y === parseISODate(todayKey).y
  return new Date(d.y, d.m - 1, d.d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }),
  })
}

// Newest first, grouped by local day: [{ key, label, walks: [...] }]
export function groupByDay(walks, todayKey = todayISO()) {
  const sorted = [...walks].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
  const groups = []
  for (const w of sorted) {
    const key = localDayKey(w.startedAt)
    let group = groups[groups.length - 1]
    if (!group || group.key !== key) {
      group = { key, label: dayLabel(key, todayKey), walks: [] }
      groups.push(group)
    }
    group.walks.push(w)
  }
  return groups
}

// "8:05 PM" in the device's language.
export function formatTimeOfDay(isoTime) {
  return new Date(isoTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

// 600 -> "10 min", 200 -> "3 min 20 sec", 45 -> "45 sec"
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s} sec`
  if (s === 0) return `${m} min`
  return `${m} min ${s} sec`
}

// Change the result and/or note of one walk. Returns a new list.
export function updateWalk(walks, id, changes) {
  return walks.map((w) => {
    if (w.id !== id) return w
    const next = { ...w }
    if ('result' in changes) next.result = RESULTS.includes(changes.result) ? changes.result : null
    if ('note' in changes) next.note = String(changes.note ?? '').trim().slice(0, MAX_NOTE_LENGTH)
    return next
  })
}

export function deleteWalk(walks, id) {
  return walks.filter((w) => w.id !== id)
}
