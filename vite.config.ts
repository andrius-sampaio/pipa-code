import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Base pública do app (GitHub Pages: https://usuario.github.io/pipa-code/).
// Todos os caminhos do PWA precisam respeitar esse prefixo.
const BASE = '/pipa-code/'
const pyodidePrefix = new RegExp(`^${BASE}pyodide/`)

// https://vite.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'offline.html', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: BASE,
        name: 'Pipa Code — IDE Educacional',
        short_name: 'Pipa Code',
        description: 'IDE web leve, offline, em português para aprender a programar.',
        lang: 'pt-BR',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        orientation: 'any',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff,woff2}'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [
          new RegExp(`^${BASE}offline`),
          pyodidePrefix,
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: pyodidePrefix,
            handler: 'CacheFirst',
            options: { cacheName: 'pyodide-cache', expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})