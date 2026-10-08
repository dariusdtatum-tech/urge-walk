import { describe, expect, it } from 'vitest'
import {
  ACTIVE_WALK_KEY, WALKS_KEY, WALK_PREFS_KEY, appendWalk, loadActiveWalk, loadWalkMinutes,
  loadWalks, saveActiveWalk, saveWalkMinutes,
} from './walkStorage.js'
import { pauseWalk, startWalk } from './walkTimer.js'

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v) },
    removeItem: (k) => { delete data[k] },
  }
}

const record = (over = {}) => ({
  id: 'r1',
  startedAt: '2026-01-01T12:00:00.000Z',
  endedAt: '2026-01-01T12:10:00.000Z',
  plannedMinutes: 10,
  actualSeconds: 600,
  endedEarly: false,
  result: 'yes',
  note: 'ok',
  ...over,
})

describe('saved walks', () => {
  it('appends records under a versioned key', () => {
    const s = memoryStorage()
    expect(appendWalk(record(), s)).toBe(true)
    expect(appendWalk(record({ id: 'r2', result: null }), s)).toBe(true)
    expect(JSON.parse(s.data[WALKS_KEY]).version).toBe(1)
    const { walks, recovered } = loadWalks(s)
    expect(walks.map((w) => w.id)).toEqual(['r1', 'r2'])
    expect(walks[1].result).toBeNull()
    expect(recovered).toBe(false)
  })

  it('backs up corrupt data and starts a fresh list', () => {
    const s = memoryStorage({ [WALKS_KEY]: 'nope{' })
    expect(appendWalk(record(), s)).toBe(true)
    expect(loadWalks(s).walks).toHaveLength(1)
    const backup = Object.keys(s.data).find((k) => k.startsWith(`${WALKS_KEY}.corrupt-`))
    expect(s.data[backup]).toBe('nope{')
  })

  it('drops malformed records and cleans bad fields', () => {
    const s = memoryStorage({
      [WALKS_KEY]: JSON.stringify({ version: 1, walks: [
        record(),
        record({ id: 'bad', startedAt: 'yesterday-ish' }),
        record({ id: 'odd', result: 'maybe' }),
        42,
      ] }),
    })
    const { walks, recovered } = loadWalks(s)
    expect(walks.map((w) => w.id)).toEqual(['r1', 'odd'])
    expect(walks[1].result).toBeNull()
    expect(recovered).toBe(true)
  })
})

describe('walk in progress', () => {
  it('round-trips and can be cleared', () => {
    const s = memoryStorage()
    const w = pauseWalk(startWalk(10, 1000, { id: 'a', messageOffset: 3 }), 5000)
    saveActiveWalk(w, s)
    expect(loadActiveWalk(s)).toEqual({ version: 1, ...w })
    saveActiveWalk(null, s)
    expect(s.data[ACTIVE_WALK_KEY]).toBeUndefined()
    expect(loadActiveWalk(s)).toBeNull()
  })

  it('ignores and removes unusable data', () => {
    const s = memoryStorage({ [ACTIVE_WALK_KEY]: JSON.stringify({ id: 'a', startedAt: 'soon' }) })
    expect(loadActiveWalk(s)).toBeNull()
    expect(s.data[ACTIVE_WALK_KEY]).toBeUndefined()
    const s2 = memoryStorage({ [ACTIVE_WALK_KEY]: '{{' })
    expect(loadActiveWalk(s2)).toBeNull()
  })
})

describe('preferences', () => {
  it('defaults to 10 and remembers the last choice', () => {
    const s = memoryStorage()
    expect(loadWalkMinutes(s)).toBe(10)
    saveWalkMinutes(5, s)
    expect(loadWalkMinutes(s)).toBe(5)
    s.data[WALK_PREFS_KEY] = JSON.stringify({ minutes: 7 })
    expect(loadWalkMinutes(s)).toBe(10)
  })
})
