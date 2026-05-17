import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    // Docker-injected env vars (no react/src/.env file needed)
    'import.meta.env.VITE_API_BASE_URL':
      JSON.stringify(process.env.VITE_API_BASE_URL),
    'import.meta.env.VITE_DJANGO_API_URL':
      JSON.stringify(process.env.VITE_DJANGO_API_URL),
    'import.meta.env.VITE_PHP_API_URL':
      JSON.stringify(process.env.VITE_PHP_API_URL),
    'import.meta.env.VITE_OLLAMA_URL':
      JSON.stringify(process.env.VITE_OLLAMA_URL),
    'import.meta.env.VITE_GOOGLE_CLIENT_ID':
      JSON.stringify(process.env.VITE_GOOGLE_CLIENT_ID),
  },
  server: {
    host: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
    proxy: {
      '/ws': {
        target: 'http://sb:8080',
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

