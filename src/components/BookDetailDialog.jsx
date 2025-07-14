import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Info,
    SquareLibrary,
    Siren,
    BookOpen,
    Camera,
    Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { areKubesAvailable } from '@/lib/kubeUtils';
import { useTheme } from '@/hooks/useTheme';
import { booksService } from '@/services/api';

const BookDetailDialog = ({ book, open, onOpenChange, onUpdateBook }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [kubesAvailable, setKubesAvailable] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isUploadingJacket, setIsUploadingJacket] = useState(false);
    const [imageTimestamp, setImageTimestamp] = useState(Date.now()); // Pour forcer le rechargement
    const fileInputRef = useRef(null);
    const isDark = useTheme();
    const navigate = useNavigate();

    // Helper function to get jacket image URL from API
    const getImageUrl = (book, size = 'small') => {
        if (!book?.id || !book?.jacket) {
            return isDark
                ? '/dark-placeholder-book.svg'
                : '/light-placeholder-book.svg';
        }
        // Ajouter un timestamp pour forcer le rechargement après upload
        return `/api/books/${book.id}/jacket/${size}?t=${imageTimestamp}`;
    };

    // Vérifier la disponibilité des kubes quand le dialog s'ouvre
    useEffect(() => {
        if (open) {
            areKubesAvailable().then(setKubesAvailable);
        }
    }, [open]);

    // Réinitialiser l'état de chargement de l'image quand le livre change
    useEffect(() => {
        if (book?.id) {
            setImageLoaded(false);
        }
    }, [book?.id]);

    if (!book) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            return 'Date invalide :', error.message;
        }
    };

    // Fonction pour naviguer vers la page kubes avec le kube spécifique
    const handleKubeClick = () => {
        onOpenChange(false); // Fermer le dialog
        navigate(`/kubes?highlight=${book.shelfLocation}`);
    };

    // Fonction pour ouvrir le sélecteur de fichier
    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

    // Fonction pour gérer l'upload de la nouvelle jaquette
    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un fichier image.',
                variant: 'destructive',
            });
            return;
        }

        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'Erreur',
                description:
                    'Le fichier est trop volumineux. Taille maximum : 10MB.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploadingJacket(true);

        try {
            // Uploader l'image via l'API
            await booksService.uploadJacket(book.id, file);

            // Mettre à jour le timestamp pour forcer le rechargement de l'image
            setImageTimestamp(Date.now());

            // Forcer le rechargement de l'image en modifiant sa clé
            setImageLoaded(false);

            // Notification de succès
            toast({
                title: 'Succès',
                description: 'La couverture a été mise à jour avec succès.',
                variant: 'success',
            });

            // Optionnel : callback pour informer le parent qu'il faut recharger les données
            if (onUpdateBook) {
                onUpdateBook(book);
            }
        } catch (error) {
            console.error("Erreur lors de l'upload de la jaquette:", error);
            toast({
                title: 'Erreur',
                description:
                    'Impossible de mettre à jour la couverture. Veuillez réessayer.',
                variant: 'destructive',
            });
        } finally {
            setIsUploadingJacket(false);
            // Reset l'input file
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="main-title-text text-2xl">
                        {book.title}
                    </DialogTitle>
                    <DialogDescription>{book.author}</DialogDescription>
                </DialogHeader>

                <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {/* Layout carte d'identité : Image à gauche + Champs à droite */}
                    <div className="flex gap-4">
                        {/* Image à gauche - largeur automatique */}
                        <div className="flex-shrink-0 w-auto">
                            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden w-[117px] h-44 flex items-center justify-center relative group">
                                {!imageLoaded && (
                                    <Skeleton className="w-full h-full rounded-xl" />
                                )}
                                <img
                                    src={getImageUrl(book, 'small')}
                                    alt={`Couverture de ${book.title}`}
                                    className={`w-full h-full object-contain rounded-xl ${!imageLoaded ? 'hidden' : ''}`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={(e) => {
                                        // Changer la source vers le placeholder approprié selon le thème
                                        const placeholderPath = isDark
                                            ? '/dark-placeholder-book.svg'
                                            : '/light-placeholder-book.svg';

                                        if (
                                            e.target.src.includes(
                                                'placeholder-book.svg'
                                            )
                                        ) {
                                            setImageLoaded(true);
                                        } else {
                                            e.target.src = placeholderPath;
                                        }
                                    }}
                                />

                                {/* Bouton caméra flottant */}
                                <button
                                    onClick={handleCameraClick}
                                    disabled={isUploadingJacket}
                                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/80 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Changer la couverture"
                                >
                                    {isUploadingJacket ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </button>

                                {/* Input file caché */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                            {/* Lien "En savoir plus" */}
                            <div className="mt-2 text-center">
                                <a
                                    href={`https://www.google.com/search?q=Livre+${encodeURIComponent(book.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground underline text-sm italic transition-colors"
                                >
                                    En savoir plus...
                                </a>
                            </div>
                        </div>

                        {/* Champs à droite - 2/3 de la largeur */}
                        <div className="flex-1 space-y-3">
                            {/* ISBN en premier */}
                            {book.isbn && (
                                <div className="flex items-center">
                                    <Info className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                    <p>
                                        <span className="font-medium">
                                            ISBN :
                                        </span>{' '}
                                        {book.isbn}
                                    </p>
                                </div>
                            )}

                            {/* Date de parution en deuxième */}
                            <div className="flex items-center">
                                <CalendarDays className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                <p>
                                    <span className="font-medium">
                                        Date de parution :
                                    </span>{' '}
                                    {formatDate(book.publicationDate)}
                                </p>
                            </div>

                            {/* Nom de l'étagère en troisième avec icône SquareLibrary */}
                            {book.shelf && (
                                <div className="flex items-center">
                                    <SquareLibrary className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                    <p>
                                        <span className="font-medium">
                                            Étagère :
                                        </span>{' '}
                                        {book.shelf === 'Non classé' ? (
                                            <span>{book.shelf}</span>
                                        ) : book.shelfLocation &&
                                          kubesAvailable ? (
                                            <button
                                                onClick={handleKubeClick}
                                                className="text-primary underline hover:text-primary/80 transition-colors cursor-pointer"
                                            >
                                                {book.shelf}
                                            </button>
                                        ) : (
                                            <span>{book.shelf}</span>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Description en quatrième avec système de déploiement */}
                            {book.description && (
                                <div className="flex items-start">
                                    <BookOpen className="h-5 w-5 mr-3 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <span className="font-medium">
                                            Description :
                                        </span>{' '}
                                        <span className="text-muted-foreground">
                                            {isDescriptionExpanded
                                                ? book.description
                                                : `${book.description.slice(0, 100)}${book.description.length > 100 ? '...' : ''}`}
                                        </span>
                                        {book.description.length > 100 && (
                                            <button
                                                onClick={() =>
                                                    setIsDescriptionExpanded(
                                                        !isDescriptionExpanded
                                                    )
                                                }
                                                className="ml-2 text-primary hover:text-primary/80 transition-colors"
                                            >
                                                {isDescriptionExpanded ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Fermer
                    </Button>
                    <Button
                        onClick={() => {
                            // TODO: Implémenter la fonctionnalité de clignotement
                            console.log(
                                'Faire clignoter le livre:',
                                book.title
                            );
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Siren className="h-4 w-4 mr-2" />
                        Faire clignoter
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default BookDetailDialog;
