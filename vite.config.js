import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The app is hosted on GitHub Pages at https://<user>.github.io/urge-walk/
// so every URL (assets, manifest, icons, service worker) lives under /urge-walk/
const BASE = '/urge-walk/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    // Turns the app into an installable PWA:
    // - writes manifest.webmanifest (name, icons, colors)
    // - generates a service worker that caches the app so it works offline
    VitePWA({
      registerType: 'autoUpdate',
      // versioned like the icons, so iOS/Chrome fetch the new manifest
      manifestFilename: 'manifest-c.webmanifest',
      includeAssets: ['apple-touch-icon-c.png', 'favicon-b.svg', 'favicon-b.ico', 'favicon-32-b.png', 'favicon-64-b.png'],
      manifest: {
        name: 'Urge Walk',
        short_name: 'Urge Walk',
        description: 'A private, on-device companion for riding out urges.',
        // A fixed id keeps the installed app's identity stable even if start_url changes.
        id: BASE,
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f1',
        theme_color: '#faf7f1',
        icons: [
          // Absolute URLs; 180/192/512 are plain "any" icons (what iOS uses); maskable is its own entry.
          { src: BASE + 'apple-touch-icon-c.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: BASE + 'pwa-192-c.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: BASE + 'pwa-512-c.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: BASE + 'pwa-maskable-512-c.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,woff2}'],
        navigateFallback: BASE + 'index.html',
        // The bare icon test page must load itself, never the app shell.
        navigateFallbackDenylist: [/icon-test.*\.html$/],
        globIgnores: ['**/icon-test*.html'],
        // drop old precaches (e.g. the previous icon files) and take over right away
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  // Allow the temporary public tunnel URL (e.g. *.trycloudflare.com) to reach `vite preview`
  preview: {
    allowedHosts: true,
  },
  // Unit tests run in a fixed time zone with daylight saving, so day-grouping tests are stable.
  test: {
    env: { TZ: 'America/New_York' },
  },
})
