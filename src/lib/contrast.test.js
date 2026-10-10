// WCAG 2.x AA contrast for the key text / background pairs, in both themes.
// Reads the real token values from src/index.css, so a palette change can't silently break contrast.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

function tokens(block) {
  const out = {}
  for (const m of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim()
  return out
}
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('@media (prefers-color-scheme: dark)'))
const darkBlock = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))
const light = tokens(lightBlock)
const dark = { ...light, ...tokens(darkBlock) }

function rgba(value) {
  const v = value.trim()
  let m = v.match(/^#([0-9a-f]{6})$/i)
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1)
  m = v.match(/^rgba?\(([^)]+)\)$/)
  if (m) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
  throw new Error(`not a solid colour: ${value}`)
}
// A translucent colour laid over an opaque one.
const over = (top, bottom) => { const t = rgba(top), b = Array.isArray(bottom) ? bottom : rgba(bottom); return t.slice(0, 3).map((c, i) => c * t[3] + b[i] * (1 - t[3])) }
const lum = (rgb) => { const c = rgb.map((x) => { x /= 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
export function ratio(fg, bg) {
  const a = lum(Array.isArray(fg) ? fg : rgba(fg).slice(0, 3)), b = lum(Array.isArray(bg) ? bg : rgba(bg).slice(0, 3))
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

// [label, foreground token, background token, minimum]  4.5 = normal text, 3 = large/bold text or UI parts
const PAIRS = [
  ['body text on screen', 'text', 'bg', 4.5],
  ['body text on cards / sheets', 'text', 'card', 4.5],
  ['titles + ring number on screen', 'title', 'bg', 4.5],
  ['titles on cards', 'title', 'card', 4.5],
  ['chip numbers on sand', 'title', 'sand', 4.5],
  ['muted captions on screen', 'muted', 'bg', 4.5],
  ['muted captions on cards', 'muted', 'card', 4.5],
  ['muted labels on sand (chips, Log row)', 'muted-sand', 'sand', 4.5],
  ['accent text (Edit, links, kicker) on screen', 'accent', 'bg', 4.5],
  ['accent text on cards', 'accent', 'card', 4.5],
  ['segmented: active label', 'title', 'seg-on', 4.5],
  ['segmented: idle label', 'muted-sand', 'seg', 4.5],
  ['primary button / + label', 'on-action', 'action', 4.5],
  ['badge text on earned badge', 'on-badge', 'badge', 4.5],
  ['next badge text on screen', 'accent', 'bg', 4.5],
  ['urge button title on sea glass', 'urge-text', 'ring-b', 4.5],
  ['urge button subtitle on sea glass', 'urge-sub', 'ring-b', 4.5],
  ['Log passed on cards', 'res-yes', 'card', 4.5],
  ['Log kinda on cards', 'res-kinda', 'card', 4.5],
  ["Log didn't on cards", 'res-no-text', 'card', 4.5],
  ['Log passed count on sand (bold 21px = large)', 'res-yes', 'sand', 3],
  ['Log kinda count on sand (bold 21px = large)', 'res-kinda', 'sand', 3],
  ['delete text on cards', 'danger', 'card', 4.5],
  ['delete button label', 'on-danger', 'danger', 4.5],
  ['input / control border vs card (UI)', 'field-border', 'card', 3],
  ['dashed next badge outline (UI)', 'badge-next', 'bg', 3],
  ['ring arc vs track is decorative; arc vs screen (UI)', 'ring-a', 'bg', light === dark ? 3 : 1],
]

for (const [theme, t] of [['light (cream)', light], ['dark (coastal night)', dark]]) {
  describe(`WCAG AA contrast — ${theme}`, () => {
    for (const [label, fg, bg, min] of PAIRS) {
      it(`${label}: ${fg} on ${bg} >= ${min}`, () => {
        expect(t[fg], `missing --${fg}`).toBeTruthy()
        expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(min)
      })
    }
    it('tab labels on the glass tab bar (over the screen)', () => {
      const glass = over(t.glass, t.bg)
      expect(ratio(t.muted, glass)).toBeGreaterThanOrEqual(4.5)
      expect(ratio(t['tab-active'], glass)).toBeGreaterThanOrEqual(4.5)
    })
    it('text over the bottom waves stays readable', () => {
      const deepest = over(t['wave-3'], over(t['wave-2'], over(t['wave-1'], t.bg)))
      expect(ratio(t.text, deepest)).toBeGreaterThanOrEqual(4.5)
    })
  })
}

describe('palette', () => {
  it('sea glass #a9cbc0 is the ring, chart and badge colour; #3f7a6b is sea as text on cream', () => {
    expect(light['ring-b']).toBe('#a9cbc0')
    expect(light.badge).toBe('#a9cbc0')
    expect(light.accent).toBe('#3f7a6b')
    expect(dark['ring-a']).toBe('#a9cbc0')
  })
  it('sea glass is never used as text on cream (it fails AA)', () => {
    expect(ratio('#a9cbc0', light.bg)).toBeLessThan(3)
    for (const k of ['text', 'title', 'muted', 'accent', 'res-yes', 'res-kinda', 'res-no-text']) expect(light[k]).not.toBe('#a9cbc0')
  })
  it('light: navy actions with cream text; dark: sea actions with navy text', () => {
    expect([light.action, light['on-action']]).toEqual(['#24395c', '#faf7f1'])
    expect([dark.action, dark['on-action']]).toEqual(['#a9cbc0', '#0f1d33'])
  })
  it('no cyan left anywhere in the styles', () => {
    const app = readFileSync(new URL('../App.css', import.meta.url), 'utf8')
    expect(css + app).not.toMatch(/--cyan|#3de4ff|#5eead4/i)
  })
})
