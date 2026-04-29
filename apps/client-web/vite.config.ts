import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@lume/protocol', '@lume/shared'],
  },
});
