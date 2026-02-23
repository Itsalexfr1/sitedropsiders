import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          'utils': ['axios', 'cheerio', 'jsdom'],
          'charts': ['d3-geo', 'd3-scale', 'react-simple-maps'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
})
