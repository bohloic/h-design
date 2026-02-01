import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
        // AJOUTE CECI :
        // allowedHosts: [
        //   'rosaline-ceroplastic-humblingly.ngrok-free.dev'
        // ],
        // AJOUTE TOUT CE BLOC "proxy" :
        proxy: {
          '/api': {
            target: 'http://localhost:205', // L'adresse de ton backend
            changeOrigin: true,
            secure: false,
          },
          '/images': { // Pour que les images marchent aussi
            target: 'http://localhost:205',
            changeOrigin: true,
            secure: false,
          }
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: './',
    };
});
