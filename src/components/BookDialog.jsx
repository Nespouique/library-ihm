import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import { AuthorCombobox } from '@/components/ui/author-combobox';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
    authorsService,
    shelvesService,
    bookMetadataService,
} from '@/services/api';
import BarcodeScanner from './BarcodeScanner';
import AuthorDialog from './AuthorDialog';

const BookDialog = ({
    open,
    onOpenChange,
    onAddBook,
    onUpdateBook,
    bookToEdit = null,
    mode = 'add', // 'add' ou 'edit'
}) => {
    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        authorId: '', // Changé pour stocker l'ID
        publicationDate: null, // Changed to null for Date object
        shelfId: '', // Changé pour stocker l'ID
        description: '',
    });

    // États pour les autocompletes
    const [authors, setAuthors] = useState([]);
    const [shelves, setShelves] = useState([]);
    const [isDateValid, setIsDateValid] = useState(true); // État pour la validation de la date
    const [isScannerOpen, setIsScannerOpen] = useState(false); // État pour le scanner de code-barres
    const [isLoadingBookData, setIsLoadingBookData] = useState(false); // État pour le chargement des données Google Books
    const [isCreatingBook, setIsCreatingBook] = useState(false); // État pour la création du livre + upload jaquette

    // États pour les messages toast
    const [toastMessage, setToastMessage] = useState(null);

    // États pour l'AuthorDialog
    const [isAuthorDialogOpen, setIsAuthorDialogOpen] = useState(false);
    const [pendingAuthorName, setPendingAuthorName] = useState(''); // Pour stocker le nom de l'auteur à créer
    const [pendingAuthorMessage, setPendingAuthorMessage] = useState(''); // Pour le message personnalisé

    const isEditMode = mode === 'edit' || bookToEdit !== null;

    // Options formatées pour les Combobox
    const authorOptions = useMemo(
        () =>
            authors.map((author) => ({
                value: author.id.toString(), // Utiliser l'ID comme valeur
                label: `${author.firstName} ${author.lastName}`,
                id: author.id,
            })),
        [authors]
    );

    const shelfOptions = useMemo(
        () =>
            shelves
                .map((shelf) => ({
                    value: shelf.id.toString(), // Utiliser l'ID comme valeur
                    label: shelf.name,
                    id: shelf.id,
                }))
                .sort((a, b) =>
                    a.label.localeCompare(b.label, 'fr', { numeric: true })
                ), // Tri numérique naturel
        [shelves]
    );

    // Validation des champs obligatoires
    const isFormValid =
        formData.isbn.trim() &&
        formData.title.trim() &&
        formData.authorId &&
        isDateValid; // Inclure la validation de la date

    // Reset des champs quand la popup se ferme ou pré-remplir en mode édition
    useEffect(() => {
        if (!open) {
            // Reset tous les champs quand la popup se ferme
            setFormData({
                isbn: '',
                title: '',
                authorId: '',
                publicationDate: null,
                shelfId: '',
                description: '',
            });
            // Reset aussi la validation de la date et l'état de création
            setIsDateValid(true);
            setIsCreatingBook(false);
        } else if (isEditMode && bookToEdit) {
            // Pré-remplir avec les données du livre à modifier
            // Conversion simple de la date depuis le format API ("1994-12-14")
            const publicationDate = bookToEdit.publicationDate
                ? new Date(bookToEdit.publicationDate)
                : null;

            setFormData({
                isbn: bookToEdit.isbn || '',
                title: bookToEdit.title || '',
                authorId: bookToEdit.authorId?.toString() || '',
                publicationDate: publicationDate,
                shelfId: bookToEdit.shelfId?.toString() || '',
                description: bookToEdit.description || '',
            });
        }
    }, [open, isEditMode, bookToEdit]);

    // Charger les auteurs et étagères
    useEffect(() => {
        const loadData = async () => {
            try {
                const [authorsRes, shelvesRes] = await Promise.all([
                    authorsService.getAuthors(),
                    shelvesService.getShelves(),
                ]);
                setAuthors(authorsRes || []);
                setShelves(shelvesRes || []);
            } catch (error) {
                console.error('Erreur lors du chargement des données:', error);
            }
        };

        if (open) {
            loadData();
        }
    }, [open]);

    // Fonction pour recharger les auteurs après création
    const reloadAuthors = async () => {
        try {
            const authorsRes = await authorsService.getAuthors();
            setAuthors(authorsRes || []);
        } catch (error) {
            console.error('Erreur lors du rechargement des auteurs:', error);
        }
    };

    // useEffect pour gérer les toasts
    useEffect(() => {
        if (toastMessage) {
            toast(toastMessage);
            setToastMessage(null); // Reset après affichage
        }
    }, [toastMessage]);

    // Fonction pour rechercher automatiquement les données du livre via multiple sources
    const searchBookByISBN = useCallback(
        async (isbn) => {
            console.log('Recherche de livre pour ISBN:', isbn);
            if (!isbn || isbn.length < 10) return; // ISBN trop court

            setIsLoadingBookData(true);
            try {
                const bookData = await bookMetadataService.searchByISBN(isbn);

                // Pré-remplir les champs avec les données trouvées
                setFormData((prevData) => ({
                    ...prevData,
                    title: bookData.title || prevData.title,
                    description: bookData.description || prevData.description,
                    publicationDate: bookData.publishedDate
                        ? new Date(bookData.publishedDate)
                        : prevData.publicationDate,
                }));

                // Chercher un auteur correspondant - utilise la version actuelle d'authors
                if (bookData.authors && bookData.authors.length > 0) {
                    // Utiliser une fonction de callback pour avoir accès aux authors actuels
                    setFormData((prevData) => {
                        // Récupérer les authors actuels depuis le state
                        const currentAuthors = authors; // Cette variable sera toujours à jour

                        // Fonction pour nettoyer le nom d'un auteur
                        const cleanAuthorName = (name) => {
                            if (!name) return '';
                            return name
                                .trim() // Supprimer les espaces en début/fin
                                .replace(/,$/, '') // Supprimer la virgule finale
                                .replace(/\s+/g, ' ') // Normaliser les espaces multiples
                                .replace(/\s*\.\s*/g, '.') // Normaliser les espaces autour des points (R. R. -> R.R.)
                                .replace(/\s*-\s*/g, '-') // Normaliser les espaces autour des tirets
                                .replace(/[''"'']/g, '') // Supprimer les apostrophes et guillemets
                                .normalize('NFD') // Décomposer les caractères accentués
                                .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                                .toLowerCase();
                        };

                        console.log('Authors from API:', bookData.authors);

                        authors.forEach((authorInList) => {
                            console.log(
                                'Author in list: ',
                                `${authorInList.firstName} ${authorInList.lastName}`.toLowerCase()
                            );
                        });

                        let foundAuthor = null;
                        let matchedAuthorName = '';

                        // Parcourir tous les auteurs retournés par l'API
                        for (const apiAuthor of bookData.authors) {
                            // Gérer les cas où l'auteur est un objet (OpenLibrary) ou une chaîne (Google)
                            const authorName =
                                typeof apiAuthor === 'string'
                                    ? apiAuthor
                                    : apiAuthor.name;

                            if (!authorName) continue;

                            const cleanedApiAuthorName =
                                cleanAuthorName(authorName);
                            console.log(
                                'Checking API author:',
                                cleanedApiAuthorName
                            );

                            // Chercher dans la base d'auteurs
                            const existingAuthor = currentAuthors.find(
                                (author) => {
                                    const fullName = `${author.firstName} ${author.lastName}`;
                                    const cleanedDbAuthorName =
                                        cleanAuthorName(fullName);
                                    console.log(
                                        'Comparing:',
                                        cleanedApiAuthorName,
                                        'with',
                                        cleanedDbAuthorName
                                    );
                                    return (
                                        cleanedDbAuthorName ===
                                        cleanedApiAuthorName
                                    );
                                }
                            );

                            if (existingAuthor) {
                                foundAuthor = existingAuthor;
                                matchedAuthorName = authorName;
                                console.log(
                                    'Found matching author:',
                                    matchedAuthorName
                                );
                                break; // Sortir de la boucle dès qu'on trouve un match
                            }
                        }

                        if (foundAuthor) {
                            console.log(
                                `Auteur trouvé: ${matchedAuthorName} -> ${foundAuthor.firstName} ${foundAuthor.lastName}`
                            );
                            return {
                                ...prevData,
                                authorId: foundAuthor.id.toString(),
                            };
                        } else {
                            // Aucun auteur trouvé, ouvrir l'AuthorDialog pour créer l'auteur
                            const firstAuthorName =
                                typeof bookData.authors[0] === 'string'
                                    ? bookData.authors[0]
                                    : bookData.authors[0].name;

                            console.warn(
                                `Aucun auteur trouvé parmi: ${bookData.authors.map((a) => (typeof a === 'string' ? a : a.name)).join(', ')}`
                            );

                            // Ouvrir l'AuthorDialog pour créer l'auteur
                            setPendingAuthorName(firstAuthorName);
                            setPendingAuthorMessage(
                                `L'auteur trouvé "${firstAuthorName}" n'existe pas encore, vous pouvez l'ajouter ci-dessous.`
                            );
                            setIsAuthorDialogOpen(true);
                            return prevData;
                        }
                    });
                }
            } catch (error) {
                console.error('Erreur lors de la recherche:', error);
                // Ne pas afficher d'erreur si c'est juste un ISBN invalide ou non trouvé
                if (error.message !== 'Format ISBN invalide') {
                    // Programmer un toast pour l'erreur
                    setToastMessage({
                        title: 'Livre non trouvé',
                        description:
                            'Aucune information trouvée pour cet ISBN dans les sources disponibles.',
                        variant: 'default',
                    });
                }
            } finally {
                setIsLoadingBookData(false);
            }
        },
        [authors]
    );

    // Déclencher la recherche quand l'ISBN change (avec un délai pour éviter trop d'appels)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (
                formData.isbn &&
                !isEditMode &&
                bookMetadataService.isValidISBN(formData.isbn)
            ) {
                searchBookByISBN(formData.isbn);
            }
        }, 500); // Délai de 500ms après la dernière frappe

        return () => clearTimeout(timeoutId);
    }, [formData.isbn, isEditMode, searchBookByISBN]);

    const handleSubmit = async (e) => {
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

        // Format the date for submission (évite le décalage de fuseau horaire)
        const formatDateForSubmission = (date) => {
            if (!date) return null; // Retourner null au lieu d'une chaîne vide
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const submissionData = {
            ...formData,
            publicationDate: formatDateForSubmission(formData.publicationDate),
        };

        if (isEditMode && onUpdateBook) {
            onUpdateBook({
                ...submissionData,
                id: bookToEdit.id,
            });
            onOpenChange(false); // Fermer immédiatement pour les modifications
        } else if (onAddBook) {
            // Pour la création, passer la fonction setLoading et attendre la fin
            await onAddBook(
                {
                    ...submissionData,
                    id: Date.now().toString(),
                },
                setIsCreatingBook
            );

            // Fermer le dialog seulement après succès complet
            onOpenChange(false);
        }
    };

    const handleScanBarcode = () => {
        setIsScannerOpen(true);
    };

    const handleBarcodeDetected = (isbn) => {
        setFormData({
            ...formData,
            isbn: isbn,
        });
        // La recherche automatique se déclenchera via useEffect
    };

    // Fonction pour gérer l'ouverture de l'AuthorDialog depuis le combobox
    const handleCreateAuthorFromCombobox = (searchValue) => {
        setPendingAuthorName(searchValue);
        setPendingAuthorMessage(
            `L'auteur "${searchValue}" n'existe pas encore, vous pouvez l'ajouter ci-dessous.`
        );
        setIsAuthorDialogOpen(true);
    };

    // Fonction pour gérer la création d'un auteur depuis l'AuthorDialog
    const handleAddAuthor = async (authorData) => {
        try {
            const newAuthor = await authorsService.createAuthor(authorData);

            // Recharger la liste des auteurs
            await reloadAuthors();

            // Sélectionner automatiquement le nouvel auteur
            setFormData((prev) => ({
                ...prev,
                authorId: newAuthor.id.toString(),
            }));

            // Notification de succès
            toast({
                title: 'Auteur créé',
                description: `L'auteur "${authorData.firstName} ${authorData.lastName}" a été créé avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'auteur:", error);
            toast({
                title: 'Erreur',
                description:
                    "Impossible de créer l'auteur. Veuillez réessayer.",
                variant: 'destructive',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="main-title-text">
                        {isEditMode ? 'Modifier un livre' : 'Ajouter un livre'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {isEditMode
                            ? 'Modifiez les informations de ce livre.'
                            : 'Remplissez les informations du livre à ajouter à votre bibliothèque.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* 1. ISBN - obligatoire, toute la largeur avec bouton scan intégré */}
                    <div className="space-y-1">
                        <Label htmlFor="isbn">ISBN *</Label>
                        <div className="relative">
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
                                className="pr-20"
                                required
                                disabled={isCreatingBook}
                            />
                            {/* Indicateur de chargement */}
                            {isLoadingBookData && (
                                <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleScanBarcode}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                                aria-label="Scanner le code-barres"
                                disabled={isCreatingBook}
                            >
                                <Camera className="h-4 w-4 opacity-50" />
                            </Button>
                        </div>
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
                            disabled={isCreatingBook}
                        />
                    </div>
                    {/* 3. Auteur - obligatoire, toute la largeur avec combobox */}
                    <div className="space-y-1">
                        <Label htmlFor="author">Auteur *</Label>
                        <AuthorCombobox
                            options={authorOptions}
                            value={formData.authorId}
                            onValueChange={(value) =>
                                setFormData({ ...formData, authorId: value })
                            }
                            placeholder="Choisir un auteur..."
                            searchPlaceholder="Rechercher un auteur..."
                            disabled={isCreatingBook}
                            onCreateAuthor={handleCreateAuthorFromCombobox}
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
                                onValidationChange={setIsDateValid}
                                id="publicationDate"
                                disabled={isCreatingBook}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="shelf">Étagère</Label>
                            <Combobox
                                options={shelfOptions}
                                value={formData.shelfId}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, shelfId: value })
                                }
                                placeholder="Choisir une étagère..."
                                searchPlaceholder="Rechercher une étagère..."
                                emptyMessage="Aucune étagère trouvée."
                                disabled={isCreatingBook}
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
                            disabled={isCreatingBook}
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isCreatingBook}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={!isFormValid || isCreatingBook}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreatingBook ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {isEditMode
                                        ? 'Modification...'
                                        : 'Création en cours...'}
                                </>
                            ) : isEditMode ? (
                                'Modifier'
                            ) : (
                                'Ajouter'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>

            {/* Scanner de code-barres */}
            <BarcodeScanner
                open={isScannerOpen}
                onOpenChange={setIsScannerOpen}
                onBarcodeDetected={handleBarcodeDetected}
            />

            {/* Dialog pour créer un auteur */}
            <AuthorDialog
                open={isAuthorDialogOpen}
                onOpenChange={setIsAuthorDialogOpen}
                onAddAuthor={handleAddAuthor}
                mode="add"
                pendingAuthorName={pendingAuthorName}
                pendingAuthorMessage={pendingAuthorMessage}
            />
        </Dialog>
    );
};

export default BookDialog;
