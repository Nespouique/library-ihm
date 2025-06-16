import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { authorsService, shelvesService } from '@/services/api';

const AddBookDialog = ({ open, onOpenChange, onAddBook }) => {
    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        author: '',
        publicationDate: null, // Changed to null for Date object
        shelf: '',
        description: '',
    }); // États pour les autocompletes
    const [authors, setAuthors] = useState([]);
    const [shelves, setShelves] = useState([]);

    // Options formatées pour les Combobox
    const authorOptions = useMemo(
        () =>
            authors.map((author) => ({
                value: `${author.firstName} ${author.lastName}`,
                label: `${author.firstName} ${author.lastName}`,
                id: author.id,
            })),
        [authors]
    );

    const shelfOptions = useMemo(
        () =>
            shelves.map((shelf) => ({
                value: shelf.name,
                label: shelf.name,
                id: shelf.id,
            })),
        [shelves]
    ); // Validation des champs obligatoires
    const isFormValid =
        formData.isbn.trim() && formData.title.trim() && formData.author.trim();

    // Charger les auteurs et étagères
    useEffect(() => {
        const loadData = async () => {
            try {
                const [authorsRes, shelvesRes] = await Promise.all([
                    authorsService.getAuthors(1),
                    shelvesService.getShelves(1),
                ]);
                setAuthors(authorsRes.data || []);
                setShelves(shelvesRes.data || []);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        };

        if (open) {
            loadData();
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isFormValid) {
            toast({
                title: 'Erreur',
                description:
                    'Veuillez remplir tous les champs obligatoires (ISBN, Titre, Auteur).',
                variant: 'destructive',
            });
            return;
        }

        // Format the date for submission
        const submissionData = {
            ...formData,
            id: Date.now().toString(),
            publicationDate: formData.publicationDate
                ? formData.publicationDate.toISOString().split('T')[0]
                : '',
        };

        onAddBook(submissionData);
        setFormData({
            isbn: '',
            title: '',
            author: '',
            publicationDate: null, // Changed to null for Date object
            shelf: '',
            description: '',
        });

        onOpenChange(false);

        toast({
            title: 'Livre ajouté !',
            description: 'Le livre a été ajouté avec succès à la bibliothèque.',
        });
    };

    const handleScanBarcode = () => {
        toast({
            title: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-start space-x-3">
                        <DialogTitle className="main-title-text">
                            Ajouter un livre
                        </DialogTitle>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleScanBarcode}
                            className="rounded-full w-8 h-8"
                        >
                            <Camera className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* 1. ISBN - obligatoire, toute la largeur */}
                    <div className="space-y-1">
                        <Label htmlFor="isbn">ISBN *</Label>
                        <Input
                            id="isbn"
                            value={formData.isbn}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    isbn: e.target.value,
                                })
                            }
                            placeholder="ISBN du livre"
                            required
                        />
                    </div>
                    {/* 2. Titre - obligatoire, toute la largeur */}
                    <div className="space-y-1">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                            placeholder="Titre du livre"
                            required
                        />
                    </div>
                    {/* 3. Auteur - obligatoire, toute la largeur avec combobox */}
                    <div className="space-y-1">
                        <Label htmlFor="author">Auteur *</Label>
                        <Combobox
                            options={authorOptions}
                            value={formData.author}
                            onValueChange={(value) =>
                                setFormData({ ...formData, author: value })
                            }
                            placeholder="Choisir un auteur..."
                            searchPlaceholder="Rechercher un auteur..."
                            emptyMessage="Aucun auteur trouvé."
                        />
                    </div>{' '}
                    {/* 4. Date de parution + Étagère - non obligatoires, moitié largeur chacun */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="publicationDate">
                                Date de parution
                            </Label>
                            <DatePicker
                                date={formData.publicationDate}
                                setDate={(date) =>
                                    setFormData({
                                        ...formData,
                                        publicationDate: date,
                                    })
                                }
                                placeholder="14/12/1994"
                                id="publicationDate"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="shelf">Étagère</Label>
                            <Combobox
                                options={shelfOptions}
                                value={formData.shelf}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, shelf: value })
                                }
                                placeholder="Choisir une étagère..."
                                searchPlaceholder="Rechercher une étagère..."
                                emptyMessage="Aucune étagère trouvée."
                            />
                        </div>
                    </div>
                    {/* 5. Description - non obligatoire, toute la largeur */}
                    <div className="space-y-1">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                            placeholder="Description du livre"
                            rows={3}
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
                            Ajouter
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddBookDialog;
