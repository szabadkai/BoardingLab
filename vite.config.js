import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './', // Relative base path for GitHub Pages
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    open: true,
  },
});
