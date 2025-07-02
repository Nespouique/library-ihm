import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Écouter sur toutes les interfaces réseau
        port: 5173, // Port explicite
        cors: true,
        headers: {
            'Cross-Origin-Embedder-Policy': 'credentialless',
        },
        allowedHosts: true,
    },
    resolve: {
        extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            external: [
                '@babel/parser',
                '@babel/traverse',
                '@babel/generator',
                '@babel/types',
            ],
        },
    },
    // Configuration PWA pour le mode plein écran
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    // Génération du manifest pour PWA
    publicDir: 'public',
});
