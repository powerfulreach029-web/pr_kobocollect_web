import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'KoboCollect Web',
        short_name: 'KoboWeb',
        description: 'Collecte de données Kobo sur le Web',
        theme_color: '#3e9fcc',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    proxy: {
      '/kobo-proxy': {
        target: 'https://kc.kobotoolbox.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kobo-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            if (proxyRes.headers['www-authenticate']) {
              console.log('PROXY: Stripping WWW-Authenticate from Kobo response');
              delete proxyRes.headers['www-authenticate'];
            }
          });
        },
      },
      '/kf-proxy': {
        target: 'https://kf.kobotoolbox.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kf-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            if (proxyRes.headers['www-authenticate']) {
              delete proxyRes.headers['www-authenticate'];
            }
          });
        },
      },
      '/eu-proxy': {
        target: 'https://eu.kobotoolbox.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/eu-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, _req, _res) => {
            if (proxyRes.headers['www-authenticate']) {
              delete proxyRes.headers['www-authenticate'];
            }
          });
        },
      },
    },
  },
})
