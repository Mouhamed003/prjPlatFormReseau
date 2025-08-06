const express = require('express');
const { body } = require('express-validator');
const LikesController = require('../controllers/likesController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour le like d'une publication
const postLikeValidation = [
  body('postId')
    .isInt({ min: 1 })
    .withMessage('ID de publication invalide')
];

// Validation pour le like d'un commentaire
const commentLikeValidation = [
  body('commentId')
    .isInt({ min: 1 })
    .withMessage('ID de commentaire invalide')
];

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les likes
router.post('/post', postLikeValidation, LikesController.togglePostLike);
router.post('/comment', commentLikeValidation, LikesController.toggleCommentLike);

// Routes pour récupérer les likes
router.get('/post/:postId', LikesController.getPostLikes);
router.get('/comment/:commentId', LikesController.getCommentLikes);
router.get('/user/:userId/posts', LikesController.getUserLikedPosts);

module.exports = router;
