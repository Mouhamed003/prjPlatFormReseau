const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function initializeDatabase() {
  try {
    // Créer le dossier database s'il n'existe pas
    const dbDir = path.dirname(path.resolve(process.env.DB_PATH || './database/social_network.db'));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('📁 Dossier database créé');
    }

    // Connexion à la base de données
    await database.connect();

    console.log('🔧 Initialisation des tables...');

    // Table des utilisateurs
    await database.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        bio TEXT,
        avatar_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table users créée');

    // Table des publications
    await database.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table posts créée');

    // Table des commentaires
    await database.run(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Table comments créée');

    // Table des likes
    await database.run(`
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER,
        comment_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        UNIQUE(user_id, post_id),
        UNIQUE(user_id, comment_id),
        CHECK ((post_id IS NOT NULL AND comment_id IS NULL) OR (post_id IS NULL AND comment_id IS NOT NULL))
      )
    `);
    console.log('✅ Table likes créée');

    // Index pour améliorer les performances
    await database.run('CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id)');
    await database.run('CREATE INDEX IF NOT EXISTS idx_likes_comment_id ON likes(comment_id)');
    console.log('✅ Index créés');

    console.log('🎉 Base de données initialisée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Exécuter l'initialisation si ce script est appelé directement
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
