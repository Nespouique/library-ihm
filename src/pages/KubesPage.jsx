import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ShelfDetailDialog from '@/components/ShelfDetailDialog';
import FullscreenToggle from '@/components/FullscreenToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileImage } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { shelvesService, booksService, authorsService } from '@/services/api';
import {
    loadKubeDataFromSVG,
    getKubeDataSync,
    getAvailableKubeIds,
    forceReloadSVG,
} from '@/lib/kubeUtils';

const KubesPage = () => {
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [books, setBooks] = useState([]);
    const [selectedShelf, setSelectedShelf] = useState(null);
    const [selectedShelfBooks, setSelectedShelfBooks] = useState([]);
    const [highlightedKube, setHighlightedKube] = useState(null);
    const [kubeDataLoaded, setKubeDataLoaded] = useState(false);
    const [svgFileExists, setSvgFileExists] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    // Charger les livres depuis l'API
    const loadBooks = async () => {
        try {
            // Charger les livres et les auteurs en parallèle
            const [booksResponse, authorsResponse] = await Promise.all([
                booksService.getBooks(1),
                authorsService.getAuthors(1),
            ]);

            // Créer un mapping ID auteur -> nom complet auteur
            const authorsMap = {};
            authorsResponse.forEach((author) => {
                authorsMap[author.id] =
                    `${author.firstName} ${author.lastName}`;
            });

            const transformedBooks = booksResponse.map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author
                    ? authorsMap[book.author] || book.author
                    : 'Auteur inconnu',
                shelf: book.shelf,
                isbn: book.isbn,
                description: book.description,
                publicationDate: book.date,
                coverUrl: book.jacket || '',
                status: 'unread',
            }));

            setBooks(transformedBooks);
        } catch (error) {
            console.error('Erreur lors du chargement des livres:', error);
            setError('Erreur lors du chargement des livres');
        }
    };

    // Charger les étagères depuis l'API
    const loadShelves = useCallback(async () => {
        try {
            setLoading(true);
            const response = await shelvesService.getShelves();
            setShelves(response);
            setError(null);
        } catch (error) {
            console.error('Erreur lors du chargement des étagères:', error);
            setError('Erreur lors du chargement des étagères');
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les étagères.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Fonction pour recharger toutes les données des kubes
    const reloadKubeData = useCallback(async () => {
        try {
            // Forcer le rechargement en ignorant le cache d'état
            forceReloadSVG();

            // Recharger les données du SVG
            await loadKubeDataFromSVG();
            setKubeDataLoaded(true);
            setSvgFileExists(true);

            // Recharger les étagères et livres
            await Promise.all([loadShelves(), loadBooks()]);

            console.log('Données des kubes rechargées avec succès');
        } catch (error) {
            console.error(
                'Erreur lors du rechargement des données des kubes:',
                error
            );
            throw error;
        }
    }, [loadShelves]);

    // Fonction pour gérer l'upload du fichier SVG
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Vérifier que c'est bien un fichier SVG
        if (
            !file.type.includes('svg') &&
            !file.name.toLowerCase().endsWith('.svg')
        ) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un fichier SVG.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);

        try {
            // Lire le contenu du fichier SVG
            const svgContent = await file.text();

            // Remplacer le contenu du fichier kubes.svg existant
            try {
                const response = await fetch('/api/update-kubes-svg', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'image/svg+xml',
                    },
                    body: svgContent,
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Attendre un peu pour que le fichier soit écrit, puis recharger
                    setTimeout(async () => {
                        try {
                            // Forcer le rechargement des données
                            await reloadKubeData();

                            toast({
                                title: 'Succès',
                                description:
                                    'Le fichier kubes.svg a été mis à jour avec succès !',
                                variant: 'success',
                            });
                        } catch (reloadError) {
                            console.error(
                                'Erreur lors du rechargement:',
                                reloadError
                            );
                            toast({
                                title: 'Fichier mis à jour',
                                description:
                                    'Le fichier a été mis à jour. Rechargement en cours...',
                                variant: 'default',
                            });

                            // En cas d'échec du rechargement, essayer une fois de plus après un délai plus long
                            setTimeout(async () => {
                                try {
                                    await reloadKubeData();
                                    toast({
                                        title: 'Succès',
                                        description:
                                            'Données rechargées avec succès !',
                                        variant: 'default',
                                    });
                                } catch (secondReloadError) {
                                    console.error(
                                        'Deuxième tentative de rechargement échouée:',
                                        secondReloadError
                                    );
                                    toast({
                                        title: 'Rechargement nécessaire',
                                        description:
                                            'Veuillez actualiser la page pour voir les changements.',
                                        variant: 'default',
                                    });
                                }
                            }, 1000);
                        }
                    }, 300);
                } else {
                    throw new Error(
                        result.error || 'Impossible de mettre à jour le fichier'
                    );
                }
            } catch (fetchError) {
                console.log(
                    'API de mise à jour non disponible, utilisation du téléchargement...',
                    fetchError.message
                );

                // Fallback : téléchargement automatique
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = 'kubes.svg';
                link.style.display = 'none';
                document.body.appendChild(link);

                toast({
                    title: 'Fichier téléchargé',
                    description:
                        'Le fichier kubes.svg a été téléchargé. Placez-le dans public/kubes.svg puis cliquez sur "Actualiser" ci-dessous.',
                    variant: 'default',
                });

                link.click();

                // Nettoyer
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Ajouter un message pour indiquer qu'un rechargement automatique sera tenté
                setTimeout(async () => {
                    toast({
                        title: 'Tentative de rechargement automatique...',
                        description:
                            'Essai de rechargement des données après remplacement du fichier.',
                        variant: 'default',
                    });

                    try {
                        await reloadKubeData();
                        toast({
                            title: 'Succès',
                            description:
                                'Données rechargées automatiquement avec succès !',
                            variant: 'default',
                        });
                    } catch {
                        toast({
                            title: 'Rechargement manuel nécessaire',
                            description:
                                'Impossible de recharger automatiquement. Veuillez actualiser la page.',
                            variant: 'default',
                        });
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Erreur lors du traitement du fichier:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de traiter le fichier SVG.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            // Reset l'input file
            event.target.value = '';
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            try {
                // Charger les données du SVG en premier
                await loadKubeDataFromSVG();
                setKubeDataLoaded(true);
                setSvgFileExists(true);

                // Puis charger les autres données
                await Promise.all([loadShelves(), loadBooks()]);
            } catch (error) {
                console.error(
                    "Erreur lors de l'initialisation des données:",
                    error
                );

                // Si c'est une erreur liée au fichier SVG vide ou invalide
                if (
                    error.message?.includes('404') ||
                    error.message?.includes('Erreur 404') ||
                    error.message?.includes(
                        'ne contient aucun groupe kube valide'
                    ) ||
                    error.name === 'TypeError' ||
                    error.message?.includes('Failed to fetch')
                ) {
                    console.log(
                        "Fichier SVG vide ou invalide, affichage du composant d'upload"
                    );
                    setSvgFileExists(false);
                    setKubeDataLoaded(false);
                    // Charger quand même les étagères et livres
                    try {
                        await Promise.all([loadShelves(), loadBooks()]);
                    } catch (loadError) {
                        console.error(
                            'Erreur lors du chargement des données secondaires:',
                            loadError
                        );
                    }
                } else {
                    setError('Erreur lors du chargement des données');
                }
            }
        };

        initializeData();
    }, [loadShelves]);

    // Gérer le paramètre highlight pour faire clignoter un kube spécifique
    useEffect(() => {
        const highlight = searchParams.get('highlight');
        if (highlight && kubeDataLoaded) {
            // Format attendu : "kube1", "kube2", etc.
            const availableKubes = getAvailableKubeIds();
            if (availableKubes.includes(highlight)) {
                setHighlightedKube(highlight); // Stocker directement "kube1"
            }
        }
    }, [searchParams, setSearchParams, kubeDataLoaded]);

    // Arrêter le clignotement et nettoyer l'URL quand un dialog s'ouvre (interaction utilisateur)
    useEffect(() => {
        if (selectedShelf) {
            setHighlightedKube(null);

            // Nettoyer le paramètre URL lors de l'ouverture du dialog
            const highlight = searchParams.get('highlight');
            if (highlight) {
                const newSearchParams = new URLSearchParams(searchParams);
                newSearchParams.delete('highlight');
                setSearchParams(newSearchParams, { replace: true });
            }
        }
    }, [selectedShelf, searchParams, setSearchParams]);

    // Mapper les kubes aux étagères en utilisant shelf.location
    const getShelfByKubeLocation = (kubeId) => {
        return shelves.find((shelf) => shelf.location === kubeId);
    };

    // Gérer le clic sur un kube
    const handleKubeClick = (kubeId) => {
        const shelf = getShelfByKubeLocation(kubeId);
        if (shelf) {
            setSelectedShelf(shelf);
            // Filtrer les livres pour cette étagère
            const shelfBooks = books.filter((book) => book.shelf === shelf.id);
            setSelectedShelfBooks(shelfBooks);
        } else {
            // Afficher un toast si aucune étagère n'est associée à ce kube
            toast({
                title: 'Emplacement libre',
                description: 'Aucune étagère ne pointe vers cet emplacement',
                variant: 'default',
            });
        }
    };

    // Fonction pour rendre le SVG avec les gestionnaires de clic
    const renderInteractiveSVG = () => {
        return (
            <div className="w-full">
                <div className="relative w-full">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1659 812"
                        className="w-full h-auto"
                        style={{ minHeight: '60vh', maxHeight: '75vh' }}
                    >
                        <g id="kubes">
                            {/* Générer tous les kubes dynamiquement en fonction du contenu du SVG */}
                            {kubeDataLoaded &&
                                getAvailableKubeIds().map((kubeId) => {
                                    const isHighlighted =
                                        highlightedKube === kubeId;

                                    // Coordonnées et dimensions pour chaque kube (chargées dynamiquement depuis le SVG)
                                    const kubeData = getKubeDataSync(kubeId);
                                    if (!kubeData) return null;

                                    return (
                                        <g key={kubeId} id={kubeId}>
                                            <rect
                                                id={`outer-${kubeId}`}
                                                className="cls-1"
                                                x={kubeData.outer.x}
                                                y={kubeData.outer.y}
                                                width={kubeData.outer.width}
                                                height={kubeData.outer.height}
                                            />
                                            <rect
                                                className={`${kubeData.innerClass} kube-inner ${isHighlighted ? 'kube-highlighted' : ''}`}
                                                x={kubeData.inner.x}
                                                y={kubeData.inner.y}
                                                width={kubeData.inner.width}
                                                height={kubeData.inner.height}
                                                onClick={() =>
                                                    handleKubeClick(kubeId)
                                                }
                                            />
                                            {/* Texte du numéro du kube */}
                                            <text
                                                x={
                                                    kubeData.inner.x +
                                                    kubeData.inner.width / 2
                                                }
                                                y={
                                                    kubeData.inner.y +
                                                    kubeData.inner.height / 2
                                                }
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontSize="18"
                                                fontWeight="bold"
                                                fill="#000"
                                                pointerEvents="none"
                                            >
                                                {kubeId.replace('kube', '')}
                                            </text>
                                        </g>
                                    );
                                })}
                        </g>
                    </svg>
                </div>
            </div>
        );
    };

    // Composant pour l'upload du fichier SVG
    const renderUploadComponent = () => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto"
            >
                <div className="bg-card border border-border rounded-xl shadow-lg p-8 text-center">
                    <div className="mb-6">
                        <FileImage className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-2xl font-bold main-title-text mb-2">
                            Fichier SVG requis
                        </h2>
                        <p className="text-muted-foreground">
                            Le fichier <code>kubes.svg</code> est vide ou ne
                            contient pas de données valides. Veuillez
                            sélectionner un fichier SVG valide pour remplacer le
                            contenu.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="hidden">
                            <Label htmlFor="svg-upload" className="sr-only">
                                Sélectionner un fichier SVG
                            </Label>
                            <Input
                                id="svg-upload"
                                type="file"
                                accept=".svg,image/svg+xml"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="cursor-pointer"
                            />
                        </div>

                        <Button
                            onClick={() =>
                                document.getElementById('svg-upload').click()
                            }
                            disabled={isUploading}
                            className="w-full"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploading
                                ? 'Traitement en cours...'
                                : 'Choisir un fichier SVG'}
                        </Button>

                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="w-full"
                        >
                            Actualiser la page
                        </Button>
                    </div>

                    <div className="mt-6 text-sm text-muted-foreground">
                        <p className="mb-2">Format requis :</p>
                        <ul className="text-left space-y-1">
                            <li>• Fichier au format SVG</li>
                            <li>
                                • Contenant des groupes avec des IDs comme
                                "kube1", "kube2", etc.
                            </li>
                            <li>
                                • Chaque groupe doit contenir des rectangles
                                avec IDs "outer-kubeX" et "inner-kubeX"
                            </li>
                        </ul>
                    </div>
                </div>
            </motion.div>
        );
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Chargement...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-red-500">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold main-title-text">
                    Disposition des Étagères
                </h1>
            </div>

            {!svgFileExists ? (
                renderUploadComponent()
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full"
                >
                    {renderInteractiveSVG()}

                    {/* Dialog pour afficher les détails de l'étagère */}
                    <ShelfDetailDialog
                        shelf={selectedShelf}
                        books={selectedShelfBooks}
                        open={!!selectedShelf}
                        onOpenChange={(open) => {
                            if (!open) {
                                setSelectedShelf(null);
                                setSelectedShelfBooks([]);
                            }
                        }}
                    />
                </motion.div>
            )}

            {/* Bouton plein écran */}
            <FullscreenToggle />
        </div>
    );
};

export default KubesPage;
