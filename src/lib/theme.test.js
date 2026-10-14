import { describe, expect, it } from 'vitest'
import { THEME_KEY, applyTheme, loadTheme, saveTheme } from './theme.js'

function fakeStorage() {
  const m = new Map()
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }
}
function fakeDoc() {
  const meta = (media, content) => {
    const a = { media, content }
    return { getAttribute: (k) => a[k], setAttribute: (k, v) => { a[k] = v }, get content() { return a.content } }
  }
  const metas = [meta('(prefers-color-scheme: light)', '#faf7f1'), meta('(prefers-color-scheme: dark)', '#0f1d33')]
  return { documentElement: { dataset: {} }, querySelectorAll: () => metas, metas }
}

describe('appearance', () => {
  it('defaults to System and ignores junk', () => {
    const s = fakeStorage()
    expect(loadTheme(s)).toBe('system')
    s.setItem(THEME_KEY, 'neon')
    expect(loadTheme(s)).toBe('system')
  })
  it('saves Dark, sets data-theme and pins the status bar color', () => {
    const s = fakeStorage(); const d = fakeDoc()
    saveTheme('dark', s, d)
    expect(loadTheme(s)).toBe('dark')
    expect(d.documentElement.dataset.theme).toBe('dark')
    expect(d.metas.map((m) => m.content)).toEqual(['#0f1d33', '#0f1d33'])
  })
  it('System removes the override and restores both colors', () => {
    const s = fakeStorage(); const d = fakeDoc()
    saveTheme('light', s, d); saveTheme('system', s, d)
    expect(s.getItem(THEME_KEY)).toBeNull()
    expect(d.documentElement.dataset.theme).toBeUndefined()
    expect(d.metas.map((m) => m.content)).toEqual(['#faf7f1', '#0f1d33'])
  })
  it('without a document it does nothing', () => {
    expect(() => applyTheme('dark', undefined)).not.toThrow()
  })
})
