const { validationResult } = require('express-validator');
const database = require('../config/database');

class CommentsController {
  // Créer un nouveau commentaire
  static async createComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { postId, content } = req.body;
      const userId = req.user.id;

      // Vérifier que la publication existe
      const post = await database.get('SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return res.status(404).json({
          error: 'Publication non trouvée'
        });
      }

      const result = await database.run(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [postId, userId, content]
      );

      // Récupérer le commentaire créé avec les informations de l'utilisateur
      const comment = await database.get(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(l.id) as likes_count
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN likes l ON c.id = l.comment_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [result.id]);

      res.status(201).json({
        message: 'Commentaire créé avec succès',
        comment: {
          id: comment.id,
          postId: comment.post_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          likesCount: comment.likes_count,
          user: {
            id: comment.user_id,
            username: comment.username,
            firstName: comment.first_name,
            lastName: comment.last_name,
            avatarUrl: comment.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la création du commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la création du commentaire'
      });
    }
  }

  // Récupérer les commentaires d'une publication
  static async getPostComments(req, res) {
    try {
      const postId = req.params.postId;
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      // Vérifier que la publication existe
      const post = await database.get('SELECT id FROM posts WHERE id = ?', [postId]);
      if (!post) {
        return res.status(404).json({
          error: 'Publication non trouvée'
        });
      }

      const comments = await database.all(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN likes l ON c.id = l.comment_id
        LEFT JOIN likes ul ON c.id = ul.comment_id AND ul.user_id = ?
        WHERE c.post_id = ?
        GROUP BY c.id
        ORDER BY c.created_at ASC
        LIMIT ? OFFSET ?
      `, [userId, postId, parseInt(limit), parseInt(offset)]);

      res.json({
        comments: comments.map(comment => ({
          id: comment.id,
          postId: comment.post_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          likesCount: comment.likes_count,
          isLiked: Boolean(comment.is_liked),
          user: {
            id: comment.user_id,
            username: comment.username,
            firstName: comment.first_name,
            lastName: comment.last_name,
            avatarUrl: comment.avatar_url
          }
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: comments.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des commentaires'
      });
    }
  }

  // Récupérer un commentaire spécifique
  static async getCommentById(req, res) {
    try {
      const commentId = req.params.id;
      const userId = req.user.id;

      const comment = await database.get(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN likes l ON c.id = l.comment_id
        LEFT JOIN likes ul ON c.id = ul.comment_id AND ul.user_id = ?
        WHERE c.id = ?
        GROUP BY c.id
      `, [userId, commentId]);

      if (!comment) {
        return res.status(404).json({
          error: 'Commentaire non trouvé'
        });
      }

      res.json({
        comment: {
          id: comment.id,
          postId: comment.post_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          likesCount: comment.likes_count,
          isLiked: Boolean(comment.is_liked),
          user: {
            id: comment.user_id,
            username: comment.username,
            firstName: comment.first_name,
            lastName: comment.last_name,
            avatarUrl: comment.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération du commentaire'
      });
    }
  }

  // Modifier un commentaire
  static async updateComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const commentId = req.params.id;
      const { content } = req.body;

      await database.run(
        'UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [content, commentId]
      );

      // Récupérer le commentaire mis à jour
      const updatedComment = await database.get(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url,
               COUNT(DISTINCT l.id) as likes_count
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN likes l ON c.id = l.comment_id
        WHERE c.id = ?
        GROUP BY c.id
      `, [commentId]);

      res.json({
        message: 'Commentaire mis à jour avec succès',
        comment: {
          id: updatedComment.id,
          postId: updatedComment.post_id,
          content: updatedComment.content,
          createdAt: updatedComment.created_at,
          updatedAt: updatedComment.updated_at,
          likesCount: updatedComment.likes_count,
          user: {
            id: updatedComment.user_id,
            username: updatedComment.username,
            firstName: updatedComment.first_name,
            lastName: updatedComment.last_name,
            avatarUrl: updatedComment.avatar_url
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la mise à jour du commentaire'
      });
    }
  }

  // Supprimer un commentaire
  static async deleteComment(req, res) {
    try {
      const commentId = req.params.id;

      await database.run('DELETE FROM comments WHERE id = ?', [commentId]);

      res.json({
        message: 'Commentaire supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la suppression du commentaire'
      });
    }
  }

  // Récupérer tous les commentaires d'un utilisateur
  static async getUserComments(req, res) {
    try {
      const targetUserId = req.params.userId;
      const currentUserId = req.user.id;
      const { limit = 10, offset = 0 } = req.query;

      const comments = await database.all(`
        SELECT c.*, u.username, u.first_name, u.last_name, u.avatar_url,
               p.content as post_content,
               COUNT(DISTINCT l.id) as likes_count,
               CASE WHEN ul.id IS NOT NULL THEN 1 ELSE 0 END as is_liked
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN posts p ON c.post_id = p.id
        LEFT JOIN likes l ON c.id = l.comment_id
        LEFT JOIN likes ul ON c.id = ul.comment_id AND ul.user_id = ?
        WHERE c.user_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `, [currentUserId, targetUserId, parseInt(limit), parseInt(offset)]);

      res.json({
        comments: comments.map(comment => ({
          id: comment.id,
          postId: comment.post_id,
          content: comment.content,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
          likesCount: comment.likes_count,
          isLiked: Boolean(comment.is_liked),
          postContent: comment.post_content.substring(0, 100) + '...', // Aperçu du post
          user: {
            id: comment.user_id,
            username: comment.username,
            firstName: comment.first_name,
            lastName: comment.last_name,
            avatarUrl: comment.avatar_url
          }
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: comments.length === parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des commentaires utilisateur:', error);
      res.status(500).json({
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la récupération des commentaires'
      });
    }
  }
}

module.exports = CommentsController;
