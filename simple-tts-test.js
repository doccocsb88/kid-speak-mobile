// Simple TTS test script
const { speakText } = require('./src/services/ttsService');

async function testTTS() {
  console.log('🎤 Testing TTS with simple text...');
  
  try {
    await speakText('Hello, this is a test of text to speech functionality.');
    console.log('✅ TTS test completed');
  } catch (error) {
    console.error('❌ TTS test failed:', error.message);
  }
}

testTTS();
