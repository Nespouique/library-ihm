import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
    plugins: [
        react(),
        // Plugin personnalisé pour gérer la mise à jour du fichier kubes.svg
        {
            name: 'svg-updater',
            configureServer(server) {
                server.middlewares.use(
                    '/api/update-kubes-svg',
                    (req, res, next) => {
                        if (req.method === 'PUT') {
                            let body = '';
                            req.on('data', (chunk) => {
                                body += chunk.toString();
                            });
                            req.on('end', () => {
                                try {
                                    const svgPath = path.join(
                                        process.cwd(),
                                        'public',
                                        'kubes.svg'
                                    );
                                    fs.writeFileSync(svgPath, body, 'utf8');
                                    res.writeHead(200, {
                                        'Content-Type': 'application/json',
                                    });
                                    res.end(
                                        JSON.stringify({
                                            success: true,
                                            message:
                                                'Fichier mis à jour avec succès',
                                        })
                                    );
                                } catch (error) {
                                    res.writeHead(500, {
                                        'Content-Type': 'application/json',
                                    });
                                    res.end(
                                        JSON.stringify({
                                            success: false,
                                            error: error.message,
                                        })
                                    );
                                }
                            });
                        } else {
                            next();
                        }
                    }
                );
            },
        },
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
    // Génération du manifest pour PWA
    publicDir: 'public',
});
