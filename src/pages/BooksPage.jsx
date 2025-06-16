import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import BookCard from '@/components/BookCard';
import FloatingButton from '@/components/FloatingButton';
import AddBookDialog from '@/components/AddBookDialog';
import BookDetailDialog from '@/components/BookDetailDialog';
import AlphabeticalScroller from '@/components/AlphabeticalScroller';
import { toast } from '@/components/ui/use-toast';
import { booksService, shelvesService } from '@/services/api';

const BooksPage = ({ initialSearchTerm }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const bookRefs = useRef({});

    // Charger les livres depuis l'API
    const loadBooks = async () => {
        try {
            setLoading(true);
            setError(null);

            // Charger les livres et les étagères en parallèle
            const [booksResponse, shelvesResponse] = await Promise.all([
                booksService.getBooks(1),
                shelvesService.getShelves(1),
            ]);

            // Créer un mapping ID étagère -> nom étagère
            const shelvesMap = {};
            shelvesResponse.data.forEach((shelf) => {
                shelvesMap[shelf.id] = shelf.name;
            });

            // Transformer les données API vers le format attendu par l'interface
            const transformedBooks = booksResponse.data.map((book) => ({
                id: book.id,
                title: book.title,
                author: `${book.author.firstName} ${book.author.lastName}`,
                isbn: book.isbn,
                description: book.description,
                shelf: book.shelf
                    ? shelvesMap[book.shelf] || book.shelf
                    : 'Non classé', // Utiliser le nom de l'étagère
                publicationDate: book.date,
                jacket: book.jacket, // Nom du fichier jacket de l'API
            }));

            setBooks(transformedBooks);
        } catch (err) {
            console.error('Erreur lors du chargement des livres:', err);
            setError(
                "Impossible de charger les livres. Vérifiez que l'API est démarrée."
            );

            // En cas d'erreur, utiliser des données de fallback
            setBooks([
                {
                    id: '1',
                    title: 'Exemple de livre',
                    author: 'Auteur Test',
                    isbn: '978-2-07-040850-1',
                    description:
                        "Livre d'exemple en attendant la connexion à l'API.",
                    shelf: 'Fiction',
                    publicationDate: '2023-01-01',
                    coverUrl: '',
                    status: 'unread',
                    pageCount: 200,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const querySearchTerm = params.get('search');
        if (querySearchTerm) {
            setSearchTerm(querySearchTerm);
        }
    }, [location.search]);

    useEffect(() => {
        loadBooks();
    }, []);

    const handleAddBook = async (newBook) => {
        try {
            // Déboguer les données reçues
            //console.log('Données reçues du formulaire:', newBook);

            // Préparer les données pour l'API avec les IDs
            const bookDataForApi = {
                title: newBook.title,
                author: newBook.authorId, // API attend 'author' avec l'ID
                isbn: newBook.isbn,
                description: newBook.description,
                date: newBook.publicationDate,
                jacket: newBook.coverUrl || null, // Utiliser null au lieu d'undefined
                shelf: newBook.shelfId || null, // API attend 'shelf' avec l'ID ou null
            };

            //console.log("Données envoyées à l'API:", bookDataForApi);

            // Appeler l'API pour créer le livre
            const response = await booksService.createBook(bookDataForApi);
            //console.log('Livre créé via API:', response);

            // Recharger la liste des livres pour avoir les données complètes
            await loadBooks();

            toast({
                title: 'Succès - Livre ajouté !',
                description: `"${newBook.title}" a été ajouté avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error('Erreur lors de la création du livre:', error);
            toast({
                title: `Erreur - Impossible d'ajouter le livre`,
                description: `${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleUpdateBook = (updatedBook) => {
        // TODO: Appeler l'API pour mettre à jour le livre
        console.log('Mise à jour de livre via API à implémenter:', updatedBook);

        // Pour l'instant, on met à jour localement
        const updatedBooks = books.map((book) =>
            book.id === updatedBook.id ? updatedBook : book
        );
        setBooks(updatedBooks);

        toast({
            title: 'Livre mis à jour!',
            description: `${updatedBook.title} a été mis à jour (temporairement).`,
        });
    };

    const filteredBooks = books
        .filter(
            (book) =>
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (book.isbn &&
                    book.isbn.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => a.title.localeCompare(b.title));

    const handleLetterScroll = (char) => {
        let firstBookWithChar;

        if (char === '#') {
            // Trouver le premier livre qui ne commence pas par une lettre
            firstBookWithChar = filteredBooks.find((book) => {
                const firstChar = book.title.charAt(0).toUpperCase();
                return !/^[A-Z]$/.test(firstChar);
            });
        } else {
            // Trouver le premier livre qui commence par la lettre spécifiée
            firstBookWithChar = filteredBooks.find((book) =>
                book.title.toUpperCase().startsWith(char)
            );
        }

        if (firstBookWithChar && bookRefs.current[firstBookWithChar.id]) {
            const element = bookRefs.current[firstBookWithChar.id];
            const headerHeight = 64; // 4rem = 64px (hauteur du header h-16)
            const extraOffset = 16; // 1rem = 16px (marge supplémentaire)
            const totalOffset = headerHeight + extraOffset;

            // Calculer la position de l'élément par rapport au top de la page
            const elementPosition =
                element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - totalOffset;

            // Scroll avec l'offset
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        } else {
            const description =
                char === '#'
                    ? 'Aucun livre ne commence par un chiffre ou caractère spécial.'
                    : `Aucun livre ne commence par la lettre ${char}.`;
            toast({
                title: 'Aucun livre',
                description,
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold main-title-text">
                    Gestion des Livres
                </h1>
            </div>
            <SearchBar
                placeholder="Rechercher par titre, auteur ou ISBN..."
                value={searchTerm}
                onChange={(value) => {
                    setSearchTerm(value);
                    // Update URL without navigating
                    const newUrl = value
                        ? `/?search=${encodeURIComponent(value)}`
                        : '/';
                    window.history.replaceState({}, '', newUrl);
                }}
            />
            <AlphabeticalScroller onLetterClick={handleLetterScroll} />

            {/* Indicateur de chargement */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Chargement des livres...
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
                        onClick={loadBooks}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredBooks.length > 0 ? (
                        filteredBooks.map((book, index) => (
                            <div
                                key={book.id}
                                ref={(el) => (bookRefs.current[book.id] = el)}
                                className="h-full"
                            >
                                <BookCard
                                    book={book}
                                    index={index}
                                    onClick={() => setSelectedBook(book)}
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
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Aucun livre trouvé
                            </h3>
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? 'Aucun livre ne correspond à votre recherche.'
                                    : 'Commencez par ajouter votre premier livre !'}
                            </p>
                        </motion.div>
                    )}
                </div>
            )}
            <FloatingButton onClick={() => setIsAddDialogOpen(true)} />
            <AddBookDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddBook={handleAddBook}
            />
            {selectedBook && (
                <BookDetailDialog
                    book={selectedBook}
                    open={!!selectedBook}
                    onOpenChange={() => setSelectedBook(null)}
                    onUpdateBook={handleUpdateBook}
                />
            )}
        </div>
    );
};

export default BooksPage;
