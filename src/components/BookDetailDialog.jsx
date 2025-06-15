import React from 'react';
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
    BookOpen,
    Image as ImageIcon,
    Tag,
    Info,
    Siren,
} from 'lucide-react';

const BookDetailDialog = ({ book, open, onOpenChange, onUpdateBook }) => {
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

    const statusOptions = {
        unread: 'Non lu',
        reading: 'En cours',
        read: 'Lu',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="main-title-text text-2xl">
                        {book.title}
                    </DialogTitle>
                    <DialogDescription>{book.author}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {book.coverUrl ? (
                        <img-replace
                            src={book.coverUrl}
                            alt={`Couverture de ${book.title}`}
                            className="w-full h-48 object-contain rounded-md mb-4"
                        />
                    ) : (
                        <div className="w-full h-48 bg-secondary rounded-md flex items-center justify-center text-muted-foreground mb-4">
                            <ImageIcon className="h-12 w-12" />
                        </div>
                    )}
                    <div className="flex items-center">
                        <CalendarDays className="h-5 w-5 mr-3 text-primary" />
                        <p>
                            <span className="font-medium">
                                Date de parution :
                            </span>{' '}
                            {formatDate(book.publicationDate)}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-3 text-primary" />
                        <p>
                            <span className="font-medium">
                                Nombre de pages :
                            </span>{' '}
                            {book.pageCount || 'N/A'}
                        </p>
                    </div>
                    <div className="flex items-center">
                        <Tag className="h-5 w-5 mr-3 text-primary" />
                        <p>
                            <span className="font-medium">Statut :</span>{' '}
                            <span
                                className={`status-badge status-${book.status}`}
                            >
                                {statusOptions[book.status]}
                            </span>
                        </p>
                    </div>
                    {book.isbn && (
                        <div className="flex items-center">
                            <Info className="h-5 w-5 mr-3 text-primary" />
                            <p>
                                <span className="font-medium">ISBN :</span>{' '}
                                {book.isbn}
                            </p>
                        </div>
                    )}
                    {book.shelf && (
                        <div className="flex items-center">
                            <Info className="h-5 w-5 mr-3 text-primary" />
                            <p>
                                <span className="font-medium">Étagère :</span>{' '}
                                {book.shelf}
                            </p>
                        </div>
                    )}
                    {book.description && (
                        <div>
                            <h4 className="font-medium mb-1 text-foreground">
                                Description :
                            </h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {book.description}
                            </p>
                        </div>
                    )}
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
