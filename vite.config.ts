import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Supports static hosting / GitHub Pages cleanly
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
});
