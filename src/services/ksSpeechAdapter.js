// KSSpeechAdapter - Wrapper để map KSSpeech native module sang Voice library format
// Cho phép SpeakingScreen sử dụng KSSpeech module với API tương thích với @react-native-voice/voice

import { NativeModules, DeviceEventEmitter } from 'react-native';

const { KSSpeech } = NativeModules;

class KSSpeechAdapter {
  constructor() {
    this.listeners = {
      onSpeechStart: null,
      onSpeechResults: null,
      onSpeechEnd: null,
      onSpeechError: null,
      onSpeechVolumeChanged: null,
    };
    this.subscriptions = [];
    this.isInitialized = false;
  }

  // Initialize event listeners
  initialize() {
    if (!KSSpeech || this.isInitialized) {
      console.log('[KSSpeechAdapter] Cannot initialize - KSSpeech not available or already initialized');
      return;
    }

    console.log('[KSSpeechAdapter] Initializing event listeners...');
    console.log('[KSSpeechAdapter] KSSpeech module:', KSSpeech);
    console.log('[KSSpeechAdapter] Using DeviceEventEmitter for events');

    // Map KSSpeech.onStart -> Voice.onSpeechStart
    console.log('[KSSpeechAdapter] Adding listener for KSSpeech.onStart...');
    const startSub = DeviceEventEmitter.addListener('KSSpeech.onStart', () => {
      console.log('[KSSpeechAdapter] RECEIVED onStart event from native module -> onSpeechStart');
      if (this.listeners.onSpeechStart) {
        this.listeners.onSpeechStart();
      } else {
        console.log('[KSSpeechAdapter] WARNING: onSpeechStart listener not set!');
      }
    });
    console.log('[KSSpeechAdapter] Added listener for KSSpeech.onStart:', startSub);

    // Map KSSpeech.onResults + onPartialResults -> Voice.onSpeechResults
    // Voice library gộp cả partial và final results vào 1 event
    const resultsSub = DeviceEventEmitter.addListener('KSSpeech.onResults', (data) => {
      console.log('[KSSpeechAdapter] RECEIVED onResults event from native module:', data);
      if (this.listeners.onSpeechResults) {
        const text = data?.text || '';
        console.log('[KSSpeechAdapter] onResults -> onSpeechResults (final):', text);
        this.listeners.onSpeechResults({ value: [text] });
      } else {
        console.log('[KSSpeechAdapter] WARNING: onSpeechResults listener not set!');
      }
    });

    const partialResultsSub = DeviceEventEmitter.addListener('KSSpeech.onPartialResults', (data) => {
      console.log('[KSSpeechAdapter] RECEIVED onPartialResults event from native module:', data);
      if (this.listeners.onSpeechResults) {
        const text = data?.text || '';
        console.log('[KSSpeechAdapter] onPartialResults -> onSpeechResults (partial):', text);
        this.listeners.onSpeechResults({ value: [text] });
      } else {
        console.log('[KSSpeechAdapter] WARNING: onSpeechResults listener not set!');
      }
    });

    // Map KSSpeech.onEnd -> Voice.onSpeechEnd
    const endSub = DeviceEventEmitter.addListener('KSSpeech.onEnd', () => {
      console.log('[KSSpeechAdapter] onEnd -> onSpeechEnd');
      if (this.listeners.onSpeechEnd) {
        this.listeners.onSpeechEnd();
      }
    });

    // Map KSSpeech.onError -> Voice.onSpeechError
    const errorSub = DeviceEventEmitter.addListener('KSSpeech.onError', (data) => {
      console.log('[KSSpeechAdapter] onError -> onSpeechError');
      if (this.listeners.onSpeechError) {
        // Convert error code + message to error object
        const error = {
          code: data?.code || 'UNKNOWN',
          message: data?.message || 'Unknown error',
          error: data?.message || 'Unknown error',
        };
        this.listeners.onSpeechError(error);
      }
    });

    // Map KSSpeech.onRmsChanged -> Voice.onSpeechVolumeChanged
    const volumeSub = DeviceEventEmitter.addListener('KSSpeech.onRmsChanged', (data) => {
      console.log('[KSSpeechAdapter] RECEIVED onRmsChanged event from native module:', data);
      if (this.listeners.onSpeechVolumeChanged) {
        // Use 'value' field to match Voice format (also supports 'rms' for backward compat)
        const value = data?.value !== undefined ? data.value : data?.rms;
        console.log('[KSSpeechAdapter] onRmsChanged -> onSpeechVolumeChanged:', value);
        this.listeners.onSpeechVolumeChanged({ value });
      } else {
        console.log('[KSSpeechAdapter] WARNING: onSpeechVolumeChanged listener not set!');
      }
    });

    this.subscriptions = [startSub, resultsSub, partialResultsSub, endSub, errorSub, volumeSub];
    this.isInitialized = true;
    console.log('[KSSpeechAdapter] Event listeners initialized');
  }

  // Cleanup event listeners
  removeAllListeners() {
    console.log('[KSSpeechAdapter] Removing all listeners...');
    this.subscriptions.forEach(sub => sub.remove());
    this.subscriptions = [];
    this.isInitialized = false;
    this.listeners = {
      onSpeechStart: null,
      onSpeechResults: null,
      onSpeechEnd: null,
      onSpeechError: null,
      onSpeechVolumeChanged: null,
    };
  }

  // Set event listeners (matching Voice library API)
  set onSpeechStart(callback) {
    this.listeners.onSpeechStart = callback;
  }

  set onSpeechResults(callback) {
    this.listeners.onSpeechResults = callback;
  }

  set onSpeechEnd(callback) {
    this.listeners.onSpeechEnd = callback;
  }

  set onSpeechError(callback) {
    this.listeners.onSpeechError = callback;
  }

  set onSpeechVolumeChanged(callback) {
    this.listeners.onSpeechVolumeChanged = callback;
  }

  // Methods matching Voice library API
  async start(language = 'en-US') {
    if (!KSSpeech) {
      throw new Error('KSSpeech native module is not available');
    }
    console.log('[KSSpeechAdapter] start() called with language:', language);
    try {
      await KSSpeech.start(language);
      console.log('[KSSpeechAdapter] start() succeeded');
    } catch (error) {
      console.error('[KSSpeechAdapter] start() failed:', error);
      throw error;
    }
  }

  async stop() {
    if (!KSSpeech) {
      throw new Error('KSSpeech native module is not available');
    }
    console.log('[KSSpeechAdapter] stop() called');
    try {
      await KSSpeech.stop();
      console.log('[KSSpeechAdapter] stop() succeeded');
    } catch (error) {
      console.error('[KSSpeechAdapter] stop() failed:', error);
      throw error;
    }
  }

  async cancel() {
    if (!KSSpeech) {
      throw new Error('KSSpeech native module is not available');
    }
    console.log('[KSSpeechAdapter] cancel() called');
    try {
      await KSSpeech.cancel();
      console.log('[KSSpeechAdapter] cancel() succeeded');
    } catch (error) {
      console.error('[KSSpeechAdapter] cancel() failed:', error);
      throw error;
    }
  }

  async destroy() {
    if (!KSSpeech) {
      throw new Error('KSSpeech native module is not available');
    }
    console.log('[KSSpeechAdapter] destroy() called');
    try {
      await KSSpeech.destroy();
      this.removeAllListeners();
      console.log('[KSSpeechAdapter] destroy() succeeded');
    } catch (error) {
      console.error('[KSSpeechAdapter] destroy() failed:', error);
      throw error;
    }
  }

  // Check if module is available (instance method)
  isAvailable() {
    return !!KSSpeech;
  }

  // Static method for direct class access
  static isAvailable() {
    return !!KSSpeech;
  }
}

// Export singleton instance
const ksSpeechAdapter = new KSSpeechAdapter();

export default ksSpeechAdapter;

