const express = require('express');
const { body } = require('express-validator');
const UsersController = require('../controllers/usersController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores'),
  
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom contient des caractères invalides'),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom contient des caractères invalides'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères')
];

// Validation pour la connexion
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis')
];

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('firstName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom contient des caractères invalides'),
  
  body('lastName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom contient des caractères invalides'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères'),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('URL d\'avatar invalide')
];

// Routes d'authentification (publiques)
router.post('/register', registerValidation, UsersController.register);
router.post('/login', loginValidation, UsersController.login);

// Routes protégées (authentification requise)
router.use(authenticateToken); // Toutes les routes suivantes nécessitent une authentification

router.get('/profile', UsersController.getProfile); // Profil de l'utilisateur connecté
router.get('/profile/:id', UsersController.getProfile); // Profil d'un utilisateur spécifique
router.put('/profile', updateProfileValidation, UsersController.updateProfile);
router.get('/', UsersController.getAllUsers); // Liste des utilisateurs avec recherche

module.exports = router;
