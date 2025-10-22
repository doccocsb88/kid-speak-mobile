// Test script for TTS functionality
import { speakText, checkAudioSystemAvailability, getTTSOptions } from './src/services/ttsService';

async function testTTSFunctionality() {
  console.log('🎤 Testing TTS Functionality...\n');

  try {
    // Test 1: Check audio system availability
    console.log('1. Checking audio system availability...');
    const audioAvailable = await checkAudioSystemAvailability();
    console.log('Audio system available:', audioAvailable ? '✅ Yes' : '❌ No');

    if (!audioAvailable) {
      console.log('⚠️ Audio system not available. Check device audio settings and permissions.');
      return;
    }

    // Test 2: Get TTS options
    console.log('\n2. Getting TTS options...');
    const ttsOptions = await getTTSOptions();
    console.log('Available voices:', ttsOptions.voices);
    console.log('Available models:', ttsOptions.models);

    // Test 3: Test TTS with simple text
    console.log('\n3. Testing TTS with simple text...');
    const testText = 'Hello, this is a test of the text to speech functionality.';
    console.log('Test text:', testText);
    
    await speakText(testText, 'alloy', 'tts-1');
    console.log('✅ TTS test completed successfully!');

    // Test 4: Test TTS with different voice
    console.log('\n4. Testing TTS with different voice...');
    await speakText('This is a test with a different voice.', 'nova', 'tts-1');
    console.log('✅ Different voice test completed!');

  } catch (error) {
    console.error('❌ TTS Test failed:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure your backend server is running');
    console.log('2. Check if the device has audio permissions');
    console.log('3. Verify the device volume is not muted');
    console.log('4. Try restarting the app');
    console.log('5. Check iOS audio session settings');
  }
}

// Run the test
testTTSFunctionality().catch(console.error);
