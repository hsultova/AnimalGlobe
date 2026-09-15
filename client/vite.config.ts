import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/wwwroot',
    emptyOutDir: true,
    target: 'baseline-widely-available',
    // three.js (via react-globe.gl) is legitimately large; raise the warning
    // threshold so its route chunk doesn't trip a false alarm.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split long-lived vendor code into its own chunk so it caches
        // independently of app code between deploys. The globe/three.js bundle
        // is intentionally left out — route-level splitting keeps it scoped to
        // the globe page only.
        manualChunks(id) {
          if (id.includes('node_modules/react-router') || id.includes('node_modules/react-dom') ||
              /node_modules\/react(-dom)?\//.test(id) || id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n'
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': { 
        target: 'http://127.0.0.1:8080/',
        changeOrigin: true, 
        secure: false,
      },
    }
  }
})
