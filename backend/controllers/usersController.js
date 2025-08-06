const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const database = require('../config/database');

class UsersController {
  // Inscription d'un nouvel utilisateur
  static async register(req, res) {
    try {
      // Vérification des erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { username, email, password, firstName, lastName, bio } = req.body;

      // Vérifier si l'utilisateur existe déjà
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
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Insertion du nouvel utilisateur
      const result = await database.run(
        `INSERT INTO users (username, email, password_hash, first_name, last_name, bio) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [username, email, passwordHash, firstName, lastName, bio || null]
      );

      // Génération du token JWT
      const token = jwt.sign(
        { userId: result.id, username, email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

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
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la création du compte'
      });
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
