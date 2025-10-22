// Test native audio implementation
const { speakText } = require('./src/services/ttsService');

async function testNativeAudio() {
  console.log('🎤 Testing Native Audio Implementation...');
  
  try {
    console.log('📱 Testing TTS with native audio player...');
    await speakText('Hello, this is a test of the native audio player implementation.');
    console.log('✅ Native audio test completed');
  } catch (error) {
    console.error('❌ Native audio test failed:', error.message);
  }
}

testNativeAudio();
