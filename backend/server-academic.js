/**
 * SERVEUR BACKEND ACADÉMIQUE COMPLET
 * Solution finale pour la plateforme de réseau social
 * Intègre tous les endpoints nécessaires avec gestion d'erreurs robuste
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// CONFIGURATION ACADÉMIQUE DU SERVEUR
// ========================================

console.log('🎓 [ACADÉMIQUE] Démarrage du serveur backend académique...');

// Configuration CORS académique
const corsOptions = {
  origin: [
    'http://localhost:4200',
    'http://localhost:4201',
    process.env.FRONTEND_URL || 'http://localhost:4201'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting académique
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes',
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});
app.use(limiter);

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging académique
app.use((req, res, next) => {
  console.log(`🎓 [ACADÉMIQUE] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ========================================
// CONNEXION BASE DE DONNÉES ACADÉMIQUE
// ========================================

const dbPath = path.join(__dirname, 'database', 'social_network.db');
console.log('🎓 [ACADÉMIQUE] Chemin base de données:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ [ACADÉMIQUE] Erreur connexion SQLite:', err);
    process.exit(1);
  } else {
    console.log('✅ [ACADÉMIQUE] Connexion SQLite réussie');
  }
});

// Promisification académique des méthodes SQLite
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('❌ [ACADÉMIQUE] Erreur DB GET:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ [ACADÉMIQUE] Erreur DB RUN:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('❌ [ACADÉMIQUE] Erreur DB ALL:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// ========================================
// MIDDLEWARE D'AUTHENTIFICATION ACADÉMIQUE
// ========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token manquant',
      message: 'Token d\'authentification requis'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('🎓 [ACADÉMIQUE] Token invalide:', err.message);
      return res.status(403).json({
        error: 'Token invalide',
        message: 'Token d\'authentification invalide'
      });
    }
    req.user = user;
    next();
  });
};

// ========================================
// ROUTES D'AUTHENTIFICATION ACADÉMIQUES
// ========================================

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Serveur académique opérationnel!',
    timestamp: new Date().toISOString(),
    version: '1.0.0-academic'
  });
});

// INSCRIPTION ACADÉMIQUE
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('🎓 [ACADÉMIQUE] Début inscription - données reçues:', req.body);
    
    const { username, email, password, firstName, lastName, bio } = req.body;
    
    // Validation académique complète
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ [ACADÉMIQUE] Données manquantes détectées');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }

    // Validation email académique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ [ACADÉMIQUE] Format email invalide');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Format d\'email invalide'
      });
    }

    // Validation mot de passe académique
    if (password.length < 6) {
      console.log('❌ [ACADÉMIQUE] Mot de passe trop court');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Validation username académique
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le nom d\'utilisateur doit contenir entre 3 et 50 caractères'
      });
    }

    // Vérifier utilisateur existant
    console.log('🔍 [ACADÉMIQUE] Vérification utilisateur existant...');
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser) {
      console.log('⚠️ [ACADÉMIQUE] Utilisateur déjà existant');
      return res.status(409).json({
        error: 'Utilisateur déjà existant',
        message: 'Un compte avec cet email ou nom d\'utilisateur existe déjà'
      });
    }

    // Hachage du mot de passe académique
    console.log('🔐 [ACADÉMIQUE] Hachage du mot de passe...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Insertion utilisateur académique
    console.log('💾 [ACADÉMIQUE] Insertion utilisateur...');
    const result = await dbRun(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, bio, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [username, email, passwordHash, firstName, lastName, bio || null]
    );

    console.log('✅ [ACADÉMIQUE] Insertion réussie, ID:', result.id);

    // Vérification académique de l'insertion
    if (!result || !result.id) {
      throw new Error('Échec de l\'insertion en base de données');
    }

    // Génération token JWT académique
    console.log('🎫 [ACADÉMIQUE] Génération token...');
    if (!process.env.JWT_SECRET) {
      throw new Error('Configuration JWT manquante');
    }

    const token = jwt.sign(
      { userId: result.id, username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Réponse académique structurée
    const response = {
      message: 'Utilisateur créé avec succès',
      user: {
        id: result.id,
        username,
        email,
        firstName,
        lastName,
        bio: bio || null,
        avatarUrl: null
      },
      token
    };

    console.log('🎉 [ACADÉMIQUE] Inscription terminée avec succès pour:', email, 'ID:', result.id);
    res.status(201).json(response);
    
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur inscription:', error.message);
    console.error('[ACADÉMIQUE] Stack trace:', error.stack);
    
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la création du compte',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
});

// CONNEXION ACADÉMIQUE
app.post('/api/users/login', async (req, res) => {
  try {
    console.log('🔑 [ACADÉMIQUE] Début connexion');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Email et mot de passe requis'
      });
    }

    // Rechercher l'utilisateur
    const user = await dbGet(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Identifiants invalides',
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Génération token
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    console.log('✅ [ACADÉMIQUE] Connexion réussie pour:', user.email);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.bio,
        avatarUrl: user.avatar_url
      },
      token
    });
    
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la connexion'
    });
  }
});

// PROFIL UTILISATEUR ACADÉMIQUE
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, first_name, last_name, bio, avatar_url FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable',
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.bio,
        avatarUrl: user.avatar_url
      }
    });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur récupération profil:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// ========================================
// ROUTES POSTS ACADÉMIQUES (BASIQUES)
// ========================================

// Récupérer tous les posts
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    const posts = await dbAll(`
      SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    
    res.json({ posts });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur récupération posts:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la récupération des posts'
    });
  }
});

// Créer un post
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    console.log('🎓 [ACADÉMIQUE] Création post - utilisateur:', req.user.userId);
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le contenu du post ne peut pas être vide'
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le contenu du post ne peut pas dépasser 500 caractères'
      });
    }

    const result = await dbRun(
      `INSERT INTO posts (user_id, content, created_at, updated_at) 
       VALUES (?, ?, datetime('now'), datetime('now'))`,
      [req.user.userId, content.trim()]
    );

    console.log('✅ [ACADÉMIQUE] Post créé avec succès, ID:', result.id);

    res.status(201).json({
      message: 'Post créé avec succès',
      post: {
        id: result.id,
        content: content.trim(),
        userId: req.user.userId
      }
    });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur création post:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la création du post'
    });
  }
});

// Récupérer un post spécifique
app.get('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'ID du post invalide'
      });
    }

    const post = await dbGet(`
      SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [postId]);

    if (!post) {
      return res.status(404).json({
        error: 'Post introuvable',
        message: 'Le post demandé n\'existe pas'
      });
    }

    res.json({ post });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur récupération post:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la récupération du post'
    });
  }
});

// Éditer un post (avec gestion de l'ownership)
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🎓 [ACADÉMIQUE] Édition post - utilisateur:', req.user.userId, 'post:', req.params.id);
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'ID du post invalide'
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le contenu du post ne peut pas être vide'
      });
    }

    if (content.trim().length > 500) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le contenu du post ne peut pas dépasser 500 caractères'
      });
    }

    // Vérifier que le post existe et appartient à l'utilisateur (OWNERSHIP)
    const existingPost = await dbGet(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (!existingPost) {
      return res.status(404).json({
        error: 'Post introuvable',
        message: 'Le post à éditer n\'existe pas'
      });
    }

    if (existingPost.user_id !== req.user.userId) {
      console.log('❌ [ACADÉMIQUE] Tentative d\'édition non autorisée - post appartient à:', existingPost.user_id, 'utilisateur:', req.user.userId);
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous ne pouvez éditer que vos propres posts'
      });
    }

    // Mettre à jour le post
    const result = await dbRun(
      `UPDATE posts SET content = ?, updated_at = datetime('now') WHERE id = ?`,
      [content.trim(), postId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Post introuvable',
        message: 'Le post à éditer n\'existe pas'
      });
    }

    console.log('✅ [ACADÉMIQUE] Post édité avec succès, ID:', postId);

    res.json({
      message: 'Post modifié avec succès',
      post: {
        id: postId,
        content: content.trim(),
        userId: req.user.userId
      }
    });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur édition post:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la modification du post'
    });
  }
});

// Supprimer un post (avec gestion de l'ownership)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    console.log('🎓 [ACADÉMIQUE] Suppression post - utilisateur:', req.user.userId, 'post:', req.params.id);
    const postId = parseInt(req.params.id);
    
    if (isNaN(postId)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'ID du post invalide'
      });
    }

    // Vérifier que le post existe et appartient à l'utilisateur (OWNERSHIP)
    const existingPost = await dbGet(
      'SELECT * FROM posts WHERE id = ?',
      [postId]
    );

    if (!existingPost) {
      return res.status(404).json({
        error: 'Post introuvable',
        message: 'Le post à supprimer n\'existe pas'
      });
    }

    if (existingPost.user_id !== req.user.userId) {
      console.log('❌ [ACADÉMIQUE] Tentative de suppression non autorisée - post appartient à:', existingPost.user_id, 'utilisateur:', req.user.userId);
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Vous ne pouvez supprimer que vos propres posts'
      });
    }

    // Supprimer d'abord les likes et commentaires associés (intégrité référentielle)
    await dbRun('DELETE FROM likes WHERE post_id = ?', [postId]);
    await dbRun('DELETE FROM comments WHERE post_id = ?', [postId]);
    
    // Supprimer le post
    const result = await dbRun('DELETE FROM posts WHERE id = ?', [postId]);

    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Post introuvable',
        message: 'Le post à supprimer n\'existe pas'
      });
    }

    console.log('✅ [ACADÉMIQUE] Post supprimé avec succès, ID:', postId);

    res.json({
      message: 'Post supprimé avec succès'
    });
  } catch (error) {
    console.error('💥 [ACADÉMIQUE] Erreur suppression post:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la suppression du post'
    });
  }
});

// ========================================
// GESTION DES ERREURS ACADÉMIQUE
// ========================================

// Route 404 académique
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.originalUrl} n'existe pas`,
    path: req.originalUrl
  });
});

// Gestionnaire d'erreurs global académique
app.use((error, req, res, next) => {
  console.error('💥 [ACADÉMIQUE] Erreur globale:', error);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: 'Une erreur inattendue s\'est produite',
    timestamp: new Date().toISOString()
  });
});

// ========================================
// DÉMARRAGE DU SERVEUR ACADÉMIQUE
// ========================================

app.listen(PORT, () => {
  console.log(`🎓 [ACADÉMIQUE] Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Endpoints disponibles:`);
  console.log(`   POST /api/users/register - Inscription`);
  console.log(`   POST /api/users/login - Connexion`);
  console.log(`   GET  /api/users/me - Profil utilisateur`);
  console.log(`   GET  /api/posts - Liste des posts`);
  console.log(`   POST /api/posts - Créer un post`);
});

// Gestion propre de l'arrêt académique
process.on('SIGINT', () => {
  console.log('\n🛑 [ACADÉMIQUE] Arrêt du serveur...');
  db.close((err) => {
    if (err) {
      console.error('❌ [ACADÉMIQUE] Erreur fermeture base:', err);
    } else {
      console.log('🔒 [ACADÉMIQUE] Base de données fermée');
    }
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error('💥 [ACADÉMIQUE] Exception non gérée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [ACADÉMIQUE] Promesse rejetée non gérée:', reason);
  process.exit(1);
});
