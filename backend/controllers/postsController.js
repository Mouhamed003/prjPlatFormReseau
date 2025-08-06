const { validationResult } = require('express-validator');
const database = require('../config/database');

class PostsController {
  // Créer une nouvelle publication
  static async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { content, imageUrl } = req.body;
      const userId = req.user.id;

      const result = await database.run(
        'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
        [userId, content, imageUrl || null]
      );

      // Récupérer la publication créée avec les informations de l'utilisateur
      const post = await database.get(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(l.id) as likes_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [result.id]);

      res.status(201).json({
        message: 'Publication créée avec succès',
        post: {
          id: post.id,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likesCount: post.likes_count,
          user: {
            id: post.user_id,
            username: post.username,
            firstName: post.first_name,
            lastName: post.last_name,
            avatarUrl: post.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la création de la publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la création de la publication'
      });
    }
  }

  // Récupérer toutes les publications (feed)
  static async getAllPosts(req, res) {
    try {
      const { limit = 10, offset = 0 } = req.query;
      const userId = req.user.id;

      const posts = await database.all(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               COUNT(DISTINCT c.id) as comments_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)]);

      res.json({
        posts: posts.map(post => ({
          id: post.id,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          isLiked: Boolean(post.is_liked),
          user: {
            id: post.user_id,
            username: post.username,
            firstName: post.first_name,
            lastName: post.last_name,
            avatarUrl: post.avatar_url
          }
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: posts.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des publications:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des publications'
      });
    }
  }

  // Récupérer une publication spécifique
  static async getPostById(req, res) {
    try {
      const postId = req.params.id;
      const userId = req.user.id;

      const post = await database.get(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               COUNT(DISTINCT c.id) as comments_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
        WHERE p.id = ?
        GROUP BY p.id
      `, [userId, postId]);

      if (!post) {
        return res.status(404).json({
          error: 'Publication non trouvée'
        });
      }

      res.json({
        post: {
          id: post.id,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          isLiked: Boolean(post.is_liked),
          user: {
            id: post.user_id,
            username: post.username,
            firstName: post.first_name,
            lastName: post.last_name,
            avatarUrl: post.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération de la publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération de la publication'
      });
    }
  }

  // Récupérer les publications d'un utilisateur
  static async getUserPosts(req, res) {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      const posts = await database.all(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               COUNT(DISTINCT c.id) as comments_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
        WHERE p.user_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `, [currentUserId, targetUserId, parseInt(limit), parseInt(offset)]);

      res.json({
        posts: posts.map(post => ({
          id: post.id,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          isLiked: Boolean(post.is_liked),
          user: {
            id: post.user_id,
            username: post.username,
            firstName: post.first_name,
            lastName: post.last_name,
            avatarUrl: post.avatar_url
          }
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: posts.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des publications utilisateur:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des publications'
      });
    }
  }

  // Modifier une publication
  static async updatePost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const postId = req.params.id;
      const { content, imageUrl } = req.body;

      await database.run(
        'UPDATE posts SET content = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, imageUrl || null, postId]
      );

      // Récupérer la publication mise à jour
      const updatedPost = await database.get(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               COUNT(DISTINCT c.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes l ON p.id = l.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [postId]);

      res.json({
        message: 'Publication mise à jour avec succès',
        post: {
          id: updatedPost.id,
          content: updatedPost.content,
          imageUrl: updatedPost.image_url,
          createdAt: updatedPost.created_at,
          updatedAt: updatedPost.updated_at,
          likesCount: updatedPost.likes_count,
          commentsCount: updatedPost.comments_count,
          user: {
            id: updatedPost.user_id,
            username: updatedPost.username,
            firstName: updatedPost.first_name,
            lastName: updatedPost.last_name,
            avatarUrl: updatedPost.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la mise à jour de la publication'
      });
    }
  }

  // Supprimer une publication
  static async deletePost(req, res) {
    try {
      const postId = req.params.id;

      await database.run('DELETE FROM posts WHERE id = ?', [postId]);

      res.json({
        message: 'Publication supprimée avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression de la publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la suppression de la publication'
      });
    }
  }
}

module.exports = PostsController;
