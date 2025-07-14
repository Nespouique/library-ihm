// Cache pour stocker les données des kubes
let kubeDataCache = null;

// Cache d'état pour éviter de recharger un SVG vide
const svgState = {
    isValid: null, // null = pas encore testé, true = valide, false = vide/invalide
    lastChecked: null,
};

/**
 * Charge et parse le fichier SVG pour extraire les données des kubes
 */
export const loadKubeDataFromSVG = async () => {
    if (kubeDataCache) {
        return kubeDataCache;
    }

    // Si on sait déjà que le SVG est invalide, ne pas réessayer
    if (svgState.isValid === false) {
        throw new Error(
            'Le fichier SVG ne contient aucun groupe kube valide (cache)'
        );
    }

    try {
        const response = await fetch('/kubes.svg');

        if (!response.ok) {
            throw new Error(
                `Erreur ${response.status}: ${response.statusText}`
            );
        }

        const svgText = await response.text();

        // Parser le SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

        const kubeData = {};

        // Trouver tous les groupes kube dans le SVG
        const kubeGroups = svgDoc.querySelectorAll('g[id^="kube"]');

        // Vérifier si le SVG contient des kubes valides
        if (kubeGroups.length === 0) {
            // Marquer le SVG comme invalide dans le cache
            svgState.isValid = false;
            svgState.lastChecked = new Date();
            throw new Error(
                'Le fichier SVG ne contient aucun groupe kube valide'
            );
        }

        kubeGroups.forEach((kubeGroup) => {
            const kubeId = kubeGroup.id; // ex: "kube1"

            const outerRect = kubeGroup.querySelector(`#outer-${kubeId}`);
            const innerRect = kubeGroup.querySelector(`#inner-${kubeId}`);

            if (outerRect && innerRect) {
                kubeData[kubeId] = {
                    outer: {
                        x: parseFloat(outerRect.getAttribute('x')),
                        y: parseFloat(outerRect.getAttribute('y')),
                        width: parseFloat(outerRect.getAttribute('width')),
                        height: parseFloat(outerRect.getAttribute('height')),
                    },
                    inner: {
                        x: parseFloat(innerRect.getAttribute('x')),
                        y: parseFloat(innerRect.getAttribute('y')),
                        width: parseFloat(innerRect.getAttribute('width')),
                        height: parseFloat(innerRect.getAttribute('height')),
                    },
                    innerClass: innerRect.getAttribute('class'),
                };
            }
        });
        //console.log('Nb de kubes:', kubeGroups.length);

        // Marquer le SVG comme valide dans le cache
        svgState.isValid = true;
        svgState.lastChecked = new Date();

        kubeDataCache = kubeData;
        return kubeData;
    } catch (error) {
        // Si c'est une erreur de parsing ou de contenu, marquer comme invalide
        if (
            error.message.includes('ne contient aucun groupe kube valide') ||
            error.message.includes('Failed to fetch') ||
            error.status === 404
        ) {
            svgState.isValid = false;
            svgState.lastChecked = new Date();
        }

        console.error('Erreur lors du chargement du SVG:', error);
        // Propager l'erreur au lieu de retourner un objet vide
        throw error;
    }
};

/**
 * Obtient les données d'un kube spécifique
 */
export const getKubeData = async (kubeId) => {
    const allKubeData = await loadKubeDataFromSVG();
    return allKubeData[kubeId] || null;
};

/**
 * Version synchrone qui utilise le cache (à utiliser après avoir appelé loadKubeDataFromSVG)
 */
export const getKubeDataSync = (kubeId) => {
    if (!kubeDataCache) {
        console.warn(
            "Les données des kubes ne sont pas encore chargées. Appelez loadKubeDataFromSVG() d'abord."
        );
        return null;
    }
    return kubeDataCache[kubeId] || null;
};

/**
 * Réinitialise le cache (utile pour le développement)
 */
export const clearKubeDataCache = () => {
    kubeDataCache = null;
    // Réinitialiser aussi l'état SVG pour permettre un nouveau test
    svgState.isValid = null;
    svgState.lastChecked = null;
};

/**
 * Force le rechargement du SVG en ignorant le cache d'état
 * À utiliser après un upload réussi
 */
export const forceReloadSVG = () => {
    kubeDataCache = null;
    svgState.isValid = null;
    svgState.lastChecked = null;
};

/**
 * Obtient la liste des IDs de kubes disponibles dans le SVG
 */
export const getAvailableKubeIds = () => {
    if (!kubeDataCache) {
        console.warn(
            "Les données des kubes ne sont pas encore chargées. Appelez loadKubeDataFromSVG() d'abord."
        );
        return [];
    }
    return Object.keys(kubeDataCache).sort((a, b) => {
        // Trier par numéro pour garder l'ordre logique (kube1, kube2, kube10, kube40, etc.)
        const numA = parseInt(a.replace('kube', ''), 10);
        const numB = parseInt(b.replace('kube', ''), 10);
        return numA - numB;
    });
};

/**
 * Obtient le nombre total de kubes disponibles
 */
export const getTotalKubeCount = () => {
    return getAvailableKubeIds().length;
};

/**
 * Vérifie si les kubes sont disponibles (fichier SVG renseigné et valide)
 */
export const areKubesAvailable = async () => {
    // Si on sait déjà que le SVG est invalide, retourner false directement
    if (svgState.isValid === false) {
        return false;
    }

    // Si on a déjà des données en cache et que le SVG est valide, retourner true
    if (svgState.isValid === true && kubeDataCache) {
        return getTotalKubeCount() > 0;
    }

    try {
        await loadKubeDataFromSVG();
        return getTotalKubeCount() > 0;
    } catch {
        return false;
    }
};

/**
 * Version synchrone pour vérifier si les kubes sont disponibles
 */
export const areKubesAvailableSync = () => {
    // Si on sait que le SVG est invalide, retourner false
    if (svgState.isValid === false) {
        return false;
    }

    if (!kubeDataCache) {
        return false;
    }
    return getTotalKubeCount() > 0;
};
