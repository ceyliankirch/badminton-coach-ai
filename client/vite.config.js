import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour l'app automatiquement en arrière-plan
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        id: '/',
        name: 'Badmin - Coach IA',
        short_name: 'Badmin',
        description: 'Ton coach de badminton personnel propulsé par l\'IA',
        theme_color: '#1a1a1a', // La couleur de la barre d'état sur téléphone
        background_color: '#1a1a1a', // La couleur de l'écran de chargement
        display: 'standalone', // Pour cacher la barre d'URL (comme une vraie app)
        icons: [
          {
            src: 'badmin_logo_192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'badmin_logo_512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      // 👇 C'EST LA LIGNE MAGIQUE POUR TESTER EN LOCAL 👇
      devOptions: {
        enabled: true
      }
    })
  ]
});