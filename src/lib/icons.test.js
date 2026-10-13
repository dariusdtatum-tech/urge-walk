// App icons in public/: right pixel sizes, and no alpha channel (iOS turns transparency black).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const png = (name) => {
  const b = readFileSync(new URL(`../../public/${name}`, import.meta.url))
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] } // IHDR
}

describe('app icons', () => {
  it.each([
    ['apple-touch-icon-b.png', 180], ['apple-touch-icon-120-b.png', 120], ['apple-touch-icon-152-b.png', 152], ['apple-touch-icon-167-b.png', 167],
    ['apple-touch-icon.png', 180], ['apple-touch-icon-precomposed.png', 180], ['pwa-192-b.png', 192], ['pwa-512-b.png', 512],
    ['pwa-maskable-512-b.png', 512], ['favicon-64-b.png', 64], ['favicon-32-b.png', 32],
  ])('%s is %ipx and opaque', (name, size) => {
    const p = png(name)
    expect([p.w, p.h]).toEqual([size, size])
    expect([2, 0]).toContain(p.colorType) // RGB or grey, no alpha
  })
  it('favicon-b.svg is the Light B icon (versioned name)', () => {
    expect(readFileSync(new URL('../../public/favicon-b.svg', import.meta.url), 'utf8')).toMatch(/^<svg[^>]+viewBox="0 0 1024 1024"/)
  })
})

describe('icon URLs are versioned (iOS caches home-screen icons by URL)', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8')
  const cfg = readFileSync(new URL('../../vite.config.js', import.meta.url), 'utf8')
  it('index.html and the manifest point at the -b files only', () => {
    expect(html).toContain('apple-touch-icon-b.png')
    for (const old of ['pwa-192x192.png', 'pwa-512x512.png', 'favicon.ico', 'favicon.svg', 'favicon-32.png']) {
      expect(html).not.toContain(`/${old}`)
      expect(cfg).not.toContain(`'${old}'`)
    }
    expect(cfg).toContain("'pwa-maskable-512-b.png'")
  })
})
