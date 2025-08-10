import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  root: './src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: './src/index.html'
    }
  },
  server: {
    port: 3000,
    open: true
  },
  define: {
    global: 'globalThis',
  }
})