import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ShelfCard from '@/components/ShelfCard';
import FloatingButton from '@/components/FloatingButton';
import AddShelfDialog from '@/components/AddShelfDialog';
import ShelfDetailDialog from '@/components/ShelfDetailDialog';
import { toast } from '@/components/ui/use-toast';
import { shelvesService, booksService } from '@/services/api';

const ShelvesPage = () => {
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedShelf, setSelectedShelf] = useState(null);

    // Charger les livres depuis l'API
    const loadBooks = async () => {
        try {
            const response = await booksService.getBooks(1);
            const transformedBooks = response.data.map((book) => ({
                id: book.id,
                title: book.title,
                author: `${book.author.firstName} ${book.author.lastName}`,
                shelf: book.shelf, // ID de l'étagère
                isbn: book.isbn,
                description: book.description,
                publicationDate: book.date,
                coverUrl: book.jacket || '',
                status: 'unread',
                pageCount: Math.floor(Math.random() * 500) + 50,
            }));
            setBooks(transformedBooks);
            return transformedBooks;
        } catch (err) {
            console.error('Erreur lors du chargement des livres:', err);
            setBooks([]);
            return [];
        }
    };

    // Charger les étagères depuis l'API et calculer le nombre de livres
    const loadShelves = async (booksData = []) => {
        try {
            setLoading(true);
            setError(null);

            const response = await shelvesService.getShelves(1);

            // Transformer les données API vers le format attendu par l'interface
            const transformedShelves = response.data.map((shelf) => {
                // Calculer le nombre de livres pour cette étagère
                const shelfBookCount = booksData.filter(
                    (book) => book.shelf === shelf.id
                ).length;

                return {
                    id: shelf.id,
                    name: shelf.name || `Étagère ${shelf.id.substring(0, 8)}`, // Utiliser le nom de l'API ou fallback
                    bookCount: shelfBookCount,
                };
            });

            // Ajouter une étagère "Non classé" pour les livres sans étagère
            const unclassifiedBookCount = booksData.filter(
                (book) => !book.shelf
            ).length;
            if (unclassifiedBookCount > 0) {
                transformedShelves.push({
                    id: 'unclassified',
                    name: 'Non classé',
                    bookCount: unclassifiedBookCount,
                });
            }

            setShelves(sortShelves(transformedShelves));
        } catch (err) {
            console.error('Erreur lors du chargement des étagères:', err);
            setError(
                "Impossible de charger les étagères. Vérifiez que l'API est démarrée."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            // Charger d'abord les livres
            const booksData = await loadBooks();
            // Puis charger les étagères avec le bon compteur de livres
            await loadShelves(booksData);
        };

        loadData();
    }, []);

    // Fonction de tri personnalisée pour les étagères
    const sortShelves = (shelves) => {
        return shelves.sort((a, b) => {
            // "Non classé" toujours en premier
            if (a.id === 'unclassified') return -1;
            if (b.id === 'unclassified') return 1;

            // Pour les étagères numérotées, extraire le numéro pour un tri numérique
            const aMatch = a.name.match(/Étagère (\d+)/);
            const bMatch = b.name.match(/Étagère (\d+)/);

            if (aMatch && bMatch) {
                // Si les deux sont des étagères numérotées, trier par numéro
                const aNum = parseInt(aMatch[1], 10);
                const bNum = parseInt(bMatch[1], 10);
                return aNum - bNum;
            }

            // Sinon, tri alphabétique normal
            return a.name.localeCompare(b.name);
        });
    };

    const handleAddShelf = async (newShelf) => {
        try {
            // Appeler l'API pour créer l'étagère
            const response = await shelvesService.createShelf(newShelf);
            console.log('Étagère créée via API:', response);

            // Ajouter l'étagère à la liste locale avec le bon ID et nom de l'API
            const shelfFromApi = {
                id: response.id || response.data?.id, // L'API retourne l'ID de l'étagère créée
                name: response.name || response.data?.name || newShelf.name, // Utiliser le nom confirmé par l'API
                bookCount: 0, // Nouvelle étagère, pas de livres pour l'instant
            };

            const updatedShelves = sortShelves([...shelves, shelfFromApi]);
            setShelves(updatedShelves);

            toast({
                title: 'Succès - Étagère ajoutée !',
                description: `${newShelf.name} a été ajoutée avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'étagère : ", error);
            toast({
                title: `Erreur - Impossible d'ajouter l'étagère`,
                description: `${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const filteredShelves = sortShelves(
        shelves.filter((shelf) =>
            shelf.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const getShelfBooks = (shelf) => {
        let shelfBooks;

        // Utiliser l'ID de l'étagère pour le matching exact
        if (shelf.id === 'unclassified') {
            // Cas spécial pour les livres non classés
            shelfBooks = books.filter((book) => !book.shelf);
        } else {
            shelfBooks = books.filter((book) => book.shelf === shelf.id);
        }

        // Trier les livres par ordre alphabétique (titre)
        return shelfBooks.sort((a, b) => a.title.localeCompare(b.title));
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold main-title-text">
                    Gestion des Étagères
                </h1>
            </div>

            <SearchBar
                placeholder="Rechercher une étagère..."
                value={searchTerm}
                onChange={setSearchTerm}
            />

            {/* Indicateur de chargement */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Chargement des étagères...
                    </p>
                </div>
            ) : error ? (
                <div className="text-center py-12">
                    <div className="text-destructive mb-4">
                        <svg
                            className="mx-auto h-12 w-12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    </div>
                    <p className="text-destructive mb-4">{error}</p>
                    <button
                        onClick={loadShelves}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredShelves.length > 0 ? (
                        filteredShelves.map((shelf, index) => (
                            <div key={shelf.id} className="h-full">
                                <ShelfCard
                                    shelf={shelf}
                                    index={index}
                                    onClick={() => setSelectedShelf(shelf)}
                                />
                            </div>
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full text-center py-12"
                        >
                            <div className="text-gray-400 mb-4">
                                <svg
                                    className="mx-auto h-12 w-12"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Aucune étagère trouvée
                            </h3>
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? 'Aucune étagère ne correspond à votre recherche.'
                                    : 'Commencez par ajouter votre première étagère !'}
                            </p>
                        </motion.div>
                    )}
                </div>
            )}

            <FloatingButton onClick={() => setIsAddDialogOpen(true)} />

            <AddShelfDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddShelf={handleAddShelf}
            />
            {selectedShelf && (
                <ShelfDetailDialog
                    shelf={selectedShelf}
                    books={getShelfBooks(selectedShelf)}
                    open={!!selectedShelf}
                    onOpenChange={() => setSelectedShelf(null)}
                />
            )}
        </div>
    );
};

export default ShelvesPage;
