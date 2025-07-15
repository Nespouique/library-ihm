import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ShelfDetailDialog from '@/components/ShelfDetailDialog';
import FullscreenToggle from '@/components/FullscreenToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Upload, FileImage, Pencil, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { shelvesService, booksService, authorsService } from '@/services/api';
import {
    loadKubeDataFromSVG,
    getKubeDataSync,
    getAvailableKubeIds,
    forceReloadSVG,
    getUploadMethod,
    markAsDeleted,
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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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

            // Recharger les données du SVG (forcer le test après upload)
            const kubeData = await loadKubeDataFromSVG(true);

            // Si kubeData est null, cela signifie que le SVG est vide/invalide
            if (kubeData === null) {
                setKubeDataLoaded(false);
                setSvgFileExists(false);
            } else {
                setKubeDataLoaded(true);
                setSvgFileExists(true);
            }

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
            // Créer un FormData pour l'upload
            const formData = new FormData();
            formData.append('svg', file);

            // Déterminer la méthode HTTP selon l'état du fichier
            const method = getUploadMethod();

            // Envoyer le fichier SVG au backend
            const response = await fetch('/api/kubes', {
                method: method,
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                // Attendre un peu puis recharger les données
                setTimeout(async () => {
                    try {
                        await reloadKubeData();
                        toast({
                            title: 'Succès',
                            description:
                                'La visualisation a été mise à jour avec succès !',
                            variant: 'success',
                        });
                    } catch (reloadError) {
                        console.error(
                            'Erreur lors du rechargement:',
                            reloadError
                        );
                        throw reloadError;
                    }
                }, 300);
            } else {
                throw new Error(
                    result.error || 'Impossible de mettre à jour le fichier'
                );
            }
        } catch (error) {
            console.error("Erreur lors de l'upload:", error);
            toast({
                title: 'Erreur',
                description: `Erreur lors de l'upload: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
            // Réinitialiser l'input file
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    // Fonction pour déclencher la confirmation de suppression
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    // Fonction pour annuler la suppression
    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    // Fonction pour confirmer la suppression
    const handleConfirmDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await fetch('/api/kubes', {
                method: 'DELETE',
            });

            if (response.ok) {
                // Marquer le fichier comme supprimé pour que le prochain upload soit un POST
                markAsDeleted();
                setSvgFileExists(false);
                setKubeDataLoaded(false);
                setShowDeleteConfirm(false);

                toast({
                    title: 'Succès',
                    description:
                        'Le fichier kubes.svg a été supprimé avec succès !',
                    variant: 'success',
                });
            } else {
                const result = await response.json();
                throw new Error(
                    result.error || 'Impossible de supprimer le fichier'
                );
            }
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast({
                title: 'Erreur',
                description: `Erreur lors de la suppression: ${error.message}`,
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            try {
                // Charger les données du SVG en premier (forcer le test initial)
                const kubeData = await loadKubeDataFromSVG(true);

                // Si kubeData est null, cela signifie que le SVG est vide/invalide (cas normal)
                if (kubeData === null) {
                    console.log(
                        "Fichier SVG vide ou invalide (cache), affichage du composant d'upload"
                    );
                    setSvgFileExists(false);
                    setKubeDataLoaded(false);
                    // Charger quand même les étagères et livres
                    await Promise.all([loadShelves(), loadBooks()]);
                    return;
                }

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
                <div className="relative w-full group">
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

                    {/* Boutons flottants d'édition et suppression - visibles au survol */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="hidden">
                            <Label
                                htmlFor="svg-edit-upload"
                                className="sr-only"
                            >
                                Modifier le fichier SVG
                            </Label>
                            <Input
                                id="svg-edit-upload"
                                type="file"
                                accept=".svg,image/svg+xml"
                                onChange={handleFileUpload}
                                disabled={isUploading}
                                className="cursor-pointer"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() =>
                                    document
                                        .getElementById('svg-edit-upload')
                                        .click()
                                }
                                disabled={isUploading || isDeleting}
                                size="sm"
                                className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-lg backdrop-blur-sm rounded-full w-10 h-10 p-0"
                                title="Modifier le fichier SVG"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                                onClick={handleDeleteClick}
                                disabled={isUploading || isDeleting}
                                size="sm"
                                className="bg-red-500/90 hover:bg-red-500 text-white shadow-lg backdrop-blur-sm rounded-full w-10 h-10 p-0"
                                title="Supprimer le fichier SVG"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
                    </div>

                    <div className="mt-8 text-sm text-muted-foreground">
                        <h3 className="text-base font-semibold text-foreground mb-3">
                            Format requis :
                        </h3>
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
                        <p className="text-xs mt-4">
                            Vous pouvez utiliser le fichier{' '}
                            <a
                                href="/kubes_example.svg"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                kubes_example.svg
                            </a>{' '}
                            comme modèle de format.
                        </p>
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

            {/* Dialog de confirmation de suppression */}
            <Dialog
                open={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="text-center">
                        <DialogTitle className="main-title-text text-center pb-3 font-bold">
                            Êtes-vous sûr ?
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Vous êtes sur le point de supprimer le fichier{' '}
                            <em>kubes.svg</em>.
                            <br />
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center">
                        <Button
                            variant="outline"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Suppression...' : 'Confirmer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default KubesPage;
