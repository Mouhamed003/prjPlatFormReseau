const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
  constructor() {
    this.db = null;
  }

  // Connexion à la base de données
  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.resolve(process.env.DB_PATH || './database/social_network.db');
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Erreur de connexion à la base de données:', err.message);
          reject(err);
        } else {
          console.log('✅ Connexion à la base de données SQLite établie');
          // Activer les clés étrangères
          this.db.run('PRAGMA foreign_keys = ON');
          resolve(this.db);
        }
      });
    });
  }

  // Fermeture de la connexion
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('🔒 Connexion à la base de données fermée');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Exécution d'une requête
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Récupération d'une seule ligne
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Récupération de plusieurs lignes
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// Instance singleton
const database = new Database();

module.exports = database;
