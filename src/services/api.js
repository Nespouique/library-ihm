// Configuration de base pour l'API
const API_BASE_URL = '/api'; // Utilise le proxy Vite

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
    async getAuthors(page = 1) {
        return this.fetchJson(`/authors?page=${page}`);
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
    async getBooks(page = 1) {
        return this.fetchJson(`/books?page=${page}`);
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
}

// Service pour les étagères
export class ShelvesService extends ApiService {
    async getShelves(page = 1) {
        return this.fetchJson(`/shelves?page=${page}`);
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

// Instances des services
export const authorsService = new AuthorsService();
export const booksService = new BooksService();
export const shelvesService = new ShelvesService();
