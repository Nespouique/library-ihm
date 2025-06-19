import React, { useState } from 'react';
import { User, Edit, Trash2 } from 'lucide-react';
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
import { authorsService } from '../services/api';

const AuthorCard = ({ author, index, onClick, onDelete, onEdit }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fullName = `${author.firstName} ${author.lastName}`;

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await authorsService.deleteAuthor(author.id);

            toast({
                title: 'Auteur supprimé',
                description: `L'auteur "${fullName}" a été supprimé avec succès.`,
            });

            setShowDeleteConfirm(false);

            // Appeler la fonction de callback pour mettre à jour la liste
            if (onDelete) {
                onDelete(author.id);
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de l'auteur:", error);

            // Mapper les erreurs spécifiques
            let errorMessage = 'Veuillez réessayer.';

            if (
                error.message &&
                error.message.includes('Cannot delete author: it has books')
            ) {
                errorMessage = "L'auteur a des livres dans la bibliothèque";
            }

            toast({
                title: "Erreur - Impossible de supprimer l'auteur",
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
        if (onEdit) {
            onEdit(author);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="author-card group"
            >
                {/* Zone cliquable : contenu principal de l'auteur */}
                <div
                    className="flex items-center space-x-4 flex-grow cursor-pointer"
                    onClick={onClick}
                >
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all duration-200">
                            <User className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3
                            className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate-text"
                            title={fullName}
                        >
                            {fullName}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {author.bookCount || 0} livre(s) dans la
                            bibliothèque
                        </p>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div></div> {/* Espace vide à gauche */}
                    <div className="flex items-center gap-1">
                        <button
                            className="p-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-colors group/edit"
                            onClick={handleEditClick}
                            title="Modifier l'auteur"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            className="p-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors group/delete"
                            onClick={handleDeleteClick}
                            title="Supprimer l'auteur"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

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
                            <em>"{fullName}"</em>.
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
        </>
    );
};

export default AuthorCard;
