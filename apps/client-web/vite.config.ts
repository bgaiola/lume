import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, '../../'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4174,
    strictPort: true,
    // Cloudflare Tunnel proxies lumeapp.es to this dev server. Vite 5
    // rejects unknown Host headers by default, so we whitelist the
    // production hostname plus the trycloudflare.com / lhr.life
    // fallbacks used during the LAN-bypass demo phase.
    allowedHosts: [
      'lumeapp.es',
      'app.lumeapp.es',
      '.trycloudflare.com',
      '.lhr.life',
    ],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@lume/protocol', '@lume/shared'],
  },
});
