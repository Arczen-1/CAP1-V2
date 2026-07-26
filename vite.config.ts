import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Split heavy dependencies out of the single app bundle so the initial
        // JS is smaller and vendor code caches across app updates.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('/react/') || id.includes('/react-dom/')) return 'react';
            if (id.includes('@radix-ui')) return 'radix';
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            return 'vendor';
          }
        },
      },
    },
  },
});
