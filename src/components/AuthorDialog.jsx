import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AuthorDialog = ({
    open,
    onOpenChange,
    onAddAuthor,
    onUpdateAuthor,
    authorToEdit = null,
    mode = 'add', // 'add' ou 'edit'
    pendingAuthorMessage = '', // Message d'introduction personnalisable
}) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
    });

    const isEditMode = mode === 'edit' || authorToEdit !== null;

    // Validation des champs obligatoires
    const isFormValid = formData.firstName.trim() && formData.lastName.trim();

    // Reset des champs quand la popup se ferme ou pré-remplir en mode édition
    useEffect(() => {
        if (!open) {
            setFormData({
                firstName: '',
                lastName: '',
            });
        } else if (isEditMode && authorToEdit) {
            // Pré-remplir avec les données de l'auteur à modifier
            setFormData({
                firstName: authorToEdit.firstName || '',
                lastName: authorToEdit.lastName || '',
            });
        }
    }, [open, isEditMode, authorToEdit]);

    // Fonction pour formater le prénom (première lettre de chaque mot en majuscule)
    const formatFirstName = (name) => {
        if (!name) return '';

        return (
            name
                .trim()
                .toLowerCase()
                // Remplacer les séparateurs multiples par des séparateurs simples
                .replace(/\s+/g, ' ')
                .replace(/-+/g, '-')
                .replace(/\.+/g, '.')
                // Diviser par les séparateurs (espace, tiret, point)
                .split(/(\s|-|\.)/)
                .map((part) => {
                    // Si c'est un séparateur, le conserver tel quel
                    if (part === ' ' || part === '-' || part === '.') {
                        return part;
                    }
                    // Si c'est un mot, mettre la première lettre en majuscule
                    if (part.length > 0) {
                        return part.charAt(0).toUpperCase() + part.slice(1);
                    }
                    return part;
                })
                .join('')
        );
    };

    // Fonction pour formater le nom (tout en majuscules)
    const formatLastName = (name) => {
        if (!name) return '';
        return name.trim().toUpperCase();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) {
            return; // Ne devrait pas arriver car le bouton est désactivé
        }

        // Formater les noms avant soumission
        const formattedData = {
            ...formData,
            firstName: formatFirstName(formData.firstName),
            lastName: formatLastName(formData.lastName),
        };

        if (isEditMode && onUpdateAuthor) {
            onUpdateAuthor({
                ...formattedData,
                id: authorToEdit.id,
            });
        } else if (onAddAuthor) {
            onAddAuthor({
                ...formattedData,
            });
        }

        onOpenChange(false); // Le reset se fera automatiquement via useEffect
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        {isEditMode
                            ? 'Modifier un auteur'
                            : 'Ajouter un auteur'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditMode
                            ? 'Modifiez les informations de cet auteur.'
                            : 'Ajoutez un nouvel auteur à votre bibliothèque.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Affichage du message personnalisé pour l'auteur en cours de création */}
                    {pendingAuthorMessage && !isEditMode && (
                        <div className="bg-primary/10 dark:bg-gray-700/40 border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                {pendingAuthorMessage.includes('"') ? (
                                    <>
                                        {pendingAuthorMessage.split('"')[0]}"
                                        <em>
                                            {pendingAuthorMessage.split('"')[1]}
                                        </em>
                                        "{pendingAuthorMessage.split('"')[2]}
                                    </>
                                ) : (
                                    pendingAuthorMessage
                                )}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="firstName">Prénom *</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        firstName: e.target.value,
                                    })
                                }
                                placeholder="Prénom"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="lastName">Nom *</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        lastName: e.target.value,
                                    })
                                }
                                placeholder="Nom"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isEditMode ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AuthorDialog;
