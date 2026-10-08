// Pure helpers for the Home screen: the hero tracker, the D / W / M ranges,
// the stat chips and the "urges walked" line chart. No React here.
import { daysBetween, parseISODate, todayISO } from './cleanTime.js'

// The tracker shown in the Home ring is the first one in the list.
// "Show on Home" (in Edit) moves a tracker to the front, so no extra setting is stored.
export function heroHabit(habits) {
  return habits.length > 0 ? habits[0] : null
}

// Move one habit to the front of the list (keeps everything else in order).
export function makePrimary(habits, id) {
  const chosen = habits.find((h) => h.id === id)
  if (!chosen) return habits
  return [chosen, ...habits.filter((h) => h.id !== id)]
}

// Clean days for a habit. Comes only from its start date: walks (including
// "Didn't pass") never change it. A start date in the future counts as 0.
export function cleanDays(habit, todayKey = todayISO()) {
  if (!habit) return 0
  const days = daysBetween(habit.startDate, todayKey)
  return Number.isFinite(days) && days > 0 ? days : 0
}

// "Mar 15" this year, "Mar 15, 2025" for other years.
export function shortDate(iso, todayKey = todayISO()) {
  const p = parseISODate(iso)
  const t = parseISODate(todayKey)
  if (!p) return ''
  return new Date(p.y, p.m - 1, p.d).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', ...(t && t.y === p.y ? {} : { year: 'numeric' }),
  })
}

// ---------- D / W / M ----------
// D = today (since midnight), W = the last 7 days, M = the last 30 days (both ending today).
export const RANGES = {
  D: { id: 'D', name: 'Day', title: 'Today', sub: 'today' },
  W: { id: 'W', name: 'Week', title: 'This week', sub: 'this week' },
  M: { id: 'M', name: 'Month', title: 'Last 30 days', sub: '30 days' },
}
export const RANGE_IDS = ['D', 'W', 'M']

const HOUR_LABELS = ['12A', '4A', '8A', '12P', '4P', '8P']

function midnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// The chart's buckets for a range, oldest first: [{ start, end, label, showLabel, current }]
// start/end are milliseconds (end exclusive). Built from local calendar dates, so DST is fine.
export function rangeBuckets(rangeId, now = Date.now()) {
  const today = midnight(new Date(now))
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const buckets = []
  if (rangeId === 'D') {
    for (let i = 0; i < 6; i += 1) {
      const start = new Date(y, m, d, i * 4).getTime()
      const end = new Date(y, m, d, (i + 1) * 4).getTime()
      buckets.push({ start, end, label: HOUR_LABELS[i], showLabel: true, current: now >= start && now < end })
    }
    return buckets
  }
  const count = rangeId === 'M' ? 30 : 7
  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date(y, m, d - i)
    const start = day.getTime()
    const end = new Date(y, m, d - i + 1).getTime()
    const label = rangeId === 'M'
      ? day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : day.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()
    // A month has too many days to label them all: label every 7th day, counting back from today.
    const showLabel = rangeId !== 'M' || i % 7 === 0
    buckets.push({ start, end, label, showLabel, current: i === 0 })
  }
  return buckets
}

// How many walks started in each bucket.
export function bucketCounts(walks, buckets) {
  const counts = buckets.map(() => 0)
  for (const w of walks) {
    const t = Date.parse(w.startedAt)
    const i = buckets.findIndex((b) => t >= b.start && t < b.end)
    if (i >= 0) counts[i] += 1
  }
  return counts
}

// Numbers for the "Walked" and "Passed" chips.
export function rangeStats(walks, rangeId, now = Date.now()) {
  const buckets = rangeBuckets(rangeId, now)
  const from = buckets[0].start
  const to = buckets[buckets.length - 1].end
  let walked = 0
  let passed = 0
  for (const w of walks) {
    const t = Date.parse(w.startedAt)
    if (t >= from && t < to) {
      walked += 1
      if (w.result === 'yes') passed += 1
    }
  }
  return { walked, passed }
}

// ---------- Chart geometry ----------

// Smooth line through the points that never overshoots (monotone cubic, Fritsch–Carlson),
// so a flat run of zeros stays flat instead of dipping below the baseline.
export function smoothPath(points) {
  const n = points.length
  if (n === 0) return ''
  const f = (v) => Math.round(v * 100) / 100
  if (n === 1) return `M${f(points[0].x)},${f(points[0].y)}`
  const dx = []
  const slope = []
  for (let i = 0; i < n - 1; i += 1) {
    dx.push(points[i + 1].x - points[i].x)
    slope.push((points[i + 1].y - points[i].y) / dx[i])
  }
  const t = [slope[0]]
  for (let i = 1; i < n - 1; i += 1) {
    t.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2)
  }
  t.push(slope[n - 2])
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) { t[i] = 0; t[i + 1] = 0; continue }
    const a = t[i] / slope[i]
    const b = t[i + 1] / slope[i]
    const h = a * a + b * b
    if (h > 9) {
      const k = 3 / Math.sqrt(h)
      t[i] = k * a * slope[i]
      t[i + 1] = k * b * slope[i]
    }
  }
  let d = `M${f(points[0].x)},${f(points[0].y)}`
  for (let i = 0; i < n - 1; i += 1) {
    const p = points[i]
    const q = points[i + 1]
    const h = dx[i] / 3
    d += ` C${f(p.x + h)},${f(p.y + t[i] * h)} ${f(q.x - h)},${f(q.y - t[i + 1] * h)} ${f(q.x)},${f(q.y)}`
  }
  return d
}

// Place the counts in a box. The top of the scale is at least 2, so one walk
// doesn't shoot straight to the top of the chart.
export function chartPoints(counts, { width, height, padX = 0, padTop = 0, padBottom = 0 }) {
  const max = Math.max(2, ...counts)
  const usable = height - padTop - padBottom
  const step = counts.length > 1 ? (width - padX * 2) / (counts.length - 1) : 0
  return {
    max,
    points: counts.map((c, i) => ({
      x: padX + step * i,
      y: padTop + usable * (1 - c / max),
      value: c,
    })),
  }
}
