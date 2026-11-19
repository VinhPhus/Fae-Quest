import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.png', 'logo.png', 'logo-192.png', 'logo-512.png', 'assets/logo.png'],
      manifest: {
        name: 'FaeQuest',
        short_name: 'FaeQuest',
        description: 'FaeQuest — Hệ Thống Quản Lý Nhiệm Vụ Nhập Vai',
        theme_color: '#06141B',
        background_color: '#06141B',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/logo.png',
            sizes: '64x64',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
    host: true,
    allowedHosts: true,
  },
});
