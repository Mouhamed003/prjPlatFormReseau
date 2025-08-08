const axios = require('axios');

async function testPostsFlow() {
  try {
    console.log('🧪 Test complet du flux des publications');
    
    // Étape 1: Connexion pour obtenir un token
    console.log('🔑 Étape 1: Connexion...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'diatou2@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenu:', token.substring(0, 20) + '...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Étape 2: Test de récupération des publications
    console.log('📖 Étape 2: Récupération des publications...');
    try {
      const getPostsResponse = await axios.get('http://localhost:3000/api/posts', { headers });
      console.log('✅ Publications récupérées:', getPostsResponse.data);
    } catch (error) {
      console.log('❌ Erreur récupération publications:', error.response?.data || error.message);
    }
    
    // Étape 3: Test de création d'une publication
    console.log('📝 Étape 3: Création d\'une publication...');
    try {
      const createPostResponse = await axios.post('http://localhost:3000/api/posts', {
        content: 'Test de publication depuis le script de débogage',
        imageUrl: null
      }, { headers });
      console.log('✅ Publication créée:', createPostResponse.data);
    } catch (error) {
      console.log('❌ Erreur création publication:', error.response?.data || error.message);
    }
    
    // Étape 4: Nouvelle récupération des publications
    console.log('📖 Étape 4: Nouvelle récupération des publications...');
    try {
      const getPostsResponse2 = await axios.get('http://localhost:3000/api/posts', { headers });
      console.log('✅ Publications après création:', getPostsResponse2.data);
    } catch (error) {
      console.log('❌ Erreur récupération publications:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }
}

testPostsFlow();
