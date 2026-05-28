import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',  // Explicitly set base path
  server: {
    proxy: {
      '/api': {
        target: 'https://lens-university-market-place-alpha.vercel.app/',
        changeOrigin: true,
        secure: true
      },
      '/uploads': {
        target: 'https://lens-university-market-place-alpha.vercel.app/',
        changeOrigin: true,
        secure: true
      }
    }
  }
})
