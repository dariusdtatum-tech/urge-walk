// App icons in public/: right pixel sizes, and no alpha channel (iOS turns transparency black).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const png = (name) => {
  const b = readFileSync(new URL(`../../public/${name}`, import.meta.url))
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] } // IHDR
}

describe('app icons', () => {
  it.each([
    ['apple-touch-icon.png', 180], ['pwa-192x192.png', 192], ['pwa-512x512.png', 512],
    ['pwa-maskable-512.png', 512], ['favicon-64.png', 64], ['favicon-32.png', 32],
  ])('%s is %ipx and opaque', (name, size) => {
    const p = png(name)
    expect([p.w, p.h]).toEqual([size, size])
    expect([2, 0]).toContain(p.colorType) // RGB or grey, no alpha
  })
  it('favicon.svg is the Light B icon', () => {
    expect(readFileSync(new URL('../../public/favicon.svg', import.meta.url), 'utf8')).toMatch(/^<svg[^>]+viewBox="0 0 1024 1024"/)
  })
})
