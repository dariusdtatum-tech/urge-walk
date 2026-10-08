import { describe, expect, it } from 'vitest'
import {
  dayLabel, deleteWalk, formatDuration, groupByDay, localDayKey, summarize, updateWalk,
} from './logStats.js'
import { loadWalks, saveWalks } from './walkStorage.js'

// Tests run with TZ=America/New_York (see vite.config.js), which has daylight saving.
const walk = (id, startedAt, over = {}) => ({
  id, startedAt, endedAt: startedAt, plannedMinutes: 10, actualSeconds: 600,
  endedEarly: false, result: 'yes', note: '', ...over,
})

describe('summarize', () => {
  it('counts results and minutes', () => {
    const s = summarize([
      walk('a', '2026-10-07T12:00:00Z'),
      walk('b', '2026-10-07T13:00:00Z', { result: 'kinda', actualSeconds: 200 }),
      walk('c', '2026-10-07T14:00:00Z', { result: 'no', actualSeconds: 900 }),
      walk('d', '2026-10-07T15:00:00Z', { result: null, actualSeconds: 30 }),
      walk('e', '2026-10-07T16:00:00Z'),
    ])
    expect(s).toEqual({ total: 5, yes: 2, kinda: 1, no: 1, skipped: 1, totalSeconds: 2330, totalMinutes: 39 })
  })

  it('empty list', () => {
    expect(summarize([])).toEqual({ total: 0, yes: 0, kinda: 0, no: 0, skipped: 0, totalSeconds: 0, totalMinutes: 0 })
  })
})

describe('grouping by local day', () => {
  it('uses the local day, not the UTC day, around midnight', () => {
    expect(localDayKey('2026-10-08T03:59:00Z')).toBe('2026-10-07') // 11:59 PM EDT
    expect(localDayKey('2026-10-08T04:00:00Z')).toBe('2026-10-08') // 12:00 AM EDT
  })

  it('handles the DST changes', () => {
    // Fall back: Nov 1, 2026 2:00 AM EDT -> 1:00 AM EST (a 25-hour day)
    expect(localDayKey('2026-11-01T03:59:00Z')).toBe('2026-10-31')
    expect(localDayKey('2026-11-01T05:30:00Z')).toBe('2026-11-01') // 1:30 AM EDT
    expect(localDayKey('2026-11-02T04:59:00Z')).toBe('2026-11-01') // 11:59 PM EST
    expect(localDayKey('2026-11-02T05:00:00Z')).toBe('2026-11-02')
    // Spring forward: Mar 8, 2026 (a 23-hour day)
    expect(localDayKey('2026-03-08T04:59:00Z')).toBe('2026-03-07') // 11:59 PM EST
    expect(localDayKey('2026-03-09T03:59:00Z')).toBe('2026-03-08') // 11:59 PM EDT
    expect(dayLabel('2026-11-01', '2026-11-02')).toBe('Yesterday')
    expect(dayLabel('2026-03-08', '2026-03-09')).toBe('Yesterday')
  })

  it('labels Today / Yesterday / dates (year only when different)', () => {
    expect(dayLabel('2026-10-07', '2026-10-07')).toBe('Today')
    expect(dayLabel('2026-10-06', '2026-10-07')).toBe('Yesterday')
    expect(dayLabel('2026-10-03', '2026-10-07')).toBe('Sat, Oct 3')
    expect(dayLabel('2025-12-31', '2026-10-07')).toBe('Wed, Dec 31, 2025')
  })

  it('groups newest first, entries newest first within a day', () => {
    const groups = groupByDay([
      walk('old', '2026-10-03T18:00:00Z'),
      walk('t1', '2026-10-07T13:05:00Z'),
      walk('y-late', '2026-10-07T03:50:00Z'), // 11:50 PM Oct 6 local
      walk('t2', '2026-10-07T23:15:00Z'),
      walk('y-early', '2026-10-06T04:10:00Z'), // 12:10 AM Oct 6 local
    ], '2026-10-07')
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Sat, Oct 3'])
    expect(groups.map((g) => g.walks.map((w) => w.id))).toEqual([['t2', 't1'], ['y-late', 'y-early'], ['old']])
  })
})

describe('editing and deleting', () => {
  const list = [walk('a', '2026-10-07T12:00:00Z'), walk('b', '2026-10-07T13:00:00Z', { result: null })]

  it('updates result and note of one walk only', () => {
    const next = updateWalk(list, 'b', { result: 'kinda', note: '  better after  ' })
    expect(next[1]).toMatchObject({ id: 'b', result: 'kinda', note: 'better after' })
    expect(next[0]).toBe(list[0])
    expect(list[1].result).toBeNull() // original untouched
  })

  it('clears the result and rejects unknown values', () => {
    expect(updateWalk(list, 'a', { result: null })[0].result).toBeNull()
    expect(updateWalk(list, 'a', { result: 'maybe' })[0].result).toBeNull()
    expect(updateWalk(list, 'a', { note: 'x'.repeat(500) })[0].note).toHaveLength(280)
  })

  it('deletes by id', () => {
    expect(deleteWalk(list, 'a').map((w) => w.id)).toEqual(['b'])
    expect(deleteWalk(list, 'zzz')).toHaveLength(2)
  })

  it('edits and deletes persist through storage', () => {
    const data = {}
    const s = { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v } }
    saveWalks(updateWalk(deleteWalk(list, 'a'), 'b', { result: 'no', note: 'hard one' }), s)
    expect(loadWalks(s).walks).toEqual([{ ...list[1], result: 'no', note: 'hard one' }])
  })
})

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(600)).toBe('10 min')
    expect(formatDuration(200)).toBe('3 min 20 sec')
    expect(formatDuration(45)).toBe('45 sec')
    expect(formatDuration(0)).toBe('0 sec')
  })
})
