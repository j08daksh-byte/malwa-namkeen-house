import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/*
 * Vite config for the src-rebuild/ preview.
 *
 * Run with:
 *   npx vite --config vite.rebuild.config.ts
 *
 * Serves on port 5174. The existing app remains on 5173 (npx vite).
 * Neither config touches the other.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: 'src-rebuild',
  server: {
    port: 5174,
    strictPort: true,   // fail clearly if 5174 is already in use
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    outDir: '../dist-rebuild',  // keeps build output outside src-rebuild/
    emptyOutDir: true,
  },
});
