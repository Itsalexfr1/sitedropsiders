import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'android-chrome-512x512.png'],
      manifest: {
        name: 'DROPSIDERS',
        short_name: 'Dropsiders',
        description: 'L\'actu de tous les festivals',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 8000000,
      },
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dropsiders\.fr\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'r2-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    watch: {
      ignored: ['**/src/data/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) return 'lib-jspdf';
            if (id.includes('html2canvas')) return 'lib-canvas';
            if (id.includes('html2pdf.js')) return 'lib-html2pdf';
            if (id.includes('@uiw/react-md-editor')) return 'lib-editor';
            if (id.includes('framer-motion')) return 'lib-framer';
            if (id.includes('lucide-react')) return 'lib-lucide';
            if (id.includes('react-social-media-embed')) return 'lib-social-embeds';
            if (id.includes('react-simple-maps') || id.includes('d3-')) return 'lib-maps';
            return 'vendor';
          }
          
          // Isolate large JSON data files individually
          if (id.includes('src/data/') && id.endsWith('.json')) {
            const fileName = id.split('/').pop()?.replace('.json', '') || 'data';
            return `data-${fileName}`;
          }
          
          if (id.includes('src/pages/NewsCreate.tsx')) return 'p-admin-news-create';
          if (id.includes('src/pages/AdminFactures.tsx')) return 'p-admin-billing';
          if (id.includes('src/components/SocialSuite.tsx')) return 'c-social-suite';
          if (id.includes('src/components/InvoiceGenerator.tsx')) return 'c-invoice';
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
