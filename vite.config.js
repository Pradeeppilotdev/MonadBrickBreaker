import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
  }
})
