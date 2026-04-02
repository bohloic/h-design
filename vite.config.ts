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
            target: 'http://127.0.0.1:205', // L'adresse de ton backend (IP directe)
            changeOrigin: true,
            secure: false,
          },
          '/images': { 
            target: 'http://127.0.0.1:205',
            changeOrigin: true,
            secure: false,
          }
        },
      },
      plugins: [
        react()
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      base: './',
    };
});
