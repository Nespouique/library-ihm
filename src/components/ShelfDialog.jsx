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
import { toast } from '@/components/ui/use-toast';

const ShelfDialog = ({ 
    open, 
    onOpenChange, 
    onAddShelf, 
    onUpdateShelf, 
    shelfToEdit = null,
    mode = 'add' // 'add' ou 'edit'
}) => {
    const [formData, setFormData] = useState({
        name: '',
    });

    const isEditMode = mode === 'edit' || shelfToEdit !== null;

    // Validation des champs obligatoires
    const isFormValid = formData.name.trim();

    // Reset des champs quand la popup se ferme ou pré-remplir en mode édition
    useEffect(() => {
        if (!open) {
            setFormData({
                name: '',
            });
        } else if (isEditMode && shelfToEdit) {
            // Pré-remplir avec les données de l'étagère à modifier
            setFormData({
                name: shelfToEdit.name || '',
            });
        }
    }, [open, isEditMode, shelfToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) {
            return; // Ne devrait pas arriver car le bouton est désactivé
        }

        if (isEditMode && onUpdateShelf) {
            onUpdateShelf({
                ...formData,
                id: shelfToEdit.id,
            });
        } else if (onAddShelf) {
            onAddShelf({
                ...formData,
            });
        }

        onOpenChange(false); // Le reset se fera automatiquement via useEffect
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        {isEditMode ? 'Modifier une étagère' : 'Ajouter une étagère'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditMode 
                            ? 'Modifiez les informations de cette étagère.'
                            : 'Créez une nouvelle étagère pour organiser vos livres.'
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1">
                        <Label htmlFor="name">Nom de l'étagère *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    name: e.target.value,
                                })
                            }
                            placeholder="Nom de l'étagère"
                            required
                        />
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

export default ShelfDialog;
