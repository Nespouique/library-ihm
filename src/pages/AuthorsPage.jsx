import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import AuthorCard from '@/components/AuthorCard';
import FloatingButton from '@/components/FloatingButton';
import AddAuthorDialog from '@/components/AddAuthorDialog';
import AuthorDetailDialog from '@/components/AuthorDetailDialog';
import AlphabeticalScroller from '@/components/AlphabeticalScroller';
import { toast } from '@/components/ui/use-toast';

const generateRandomNamePart = (length) => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const generateRandomAuthor = (id) => {
    return {
        id: id.toString(),
        firstName: generateRandomNamePart(Math.floor(Math.random() * 5) + 3),
        lastName: generateRandomNamePart(Math.floor(Math.random() * 7) + 4),
        bookCount: Math.floor(Math.random() * 10),
        birthDate: `19${Math.floor(Math.random() * 80) + 10}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 20) + 10}`,
        deathDate:
            Math.random() > 0.3
                ? `20${Math.floor(Math.random() * 20)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 20) + 10}`
                : null,
    };
};

const AuthorsPage = () => {
    const [authors, setAuthors] = useState([]);
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const navigate = useNavigate();
    const authorRefs = useRef({});

    useEffect(() => {
        const savedAuthors = localStorage.getItem('library-authors');
        if (savedAuthors) {
            setAuthors(JSON.parse(savedAuthors));
        } else {
            const sampleAuthors = [
                {
                    id: '1',
                    firstName: 'Antoine',
                    lastName: 'de Saint-Exupéry',
                    bookCount: 1,
                    birthDate: '1900-06-29',
                    deathDate: '1944-07-31',
                },
                {
                    id: '2',
                    firstName: 'George',
                    lastName: 'Orwell',
                    bookCount: 1,
                    birthDate: '1903-06-25',
                    deathDate: '1950-01-21',
                },
                {
                    id: '3',
                    firstName: 'F. Scott',
                    lastName:
                        "Fitzgerald, un auteur américain connu pour ses romans sur l'âge du jazz",
                    bookCount: 1,
                    birthDate: '1896-09-24',
                    deathDate: '1940-12-21',
                },
            ];
            const generatedAuthors = Array.from({ length: 50 }, (_, i) =>
                generateRandomAuthor(i + 4)
            );
            const allAuthors = [...sampleAuthors, ...generatedAuthors];
            setAuthors(
                allAuthors.sort((a, b) =>
                    `${a.lastName} ${a.firstName}`.localeCompare(
                        `${b.lastName} ${b.firstName}`
                    )
                )
            );
            localStorage.setItem('library-authors', JSON.stringify(allAuthors));
        }

        const savedBooks = localStorage.getItem('library-books');
        if (savedBooks) {
            setBooks(JSON.parse(savedBooks));
        }
    }, []);

    const handleAddAuthor = (newAuthor) => {
        const updatedAuthors = [...authors, newAuthor].sort((a, b) =>
            `${a.lastName} ${a.firstName}`.localeCompare(
                `${b.lastName} ${b.firstName}`
            )
        );
        setAuthors(updatedAuthors);
        localStorage.setItem('library-authors', JSON.stringify(updatedAuthors));
    };

    const filteredAuthors = authors
        .filter((author) =>
            `${author.firstName} ${author.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        )
        .sort((a, b) =>
            `${a.lastName} ${a.firstName}`.localeCompare(
                `${b.lastName} ${b.firstName}`
            )
        );

    const handleLetterScroll = (char) => {
        let firstAuthorWithChar;

        if (char === '#') {
            // Trouver le premier auteur dont le nom ne commence pas par une lettre
            firstAuthorWithChar = filteredAuthors.find((author) => {
                const firstChar = author.lastName.charAt(0).toUpperCase();
                return !/^[A-Z]$/.test(firstChar);
            });
        } else {
            // Trouver le premier auteur dont le nom commence par la lettre spécifiée
            firstAuthorWithChar = filteredAuthors.find((author) =>
                author.lastName.toUpperCase().startsWith(char)
            );
        }

        if (firstAuthorWithChar && authorRefs.current[firstAuthorWithChar.id]) {
            const element = authorRefs.current[firstAuthorWithChar.id];
            const headerHeight = 64; // 4rem = 64px (hauteur du header h-16)
            const extraOffset = 16; // 1rem = 16px (marge supplémentaire)
            const totalOffset = headerHeight + extraOffset;
            
            // Calculer la position de l'élément par rapport au top de la page
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - totalOffset;
            
            // Scroll avec l'offset
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } else {
            const description =
                char === '#'
                    ? 'Aucun auteur dont le nom commence par un chiffre ou caractère spécial.'
                    : `Aucun auteur dont le nom commence par ${char}.`;
            toast({
                title: 'Aucun auteur',
                description,
                variant: 'destructive',
            });
        }
    };

    const getAuthorBooks = (author) => {
        const authorFullName = `${author.firstName} ${author.lastName}`;
        return books.filter((book) => book.author === authorFullName);
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-bold main-title-text">
                    Gestion des Auteurs
                </h1>
            </div>
            <SearchBar
                placeholder="Rechercher un auteur..."
                value={searchTerm}
                onChange={setSearchTerm}
            />
            <AlphabeticalScroller onLetterClick={handleLetterScroll} />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAuthors.length > 0 ? (
                    filteredAuthors.map((author, index) => (
                        <div
                            key={author.id}
                            ref={(el) => (authorRefs.current[author.id] = el)}
                            className="h-full"
                        >
                            <AuthorCard
                                author={author}
                                index={index}
                                onClick={() => setSelectedAuthor(author)}
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
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            Aucun auteur trouvé
                        </h3>
                        <p className="text-muted-foreground">
                            {searchTerm
                                ? 'Aucun auteur ne correspond à votre recherche.'
                                : 'Commencez par ajouter votre premier auteur !'}
                        </p>
                    </motion.div>
                )}
            </div>
            <FloatingButton onClick={() => setIsAddDialogOpen(true)} />
            <AddAuthorDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddAuthor={handleAddAuthor}
            />
            {selectedAuthor && (
                <AuthorDetailDialog
                    author={selectedAuthor}
                    books={getAuthorBooks(selectedAuthor)}
                    open={!!selectedAuthor}
                    onOpenChange={() => setSelectedAuthor(null)}
                    onNavigateToBooks={(authorName) => {
                        setSelectedAuthor(null);
                        navigate(`/?search=${encodeURIComponent(authorName)}`);
                    }}
                />
            )}
        </div>
    );
};

export default AuthorsPage;
