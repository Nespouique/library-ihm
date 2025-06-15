import React, { useState, useEffect } from 'react';
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
import { Camera, ChevronDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { authorsService, shelvesService } from '@/services/api';

const AddBookDialog = ({ open, onOpenChange, onAddBook }) => {
    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        author: '',
        publicationDate: '',
        shelf: '',
        description: '',
    });

    // États pour les autocompletes
    const [authors, setAuthors] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [filteredAuthors, setFilteredAuthors] = useState([]);
    const [filteredShelves, setFilteredShelves] = useState([]);
    const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
    const [showShelfDropdown, setShowShelfDropdown] = useState(false);

    // Validation des champs obligatoires
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

    // Fonction pour normaliser les chaînes (sans casse, accents, tirets)
    const normalizeString = (str) => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-\s]/g, '');
    };

    // Gestion de l'autocomplete auteur
    const handleAuthorChange = (value) => {
        setFormData({ ...formData, author: value });

        if (value.trim()) {
            const normalized = normalizeString(value);
            const filtered = authors.filter((author) => {
                const fullName1 = `${author.firstName} ${author.lastName}`;
                const fullName2 = `${author.lastName} ${author.firstName}`;
                return (
                    normalizeString(fullName1).includes(normalized) ||
                    normalizeString(fullName2).includes(normalized)
                );
            });
            setFilteredAuthors(filtered);
            setShowAuthorDropdown(true);
        } else {
            setShowAuthorDropdown(false);
        }
    };

    // Gestion de l'autocomplete étagère
    const handleShelfChange = (value) => {
        setFormData({ ...formData, shelf: value });

        if (value.trim()) {
            const normalized = normalizeString(value);
            const filtered = shelves.filter((shelf) =>
                normalizeString(shelf.name).includes(normalized)
            );
            setFilteredShelves(filtered);
            setShowShelfDropdown(true);
        } else {
            setShowShelfDropdown(false);
        }
    };

    // Sélection d'un auteur
    const selectAuthor = (author) => {
        setFormData({
            ...formData,
            author: `${author.firstName} ${author.lastName}`,
        });
        setShowAuthorDropdown(false);
    };

    // Sélection d'une étagère
    const selectShelf = (shelf) => {
        setFormData({ ...formData, shelf: shelf.name });
        setShowShelfDropdown(false);
    };

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

        onAddBook({
            ...formData,
            id: Date.now().toString(),
        });

        setFormData({
            isbn: '',
            title: '',
            author: '',
            publicationDate: '',
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

                    {/* 3. Auteur - obligatoire, toute la largeur avec autocomplete */}
                    <div className="space-y-1 relative">
                        <Label htmlFor="author">Auteur *</Label>
                        <div className="relative">
                            <Input
                                id="author"
                                value={formData.author}
                                onChange={(e) =>
                                    handleAuthorChange(e.target.value)
                                }
                                onFocus={() => {
                                    if (
                                        formData.author.trim() &&
                                        filteredAuthors.length > 0
                                    ) {
                                        setShowAuthorDropdown(true);
                                    }
                                }}
                                onBlur={() => {
                                    // Délai pour permettre le clic sur les options
                                    setTimeout(
                                        () => setShowAuthorDropdown(false),
                                        200
                                    );
                                }}
                                placeholder="Nom de l'auteur (ex: Victor Hugo)"
                                required
                            />
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Dropdown des auteurs */}
                        {showAuthorDropdown && filteredAuthors.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {filteredAuthors.map((author) => (
                                    <div
                                        key={author.id}
                                        className="px-3 py-2 hover:bg-accent cursor-pointer"
                                        onClick={() => selectAuthor(author)}
                                    >
                                        {author.firstName} {author.lastName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 4. Date de parution + Étagère - non obligatoires, moitié largeur chacun */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="publicationDate">
                                Date de parution
                            </Label>
                            <Input
                                id="publicationDate"
                                type="date"
                                value={formData.publicationDate}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        publicationDate: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="space-y-1 relative">
                            <Label htmlFor="shelf">Étagère</Label>
                            <div className="relative">
                                <Input
                                    id="shelf"
                                    value={formData.shelf}
                                    onChange={(e) =>
                                        handleShelfChange(e.target.value)
                                    }
                                    onFocus={() => {
                                        if (
                                            formData.shelf.trim() &&
                                            filteredShelves.length > 0
                                        ) {
                                            setShowShelfDropdown(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Délai pour permettre le clic sur les options
                                        setTimeout(
                                            () => setShowShelfDropdown(false),
                                            200
                                        );
                                    }}
                                    placeholder="Nom de l'étagère"
                                />
                                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Dropdown des étagères */}
                            {showShelfDropdown &&
                                filteredShelves.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredShelves.map((shelf) => (
                                            <div
                                                key={shelf.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer"
                                                onClick={() =>
                                                    selectShelf(shelf)
                                                }
                                            >
                                                {shelf.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
