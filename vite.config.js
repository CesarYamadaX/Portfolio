import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // relative base: the build works at a domain root (Vercel) and under a sub-path (GitHub Pages)
  base: './',
  plugins: [react()],
  build: {
    // three.js is large by nature; it lives in its own lazy chunk (see App.jsx)
    chunkSizeWarningLimit: 1400,
  },
})
