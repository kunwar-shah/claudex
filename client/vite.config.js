import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3400',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Increase chunk size warning threshold to 1MB so we don't get noisy warnings
    // for legitimate large chunks like Tremor.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split large vendors into separate chunks for parallel loading + better caching.
        // Tremor + recharts is ~700KB by itself; isolating it means the rest of the app
        // loads faster and Tremor only loads when Analytics is visited.
        manualChunks: {
          // Charts/analytics — only needed on /tremor-preview
          tremor: ['@tremor/react', 'recharts'],
          // React + router core
          react: ['react', 'react-dom', 'react-router-dom'],
          // Data layer
          query: ['@tanstack/react-query'],
          // Markdown rendering — only when viewing conversations
          markdown: ['react-markdown'],
        },
      },
    },
  },
})
