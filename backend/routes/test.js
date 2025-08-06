const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const router = express.Router();

// Route de test simple
router.post('/register-simple', async (req, res) => {
  try {
    console.log('🔥 Route de test atteinte !');
    console.log('Body reçu:', req.body);
    
    res.status(200).json({
      message: 'Route de test fonctionnelle !',
      body: req.body
    });
  } catch (error) {
    console.error('Erreur dans route test:', error);
    res.status(500).json({
      error: 'Erreur test',
      message: error.message
    });
  }
});

// Route d'inscription fonctionnelle sans validation
router.post('/register-working', async (req, res) => {
  try {
    console.log('🚀 Inscription sans validation démarrée');
    console.log('Données reçues:', req.body);
    
    const { username, email, password, firstName, lastName, bio } = req.body;
    
    // Vérification basique
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'Tous les champs obligatoires doivent être remplis'
      });
    }
    
    // Vérifier utilisateur existant
    console.log('Vérification utilisateur existant...');
    const existingUser = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Utilisateur déjà existant',
        message: 'Un compte avec cet email ou nom d\'utilisateur existe déjà'
      });
    }
    
    // Hachage du mot de passe
    console.log('Hachage du mot de passe...');
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Insertion utilisateur
    console.log('Insertion utilisateur...');
    const result = await database.run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, bio) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, lastName, bio || null]
    );
    
    console.log('Résultat insertion:', result);
    
    // Génération token JWT
    console.log('Génération token...');
    const token = jwt.sign(
      { userId: result.id, username, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    console.log('✅ Inscription réussie ! ID:', result.id);
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: result.id,
        username,
        email,
        firstName,
        lastName,
        bio
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la création du compte'
    });
  }
});

module.exports = router;
