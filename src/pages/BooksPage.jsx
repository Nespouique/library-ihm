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

const generateRandomString = (length) => {
    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result.trim();
};

const generateRandomBook = (id, authors) => {
    const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
    return {
        id: id.toString(),
        title: `Livre ${generateRandomString(5)} ${generateRandomString(8)}`,
        author: `${randomAuthor.firstName} ${randomAuthor.lastName}`,
        isbn: `${Math.floor(Math.random() * 9000000000000) + 1000000000000}`,
        description: `Description aléatoire du livre ${id} avec quelques mots pour remplir l'espace.`,
        shelf: `Étagère ${generateRandomString(3)}`,
        publicationDate: `20${Math.floor(Math.random() * 20) + 0}${Math.floor(Math.random() * 9)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 20) + 10}`,
        coverUrl: '',
        status: ['read', 'reading', 'unread'][Math.floor(Math.random() * 3)],
        pageCount: Math.floor(Math.random() * 500) + 50,
    };
};

const BooksPage = ({ initialSearchTerm }) => {
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const bookRefs = useRef({});

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const querySearchTerm = params.get('search');
        if (querySearchTerm) {
            setSearchTerm(querySearchTerm);
        }
    }, [location.search]);

    useEffect(() => {
        const savedBooks = localStorage.getItem('library-books');
        const savedAuthors = localStorage.getItem('library-authors');
        let authorsData = [];
        if (savedAuthors) {
            authorsData = JSON.parse(savedAuthors);
        }

        if (savedBooks) {
            setBooks(JSON.parse(savedBooks));
        } else {
            const sampleBooks = [
                {
                    id: '1',
                    title: 'Petit Prince',
                    author: 'Antoine de Saint-Exupéry',
                    isbn: '978-2-07-040850-1',
                    description:
                        "Un conte poétique et philosophique sous l'apparence d'un conte pour enfants.",
                    shelf: 'Fiction',
                    publicationDate: '1943-04-06',
                    coverUrl: '',
                    status: 'read',
                    pageCount: 96,
                },
                {
                    id: '2',
                    title: '1984',
                    author: 'George Orwell',
                    isbn: '978-0-452-28423-4',
                    description:
                        'Un roman dystopique qui dépeint une société totalitaire.',
                    shelf: 'Science-Fiction',
                    publicationDate: '1949-06-08',
                    coverUrl: '',
                    status: 'reading',
                    pageCount: 328,
                },
                {
                    id: '3',
                    title: "Zatsby le Magnifique, un roman qui explore les thèmes du rêve américain, de la richesse, de l'amour et de la perte dans les années 1920.",
                    author: 'F. Scott Fitzgerald',
                    isbn: '978-0743273565',
                    description:
                        'Un roman sur le rêve américain et la décadence des années 20.',
                    shelf: 'Classiques Américains du XXe Siècle',
                    publicationDate: '1925-04-10',
                    coverUrl: '',
                    status: 'unread',
                    pageCount: 180,
                },
            ];

            const generatedBooks = Array.from({ length: 50 }, (_, i) =>
                generateRandomBook(
                    i + 4,
                    authorsData.length > 0
                        ? authorsData
                        : [{ firstName: 'Auteur', lastName: 'Aléatoire' }]
                )
            );
            const allBooks = [...sampleBooks, ...generatedBooks];
            setBooks(allBooks.sort((a, b) => a.title.localeCompare(b.title)));
            localStorage.setItem('library-books', JSON.stringify(allBooks));
        }
    }, []);

    const handleAddBook = (newBook) => {
        const updatedBooks = [...books, newBook].sort((a, b) =>
            a.title.localeCompare(b.title)
        );
        setBooks(updatedBooks);
        localStorage.setItem('library-books', JSON.stringify(updatedBooks));
    };

    const handleUpdateBook = (updatedBook) => {
        const updatedBooks = books.map((book) =>
            book.id === updatedBook.id ? updatedBook : book
        );
        setBooks(updatedBooks);
        localStorage.setItem('library-books', JSON.stringify(updatedBooks));
        toast({
            title: 'Livre mis à jour!',
            description: `${updatedBook.title} a été mis à jour.`,
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
