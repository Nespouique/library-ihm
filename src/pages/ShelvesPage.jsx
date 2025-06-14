import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ShelfCard from '@/components/ShelfCard';
import FloatingButton from '@/components/FloatingButton';
import AddShelfDialog from '@/components/AddShelfDialog';
import ShelfDetailDialog from '@/components/ShelfDetailDialog';

const ShelvesPage = () => {
    const [shelves, setShelves] = useState([]);
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedShelf, setSelectedShelf] = useState(null);

    useEffect(() => {
        const savedShelves = localStorage.getItem('library-shelves');
        if (savedShelves) {
            setShelves(JSON.parse(savedShelves));
        } else {
            const sampleShelves = [
                {
                    id: '1',
                    name: 'Fiction et Romans Modernes Internationaux',
                    bookCount: 1,
                },
                { id: '2', name: 'Science-Fiction Dystopique', bookCount: 1 },
                {
                    id: '3',
                    name: 'Histoire Ancienne et Médiévale',
                    bookCount: 0,
                },
                {
                    id: '4',
                    name: 'Classiques de la Littérature Mondiale',
                    bookCount: 1,
                },
            ];
            setShelves(sampleShelves);
            localStorage.setItem(
                'library-shelves',
                JSON.stringify(sampleShelves)
            );
        }

        const savedBooks = localStorage.getItem('library-books');
        if (savedBooks) {
            setBooks(JSON.parse(savedBooks));
        }
    }, []);

    const handleAddShelf = (newShelf) => {
        const updatedShelves = [...shelves, newShelf].sort((a, b) =>
            a.name.localeCompare(b.name)
        );
        setShelves(updatedShelves);
        localStorage.setItem('library-shelves', JSON.stringify(updatedShelves));
    };

    const filteredShelves = shelves
        .filter((shelf) =>
            shelf.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    const getShelfBooks = (shelf) => {
        return books.filter((book) => book.shelf === shelf.name);
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
