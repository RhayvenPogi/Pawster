import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    proxy: {
      '/ws': {
        target: 'http://api-gateway:8000',
        changeOrigin: true,
        ws: true,
      },
      '/php': {
        target: 'http://api-gateway:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://api-gateway:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://api-gateway:8000',
        changeOrigin: true,
      },
      '/ors': {
        target: 'https://api.openrouteservice.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ors/, ''),
      },
    }
  }
})