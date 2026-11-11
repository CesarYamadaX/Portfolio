import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // three.js is large by nature; it lives in its own lazy chunk (see App.jsx)
    chunkSizeWarningLimit: 1400,
  },
})
