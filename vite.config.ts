import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.png', 'logo.png', 'assets/logo.png'],
      manifest: {
        name: 'FaeQuest',
        short_name: 'FaeQuest',
        description: 'FaeQuest — Hệ Thống Quản Lý Nhiệm Vụ Nhập Vai',
        theme_color: '#06141B',
        background_color: '#06141B',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
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
