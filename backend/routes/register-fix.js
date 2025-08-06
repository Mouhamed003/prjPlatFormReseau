const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const router = express.Router();

// Route d'inscription de contournement FONCTIONNELLE
router.post('/register', async (req, res) => {
  try {
    console.log('🎯 ROUTE DE CONTOURNEMENT - Inscription démarrée');
    console.log('Données reçues:', req.body);
    
    const { username, email, password, firstName, lastName, bio } = req.body;
    
    // Validation basique côté serveur
    if (!username || !email || !password || !firstName || !lastName) {
      console.log('❌ Données manquantes');
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }
    
    // Validation email basique
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
    const existingUser = await database.get(
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
    const result = await database.run(
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
      message: 'Une erreur est survenue lors de la création du compte'
    });
  }
});

// Route de connexion de contournement
router.post('/login', async (req, res) => {
  try {
    console.log('🔑 ROUTE DE CONTOURNEMENT - Connexion démarrée');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Données invalides',
        message: 'Email et mot de passe requis'
      });
    }
    
    // Rechercher l'utilisateur
    const user = await database.get(
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
      message: 'Une erreur est survenue lors de la connexion'
    });
  }
});

module.exports = router;
