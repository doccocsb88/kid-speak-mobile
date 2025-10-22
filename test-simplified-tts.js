// Test TTS with simplified approach
const { speakText } = require('./src/services/ttsService');

async function testSimplifiedTTS() {
  console.log('🎤 Testing Simplified TTS...');
  
  try {
    await speakText('Hello, this is a test of the simplified text to speech functionality.');
    console.log('✅ TTS test completed successfully');
  } catch (error) {
    console.error('❌ TTS test failed:', error.message);
  }
}

testSimplifiedTTS();
