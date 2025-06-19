import React, { useState } from 'react';
import { Book, User, Hash, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { booksService } from '../services/api';

const BookCard = ({ book, index, onClick, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await booksService.deleteBook(book.id);

            toast({
                title: 'Livre supprimé',
                description: `Le livre "${book.title}" a été supprimé avec succès.`,
                variant: 'success',
            });

            setShowDeleteConfirm(false);

            // Appeler la fonction de callback pour mettre à jour la liste
            if (onDelete) {
                onDelete(book.id);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du livre:', error);

            // Mapper les erreurs spécifiques (si nécessaire pour les livres)
            const errorMessage = 'Veuillez réessayer.';

            toast({
                title: 'Erreur - Impossible de supprimer le livre',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleEditClick = () => {
        // TODO: Implement edit functionality
        console.log('Edit book:', book.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="book-card group"
        >
            {/* Zone cliquable : contenu principal du livre */}
            <div
                className="flex items-start space-x-4 flex-grow cursor-pointer"
                onClick={onClick}
            >
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all duration-200">
                        <Book className="h-6 w-6" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3
                        className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors truncate-text"
                        title={book.title}
                    >
                        {book.title}
                    </h3>
                    <div className="space-y-1.5">
                        <div
                            className="flex items-center text-sm text-muted-foreground"
                            title={book.author}
                        >
                            <User className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate-text block">
                                {book.author}
                            </span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Hash className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span>ISBN: {book.isbn}</span>
                        </div>
                    </div>
                </div>
            </div>
            {book.shelf && (
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground truncate-text"
                        title={book.shelf}
                    >
                        {book.shelf}
                    </span>
                    <div className="flex items-center gap-1">
                        {' '}
                        <button
                            className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors group/edit"
                            onClick={handleEditClick}
                            title="Modifier le livre"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors group/delete"
                            onClick={handleDeleteClick}
                            title="Supprimer le livre"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}{' '}
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
                            Vous êtes sur le point de supprimer{' '}
                            <em>"{book.title}"</em>.
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
        </motion.div>
    );
};

export default BookCard;
