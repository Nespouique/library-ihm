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

    // Empêcher le rafraîchissement de la page pendant l'upload
    useEffect(() => {
        if (isUploadingJacket) {
            const handleBeforeUnload = (e) => {
                e.preventDefault();
                e.returnValue = '';
                return '';
            };

            window.addEventListener('beforeunload', handleBeforeUnload);
            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [isUploadingJacket]);

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

    // Fonction pour corriger l'orientation de l'image basée sur les métadonnées EXIF
    const correctImageOrientation = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Lire les métadonnées EXIF pour l'orientation
                    const getOrientation = (buffer) => {
                        try {
                            const view = new DataView(buffer);

                            // Vérifier si c'est un JPEG et si on a assez de données
                            if (
                                view.byteLength < 2 ||
                                view.getUint16(0, false) !== 0xffd8
                            ) {
                                return 1; // Pas un JPEG ou données insuffisantes
                            }

                            let offset = 2;
                            let marker;

                            while (offset < view.byteLength - 1) {
                                // Vérifier qu'on peut lire le marker
                                if (offset + 2 > view.byteLength) break;

                                marker = view.getUint16(offset, false);
                                offset += 2;

                                if (marker === 0xffe1) {
                                    // EXIF marker
                                    // Vérifier qu'on peut lire la taille du segment
                                    if (offset + 2 > view.byteLength) break;
                                    const segmentSize = view.getUint16(
                                        offset,
                                        false
                                    );

                                    // Vérifier qu'on a assez de données pour le segment EXIF
                                    if (
                                        offset + segmentSize >
                                            view.byteLength ||
                                        offset + 14 > view.byteLength
                                    )
                                        break;

                                    // Vérifier la signature EXIF
                                    if (offset + 6 > view.byteLength) break;
                                    const exifSignature = view.getUint32(
                                        offset + 2,
                                        false
                                    );
                                    if (exifSignature !== 0x45786966) {
                                        // "Exif"
                                        offset += segmentSize;
                                        continue;
                                    }

                                    // Lire l'endianness
                                    if (offset + 8 > view.byteLength) break;
                                    const little =
                                        view.getUint16(offset + 6, false) ===
                                        0x4949;

                                    // Lire l'offset IFD
                                    if (offset + 12 > view.byteLength) break;
                                    const ifdOffset = view.getUint32(
                                        offset + 10,
                                        little
                                    );

                                    // Vérifier que l'IFD est dans les limites
                                    if (
                                        offset + 14 + ifdOffset + 2 >
                                        view.byteLength
                                    )
                                        break;

                                    const tags = view.getUint16(
                                        offset + 14 + ifdOffset,
                                        little
                                    );

                                    // Parcourir les tags
                                    for (let i = 0; i < tags; i++) {
                                        const tagOffset =
                                            offset +
                                            14 +
                                            ifdOffset +
                                            2 +
                                            i * 12;

                                        // Vérifier qu'on peut lire ce tag
                                        if (tagOffset + 12 > view.byteLength)
                                            break;

                                        const tag = view.getUint16(
                                            tagOffset,
                                            little
                                        );
                                        if (tag === 0x0112) {
                                            // Orientation tag
                                            return view.getUint16(
                                                tagOffset + 8,
                                                little
                                            );
                                        }
                                    }
                                    break; // On a trouvé l'EXIF mais pas l'orientation
                                }

                                if (marker === 0xffda) break; // Start of scan

                                // Passer au segment suivant
                                if (offset + 2 > view.byteLength) break;
                                const segmentSize = view.getUint16(
                                    offset,
                                    false
                                );
                                offset += segmentSize;
                            }

                            return 1; // Pas d'orientation trouvée
                        } catch (error) {
                            console.warn(
                                'Erreur lors de la lecture des métadonnées EXIF:',
                                error
                            );
                            return 1; // Orientation par défaut en cas d'erreur
                        }
                    };

                    const orientation = getOrientation(e.target.result);
                    console.log('Image orientation:', orientation);

                    let { width, height } = img;

                    // Ajuster les dimensions selon l'orientation
                    if (orientation > 4) {
                        [width, height] = [height, width];
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Appliquer la transformation selon l'orientation
                    switch (orientation) {
                        case 2:
                            ctx.transform(-1, 0, 0, 1, width, 0);
                            break;
                        case 3:
                            ctx.transform(-1, 0, 0, -1, width, height);
                            break;
                        case 4:
                            ctx.transform(1, 0, 0, -1, 0, height);
                            break;
                        case 5:
                            ctx.transform(0, 1, 1, 0, 0, 0);
                            break;
                        case 6:
                            ctx.transform(0, 1, -1, 0, height, 0);
                            break;
                        case 7:
                            ctx.transform(0, -1, -1, 0, height, width);
                            break;
                        case 8:
                            ctx.transform(0, -1, 1, 0, 0, width);
                            break;
                    }

                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(
                        (blob) => {
                            const correctedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });
                            resolve(correctedFile);
                        },
                        file.type,
                        0.9
                    ); // Qualité 90%
                };
                img.src = URL.createObjectURL(file);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // Fonction pour ouvrir le sélecteur de fichier
    const handleCameraClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Camera button clicked');
        fileInputRef.current?.click();
    };

    // Fonction pour gérer l'upload de la nouvelle jaquette
    const handleFileChange = async (event) => {
        // Empêcher la propagation et le comportement par défaut
        event.preventDefault();
        event.stopPropagation();

        const originalFile = event.target.files?.[0];
        console.log('File selected:', originalFile);

        if (!originalFile) {
            console.log('No file selected');
            return;
        }

        console.log('Original file details:', {
            name: originalFile.name,
            size: originalFile.size,
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });

        // Vérifier le type de fichier
        if (!originalFile.type.startsWith('image/')) {
            console.error('Invalid file type:', originalFile.type);
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un fichier image.',
                variant: 'destructive',
            });
            return;
        }

        // Vérifier la taille du fichier (max 10MB)
        if (originalFile.size > 10 * 1024 * 1024) {
            console.error('File too large:', originalFile.size);
            toast({
                title: 'Erreur',
                description:
                    'Le fichier est trop volumineux. Taille maximum : 10MB.',
                variant: 'destructive',
            });
            return;
        }

        console.log('Starting upload...');
        setIsUploadingJacket(true);

        try {
            // Corriger l'orientation de l'image
            console.log('Correcting image orientation...');
            const correctedFile = await correctImageOrientation(originalFile);
            console.log('Corrected file details:', {
                name: correctedFile.name,
                size: correctedFile.size,
                type: correctedFile.type,
            });

            // Uploader l'image corrigée via l'API
            console.log('Uploading corrected file to API...');
            await booksService.uploadJacket(book.id, correctedFile);
            console.log('Upload successful');

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
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });

            // Message d'erreur plus détaillé
            let errorMessage =
                'Impossible de mettre à jour la couverture. Veuillez réessayer.';

            if (error.message.includes('timeout')) {
                errorMessage =
                    'Le téléchargement a pris trop de temps. Vérifiez votre connexion.';
            } else if (error.message.includes('network')) {
                errorMessage =
                    'Problème de connexion réseau. Vérifiez votre connexion.';
            } else if (error.message.includes('413')) {
                errorMessage =
                    'Le fichier est trop volumineux pour le serveur.';
            }

            toast({
                title: 'Erreur',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            console.log('Upload finished, cleaning up...');
            setIsUploadingJacket(false);
            // Reset l'input file de manière plus agressive
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
                // Forcer le re-render du composant input
                fileInputRef.current.type = 'text';
                fileInputRef.current.type = 'file';
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
