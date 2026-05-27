import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://lens-university-market-place-alpha.vercel.app/',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://lens-university-market-place-alpha.vercel.app/',
        changeOrigin: true
      }
    }
  }
})
