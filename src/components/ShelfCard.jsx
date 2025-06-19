import React, { useState } from 'react';
import { SquareLibrary, Edit, Trash2 } from 'lucide-react';
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
import { shelvesService } from '../services/api';

const ShelfCard = ({ shelf, index, onClick, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await shelvesService.deleteShelf(shelf.id);

            toast({
                title: 'Étagère supprimée',
                description: `L'étagère "${shelf.name}" a été supprimée avec succès.`,
                variant: 'success',
            });

            setShowDeleteConfirm(false);

            // Appeler la fonction de callback pour mettre à jour la liste
            if (onDelete) {
                onDelete(shelf.id);
            }
        } catch (error) {
            console.error("Erreur lors de la suppression de l'étagère:", error);

            // Mapper les erreurs spécifiques
            let errorMessage =
                "Impossible de supprimer l'étagère. Veuillez réessayer.";

            if (
                error.message &&
                error.message.includes('Cannot delete shelf: it contains books')
            ) {
                errorMessage = "L'étagère contient des livres";
            }

            toast({
                title: "Erreur - Impossible de supprimer l'étagère",
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
        console.log('Edit shelf:', shelf.id);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="shelf-card group"
            >
                {/* Zone cliquable : contenu principal de l'étagère */}
                <div
                    className="flex items-center space-x-4 flex-grow cursor-pointer"
                    onClick={onClick}
                >
                    <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-sm group-hover:bg-primary/20 transition-all duration-200">
                            <SquareLibrary className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3
                            className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate-text"
                            title={shelf.name}
                        >
                            {shelf.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {shelf.bookCount || 0} livre(s) sur cette étagère
                        </p>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div></div> {/* Espace vide à gauche */}
                    <div className="flex items-center gap-1">
                        <button
                            className={`p-1.5 rounded-md transition-colors group/edit ${
                                shelf.id === 'unclassified'
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : 'hover:bg-primary/10 hover:text-primary'
                            }`}
                            onClick={
                                shelf.id === 'unclassified'
                                    ? undefined
                                    : handleEditClick
                            }
                            disabled={shelf.id === 'unclassified'}
                            title={
                                shelf.id === 'unclassified'
                                    ? 'L\'étagère "Non classés" ne peut pas être modifiée'
                                    : "Modifier l'étagère"
                            }
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            className={`p-1.5 rounded-md transition-colors group/delete ${
                                shelf.id === 'unclassified'
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : 'hover:bg-destructive/10 hover:text-destructive'
                            }`}
                            onClick={
                                shelf.id === 'unclassified'
                                    ? undefined
                                    : handleDeleteClick
                            }
                            disabled={shelf.id === 'unclassified'}
                            title={
                                shelf.id === 'unclassified'
                                    ? 'L\'étagère "Non classés" ne peut pas être supprimée'
                                    : "Supprimer l'étagère"
                            }
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
                            <em>"{shelf.name}"</em>.
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

export default ShelfCard;
