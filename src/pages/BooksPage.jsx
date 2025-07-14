import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Dices } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import BookCard from '@/components/BookCard';
import FloatingButton from '@/components/FloatingButton';
import FullscreenToggle from '@/components/FullscreenToggle';
import BookDialog from '@/components/BookDialog';
import BookDetailDialog from '@/components/BookDetailDialog';
import AlphabeticalScroller from '@/components/AlphabeticalScroller';
import { toast } from '@/components/ui/use-toast';
import { booksService, shelvesService, authorsService } from '@/services/api';

const BooksPage = ({ initialSearchTerm }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookToEdit, setBookToEdit] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [authorsMap, setAuthorsMap] = useState({});
    const [shelvesMap, setShelvesMap] = useState({});
    const location = useLocation();
    const bookRefs = useRef({});

    // Charger les livres depuis l'API
    const loadBooks = async () => {
        try {
            setLoading(true);
            setError(null);

            // Charger les livres, les étagères et les auteurs en parallèle
            const [booksResponse, shelvesResponse, authorsResponse] =
                await Promise.all([
                    booksService.getBooks(1),
                    shelvesService.getShelves(1),
                    authorsService.getAuthors(1),
                ]);

            // Créer un mapping ID étagère -> informations étagère
            const shelvesMap = {};
            const shelvesInfoMap = {}; // Pour stocker les infos complètes incluant location
            shelvesResponse.forEach((shelf) => {
                shelvesMap[shelf.id] = shelf.name;
                shelvesInfoMap[shelf.id] = shelf; // Stocker l'objet complet
            });

            // Créer un mapping ID auteur -> nom complet auteur
            const authorsMap = {};
            authorsResponse.forEach((author) => {
                authorsMap[author.id] =
                    `${author.firstName} ${author.lastName}`;
            });

            // Transformer les données API vers le format attendu par l'interface
            const transformedBooks = booksResponse.map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author
                    ? authorsMap[book.author] || book.author
                    : 'Auteur inconnu', // Utiliser le nom complet de l'auteur
                authorId: book.author, // Conserver l'ID original pour l'édition
                isbn: book.isbn,
                description: book.description,
                shelf: book.shelf
                    ? shelvesMap[book.shelf] || book.shelf
                    : 'Non classé', // Utiliser le nom de l'étagère
                shelfId: book.shelf, // Conserver l'ID original pour l'édition
                shelfLocation:
                    book.shelf && shelvesInfoMap[book.shelf]
                        ? shelvesInfoMap[book.shelf].location
                        : null, // Ajouter la location de l'étagère
                publicationDate: book.date,
                jacket: book.jacket, // Nom du fichier jacket de l'API
            }));

            setBooks(transformedBooks);
            // Sauvegarder les mappings pour les réutiliser lors des updates
            setAuthorsMap(authorsMap);
            setShelvesMap(shelvesMap);
        } catch (err) {
            console.error('Erreur lors du chargement des livres:', err);
            setError(
                "Impossible de charger les livres. Vérifiez que l'API est démarrée."
            );
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

    // Fonction pour supprimer un livre de la liste locale
    const handleBookDelete = (deletedBookId) => {
        setBooks((prevBooks) =>
            prevBooks.filter((book) => book.id !== deletedBookId)
        );
    };

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
                date: newBook.publicationDate || null, // Utiliser null si pas de date
                jacket: newBook.coverUrl || null, // Utiliser null au lieu d'undefined
                shelf: newBook.shelfId || null, // API attend 'shelf' avec l'ID ou null
            };

            //console.log("Données envoyées à l'API:", bookDataForApi);

            // Appeler l'API pour créer le livre
            const response = await booksService.createBook(bookDataForApi);
            console.log('Livre créé via API:', response);

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

    const handleEditBook = (book) => {
        setBookToEdit(book);
        setIsEditDialogOpen(true);
    };

    const handleUpdateBook = async (updatedBookData) => {
        try {
            // Préparer les données pour l'API avec les IDs (la jacket n'est pas modifiable puisqu'il s'agit du lien vers le fichier, il faut passer par un autre endpoint pour changer la couverture)
            const bookDataForApi = {
                title: updatedBookData.title,
                author: updatedBookData.authorId, // API attend 'author' avec l'ID
                isbn: updatedBookData.isbn,
                description: updatedBookData.description,
                date: updatedBookData.publicationDate || null, // Utiliser null si pas de date
                shelf: updatedBookData.shelfId || null, // API attend 'shelf' avec l'ID ou null
            };

            // Appeler l'API pour mettre à jour le livre
            const response = await booksService.updateBook(
                updatedBookData.id,
                bookDataForApi
            );
            console.log('Livre mis à jour via API:', response);

            // Mise à jour locale optimisée en utilisant les mappings déjà chargés
            const updatedBooks = books.map((book) =>
                book.id === updatedBookData.id
                    ? {
                          ...book,
                          title: updatedBookData.title,
                          isbn: updatedBookData.isbn,
                          description: updatedBookData.description,
                          publicationDate: updatedBookData.publicationDate,
                          authorId: updatedBookData.authorId,
                          shelfId: updatedBookData.shelfId,
                          // Recalculer les noms affichés avec les mappings existants
                          author: updatedBookData.authorId
                              ? authorsMap[updatedBookData.authorId] ||
                                updatedBookData.authorId
                              : 'Auteur inconnu',
                          shelf: updatedBookData.shelfId
                              ? shelvesMap[updatedBookData.shelfId] ||
                                updatedBookData.shelfId
                              : 'Non classé',
                      }
                    : book
            );

            setBooks(updatedBooks);

            toast({
                title: 'Succès - Livre modifié !',
                description: `"${updatedBookData.title}" a été modifié avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error('Erreur lors de la modification du livre:', error);
            toast({
                title: `Erreur - Impossible de modifier le livre`,
                description: `${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleRandomBook = () => {
        // Utiliser les livres filtrés pour respecter la recherche actuelle
        if (filteredBooks.length === 0) {
            toast({
                title: 'Aucun livre disponible',
                description:
                    "Il n'y a aucun livre à sélectionner aléatoirement.",
                variant: 'destructive',
            });
            return;
        }

        // Sélectionner un livre aléatoire
        const randomIndex = Math.floor(Math.random() * filteredBooks.length);
        const randomBook = filteredBooks[randomIndex];

        // Afficher le détail du livre
        setSelectedBook(randomBook);
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
                rightIcon={<Dices className="h-6 w-6" />}
                onRightIconClick={handleRandomBook}
                rightIconTitle="Livre aléatoire"
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
                                    onDelete={handleBookDelete}
                                    onEdit={handleEditBook}
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

            <FullscreenToggle />

            <BookDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddBook={handleAddBook}
                mode="add"
            />

            <BookDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setBookToEdit(null);
                    }
                }}
                onUpdateBook={handleUpdateBook}
                bookToEdit={bookToEdit}
                mode="edit"
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
