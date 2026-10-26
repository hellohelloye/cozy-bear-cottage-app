import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Cozy Bear Cottage — mobile web app (PWA).
// No app-store step: deploy the built site, share the link.
// All Meta Model API calls go through the serverless proxy in /api
// so the API key never reaches the browser (see api/meta.js).
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cozy Bear Cottage 小熊中文',
        short_name: 'Cozy Bear',
        description: 'AI co-teacher for weekend Chinese classes, ages 3-6.',
        theme_color: '#a8d8ea',
        background_color: '#eaf6fb',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/assets/bear-cutout.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      }
    })
  ],
  server: {
    // Local dev only: forward /api to `vercel dev` if you run it, otherwise
    // the app falls back to the built-in sample lesson (see src/lib/metaApi.js).
    port: 5173
  }
});
