const database = require('./config/database');

async function testDatabase() {
  try {
    console.log('🧪 Test de connexion à la base de données...');
    
    // Connexion à la base de données
    await database.connect();
    console.log('✅ Connexion réussie');
    
    // Test d'insertion simple
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, bio) VALUES (?, ?, ?, ?, ?, ?)',
      ['testuser', 'test@example.com', 'hashedpassword', 'Test', 'User', 'Test bio']
    );
    
    console.log('✅ Insertion réussie, ID:', result.id);
    
    // Test de lecture
    const user = await database.get('SELECT * FROM users WHERE id = ?', [result.id]);
    console.log('✅ Lecture réussie:', user);
    
    // Nettoyage
    await database.run('DELETE FROM users WHERE id = ?', [result.id]);
    console.log('✅ Nettoyage réussi');
    
    await database.close();
    console.log('🎉 Tous les tests sont passés !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

testDatabase();
