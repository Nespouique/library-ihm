import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Info,
    SquareLibrary,
    Siren,
    BookOpen,
} from 'lucide-react';

// Helper function to get jacket image URL from API
const getImageUrl = (book, size = 'small') => {
    if (!book?.id || !book?.jacket) return '/placeholder-book.svg';
    return `/api/books/${book.id}/jacket/${size}`;
};

const BookDetailDialog = ({ book, open, onOpenChange, onUpdateBook }) => {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
            return 'Date invalide';
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
                            <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                                <img
                                    src={getImageUrl(book, 'small')}
                                    alt={`Couverture de ${book.title}`}
                                    className="h-auto max-h-44 object-contain rounded-lg"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-book.svg';
                                    }}
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
                                        {book.shelf}
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
