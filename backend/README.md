# API Backend - Plateforme de Réseau Social

## Description
Backend pour une plateforme de réseau social développée avec Node.js, Express et SQLite. Cette API fournit tous les endpoints nécessaires pour gérer les utilisateurs, publications, commentaires et likes avec authentification JWT.

## Technologies utilisées
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Base de données
- **JWT** - Authentification par token
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données

## Installation et configuration

### 1. Installation des dépendances
```bash
npm install
```

### 2. Configuration de l'environnement
Copiez le fichier `.env.example` vers `.env` et modifiez les valeurs selon vos besoins :
```bash
cp .env.example .env
```

### 3. Initialisation de la base de données
```bash
npm run init-db
```

### 4. Démarrage du serveur
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

Le serveur sera accessible sur `http://localhost:3000`

## Structure de l'API

### Authentification
Tous les endpoints (sauf `/register` et `/login`) nécessitent un token JWT dans l'en-tête :
```
Authorization: Bearer <votre_token_jwt>
```

## Endpoints disponibles

### 👤 Utilisateurs (`/api/users`)
- `POST /register` - Inscription d'un nouvel utilisateur
- `POST /login` - Connexion utilisateur
- `GET /profile` - Profil de l'utilisateur connecté
- `GET /profile/:id` - Profil d'un utilisateur spécifique
- `PUT /profile` - Mise à jour du profil
- `GET /` - Liste des utilisateurs (avec recherche)

### 📝 Publications (`/api/posts`)
- `POST /` - Créer une publication
- `GET /` - Récupérer toutes les publications (feed)
- `GET /:id` - Récupérer une publication spécifique
- `GET /user/:userId` - Publications d'un utilisateur
- `PUT /:id` - Modifier une publication (propriétaire uniquement)
- `DELETE /:id` - Supprimer une publication (propriétaire uniquement)

### 💬 Commentaires (`/api/comments`)
- `POST /` - Créer un commentaire
- `GET /post/:postId` - Commentaires d'une publication
- `GET /user/:userId` - Commentaires d'un utilisateur
- `GET /:id` - Récupérer un commentaire spécifique
- `PUT /:id` - Modifier un commentaire (propriétaire uniquement)
- `DELETE /:id` - Supprimer un commentaire (propriétaire uniquement)

### ❤️ Likes (`/api/likes`)
- `POST /post` - Ajouter/retirer un like sur une publication
- `POST /comment` - Ajouter/retirer un like sur un commentaire
- `GET /post/:postId` - Likes d'une publication
- `GET /comment/:commentId` - Likes d'un commentaire
- `GET /user/:userId/posts` - Publications likées par un utilisateur

## Exemples d'utilisation

### Inscription
```bash
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "MonMotDePasse123",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Développeur passionné"
}
```

### Connexion
```bash
POST /api/users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "MonMotDePasse123"
}
```

### Créer une publication
```bash
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Ma première publication sur cette plateforme !",
  "imageUrl": "https://example.com/image.jpg"
}
```

### Ajouter un commentaire
```bash
POST /api/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": 1,
  "content": "Super publication !"
}
```

### Liker une publication
```bash
POST /api/likes/post
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": 1
}
```

## Sécurité

### Authentification
- Tous les endpoints sont protégés par authentification JWT
- Les tokens expirent après 24h par défaut
- Les mots de passe sont hachés avec bcrypt (12 rounds)

### Autorisation
- Chaque utilisateur ne peut modifier/supprimer que ses propres ressources
- Middleware de vérification de propriété pour les opérations sensibles

### Protection
- Limitation du taux de requêtes (100 req/15min par IP)
- Headers de sécurité avec Helmet
- Validation stricte des données d'entrée
- Protection CORS configurée

## Base de données

### Structure des tables
- **users** - Informations des utilisateurs
- **posts** - Publications
- **comments** - Commentaires sur les publications
- **likes** - Likes sur publications et commentaires

### Relations
- Un utilisateur peut avoir plusieurs publications
- Une publication peut avoir plusieurs commentaires
- Un utilisateur peut liker plusieurs publications/commentaires
- Contraintes d'intégrité référentielle avec clés étrangères

## Scripts disponibles
- `npm start` - Démarrer le serveur en production
- `npm run dev` - Démarrer en mode développement avec nodemon
- `npm run init-db` - Initialiser la base de données

## Test de l'API
Utilisez un client REST comme Postman, Insomnia ou curl pour tester les endpoints.

Route de test disponible : `GET /api/health`
