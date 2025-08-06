const express = require('express');
const { body } = require('express-validator');
const CommentsController = require('../controllers/commentsController');
const { authenticateToken, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création/modification de commentaire
const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 500 })
    .withMessage('Le commentaire doit contenir entre 1 et 500 caractères')
    .trim()
];

// Validation pour la création de commentaire (inclut postId)
const createCommentValidation = [
  body('postId')
    .isInt({ min: 1 })
    .withMessage('ID de publication invalide'),
  ...commentValidation
];

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les commentaires
router.post('/', createCommentValidation, CommentsController.createComment);
router.get('/post/:postId', CommentsController.getPostComments);
router.get('/user/:userId', CommentsController.getUserComments);
router.get('/:id', CommentsController.getCommentById);

// Routes nécessitant la propriété de la ressource
router.put('/:id', checkOwnership('comment'), commentValidation, CommentsController.updateComment);
router.delete('/:id', checkOwnership('comment'), CommentsController.deleteComment);

module.exports = router;
