// Test script to check API connection
const API_BASE_URL = 'http://172.16.2.124:5000/api';

async function testAPI() {
  console.log('Testing API connection...');
  console.log('API Base URL:', API_BASE_URL);

  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health/health`);
    console.log('Health response:', healthResponse.status);
  } catch (error) {
    console.log('Health endpoint not available:', error.message);
  }

  try {
    // Test 2: Auth profile (should return 401 without token)
    console.log('\n2. Testing auth profile endpoint...');
    const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`);
    const profileData = await profileResponse.json();
    console.log('Profile response:', profileResponse.status, profileData);
  } catch (error) {
    console.log('Profile endpoint error:', error.message);
  }

  try {
    // Test 3: Login with invalid credentials
    console.log('\n3. Testing login endpoint...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });
    const loginData = await loginResponse.json();
    console.log('Login response:', loginResponse.status, loginData);
  } catch (error) {
    console.log('Login endpoint error:', error.message);
  }

  try {
    // Test 4: Chat send message endpoint
    console.log('\n4. Testing chat send-message endpoint...');
    const chatResponse = await fetch(`${API_BASE_URL}/chat/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        topic: { title: 'Animals' },
        userInfo: { name: 'Test User', age: 7 }
      })
    });
    const chatData = await chatResponse.json();
    console.log('Chat response:', chatResponse.status, chatData);
  } catch (error) {
    console.log('Chat endpoint error:', error.message);
  }

  try {
    // Test 5: TTS options endpoint
    console.log('\n5. Testing TTS options endpoint...');
    const ttsResponse = await fetch(`${API_BASE_URL}/chat/tts-options`);
    const ttsData = await ttsResponse.json();
    console.log('TTS options response:', ttsResponse.status, ttsData);
  } catch (error) {
    console.log('TTS options endpoint error:', error.message);
  }
}

testAPI();
