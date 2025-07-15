import React, { useState, useEffect, useMemo } from 'react';
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
import { Combobox } from '@/components/ui/combobox';
import {
    loadKubeDataFromSVG,
    getAvailableKubeIds,
    areKubesAvailable,
    areKubeDataAlreadyLoaded,
} from '@/lib/kubeUtils';

const ShelfDialog = ({
    open,
    onOpenChange,
    onAddShelf,
    onUpdateShelf,
    shelfToEdit = null,
    mode = 'add', // 'add' ou 'edit'
    shelves = [], // Liste des étagères existantes pour déterminer les kubes disponibles
}) => {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
    });
    const [availableKubes, setAvailableKubes] = useState([]);
    const [kubesAvailable, setKubesAvailable] = useState(false);

    const isEditMode = mode === 'edit' || shelfToEdit !== null;

    // Options formatées pour le Combobox
    const kubeOptions = useMemo(
        () => [
            ...availableKubes.map((kubeId) => ({
                value: kubeId,
                label: kubeId.replace('kube', 'Kube '),
                id: kubeId,
            })),
            // En mode édition, inclure l'emplacement actuel même s'il n'est plus disponible
            ...(isEditMode &&
            shelfToEdit?.location &&
            !availableKubes.includes(shelfToEdit.location)
                ? [
                      {
                          value: shelfToEdit.location,
                          label:
                              shelfToEdit.location.replace('kube', 'Kube ') +
                              ' (actuel)',
                          id: shelfToEdit.location,
                      },
                  ]
                : []),
        ],
        [availableKubes, isEditMode, shelfToEdit]
    );

    // Charger les kubes disponibles et vérifier leur disponibilité
    useEffect(() => {
        const loadAvailableKubes = async () => {
            try {
                // Vérifier d'abord si les kubes sont disponibles
                const available = await areKubesAvailable();
                setKubesAvailable(available);

                if (available) {
                    // Utiliser les données déjà chargées si disponibles
                    if (!areKubeDataAlreadyLoaded()) {
                        // Seulement si les données ne sont pas encore chargées
                        await loadKubeDataFromSVG();
                    }
                    const allKubes = getAvailableKubeIds();
                    // Filtrer les kubes qui ne sont pas déjà assignés à d'autres étagères
                    const usedKubes = shelves
                        .filter(
                            (shelf) =>
                                shelf.location && shelf.id !== shelfToEdit?.id
                        ) // Exclure l'étagère en cours d'édition
                        .map((shelf) => shelf.location);

                    const freeKubes = allKubes.filter(
                        (kubeId) => !usedKubes.includes(kubeId)
                    );
                    setAvailableKubes(freeKubes);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des kubes:', error);
                setKubesAvailable(false);
            }
        };

        if (open) {
            loadAvailableKubes();
        }
    }, [open, shelves, shelfToEdit]);

    // Validation des champs obligatoires
    const isFormValid = formData.name.trim();

    // Reset des champs quand la popup se ferme ou pré-remplir en mode édition
    useEffect(() => {
        if (!open) {
            setFormData({
                name: '',
                location: '',
            });
        } else if (isEditMode && shelfToEdit) {
            // Pré-remplir avec les données de l'étagère à modifier
            setFormData({
                name: shelfToEdit.name || '',
                location: shelfToEdit.location || '',
            });
        } else {
            // En mode ajout, initialiser location à vide
            setFormData({
                name: '',
                location: '',
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
                        {isEditMode
                            ? 'Modifier une étagère'
                            : 'Ajouter une étagère'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditMode
                            ? 'Modifiez les informations de cette étagère.'
                            : 'Créez une nouvelle étagère pour organiser vos livres.'}
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

                    {kubesAvailable && (
                        <div className="space-y-1">
                            <Label htmlFor="location">Emplacement</Label>
                            <Combobox
                                options={kubeOptions}
                                value={formData.location}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        location: value,
                                    })
                                }
                                placeholder="Choisir un emplacement"
                                searchPlaceholder="Rechercher un emplacement..."
                                emptyMessage="Aucun emplacement trouvé."
                            />
                        </div>
                    )}

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
