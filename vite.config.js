import { defineConfig } from 'vite';

export default defineConfig({
  base: '/peta-lahan/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
