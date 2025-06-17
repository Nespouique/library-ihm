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

const AddAuthorDialog = ({ open, onOpenChange, onAddAuthor }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
    });

    // Validation des champs obligatoires
    const isFormValid = formData.firstName.trim() && formData.lastName.trim();

    // Reset des champs quand la popup se ferme
    useEffect(() => {
        if (!open) {
            setFormData({
                firstName: '',
                lastName: '',
            });
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) {
            return; // Ne devrait pas arriver car le bouton est désactivé
        }

        onAddAuthor({
            ...formData,
        });

        onOpenChange(false); // Le reset se fera automatiquement via useEffect
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        Ajouter un auteur
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Ajoutez un nouvel auteur à votre bibliothèque.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
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
                            Ajouter
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddAuthorDialog;
