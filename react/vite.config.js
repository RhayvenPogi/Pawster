import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/php': {
        target: 'http://php:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/php/, ''),
      },
      '/ors': {
        target: 'https://api.openrouteservice.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ors/, ''),
      },
      // ✅ Use service name 'sb' NOT container name 'pawster_springboot_app'
      '/api': {
        target: 'http://sb:8080',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://sb:8080',
        changeOrigin: true,
      },
    }
  }
})