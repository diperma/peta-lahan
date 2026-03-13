import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bhumi-scraper/',
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
