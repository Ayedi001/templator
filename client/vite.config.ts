import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:4100', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:4100', changeOrigin: true },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '..', 'dist'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
