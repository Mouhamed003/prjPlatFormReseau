// Test simple d'inscription
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('./config/database');
require('dotenv').config();

async function testRegister() {
  try {
    console.log('Test d\'inscription...');
    
    // Données de test
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    };
    
    console.log('Données utilisateur:', userData);
    
    // Vérifier les variables d'environnement
    console.log('JWT_SECRET défini:', !!process.env.JWT_SECRET);
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
    
    // Connexion à la base
    await database.connect();
    console.log('Connexion à la base réussie');
    
    // Vérifier utilisateur existant
    const existing = await database.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [userData.email, userData.username]
    );
    console.log('Utilisateur existant:', existing);
    
    if (existing) {
      console.log('Utilisateur déjà existant, suppression...');
      await database.run('DELETE FROM users WHERE email = ? OR username = ?', [userData.email, userData.username]);
    }
    
    // Hachage du mot de passe
    console.log('Hachage du mot de passe...');
    const passwordHash = await bcrypt.hash(userData.password, 12);
    console.log('Mot de passe haché');
    
    // Insertion
    console.log('Insertion utilisateur...');
    const result = await database.run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?, ?)`,
      [userData.username, userData.email, passwordHash, userData.firstName, userData.lastName]
    );
    console.log('Résultat insertion:', result);
    
    // Génération token
    console.log('Génération token...');
    const token = jwt.sign(
      { userId: result.lastID, username: userData.username, email: userData.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    console.log('Token généré avec succès');
    
    console.log('✅ Test d\'inscription réussi!');
    console.log('ID utilisateur:', result.lastID);
    
    await database.close();
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

testRegister();
