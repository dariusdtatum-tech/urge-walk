import { describe, expect, it } from 'vitest'
import {
  RANGE_IDS, bucketCounts, chartPoints, cleanDays, heroHabit, makePrimary, rangeBuckets, rangeStats, shortDate,
  smoothPath,
} from './homeStats.js'

// Thursday Oct 8, 2026, 9:41 PM in New York (tests run with TZ=America/New_York)
const NOW = new Date(2026, 9, 8, 21, 41).getTime()
const walk = (iso, result = null) => ({ id: iso, startedAt: iso, endedAt: iso, plannedMinutes: 10, actualSeconds: 600, result })

describe('hero tracker', () => {
  const habits = [
    { id: 'a', name: 'A', startDate: '2026-04-27' },
    { id: 'b', name: 'B', startDate: '2025-01-01' },
    { id: 'c', name: 'C', startDate: '2026-10-01' },
  ]
  it('is the first habit, or none', () => {
    expect(heroHabit(habits).id).toBe('a')
    expect(heroHabit([])).toBeNull()
  })
  it('"Show on Home" moves a habit to the front and keeps the rest in order', () => {
    expect(makePrimary(habits, 'c').map((h) => h.id)).toEqual(['c', 'a', 'b'])
    expect(makePrimary(habits, 'missing')).toBe(habits)
  })
})

describe('clean days', () => {
  it('counts calendar days from the start date', () => {
    expect(cleanDays({ startDate: '2026-04-27' }, '2026-10-06')).toBe(162)
  })
  it('is 0 for a future start or no habit', () => {
    expect(cleanDays({ startDate: '2026-10-09' }, '2026-10-08')).toBe(0)
    expect(cleanDays(null, '2026-10-08')).toBe(0)
  })
  it('a "Didn\'t pass" walk does not reset the streak (walks are not an input)', () => {
    const habit = { startDate: '2026-04-27' }
    const before = cleanDays(habit, '2026-10-06')
    const walks = [walk('2026-10-06T12:00:00.000Z', 'no'), walk('2026-10-06T14:00:00.000Z', 'no')]
    expect(rangeStats(walks, 'D', new Date(2026, 9, 6, 20).getTime())).toEqual({ walked: 2, passed: 0 })
    expect(cleanDays(habit, '2026-10-06')).toBe(before)
  })
})

describe('shortDate', () => {
  it('drops the year for this year only', () => {
    expect(shortDate('2026-03-15', '2026-10-08')).toBe('Mar 15')
    expect(shortDate('2025-03-15', '2026-10-08')).toBe('Mar 15, 2025')
    expect(shortDate('nope', '2026-10-08')).toBe('')
  })
})

describe('D / W / M ranges', () => {
  it('W = the last 7 days ending today, Fri..Thu', () => {
    const b = rangeBuckets('W', NOW)
    expect(b.map((x) => x.label)).toEqual(['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'])
    expect(b.map((x) => x.current)).toEqual([false, false, false, false, false, false, true])
    expect(b[0].start).toBe(new Date(2026, 9, 2).getTime())
    expect(b[6].end).toBe(new Date(2026, 9, 9).getTime())
  })
  it('D = six 4-hour blocks of today; the current one is highlighted', () => {
    const b = rangeBuckets('D', NOW)
    expect(b.map((x) => x.label)).toEqual(['12A', '4A', '8A', '12P', '4P', '8P'])
    expect(b.findIndex((x) => x.current)).toBe(5)
  })
  it('M = 30 days, labelled every 7th day back from today', () => {
    const b = rangeBuckets('M', NOW)
    expect(b).toHaveLength(30)
    expect(b.filter((x) => x.showLabel).map((x) => x.label)).toEqual(['Sep 10', 'Sep 17', 'Sep 24', 'Oct 1', 'Oct 8'])
    expect(b[29].current).toBe(true)
  })
  it('days are calendar days even across the DST change (Nov 1, 2026)', () => {
    const b = rangeBuckets('W', new Date(2026, 10, 3, 12).getTime())
    const lengths = b.map((x) => (x.end - x.start) / 3600000)
    expect(lengths).toContain(25)
    expect(b[6].start).toBe(new Date(2026, 10, 3).getTime())
  })
  it('every range id builds buckets', () => {
    for (const id of RANGE_IDS) expect(rangeBuckets(id, NOW).length).toBeGreaterThan(0)
  })
})

describe('chips and chart numbers', () => {
  // Matches the mockup: yesterday 11:50 PM didn't pass; today 9:05 AM kinda, 7:15 PM passed; plus older walks
  const walks = [
    walk('2026-10-08T03:50:00.000Z', 'no'),
    walk('2026-10-08T13:05:00.000Z', 'kinda'),
    walk('2026-10-08T23:15:00.000Z', 'yes'),
    walk('2026-09-20T16:00:00.000Z', 'yes'),
    walk('2025-12-31T03:00:00.000Z', null),
  ]
  it('W: 3 walked, 1 passed; the ring is not involved', () => {
    expect(rangeStats(walks, 'W', NOW)).toEqual({ walked: 3, passed: 1 })
  })
  it('D and M change only these numbers', () => {
    expect(rangeStats(walks, 'D', NOW)).toEqual({ walked: 2, passed: 1 })
    expect(rangeStats(walks, 'M', NOW)).toEqual({ walked: 4, passed: 2 })
  })
  it('weekly line: Fri-Tue 0, Wed 1, Thu 2', () => {
    expect(bucketCounts(walks, rangeBuckets('W', NOW))).toEqual([0, 0, 0, 0, 0, 1, 2])
  })
  it('walks after now (clock changed) are not counted in today', () => {
    expect(rangeStats([walk('2026-10-09T05:00:00.000Z', 'yes')], 'D', NOW)).toEqual({ walked: 0, passed: 0 })
  })
})

describe('chart geometry', () => {
  it('scale tops out at least at 2 and puts zeros on the baseline', () => {
    const { max, points } = chartPoints([0, 1, 0], { width: 300, height: 100, padX: 10, padTop: 0, padBottom: 0 })
    expect(max).toBe(2)
    expect(points.map((p) => p.y)).toEqual([100, 50, 100])
    expect(points.map((p) => p.x)).toEqual([10, 150, 290])
  })
  it('smooth line passes through every point and never dips below a flat run', () => {
    const pts = [{ x: 0, y: 100 }, { x: 10, y: 100 }, { x: 20, y: 100 }, { x: 30, y: 50 }, { x: 40, y: 0 }]
    const d = smoothPath(pts)
    expect(d.startsWith('M0,100')).toBe(true)
    expect(d.endsWith('40,0')).toBe(true)
    const ys = [...d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => Number(m[2]))
    expect(Math.max(...ys)).toBeLessThanOrEqual(100)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
  })
  it('handles 0 or 1 point', () => {
    expect(smoothPath([])).toBe('')
    expect(smoothPath([{ x: 5, y: 6 }])).toBe('M5,6')
  })
})
