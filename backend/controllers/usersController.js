const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const database = require('../config/database');

class UsersController {
  // Inscription - Version académique corrigée
  static async register(req, res) {
    try {
      console.log(' [ACADÉMIQUE] Début inscription - données reçues:', req.body);
      
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log(' [ACADÉMIQUE] Erreurs de validation:', errors.array());
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Les données fournies ne sont pas valides',
          details: errors.array()
        });
      }

      const { username, email, password, firstName, lastName, bio } = req.body;
      console.log(' [ACADÉMIQUE] Données extraites:', { username, email, firstName, lastName });

      // Validation académique supplémentaire côté serveur
      if (!username || !email || !password || !firstName || !lastName) {
        console.log(' [ACADÉMIQUE] Données manquantes détectées');
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Tous les champs obligatoires doivent être remplis'
        });
      }

      // Validation email académique
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log(' [ACADÉMIQUE] Format email invalide');
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Format d\'email invalide'
        });
      }

      // Validation mot de passe académique
      if (password.length < 6) {
        console.log(' [ACADÉMIQUE] Mot de passe trop court');
        return res.status(400).json({
          error: 'Données invalides',
          message: 'Le mot de passe doit contenir au moins 6 caractères'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      console.log(' [ACADÉMIQUE] Vérification utilisateur existant...');
      const existingUser = await database.get(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        [email, username]
      );
      console.log('[ACADÉMIQUE] Utilisateur existant trouvé:', existingUser);

      if (existingUser) {
        console.log(' [ACADÉMIQUE] Utilisateur déjà existant');
        return res.status(409).json({
          error: 'Utilisateur déjà existant',
          message: 'Un compte avec cet email ou nom d\'utilisateur existe déjà'
        });
      }

      // Hacher le mot de passe avec sécurité académique
      console.log(' [ACADÉMIQUE] Hachage du mot de passe...');
      const passwordHash = await bcrypt.hash(password, 12);
      console.log('[ACADÉMIQUE] Mot de passe haché avec succès');

      // Insérer l'utilisateur avec gestion d'erreur académique
      console.log(' [ACADÉMIQUE] Insertion utilisateur en base...');
      const result = await database.run(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, bio, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [username, email, passwordHash, firstName, lastName, bio || null]
      );
      console.log('[ACADÉMIQUE] Résultat insertion:', result);

      // Vérification académique de l'insertion
      if (!result || !result.id) {
        console.error(' [ACADÉMIQUE] Échec insertion - pas d\'ID retourné');
        throw new Error('Échec de l\'insertion en base de données');
      }

      // Générer le token JWT avec vérification académique
      console.log(' [ACADÉMIQUE] Génération token JWT...');
      console.log('[ACADÉMIQUE] JWT_SECRET:', process.env.JWT_SECRET ? 'défini' : 'non défini');
      console.log('[ACADÉMIQUE] JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
      
      if (!process.env.JWT_SECRET) {
        console.error(' [ACADÉMIQUE] JWT_SECRET non défini');
        throw new Error('Configuration JWT manquante');
      }

      const token = jwt.sign(
        { userId: result.id, username, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      console.log('[ACADÉMIQUE] Token généré avec succès');

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

      console.log(' [ACADÉMIQUE] Inscription terminée avec succès pour:', email, 'ID:', result.id);
      res.status(201).json(response);
      
    } catch (error) {
      console.error(' [ACADÉMIQUE] Erreur lors de l\'inscription:', error.message);
      console.error('[ACADÉMIQUE] Stack trace:', error.stack);
      
      // Gestion d'erreur académique détaillée
      const errorResponse = {
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la création du compte',
        timestamp: new Date().toISOString()
      };
      
      // En mode développement, ajouter plus de détails
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.details = error.message;
      }
      
      res.status(500).json(errorResponse);
    }
  }

  // Connexion d'un utilisateur
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { email, password } = req.body;

      // Recherche de l'utilisateur
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

      // Vérification du mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Identifiants invalides',
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Génération du token JWT
      const token = jwt.sign(
        { userId: user.id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la connexion'
      });
    }
  }

  // Récupération du profil utilisateur
  static async getProfile(req, res) {
    try {
      const userId = req.params.id || req.user.id;

      const user = await database.get(
        `SELECT id, username, email, first_name, last_name, bio, avatar_url, created_at 
         FROM users WHERE id = ?`,
        [userId]
      );

      if (!user) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé'
        });
      }

      // Compter les publications de l'utilisateur
      const postsCount = await database.get(
        'SELECT COUNT(*) as count FROM posts WHERE user_id = ?',
        [userId]
      );

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at,
          postsCount: postsCount.count
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération du profil'
      });
    }
  }

  // Mise à jour du profil utilisateur
  static async updateProfile(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const userId = req.user.id;
      const { firstName, lastName, bio, avatarUrl } = req.body;

      await database.run(
        `UPDATE users 
         SET first_name = ?, last_name = ?, bio = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [firstName, lastName, bio || null, avatarUrl || null, userId]
      );

      // Récupération des données mises à jour
      const updatedUser = await database.get(
        `SELECT id, username, email, first_name, last_name, bio, avatar_url, updated_at 
         FROM users WHERE id = ?`,
        [userId]
      );

      res.json({
        message: 'Profil mis à jour avec succès',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatar_url,
          updatedAt: updatedUser.updated_at
        }
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la mise à jour du profil'
      });
    }
  }

  // Récupération de tous les utilisateurs (pour recherche/suggestions)
  static async getAllUsers(req, res) {
    try {
      const { search, limit = 10, offset = 0 } = req.query;
      
      let query = `
        SELECT id, username, first_name, last_name, bio, avatar_url, created_at 
        FROM users
      `;
      let params = [];

      if (search) {
        query += ` WHERE username LIKE ? OR first_name LIKE ? OR last_name LIKE ?`;
        const searchPattern = `%${search}%`;
        params = [searchPattern, searchPattern, searchPattern];
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const users = await database.all(query, params);

      res.json({
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: users.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des utilisateurs'
      });
    }
  }
}

module.exports = UsersController;
