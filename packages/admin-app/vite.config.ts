import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      include: [/node_modules/, /shared/],
    },
  },
  optimizeDeps: {
    include: ['@monitor-me/shared'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@monitor-me/shared': path.resolve(__dirname, '../shared/dist/index.js'),
    },
  },
  server: {
    port: 5174,
  },
});
