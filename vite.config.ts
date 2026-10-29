import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['apple-touch-icon-180x180.png', 'images/answers/*.jpg'],
      manifest: {
        id: '/', name: 'MindCare — личный ориентир', short_name: 'MindCare',
        description: 'Четыре вопроса о вашем состоянии и рекомендации на сегодня.',
        lang: 'ru', start_url: '/', scope: '/', display: 'standalone',
        theme_color: '#e8f0eb', background_color: '#e8f0eb',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'],
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/health$/, /^\/api\//],
      },
    }),
  ],
  build: { target: ['es2022', 'safari16.4'] },
});
