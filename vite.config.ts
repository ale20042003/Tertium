import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Tertium Fit Club',
          short_name: 'Tertium',
          description: 'Gestionale palestra: schede, corsi, clienti e staff.',
          lang: 'it',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#05092f',
          theme_color: '#05092f',
          icons: [
            {src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png'},
            {src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png'},
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // La pagina non va precaricata: se sta nella cache, dopo un deploy l'utente
          // continua a vedere la versione vecchia finché non ricarica una seconda volta.
          globPatterns: ['**/*.{js,css,png,jpg,svg,woff2}'],
          // Il bundle con recharts supera il limite di default di 2 MB.
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          // Il plugin aggiungerebbe una NavigationRoute legata a index.html precaricato,
          // che qui non è più nel precache: senza questo il service worker va in errore.
          navigateFallback: null as unknown as undefined,
          runtimeCaching: [
            {
              // Prima la rete, la cache solo come riserva quando si è offline.
              urlPattern: ({request}: {request: Request}) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pagine',
                networkTimeoutSeconds: 3,
                expiration: {maxEntries: 10},
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
