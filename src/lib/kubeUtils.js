// Cache pour stocker les données des kubes
let kubeDataCache = null;

// Cache d'état simplifié
const svgCache = {
    status: 'unknown', // 'unknown', 'valid', 'invalid_empty', 'invalid_notFound'
    data: null,
    lastChecked: null,
};

/**
 * Charge et parse le fichier SVG pour extraire les données des kubes
 * @param {boolean} force - Si true, ignore le cache et force un nouvel appel API
 */
export const loadKubeDataFromSVG = async (force = false) => {
    // Si on a déjà des données en cache et qu'on ne force pas, les retourner
    if (!force && svgCache.status === 'valid' && svgCache.data) {
        kubeDataCache = svgCache.data;
        return svgCache.data;
    }

    // Si on sait que le fichier est invalide et qu'on ne force pas, retourner null
    if (
        !force &&
        (svgCache.status === 'invalid_empty' ||
            svgCache.status === 'invalid_notFound')
    ) {
        return null;
    }

    try {
        const response = await fetch('/api/kubes');

        if (!response.ok) {
            if (response.status === 404) {
                // Fichier n'existe pas
                svgCache.status = 'invalid_notFound';
                svgCache.data = null;
                svgCache.lastChecked = new Date();
                console.log('Fichier SVG non trouvé (404)');
                return null;
            } else {
                // Autre erreur
                throw new Error(
                    `Erreur ${response.status}: ${response.statusText}`
                );
            }
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
            // Fichier existe mais est vide
            svgCache.status = 'invalid_empty';
            svgCache.data = null;
            svgCache.lastChecked = new Date();
            console.log('SVG vide ou sans kubes valides');
            return null;
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

        // Fichier valide avec des kubes
        svgCache.status = 'valid';
        svgCache.data = kubeData;
        svgCache.lastChecked = new Date();
        kubeDataCache = kubeData;
        return kubeData;
    } catch (error) {
        console.error('Erreur lors du chargement du SVG:', error);
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
    svgCache.status = 'unknown';
    svgCache.data = null;
    svgCache.lastChecked = null;
};

/**
 * Force le rechargement du SVG en ignorant le cache
 * À utiliser après un upload ou suppression réussi
 */
export const forceReloadSVG = () => {
    kubeDataCache = null;
    svgCache.status = 'unknown';
    svgCache.data = null;
    svgCache.lastChecked = null;
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
    // Si on a déjà un état en cache, l'utiliser
    if (svgCache.status === 'valid') {
        return getTotalKubeCount() > 0;
    }

    if (
        svgCache.status === 'invalid_empty' ||
        svgCache.status === 'invalid_notFound'
    ) {
        return false;
    }

    try {
        const result = await loadKubeDataFromSVG();
        return result !== null && getTotalKubeCount() > 0;
    } catch (error) {
        console.log('SVG non disponible:', error.message);
        return false;
    }
};

/**
 * Version synchrone pour vérifier si les kubes sont disponibles
 */
export const areKubesAvailableSync = () => {
    return svgCache.status === 'valid' && getTotalKubeCount() > 0;
};

/**
 * Obtient la méthode HTTP à utiliser pour l'upload du SVG
 * @returns {'POST'|'PUT'} - POST si le fichier n'existe pas, PUT s'il existe
 */
export const getUploadMethod = () => {
    // POST seulement si le fichier n'existe pas (404)
    if (svgCache.status === 'invalid_notFound') {
        return 'POST';
    }

    // PUT si le fichier existe (valide ou vide)
    return 'PUT';
};

/**
 * Vérifie si les données des kubes sont déjà chargées et valides
 * Utilisé pour éviter les appels API inutiles dans les dialogues
 */
export const areKubeDataAlreadyLoaded = () => {
    return svgCache.status === 'valid' && kubeDataCache !== null;
};

/**
 * Version optimisée pour les dialogues - ne recharge pas si les données sont déjà valides
 */
export const getKubeDataForDialogs = () => {
    if (areKubeDataAlreadyLoaded()) {
        return kubeDataCache;
    }
    return null;
};

/**
 * Marque le fichier comme supprimé (après une suppression réussie)
 * À utiliser après un DELETE réussi
 */
export const markAsDeleted = () => {
    kubeDataCache = null;
    svgCache.status = 'invalid_notFound';
    svgCache.data = null;
    svgCache.lastChecked = new Date();
};
