// App icons in public/: right pixel sizes, and no alpha channel (iOS turns transparency black).
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const png = (name) => {
  const b = readFileSync(new URL(`../../public/${name}`, import.meta.url))
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] } // IHDR
}

describe('app icons', () => {
  it.each([
    ['apple-touch-icon-c.png', 180], ['apple-touch-icon.png', 180], ['apple-touch-icon-precomposed.png', 180],
    ['pwa-192-c.png', 192], ['pwa-512-c.png', 512], ['pwa-maskable-512-c.png', 512], ['favicon-64-b.png', 64], ['favicon-32-b.png', 32],
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
  it('index.html has exactly one apple-touch-icon: 180px, -c, absolute', () => {
    const tags = html.match(/<link rel="apple-touch-icon"[^>]*>/g)
    expect(tags).toEqual(['<link rel="apple-touch-icon" sizes="180x180" href="/urge-walk/apple-touch-icon-c.png" />'])
  })
  it('manifest: 180/192/512 "any" PNGs with -c names, maskable separate, never "any maskable"', () => {
    for (const [f, s] of [['apple-touch-icon-c.png', 180], ['pwa-192-c.png', 192], ['pwa-512-c.png', 512]]) {
      expect(cfg).toMatch(new RegExp(`'${f}', sizes: '${s}x${s}', type: 'image/png', purpose: 'any' }`))
    }
    expect(cfg).toContain("'pwa-maskable-512-c.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }")
    expect(cfg).not.toMatch(/any maskable|maskable any/)
    expect(cfg).toContain("manifestFilename: 'manifest-c.webmanifest'")
  })
  it('test-only icon pages and -d icons are gone', () => {
    for (const f of ['icon-test.html', 'icon-test2.html', 'icon-test3.html', 'icon-test4.html', 'icon-test5.html', 'apple-touch-icon-d.png', 'apple-touch-icon-d.jpg', 'pwa-192-d.png', 'pwa-512-d.png']) {
      expect(existsSync(new URL(`../../public/${f}`, import.meta.url))).toBe(false)
    }
    expect(cfg).not.toMatch(/icon-test|-d\.(png|jpg)/)
  })
  it('old names are gone', () => {
    for (const old of ['-b.png', 'manifest-b']) { expect(html).not.toContain(`icon${old}`); expect(cfg).not.toContain(`icon${old}`) }
    for (const old of ['pwa-192x192.png', 'pwa-512x512.png', 'favicon.ico', 'favicon.svg', 'favicon-32.png']) {
      expect(html).not.toContain(`/${old}`)
      expect(cfg).not.toContain(`'${old}'`)
    }
    for (const o of ['apple-touch-icon-b', 'pwa-192-b', 'pwa-512-b', 'pwa-maskable-512-b']) expect(cfg + html).not.toContain(o)
  })
})
