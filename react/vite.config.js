import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
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
