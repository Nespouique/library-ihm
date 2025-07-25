import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SearchBar from '@/components/SearchBar';
import AuthorCard from '@/components/AuthorCard';
import FloatingButton from '@/components/FloatingButton';
import FullscreenToggle from '@/components/FullscreenToggle';
import AuthorDialog from '@/components/AuthorDialog';
import AuthorDetailDialog from '@/components/AuthorDetailDialog';
import AlphabeticalScroller from '@/components/AlphabeticalScroller';
import { toast } from '@/components/ui/use-toast';
import { authorsService, booksService } from '@/services/api';

const AuthorsPage = () => {
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [books, setBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [authorToEdit, setAuthorToEdit] = useState(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const navigate = useNavigate();
    const authorRefs = useRef({});

    // Fonction réutilisable pour trier les auteurs par nom (Nom, Prénom)
    const sortAuthors = (authorsArray) => {
        return [...authorsArray].sort((a, b) => {
            const nameA = `${a.lastName} ${a.firstName}`.toLowerCase().trim();
            const nameB = `${b.lastName} ${b.firstName}`.toLowerCase().trim();
            return nameA.localeCompare(nameB);
        });
    };

    // Charger les auteurs depuis l'API et calculer le nombre de livres
    const loadAuthors = useCallback(async (booksData = []) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authorsService.getAuthors(1);

            // Transformer les données API vers le format attendu par l'interface
            const transformedAuthors = response.map((author) => {
                // Calculer le nombre de livres pour cet auteur
                const authorBookCount = booksData.filter(
                    (book) => book.author === author.id
                ).length;

                return {
                    id: author.id,
                    firstName: author.firstName,
                    lastName: author.lastName,
                    bookCount: authorBookCount,
                    birthDate: null, // Pas dans l'API pour le moment
                    deathDate: null, // Pas dans l'API pour le moment
                };
            });

            setAuthors(sortAuthors(transformedAuthors));
        } catch (err) {
            console.error('Erreur lors du chargement des auteurs:', err);
            setError(
                "Impossible de charger les auteurs. Vérifiez que l'API est démarrée."
            );
        } finally {
            setLoading(false);
        }
    }, []); // Pas de dépendances car utilise setAuthors, setLoading, setError

    // Charger les livres depuis l'API
    const loadBooks = async () => {
        try {
            const response = await booksService.getBooks(1);
            // Transformer les données API vers le format attendu par l'interface
            const transformedBooks = response.map((book) => ({
                id: book.id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                description: book.description,
                shelf: book.shelf || 'Non classé',
                publicationDate: book.date,
                coverUrl: book.jacket || '',
                status: 'unread',
                pageCount: Math.floor(Math.random() * 500) + 50,
            }));
            setBooks(transformedBooks);
            return transformedBooks; // Retourner les données pour calcul
        } catch (err) {
            console.error('Erreur lors du chargement des livres:', err);
            // En cas d'erreur, garder un tableau vide
            setBooks([]);
            return []; // Retourner tableau vide
        }
    };

    useEffect(() => {
        const loadData = async () => {
            // Charger d'abord les livres
            const booksData = await loadBooks();
            // Puis charger les auteurs avec le bon compteur de livres
            await loadAuthors(booksData);
        };

        loadData();
    }, [loadAuthors]); // Ajouter loadAuthors dans les dépendances

    // Fonction pour supprimer un auteur de la liste locale
    const handleAuthorDelete = (deletedAuthorId) => {
        setAuthors((prevAuthors) =>
            prevAuthors.filter((author) => author.id !== deletedAuthorId)
        );
    };

    // Fonctions utilitaires pour normaliser les noms
    const normalizeFirstName = (firstName) => {
        if (!firstName) return '';
        return firstName
            .toLowerCase()
            .split(/(\s+|-)/) // Diviser sur espaces ET traits d'union
            .map((part) => {
                // Si c'est un séparateur (espace ou trait d'union), le retourner tel quel
                if (/^\s+$/.test(part) || part === '-') return part;
                // Sinon, capitaliser la première lettre
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join('');
    };

    const normalizeLastName = (lastName) => {
        if (!lastName) return '';
        return lastName.toUpperCase();
    };

    const handleAddAuthor = async (newAuthor) => {
        try {
            // Normaliser les noms avant l'envoi à l'API
            const normalizedAuthor = {
                ...newAuthor,
                firstName: normalizeFirstName(newAuthor.firstName),
                lastName: normalizeLastName(newAuthor.lastName),
            };

            // Appeler l'API pour créer l'auteur
            const response =
                await authorsService.createAuthor(normalizedAuthor);
            console.log('Auteur créé via API:', response);

            // Recharger la liste des auteurs pour avoir les données complètes
            const booksData = await loadBooks();
            await loadAuthors(booksData);

            toast({
                title: 'Succès - Auteur ajouté !',
                description: `${normalizedAuthor.firstName} ${normalizedAuthor.lastName} a été ajouté(e) avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'auteur:", error);
            toast({
                title: `Erreur - Impossible d'ajouter l'auteur`,
                description: `${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const handleEditAuthor = (author) => {
        setAuthorToEdit(author);
        setIsEditDialogOpen(true);
    };

    const handleUpdateAuthor = async (updatedAuthorData) => {
        try {
            // Normaliser les noms avant l'envoi à l'API
            const normalizedAuthor = {
                firstName: normalizeFirstName(updatedAuthorData.firstName),
                lastName: normalizeLastName(updatedAuthorData.lastName),
            };

            // Appeler l'API pour mettre à jour l'auteur
            const response = await authorsService.updateAuthor(
                updatedAuthorData.id,
                normalizedAuthor
            );
            console.log('Auteur mis à jour via API:', response);

            // Recharger la liste des auteurs pour avoir les données complètes
            const booksData = await loadBooks();
            await loadAuthors(booksData);

            toast({
                title: 'Succès - Auteur modifié !',
                description: `${normalizedAuthor.firstName} ${normalizedAuthor.lastName} a été modifié(e) avec succès.`,
                variant: 'success',
            });
        } catch (error) {
            console.error(
                "Erreur lors de la modification de l'auteur : ",
                error
            );
            toast({
                title: `Erreur - Impossible de modifier l'auteur`,
                description: `${error.message}`,
                variant: 'destructive',
            });
        }
    };

    const filteredAuthors = authors.filter((author) =>
        `${author.firstName} ${author.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
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
        // Utiliser l'ID de l'auteur pour un matching exact et trier par titre
        const authorBooks = books.filter((book) => book.author === author.id);
        return authorBooks.sort((a, b) => a.title.localeCompare(b.title));
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

            {/* Indicateur de chargement */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                        Chargement des auteurs...
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
                        onClick={loadAuthors}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        Réessayer
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAuthors.length > 0 ? (
                        filteredAuthors.map((author, index) => (
                            <div
                                key={author.id}
                                ref={(el) =>
                                    (authorRefs.current[author.id] = el)
                                }
                                className="h-full"
                            >
                                <AuthorCard
                                    author={author}
                                    index={index}
                                    onClick={() => setSelectedAuthor(author)}
                                    onDelete={handleAuthorDelete}
                                    onEdit={handleEditAuthor}
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
            )}

            <FloatingButton onClick={() => setIsAddDialogOpen(true)} />

            <FullscreenToggle />

            <AuthorDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAddAuthor={handleAddAuthor}
                mode="add"
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

            <AuthorDialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setAuthorToEdit(null);
                    }
                }}
                onUpdateAuthor={handleUpdateAuthor}
                authorToEdit={authorToEdit}
                mode="edit"
            />
        </div>
    );
};

export default AuthorsPage;
