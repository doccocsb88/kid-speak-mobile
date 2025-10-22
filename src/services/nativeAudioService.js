// src/services/nativeAudioService.js
import { NativeModules, NativeEventEmitter } from 'react-native';

const { NativeAudioPlayer } = NativeModules;
const nativeAudioEmitter = new NativeEventEmitter(NativeAudioPlayer);

/**
 * Native Audio Service for iOS
 * Uses native iOS AVAudioPlayer for better audio session handling
 */
class NativeAudioService {
  constructor() {
    this.isPlaying = false;
    // Event listeners are now handled per-playback in playAudio()
  }

  /**
   * Play audio from base64 string
   * @param {string} base64String - Base64 encoded audio data
   * @returns {Promise<void>}
   */
  async playAudio(base64String) {
    try {
      console.log('🔊 Native audio service: Starting playback...');
      
      if (!NativeAudioPlayer) {
        throw new Error('NativeAudioPlayer module not available');
      }

      // Start playback
      const result = await NativeAudioPlayer.playAudioFromBase64(base64String);
      console.log('✅ Native audio service: Playback started:', result);
      
      this.isPlaying = true;
      
      // CRITICAL: Wait for actual completion event before resolving
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('⚠️ Audio playback timeout after 30s');
          this.isPlaying = false;
          resolve();
        }, 30000); // 30s timeout safety
        
        const finishListener = nativeAudioEmitter.addListener('onAudioPlaybackFinished', (event) => {
          clearTimeout(timeout);
          finishListener.remove();
          errorListener.remove();
          console.log('🎵 Native audio TRULY finished, resolving promise');
          this.isPlaying = false;
          resolve();
        });
        
        const errorListener = nativeAudioEmitter.addListener('onAudioPlaybackError', (event) => {
          clearTimeout(timeout);
          finishListener.remove();
          errorListener.remove();
          console.error('❌ Native audio error during playback:', event);
          this.isPlaying = false;
          reject(new Error(event?.error || 'Audio playback error'));
        });
      });
    } catch (error) {
      console.error('❌ Native audio service error:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * Stop current audio playback
   * @returns {Promise<void>}
   */
  async stopAudio() {
    try {
      if (NativeAudioPlayer) {
        const result = await NativeAudioPlayer.stopAudio();
        console.log('🛑 Native audio service: Stopped:', result);
        this.isPlaying = false;
        return result;
      }
    } catch (error) {
      console.error('❌ Native audio stop error:', error);
      throw error;
    }
  }

  /**
   * Check if audio is currently playing
   * @returns {Promise<boolean>}
   */
  async isPlaying() {
    try {
      if (NativeAudioPlayer) {
        const result = await NativeAudioPlayer.isPlaying();
        this.isPlaying = result.isPlaying;
        return result.isPlaying;
      }
      return false;
    } catch (error) {
      console.error('❌ Native audio status error:', error);
      return false;
    }
  }

  /**
   * Clean up event listeners (now managed per-playback)
   */
  cleanup() {
    // Event listeners are now automatically removed after each playback
    // This method kept for backward compatibility
  }
}

// Export singleton instance
export default new NativeAudioService();
