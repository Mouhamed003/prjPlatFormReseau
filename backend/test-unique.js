const database = require('./config/database');

async function testDatabaseWithUniqueData() {
  try {
    console.log('🧪 Test de connexion à la base de données avec données uniques...');
    
    // Connexion à la base de données
    await database.connect();
    console.log('✅ Connexion réussie');
    
    // Générer des données uniques
    const timestamp = Date.now();
    const uniqueUsername = `testuser_${timestamp}`;
    const uniqueEmail = `test_${timestamp}@example.com`;
    
    // Test d'insertion avec données uniques
    const result = await database.run(
      'INSERT INTO users (username, email, password_hash, first_name, last_name, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [uniqueUsername, uniqueEmail, 'hashedpassword123', 'Test', 'User', 'Test bio']
    );
    
    console.log('✅ Insertion réussie, ID:', result.id);
    
    // Test de lecture
    const user = await database.get('SELECT * FROM users WHERE id = ?', [result.id]);
    console.log('✅ Lecture réussie:', {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name
    });
    
    await database.close();
    console.log('🎉 Test de base de données réussi !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

testDatabaseWithUniqueData();
