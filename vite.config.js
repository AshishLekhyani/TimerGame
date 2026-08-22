import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // The question bank is a couple of hundred kilobytes of pure data and
          // never changes between releases — give it its own cacheable chunk.
          quiz: ['./src/data/quiz/index.js'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})
