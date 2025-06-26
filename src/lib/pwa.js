// PWA et mode plein écran
let deferredPrompt;
let installPromptEventFired = false;

// Gestion de l'installation PWA
window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher l'affichage automatique du prompt
    e.preventDefault();
    // Stocker l'événement pour l'utiliser plus tard
    deferredPrompt = e;
    installPromptEventFired = true;

    // Déclencher un événement personnalisé pour notifier les composants
    window.dispatchEvent(new CustomEvent('installpromptavailable'));

    console.log('Application peut être installée');
});

// Gestion de l'installation réussie
window.addEventListener('appinstalled', (evt) => {
    console.log('Application installée avec succès');
    deferredPrompt = null;
    installPromptEventFired = false;

    // Déclencher un événement personnalisé
    window.dispatchEvent(new CustomEvent('appinstalled'));
});

// Fonction pour vérifier si l'installation est possible
export const canInstallApp = () => {
    return installPromptEventFired && deferredPrompt !== null;
};

// Fonction pour installer l'application
export const installApp = async () => {
    if (deferredPrompt) {
        // Afficher le prompt d'installation
        deferredPrompt.prompt();

        // Attendre la réponse de l'utilisateur
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log("Utilisateur a accepté l'installation");
        } else {
            console.log("Utilisateur a refusé l'installation");
        }

        deferredPrompt = null;
        installPromptEventFired = false;
    }
};

// Fonction pour forcer le mode plein écran
export const enterFullscreen = () => {
    const elem = document.documentElement;

    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        // IE/Edge
        elem.msRequestFullscreen();
    }
};

// Fonction pour sortir du mode plein écran
export const exitFullscreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        // IE/Edge
        document.msExitFullscreen();
    }
};

// Détection du mode plein écran
export const isFullscreen = () => {
    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
    );
};

// Détection mobile/tablette simplifiée
export const isMobileOrTablet = () => {
    return navigator.maxTouchPoints > 0;
};

// Vérifier si l'app est déjà installée (PWA)
export const isAppInstalled = () => {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.navigator.standalone === true
    );
};
