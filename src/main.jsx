import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
        // Rechargement automatique silencieux quand une nouvelle version est disponible
        updateSW(true);
    },
    onOfflineReady() {
        console.log('App prête à fonctionner hors ligne');
    },
});

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
