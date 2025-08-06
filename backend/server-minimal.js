const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4201',
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connexion SQLite simple et directe
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erreur connexion SQLite:', err);
  } else {
    console.log('✅ Connexion SQLite réussie');
  }
});

// Promisification des méthodes SQLite
const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Route de test de base
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Serveur minimal opérationnel!',
    timestamp: new Date().toISOString()
  });
});

// Route d'inscription FONCTIONNELLE
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('🚀 INSCRIPTION DÉMARRÉE');
    console.log('Données reçues:', req.body);
    
    const { username, email, password, firstName, lastName, bio } = req.body;
    
    // Validation basique
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Format d\'email invalide'
      });
    }
    
    // Validation mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Vérifier utilisateur existant
    console.log('🔍 Vérification utilisateur existant...');
    const existingUser = await dbGet(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser) {
      console.log('⚠️ Utilisateur déjà existant');
      return res.status(409).json({
        error: 'Utilisateur déjà existant',
        message: 'Un compte avec cet email ou nom d\'utilisateur existe déjà'
      });
    }
    
    // Hachage du mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Insertion utilisateur
    console.log('💾 Insertion utilisateur...');
    const result = await dbRun(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, bio, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [username, email, passwordHash, firstName, lastName, bio || null]
    );
    
    console.log('✅ Insertion réussie, ID:', result.id);
    
    // Génération token JWT
    console.log('🎫 Génération token...');
    const token = jwt.sign(
      { userId: result.id, username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log('🎉 INSCRIPTION RÉUSSIE ! Utilisateur ID:', result.id);
    
    res.status(201).json({
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
    });
    
  } catch (error) {
    console.error('💥 Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la création du compte',
      details: error.message
    });
  }
});

// Route de connexion FONCTIONNELLE
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔑 CONNEXION DÉMARRÉE');
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
    
    console.log('✅ Connexion réussie pour:', user.email);
    
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
    console.error('💥 Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la connexion',
      details: error.message
    });
  }
});

// Middleware d'authentification JWT simple
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
      return res.status(403).json({
        error: 'Token invalide',
        message: 'Token d\'authentification invalide'
      });
    }
    req.user = user;
    next();
  });
};

// Route protégée de test
app.get('/api/auth/me', authenticateToken, async (req, res) => {
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
    console.error('Erreur récupération profil:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur minimal démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  db.close((err) => {
    if (err) {
      console.error('Erreur fermeture base:', err);
    } else {
      console.log('🔒 Base de données fermée');
    }
    process.exit(0);
  });
});
