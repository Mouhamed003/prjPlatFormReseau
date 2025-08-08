const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware basique
app.use(cors());
app.use(express.json());

// Test de débogage pour l'inscription
app.post('/debug/register', async (req, res) => {
  console.log('🔍 DÉBOGAGE INSCRIPTION - Début');
  console.log('📥 Données reçues:', JSON.stringify(req.body, null, 2));
  
  try {
    const { username, email, password, firstName, lastName, bio } = req.body;
    
    // Étape 1: Validation des données
    console.log('✅ Étape 1: Validation des données');
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Tous les champs obligatoires doivent être remplis',
        received: { username: !!username, email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName }
      });
    }
    
    // Étape 2: Connexion à la base de données
    console.log('✅ Étape 2: Connexion à la base de données');
    await database.connect();
    console.log('✅ Connexion DB réussie');
    
    // Étape 3: Vérification utilisateur existant
    console.log('✅ Étape 3: Vérification utilisateur existant');
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser) {
      console.log('⚠️ Utilisateur déjà existant');
      return res.status(409).json({
        error: 'Utilisateur déjà existant',
        message: 'Un utilisateur avec cet email ou nom d\'utilisateur existe déjà'
      });
    }
    
    // Étape 4: Hachage du mot de passe
    console.log('✅ Étape 4: Hachage du mot de passe');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Mot de passe haché');
    
    // Étape 5: Insertion en base
    console.log('✅ Étape 5: Insertion en base');
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstName, lastName, bio || null]
    );
    
    console.log('✅ Utilisateur créé avec ID:', result.id);
    
    // Étape 6: Génération du token JWT
    console.log('✅ Étape 6: Génération du token JWT');
    const token = jwt.sign(
      { userId: result.id, username, email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    console.log('✅ Token généré');
    
    // Étape 7: Récupération des données utilisateur
    console.log('✅ Étape 7: Récupération des données utilisateur');
    const newUser = await database.get(
      'SELECT id, username, email, first_name, last_name, bio, avatar_url, created_at FROM users WHERE id = ?',
      [result.id]
    );
    
    console.log('🎉 INSCRIPTION RÉUSSIE');
    
    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        bio: newUser.bio,
        avatarUrl: newUser.avatar_url,
        createdAt: newUser.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR LORS DE L\'INSCRIPTION:', error);
    console.error('Stack trace:', error.stack);
    
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de l\'inscription',
      debug: {
        name: error.name,
        message: error.message,
        code: error.code,
        errno: error.errno
      }
    });
  }
});

// Route de test simple
app.get('/debug/test', (req, res) => {
  res.json({ message: 'Serveur de débogage opérationnel' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🔍 Serveur de débogage démarré sur le port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/debug/test`);
  console.log(`Inscription: POST http://localhost:${PORT}/debug/register`);
});
