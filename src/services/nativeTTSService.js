// src/services/nativeTTSService.js
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { NativeTTS } = NativeModules;
const nativeTTSEmitter = new NativeEventEmitter(NativeTTS);

/**
 * Native TTS Service for iOS
 * Uses native iOS AVSpeechSynthesizer for device-based TTS
 */
class NativeTTSService {
  constructor() {
    this.isAvailable = Platform.OS === 'ios' && NativeTTS;
    this.isSpeaking = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.isAvailable) return;

    // Listen for speech started
    nativeTTSEmitter.addListener('onTTSSpeechStarted', (event) => {
      console.log('🎤 Native TTS: Speech started:', event);
      this.isSpeaking = true;
    });

    // Listen for speech finished
    nativeTTSEmitter.addListener('onTTSSpeechFinished', (event) => {
      console.log('✅ Native TTS: Speech finished:', event);
      this.isSpeaking = false;
    });

    // Listen for speech errors
    nativeTTSEmitter.addListener('onTTSSpeechError', (event) => {
      console.error('❌ Native TTS: Speech error:', event);
      this.isSpeaking = false;
    });
  }

  /**
   * Check if native TTS is available
   * @returns {boolean} - True if native TTS is available
   */
  isNativeTTSAvailable() {
    return this.isAvailable;
  }

  /**
   * Speak text using native iOS TTS
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   * @returns {Promise<void>}
   */
  async speakText(text, options = {}) {
    if (!this.isAvailable) {
      throw new Error('Native TTS is not available on this platform');
    }

    try {
      console.log('🎤 Native TTS: Starting speech for text:', text.substring(0, 50) + '...');
      
      const result = await NativeTTS.speakText(
        text,
        options.language || 'en-US',
        options.rate || 0.5,
        options.pitch || 1.0
      );
      
      console.log('✅ Native TTS: Speech started successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Native TTS: Speech failed:', error);
      throw error;
    }
  }

  /**
   * Stop current speech
   * @returns {Promise<void>}
   */
  async stopSpeaking() {
    if (!this.isAvailable) {
      throw new Error('Native TTS is not available on this platform');
    }

    try {
      const result = await NativeTTS.stopSpeaking();
      console.log('🛑 Native TTS: Stop result:', result);
      return result;
    } catch (error) {
      console.error('❌ Native TTS: Stop failed:', error);
      throw error;
    }
  }

  /**
   * Check if currently speaking
   * @returns {Promise<boolean>}
   */
  async isCurrentlySpeaking() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const result = await NativeTTS.isSpeaking();
      this.isSpeaking = result.isSpeaking;
      return result.isSpeaking;
    } catch (error) {
      console.error('❌ Native TTS: Status check failed:', error);
      return false;
    }
  }

  /**
   * Get available voices
   * @returns {Promise<Array>}
   */
  async getAvailableVoices() {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const result = await NativeTTS.getAvailableVoices();
      console.log('🎤 Native TTS: Available voices:', result.voices.length);
      return result.voices;
    } catch (error) {
      console.error('❌ Native TTS: Get voices failed:', error);
      return [];
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    if (this.isAvailable) {
      nativeTTSEmitter.removeAllListeners('onTTSSpeechStarted');
      nativeTTSEmitter.removeAllListeners('onTTSSpeechFinished');
      nativeTTSEmitter.removeAllListeners('onTTSSpeechError');
    }
  }
}

// Export singleton instance
export default new NativeTTSService();
