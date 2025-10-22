// Comprehensive backend API checker
const API_BASE_URL = 'http://localhost:5000/api';

async function checkBackendStatus() {
  console.log('🔍 Checking Backend API Status...');
  console.log('📍 API Base URL:', API_BASE_URL);
  console.log('=' .repeat(50));

  const endpoints = [
    { path: '/health/health', method: 'GET', name: 'Health Check' },
    { path: '/auth/login', method: 'POST', name: 'Auth Login', body: { email: 'test@test.com', password: 'test' } },
    { path: '/auth/profile', method: 'GET', name: 'Auth Profile' },
    { path: '/chat/send-message', method: 'POST', name: 'Chat Send Message', body: { message: 'Hello', topic: { title: 'Test' }, userInfo: { name: 'Test', age: 7 } } },
    { path: '/chat/start-session', method: 'POST', name: 'Chat Start Session', body: { topic: 'Animals', difficultyLevel: 'beginner' } },
    { path: '/chat/text-to-speech', method: 'POST', name: 'Text to Speech', body: { text: 'Hello world', voice: 'alloy', model: 'tts-1' } },
    { path: '/chat/tts-options', method: 'GET', name: 'TTS Options' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 Testing: ${endpoint.name}`);
      console.log(`   ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log('   ✅ SUCCESS');
      } else if (response.status === 401) {
        console.log('   ⚠️  UNAUTHORIZED (Expected for auth endpoints)');
      } else if (response.status === 404) {
        console.log('   ❌ NOT FOUND');
      } else if (response.status === 500) {
        console.log('   ⚠️  SERVER ERROR');
        try {
          const errorData = await response.json();
          console.log('   Error details:', errorData.message || 'Unknown error');
        } catch (e) {
          console.log('   Could not parse error response');
        }
      } else {
        console.log('   ⚠️  UNEXPECTED STATUS');
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📋 Summary:');
  console.log('✅ 200 = Endpoint working correctly');
  console.log('⚠️  401 = Authentication required (normal for auth endpoints)');
  console.log('⚠️  500 = Server error (backend issue)');
  console.log('❌ 404 = Endpoint not found');
  console.log('❌ ERROR = Network/connection issue');
  
  console.log('\n💡 Recommendations:');
  console.log('1. If you see 404 errors, those endpoints may not be implemented in your backend');
  console.log('2. If you see 500 errors, check your backend server logs');
  console.log('3. If you see network errors, make sure your backend server is running on port 5000');
  console.log('4. Make sure your backend server is accessible from your mobile device/emulator');
}

checkBackendStatus().catch(console.error);
