// Configuration de base pour l'API
const API_BASE_URL = '/api'; // Utilise le proxy Vite

// Service de base pour les appels API
class ApiService {
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    async fetchJson(endpoint) {
        const response = await fetch(`${this.baseUrl}${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
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
}

// Service pour les livres
export class BooksService extends ApiService {
    async getBooks(page = 1) {
        return this.fetchJson(`/books?page=${page}`);
    }

    async getBook(id) {
        return this.fetchJson(`/books/${id}`);
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
}

// Instances des services
export const authorsService = new AuthorsService();
export const booksService = new BooksService();
export const shelvesService = new ShelvesService();
