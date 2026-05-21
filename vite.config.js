import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = resolve(__dirname);

export default defineConfig({
  root,
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: '/index.html',
  },
});
