import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /* VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'KoboCollect Web',
        short_name: 'KoboWeb',
        description: 'Transformation de KoboCollect en Application Web',
        theme_color: '#3e9fcc',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }) */
  ],
  server: {
    proxy: {
      '/kobo-proxy': {
        target: 'https://kc.kobotoolbox.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kobo-proxy/, ''),
      },
      '/kf-proxy': {
        target: 'https://kf.kobotoolbox.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kf-proxy/, ''),
      },
    },
  },
})
