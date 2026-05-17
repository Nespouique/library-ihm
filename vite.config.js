import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true,
            },
            manifest: {
                name: 'Kubothèque',
                short_name: 'Kubothèque',
                description: 'Application de gestion de bibliothèque',
                start_url: '/',
                display: 'fullscreen',
                orientation: 'any',
                theme_color: '#000000',
                background_color: '#ffffff',
                icons: [
                    {
                        src: 'kube_icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                    },
                    {
                        src: 'kube_icon@2x.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                ],
                scope: '/',
                categories: ['productivity', 'utilities'],
            },
            manifestFilename: 'manifest.json',
        }),
    ],
    server: {
        host: '0.0.0.0', // Écouter sur toutes les interfaces réseau
        port: 5173, // Port explicite
        cors: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
            },
        },
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
});
