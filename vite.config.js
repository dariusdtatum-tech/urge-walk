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
      includeAssets: ['apple-touch-icon.png', 'favicon-64.png'],
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
        background_color: '#0b121a',
        theme_color: '#0b121a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        navigateFallback: BASE + 'index.html',
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
