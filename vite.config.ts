import preact from '@preact/preset-vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'offline.html', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'MiniCode — IDE Educacional',
        short_name: 'MiniCode',
        description: 'IDE web leve, offline, em português para aprender a programar.',
        theme_color: '#1e1e2e',
        background_color: '#1e1e2e',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/offline/, /^\/pyodide\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^\/pyodide\//,
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