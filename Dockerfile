# Multi-stage build pour optimiser la taille de l'image finale
FROM node:18-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances avec --legacy-peer-deps pour éviter les conflits ESLint
RUN npm ci --legacy-peer-deps

# Copier le code source
COPY . .

# Construire l'application avec les variables d'environnement
RUN npm run build

# Stage de production avec Nginx
FROM nginx:alpine

# Copier les fichiers buildés depuis le stage précédent
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la configuration Nginx comme template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Exposer le port 80
EXPOSE 80

# Commande par défaut
CMD ["nginx", "-g", "daemon off;"]
