const { validationResult } = require('express-validator');
const database = require('../config/database');

class LikesController {
  // Ajouter ou retirer un like sur une publication
  static async togglePostLike(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { postId } = req.body;
      const userId = req.user.id;

      // Vérifier que la publication existe
      const post = await database.get('SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return res.status(404).json({
          error: 'Publication non trouvée'
        });
      }

      // Vérifier si l'utilisateur a déjà liké cette publication
      const existingLike = await database.get(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );

      let isLiked;
      let message;

      if (existingLike) {
        // Retirer le like
        await database.run('DELETE FROM likes WHERE id = ?', [existingLike.id]);
        isLiked = false;
        message = 'Like retiré avec succès';
      } else {
        // Ajouter le like
        await database.run(
          'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
          [userId, postId]
        );
        isLiked = true;
        message = 'Like ajouté avec succès';
      }

      // Compter le nombre total de likes pour cette publication
      const likesCount = await database.get(
        'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
        [postId]
      );

      res.json({
        message,
        isLiked,
        likesCount: likesCount.count
      });

    } catch (error) {
      console.error('Erreur lors du toggle like publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la gestion du like'
      });
    }
  }

  // Ajouter ou retirer un like sur un commentaire
  static async toggleCommentLike(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { commentId } = req.body;
      const userId = req.user.id;

      // Vérifier que le commentaire existe
      const comment = await database.get('SELECT id FROM comments WHERE id = ?', [commentId]);
      if (!comment) {
        return res.status(404).json({
          error: 'Commentaire non trouvé'
        });
      }

      // Vérifier si l'utilisateur a déjà liké ce commentaire
      const existingLike = await database.get(
        'SELECT id FROM likes WHERE user_id = ? AND comment_id = ?',
        [userId, commentId]
      );

      let isLiked;
      let message;

      if (existingLike) {
        // Retirer le like
        await database.run('DELETE FROM likes WHERE id = ?', [existingLike.id]);
        isLiked = false;
        message = 'Like retiré avec succès';
      } else {
        // Ajouter le like
        await database.run(
          'INSERT INTO likes (user_id, comment_id) VALUES (?, ?)',
          [userId, commentId]
        );
        isLiked = true;
        message = 'Like ajouté avec succès';
      }

      // Compter le nombre total de likes pour ce commentaire
      const likesCount = await database.get(
        'SELECT COUNT(*) as count FROM likes WHERE comment_id = ?',
        [commentId]
      );

      res.json({
        message,
        isLiked,
        likesCount: likesCount.count
      });

    } catch (error) {
      console.error('Erreur lors du toggle like commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la gestion du like'
      });
    }
  }

  // Récupérer les likes d'une publication
  static async getPostLikes(req, res) {
    try {
      const postId = req.params.postId;
      const { limit = 20, offset = 0 } = req.query;

      // Vérifier que la publication existe
      const post = await database.get('SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return res.status(404).json({
          error: 'Publication non trouvée'
        });
      }

      const likes = await database.all(`
        SELECT l.created_at, u.id, u.username, u.first_name, u.last_name, u.avatar_url
        FROM likes l
        JOIN users u ON l.user_id = u.id
        WHERE l.post_id = ?
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [postId, parseInt(limit), parseInt(offset)]);

      const totalCount = await database.get(
        'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
        [postId]
      );

      res.json({
        likes: likes.map(like => ({
          createdAt: like.created_at,
          user: {
            id: like.id,
            username: like.username,
            firstName: like.first_name,
            lastName: like.last_name,
            avatarUrl: like.avatar_url
          }
        })),
        totalCount: totalCount.count,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: likes.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des likes de publication:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des likes'
      });
    }
  }

  // Récupérer les likes d'un commentaire
  static async getCommentLikes(req, res) {
    try {
      const commentId = req.params.commentId;
      const { limit = 20, offset = 0 } = req.query;

      // Vérifier que le commentaire existe
      const comment = await database.get('SELECT id FROM comments WHERE id = ?', [commentId]);
      if (!comment) {
        return res.status(404).json({
          error: 'Commentaire non trouvé'
        });
      }

      const likes = await database.all(`
        SELECT l.created_at, u.id, u.username, u.first_name, u.last_name, u.avatar_url
        FROM likes l
        JOIN users u ON l.user_id = u.id
        WHERE l.comment_id = ?
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [commentId, parseInt(limit), parseInt(offset)]);

      const totalCount = await database.get(
        'SELECT COUNT(*) as count FROM likes WHERE comment_id = ?',
        [commentId]
      );

      res.json({
        likes: likes.map(like => ({
          createdAt: like.created_at,
          user: {
            id: like.id,
            username: like.username,
            firstName: like.first_name,
            lastName: like.last_name,
            avatarUrl: like.avatar_url
          }
        })),
        totalCount: totalCount.count,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: likes.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des likes de commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des likes'
      });
    }
  }

  // Récupérer les publications likées par un utilisateur
  static async getUserLikedPosts(req, res) {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      const likedPosts = await database.all(`
        SELECT p.*, u.username, u.first_name, u.last_name, u.avatar_url,
               l.created_at as liked_at,
               COUNT(DISTINCT pl.id) as likes_count,
               COUNT(DISTINCT c.id) as comments_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM likes l
        JOIN posts p ON l.post_id = p.id
        JOIN users u ON p.user_id = u.id
        LEFT JOIN likes pl ON p.id = pl.post_id
        LEFT JOIN comments c ON p.id = c.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ?
        WHERE l.user_id = ? AND l.post_id IS NOT NULL
        GROUP BY p.id, l.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
      `, [currentUserId, targetUserId, parseInt(limit), parseInt(offset)]);

      res.json({
        likedPosts: likedPosts.map(post => ({
          id: post.id,
          content: post.content,
          imageUrl: post.image_url,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          likedAt: post.liked_at,
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
          hasMore: likedPosts.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des posts likés:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des publications likées'
      });
    }
  }
}

module.exports = LikesController;
