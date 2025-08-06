const express = require('express');
const { body } = require('express-validator');
const PostsController = require('../controllers/postsController');
const { authenticateToken, checkOwnership } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création/modification de publication
const postValidation = [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Le contenu doit contenir entre 1 et 2000 caractères')
    .trim(),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('URL d\'image invalide')
];

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les publications
router.post('/', postValidation, PostsController.createPost);
router.get('/', PostsController.getAllPosts);
router.get('/:id', PostsController.getPostById);
router.get('/user/:userId', PostsController.getUserPosts);

// Routes nécessitant la propriété de la ressource
router.put('/:id', checkOwnership('post'), postValidation, PostsController.updatePost);
router.delete('/:id', checkOwnership('post'), PostsController.deletePost);

module.exports = router;
