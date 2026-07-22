import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  publicDir: 'static'
});
