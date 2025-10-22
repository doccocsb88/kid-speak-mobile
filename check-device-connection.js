// Script to check device connection to backend
const API_BASE_URL = 'http://172.16.2.124:5000/api';

async function checkDeviceConnection() {
  console.log('🔍 Checking Device Connection to Backend...');
  console.log('📱 Device should connect to:', API_BASE_URL);
  console.log('💻 Make sure your backend server is running on port 5000');
  console.log('🌐 Make sure your device and computer are on the same WiFi network\n');

  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const response = await fetch(`${API_BASE_URL}/health/health`);
    console.log('✅ Connection successful! Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('📊 Health data:', data);
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure your backend server is running: npm start (in backend folder)');
    console.log('2. Check if port 5000 is open: lsof -i :5000');
    console.log('3. Make sure your device and computer are on the same WiFi');
    console.log('4. Try pinging your computer from device');
    console.log('5. Check firewall settings on your computer');
    return;
  }

  try {
    // Test 2: API endpoints
    console.log('\n2. Testing API endpoints...');
    const endpoints = [
      '/auth/login',
      '/auth/profile', 
      '/chat/send-message',
      '/chat/tts-options'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ API endpoints test failed:', error.message);
  }

  console.log('\n🎉 If you see successful connections above, your device should work!');
  console.log('📱 Now try running your React Native app on the real device');
}

checkDeviceConnection().catch(console.error);
