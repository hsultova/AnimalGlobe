import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/wwwroot',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': { target: 'https://localhost:7145/', changeOrigin: true, secure: false },
    }
  }
})
