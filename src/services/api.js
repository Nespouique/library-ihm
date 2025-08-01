// Configuration de base pour l'API
const API_BASE_URL = '/api';
const GOOGLE_BOOKS_BASE_URL = 'https://www.googleapis.com/books/v1';
const OPEN_LIBRARY_BASE_URL = 'https://openlibrary.org';

// Classe utilitaire pour la validation des ISBN
class ISBNValidator {
    static cleanISBN(isbn) {
        // Supprimer tous les caractères non numériques sauf X
        return isbn.replace(/[^0-9X]/gi, '');
    }

    static isValidISBN(isbn) {
        if (!isbn) return false;

        const cleanISBN = this.cleanISBN(isbn);

        // Vérifier la longueur (ISBN-10 ou ISBN-13)
        if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
            return false;
        }

        // Validation ISBN-13
        if (cleanISBN.length === 13) {
            return this.validateISBN13(cleanISBN);
        }

        // Validation ISBN-10
        if (cleanISBN.length === 10) {
            return this.validateISBN10(cleanISBN);
        }

        return false;
    }

    static validateISBN13(isbn) {
        if (!/^[0-9]{13}$/.test(isbn)) return false;

        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit === parseInt(isbn[12]);
    }

    static validateISBN10(isbn) {
        if (!/^[0-9]{9}[0-9X]$/.test(isbn)) return false;

        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(isbn[i]) * (10 - i);
        }
        const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
        return (sum + checkDigit) % 11 === 0;
    }
}

// Service de base pour les appels API
class ApiService {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    async fetchJson(endpoint, options = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        let data = null;
        try {
            // On tente de lire le body, même en cas d'erreur
            data = await response.json();
        } catch (e) {
            // body vide ou non json
            data = null;
            console.log(
                `Erreur lors de la lecture du JSON pour ${endpoint}:`,
                e
            );
        }

        if (!response.ok) {
            throw new Error(
                `API Error: ${response.status} ${response.statusText} ${data?.message ? ' - ' + data.message : ''}`
            );
        }

        return data;
    }

    async postJson(endpoint, data) {
        return this.fetchJson(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async putJson(endpoint, data) {
        return this.fetchJson(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteJson(endpoint) {
        return this.fetchJson(endpoint, {
            method: 'DELETE',
        });
    }
}

// Service pour les auteurs
export class AuthorsService extends ApiService {
    async getAuthors() {
        return this.fetchJson(`/authors`);
    }

    async getAuthor(id) {
        return this.fetchJson(`/authors/${id}`);
    }

    async createAuthor(authorData) {
        return this.postJson('/authors', authorData);
    }

    async updateAuthor(id, authorData) {
        return this.putJson(`/authors/${id}`, authorData);
    }

    async deleteAuthor(id) {
        return this.deleteJson(`/authors/${id}`);
    }
}

// Service pour les livres
export class BooksService extends ApiService {
    async getBooks() {
        return this.fetchJson(`/books`);
    }

    async getBook(id) {
        return this.fetchJson(`/books/${id}`);
    }

    async createBook(bookData) {
        return this.postJson('/books', bookData);
    }

    async updateBook(id, bookData) {
        return this.putJson(`/books/${id}`, bookData);
    }

    async deleteBook(id) {
        return this.deleteJson(`/books/${id}`);
    }

    // Nouvelles méthodes pour la gestion des jaquettes

    /**
     * Upload une jaquette pour un livre via FormData
     * @param {string} bookId - L'ID du livre
     * @param {File|Blob} imageFile - Le fichier image à uploader
     * @returns {Promise} - La réponse de l'API
     */
    async uploadJacket(bookId, imageFile) {
        const formData = new FormData();
        formData.append('jacket', imageFile);

        const response = await fetch(`${this.baseUrl}/books/${bookId}/jacket`, {
            method: 'POST',
            body: formData,
        });

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            console.log(
                `Erreur lors de la lecture du JSON pour l'upload de jaquette:`,
                e
            );
        }

        if (!response.ok) {
            throw new Error(
                `API Error: ${response.status} ${response.statusText} ${data?.message ? ' - ' + data.message : ''}`
            );
        }

        return data;
    }

    /**
     * Télécharge une image depuis une URL et la convertit en Blob
     * @param {string} imageUrl - L'URL de l'image à télécharger
     * @returns {Promise<Blob>} - Le blob de l'image
     */
    async downloadImageAsBlob(imageUrl) {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(
                `Impossible de télécharger l'image: ${response.status} ${response.statusText}`
            );
        }
        return await response.blob();
    }

    /**
     * Télécharge automatiquement une jaquette depuis OpenLibrary et l'upload sur le serveur
     * @param {string} bookId - L'ID du livre
     * @param {string} isbn - L'ISBN du livre pour récupérer la jaquette
     * @returns {Promise<boolean>} - true si réussi, false sinon
     */
    async downloadAndUploadJacketFromOpenLibrary(bookId, isbn) {
        try {
            // Nettoyer l'ISBN (supprimer les tirets et espaces)
            const cleanISBN = isbn.replace(/[^0-9X]/gi, '');

            // Construire l'URL de la jaquette OpenLibrary (taille L pour large)
            const openLibraryImageUrl = `https://covers.openlibrary.org/b/isbn/${cleanISBN}-L.jpg`;

            console.log(
                `Tentative de téléchargement de jaquette depuis: ${openLibraryImageUrl}`
            );

            // Télécharger l'image depuis OpenLibrary
            const imageBlob =
                await this.downloadImageAsBlob(openLibraryImageUrl);

            // Vérifier que l'image n'est pas le placeholder par défaut d'OpenLibrary
            // (OpenLibrary renvoie parfois une petite image de 1x1 pixel ou très petite)
            if (imageBlob.size < 1000) {
                // Moins de 1KB probablement un placeholder
                console.log('Image trop petite, probablement un placeholder');
                return false;
            }

            // Créer un objet File à partir du Blob
            const imageFile = new File([imageBlob], `jacket_${cleanISBN}.jpg`, {
                type: 'image/jpeg',
            });

            // Uploader l'image vers le serveur library-ws
            const uploadResult = await this.uploadJacket(bookId, imageFile);
            console.log('Jaquette uploadée avec succès:', uploadResult);

            return true;
        } catch (error) {
            console.log(
                `Impossible de télécharger/uploader la jaquette pour l'ISBN ${isbn}:`,
                error.message
            );
            return false;
        }
    }

    /**
     * Crée un livre et tente automatiquement de télécharger sa jaquette depuis OpenLibrary
     * @param {Object} bookData - Les données du livre
     * @returns {Promise<{book: Object, jacketDownloaded: boolean}>} - Le livre créé et si la jaquette a été téléchargée
     */
    async createBookWithAutoJacket(bookData) {
        // Créer d'abord le livre
        const createdBook = await this.createBook(bookData);

        // Si le livre a été créé avec succès et qu'on a un ISBN, essayer de télécharger la jaquette
        if (createdBook && createdBook.id && bookData.isbn) {
            console.log(
                `Tentative de téléchargement automatique de jaquette pour le livre "${createdBook.title}"`
            );

            try {
                // Attendre la fin du téléchargement (synchrone maintenant)
                const jacketSuccess =
                    await this.downloadAndUploadJacketFromOpenLibrary(
                        createdBook.id,
                        bookData.isbn
                    );

                if (jacketSuccess) {
                    console.log(
                        `Jaquette téléchargée automatiquement pour "${createdBook.title}"`
                    );
                } else {
                    console.log(
                        `Aucune jaquette disponible pour "${createdBook.title}"`
                    );
                }

                return {
                    book: createdBook,
                    jacketDownloaded: jacketSuccess,
                };
            } catch (error) {
                console.log(
                    `Erreur lors du téléchargement de jaquette pour "${createdBook.title}":`,
                    error
                );
                return {
                    book: createdBook,
                    jacketDownloaded: false,
                };
            }
        }

        // Pas d'ISBN ou livre non créé
        return {
            book: createdBook,
            jacketDownloaded: false,
        };
    }
}

// Service pour les étagères
export class ShelvesService extends ApiService {
    async getShelves() {
        return this.fetchJson(`/shelves`);
    }

    async getShelf(id) {
        return this.fetchJson(`/shelves/${id}`);
    }

    async createShelf(shelfData) {
        return this.postJson('/shelves', shelfData);
    }

    async updateShelf(id, shelfData) {
        return this.putJson(`/shelves/${id}`, shelfData);
    }

    async deleteShelf(id) {
        return this.deleteJson(`/shelves/${id}`);
    }
}

// Service pour Google Books
export class GoogleBooksService {
    constructor() {
        this.baseUrl = GOOGLE_BOOKS_BASE_URL;
    }

    async searchByISBN(isbn) {
        try {
            const cleanISBN = ISBNValidator.cleanISBN(isbn);
            if (!ISBNValidator.isValidISBN(cleanISBN)) {
                throw new Error('Format ISBN invalide');
            }

            const response = await fetch(
                `${this.baseUrl}/volumes?q=isbn:${cleanISBN}`
            );

            if (!response.ok) {
                throw new Error(`Erreur API Google Books: ${response.status}`);
            }

            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                throw new Error('Aucun livre trouvé pour cet ISBN');
            }

            // Prendre le premier résultat
            const book = data.items[0].volumeInfo;

            return {
                title: book.title || '',
                authors: book.authors || [],
                publishedDate: book.publishedDate || '',
                description: book.description || '',
                publisher: book.publisher || '',
                pageCount: book.pageCount || 0,
                language: book.language || '',
                categories: book.categories || [],
                imageLinks: book.imageLinks || {},
            };
        } catch (error) {
            console.error('Erreur lors de la recherche Google Books:', error);
            throw error;
        }
    }
}

// Service pour Open Library
export class OpenLibraryService {
    constructor() {
        this.baseUrl = OPEN_LIBRARY_BASE_URL;
    }

    async searchByISBN(isbn) {
        try {
            const cleanISBN = ISBNValidator.cleanISBN(isbn);
            if (!ISBNValidator.isValidISBN(cleanISBN)) {
                throw new Error('Format ISBN invalide');
            }

            // Open Library a plusieurs endpoints, on essaie d'abord l'API Books
            const response = await fetch(
                `${this.baseUrl}/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`
            );

            if (!response.ok) {
                throw new Error(`Erreur API Open Library: ${response.status}`);
            }

            const data = await response.json();
            const bookKey = `ISBN:${cleanISBN}`;

            if (!data[bookKey]) {
                throw new Error('Aucun livre trouvé pour cet ISBN');
            }

            const book = data[bookKey];

            // Extraire les auteurs
            const authors = book.authors
                ? book.authors.map((author) => author.name)
                : [];

            // Formater la date de publication
            let publishedDate = '';
            if (book.publish_date) {
                publishedDate = book.publish_date;
            }

            return {
                title: book.title || '',
                authors: authors,
                publishedDate: publishedDate,
                description:
                    book.excerpts && book.excerpts.length > 0
                        ? book.excerpts[0].text
                        : '',
                publisher:
                    book.publishers && book.publishers.length > 0
                        ? book.publishers[0].name
                        : '',
                pageCount: book.number_of_pages || 0,
                language:
                    book.languages && book.languages.length > 0
                        ? book.languages[0].key
                        : '',
                subjects: book.subjects
                    ? book.subjects.map((subject) => subject.name)
                    : [],
                imageLinks: {
                    thumbnail: book.cover ? book.cover.medium : '',
                    smallThumbnail: book.cover ? book.cover.small : '',
                },
            };
        } catch (error) {
            // Ne pas logger comme une erreur si c'est juste une absence de résultat
            // L'erreur sera gérée proprement au niveau supérieur
            throw error;
        }
    }
}

// Service combiné pour rechercher dans plusieurs sources
export class BookMetadataService {
    constructor() {
        this.googleBooks = new GoogleBooksService();
        this.openLibrary = new OpenLibraryService();
    }

    async searchByISBN(isbn) {
        const results = {
            title: '',
            authors: [],
            publishedDate: '',
            description: '',
            publisher: '',
            pageCount: 0,
            language: '',
            categories: [],
            subjects: [],
            imageLinks: {},
            sources: [],
        };

        // Rechercher dans Google Books
        try {
            const googleData = await this.googleBooks.searchByISBN(isbn);
            this.mergeBookData(results, googleData, 'Google Books');
        } catch (error) {
            console.log('Google Books non trouvé:', error.message);
        }

        // Rechercher dans Open Library
        try {
            const openLibraryData = await this.openLibrary.searchByISBN(isbn);
            this.mergeBookData(results, openLibraryData, 'Open Library');
        } catch (error) {
            console.log('Open Library non trouvé:', error.message);
        }

        // Si aucune source n'a donné de résultats
        if (results.sources.length === 0) {
            throw new Error('Aucun livre trouvé dans les sources disponibles');
        }

        return results;
    }

    mergeBookData(results, newData, source) {
        results.sources.push(source);

        // Titre : prendre le premier trouvé ou le plus long
        if (
            !results.title ||
            (newData.title && newData.title.length > results.title.length)
        ) {
            results.title = newData.title;
        }

        // Auteurs : fusionner sans doublons
        if (newData.authors && newData.authors.length > 0) {
            newData.authors.forEach((author) => {
                if (
                    !results.authors.some(
                        (existingAuthor) =>
                            existingAuthor.toLowerCase() ===
                            author.toLowerCase()
                    )
                ) {
                    results.authors.push(author);
                }
            });
        }

        // Date de publication : prendre la plus précise (plus de caractères généralement)
        if (
            !results.publishedDate ||
            (newData.publishedDate &&
                newData.publishedDate.length > results.publishedDate.length)
        ) {
            results.publishedDate = newData.publishedDate;
        }

        // Description : prendre la plus longue
        if (
            !results.description ||
            (newData.description &&
                newData.description.length > results.description.length)
        ) {
            results.description = newData.description;
        }

        // Éditeur : prendre le premier trouvé
        if (!results.publisher && newData.publisher) {
            results.publisher = newData.publisher;
        }

        // Nombre de pages : prendre le plus grand
        if (newData.pageCount && newData.pageCount > results.pageCount) {
            results.pageCount = newData.pageCount;
        }

        // Langue : prendre la première trouvée
        if (!results.language && newData.language) {
            results.language = newData.language;
        }

        // Catégories/Sujets : fusionner
        if (newData.categories) {
            results.categories = [
                ...new Set([...results.categories, ...newData.categories]),
            ];
        }
        if (newData.subjects) {
            results.subjects = [
                ...new Set([...results.subjects, ...newData.subjects]),
            ];
        }

        // Images : prendre les premières trouvées
        if (newData.imageLinks) {
            if (!results.imageLinks.thumbnail && newData.imageLinks.thumbnail) {
                results.imageLinks.thumbnail = newData.imageLinks.thumbnail;
            }
            if (
                !results.imageLinks.smallThumbnail &&
                newData.imageLinks.smallThumbnail
            ) {
                results.imageLinks.smallThumbnail =
                    newData.imageLinks.smallThumbnail;
            }
        }
    }

    cleanISBN(isbn) {
        return ISBNValidator.cleanISBN(isbn);
    }

    isValidISBN(isbn) {
        return ISBNValidator.isValidISBN(isbn);
    }
}

// Instances des services
export const authorsService = new AuthorsService();
export const booksService = new BooksService();
export const shelvesService = new ShelvesService();
export const googleBooksService = new GoogleBooksService();
export const openLibraryService = new OpenLibraryService();
export const bookMetadataService = new BookMetadataService();
