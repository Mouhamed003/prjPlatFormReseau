const jwt = require('jsonwebtoken');
const database = require('../config/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'accès requis',
        message: 'Vous devez être connecté pour accéder à cette ressource'
      });
    }

    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours
    const user = await database.get(
      'SELECT id, username, email, first_name, last_name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ 
        error: 'Utilisateur non trouvé',
        message: 'Le token fait référence à un utilisateur qui n\'existe plus'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré',
        message: 'Votre session a expiré, veuillez vous reconnecter'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide',
        message: 'Le token fourni n\'est pas valide'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      error: 'Erreur interne',
      message: 'Une erreur est survenue lors de la vérification de l\'authentification'
    });
  }
};

// Middleware pour vérifier la propriété d'une ressource
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;

      let query;
      switch (resourceType) {
        case 'post':
          query = 'SELECT user_id FROM posts WHERE id = ?';
          break;
        case 'comment':
          query = 'SELECT user_id FROM comments WHERE id = ?';
          break;
        default:
          return res.status(400).json({ 
            error: 'Type de ressource non supporté' 
          });
      }

      const resource = await database.get(query, [resourceId]);

      if (!resource) {
        return res.status(404).json({ 
          error: `${resourceType} non trouvé(e)` 
        });
      }

      if (resource.user_id !== userId) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          message: `Vous ne pouvez modifier que vos propres ${resourceType}s`
        });
      }

      next();
    } catch (error) {
      console.error('Erreur de vérification de propriété:', error);
      return res.status(500).json({ 
        error: 'Erreur interne',
        message: 'Une erreur est survenue lors de la vérification des permissions'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  checkOwnership
};
