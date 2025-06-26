import React, { useState, useEffect } from 'react';
import {
    installApp,
    enterFullscreen,
    exitFullscreen,
    isFullscreen,
    canInstallApp,
    isMobileOrTablet,
    isAppInstalled,
} from '@/lib/pwa';

const FullscreenToggle = () => {
    const [fullscreen, setFullscreen] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const [appInstalled, setAppInstalled] = useState(false);

    useEffect(() => {
        // Vérifier l'état initial
        setFullscreen(isFullscreen());
        setCanInstall(canInstallApp());
        setAppInstalled(isAppInstalled());

        // Vérifier l'état du plein écran
        const checkFullscreen = () => {
            setFullscreen(isFullscreen());
        };

        // Écouter les changements de plein écran
        document.addEventListener('fullscreenchange', checkFullscreen);
        document.addEventListener('webkitfullscreenchange', checkFullscreen);
        document.addEventListener('msfullscreenchange', checkFullscreen);

        // Écouter les événements PWA personnalisés
        const handleInstallPromptAvailable = () => {
            setCanInstall(true);
        };

        const handleAppInstalled = () => {
            setCanInstall(false);
            setAppInstalled(true);
        };

        window.addEventListener(
            'installpromptavailable',
            handleInstallPromptAvailable
        );
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            document.removeEventListener(
                'webkitfullscreenchange',
                checkFullscreen
            );
            document.removeEventListener('msfullscreenchange', checkFullscreen);
            window.removeEventListener(
                'installpromptavailable',
                handleInstallPromptAvailable
            );
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleFullscreenToggle = () => {
        if (fullscreen) {
            exitFullscreen();
        } else {
            enterFullscreen();
        }
    };

    const handleInstall = () => {
        installApp();
        setCanInstall(false);
    };

    // Ne pas afficher le composant si l'app est déjà installée
    if (appInstalled) {
        return null;
    }

    // Sur mobile/tablette, masquer le bouton plein écran quand on est en plein écran
    // Sur desktop, ne jamais afficher le bouton pour sortir du plein écran (Échap suffit)
    const shouldShowFullscreenButton = isMobileOrTablet()
        ? !fullscreen
        : !fullscreen;

    return (
        <div className="fixed bottom-8 left-8 flex flex-col gap-2 z-50">
            {/* Bouton plein écran - seulement pour entrer en plein écran */}
            {shouldShowFullscreenButton && (
                <button
                    onClick={handleFullscreenToggle}
                    className="w-14 h-14 bg-primary/90 hover:bg-primary text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
                    title="Mode plein écran"
                >
                    {/* Icône plein écran uniquement */}
                    <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 4L4 4L4 8M16 4L20 4L20 8M16 20L20 20L20 16M8 20L4 20L4 16"
                        />
                    </svg>
                </button>
            )}

            {/* Bouton installation PWA */}
            {canInstall && !appInstalled && (
                <button
                    onClick={handleInstall}
                    className="w-14 h-14 bg-green-500/90 hover:bg-green-500 text-white rounded-full shadow-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center"
                    title="Installer l'application"
                >
                    <svg
                        className="w-7 h-7"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default FullscreenToggle;
