// Test API connection without React Native dependencies
const axios = require('axios');

const API_BASE_URL = 'http://172.16.2.124:5000/api';

async function testAPIConnection() {
  console.log('🔍 Testing API connection...');
  console.log('API Base URL:', API_BASE_URL);

  try {
    // Test TTS endpoint
    console.log('\n1. Testing TTS endpoint...');
    const response = await axios.post(`${API_BASE_URL}/chat/text-to-speech`, {
      text: 'Hello test',
      voice: 'alloy',
      model: 'tts-1'
    }, {
      responseType: 'blob',
      timeout: 10000
    });
    
    console.log('✅ TTS endpoint working! Response size:', response.data.size);
    
  } catch (error) {
    console.error('❌ TTS endpoint error:', error.response?.status, error.message);
  }

  try {
    // Test TTS options endpoint
    console.log('\n2. Testing TTS options endpoint...');
    const optionsResponse = await axios.get(`${API_BASE_URL}/chat/tts-options`, {
      timeout: 5000
    });
    
    console.log('✅ TTS options endpoint working!', optionsResponse.data);
    
  } catch (error) {
    console.error('❌ TTS options endpoint error:', error.response?.status, error.message);
  }
}

testAPIConnection().catch(console.error);
