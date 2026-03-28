import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/php': {
        target: 'http://pawster_php_api:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/php/, ''),
      },
      '/ors': {
        target: 'https://api.openrouteservice.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ors/, ''),
      }
    }
  }
})