// src/services/ttsService.js
import axios from 'axios';
import Sound from 'react-native-sound';
import { Platform, PermissionsAndroid } from 'react-native';
import { API_BASE_URL } from '../config/api';
import nativeAudioService from './nativeAudioService';
import nativeTTSService from './nativeTTSService';

// Configure Sound for proper iOS audio session
Sound.setCategory('Playback', true); // Enable mixWithOthers for better iOS compatibility
Sound.setMode('Default');

// Initialize Sound with proper error handling
Sound.setActive(true);

// Request audio permissions for Android
async function requestAudioPermissions() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Audio Permission',
          message: 'This app needs access to audio to play speech.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Audio permission request failed:', err);
      return false;
    }
  }
  return true; // iOS doesn't need explicit permission for playback
}

/**
 * Convert blob to base64 string
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<string>} - Base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Blob to base64 conversion timeout'));
    }, 10000); // 10 second timeout for conversion

    try {
      const reader = new FileReader();
      
      reader.onload = () => {
        clearTimeout(timeout);
        try {
          const base64 = reader.result.split(',')[1];
          if (!base64) {
            reject(new Error('Invalid base64 data from FileReader'));
            return;
          }
          resolve(base64);
        } catch (error) {
          reject(new Error(`Base64 parsing error: ${error.message}`));
        }
      };
      
      reader.onerror = (error) => {
        clearTimeout(timeout);
        reject(new Error(`FileReader error: ${error.message || 'Unknown error'}`));
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error(`FileReader setup error: ${error.message}`));
    }
  });
}

/**
 * Check if TTS service is available
 * @returns {Promise<boolean>} - True if TTS service is available
 */
export async function checkTTSServiceAvailability() {
  try {
    console.log('🔍 Checking TTS service availability...');
    
    const response = await axios.get(`${API_BASE_URL}/chat/tts-options`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('✅ TTS service is available');
    return true;
  } catch (error) {
    console.log('⚠️ TTS service not available:', error.message);
    return false;
  }
}

/**
 * Check if audio system is available and properly configured
 * @returns {Promise<boolean>} - True if audio system is ready
 */
export async function checkAudioSystemAvailability() {
  try {
    console.log('🔍 Checking audio system availability...');
    
    // Always return true - let the actual playback methods handle errors
    console.log('✅ Audio system check passed (will test during actual playback)');
    return true;
  } catch (error) {
    console.error('Audio system check failed:', error);
    return true; // Assume available, let playAudioWithControls handle the real test
  }
}

/**
 * Convert text to speech using OpenAI's TTS API via backend
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param {string} model - The model to use (tts-1, tts-1-hd)
 * @returns {Promise<Blob>} - Audio blob
 */
export async function textToSpeech(text, voice = 'alloy', model = 'tts-1') {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    console.log('🎤 Starting TTS API request...');
    const startTime = Date.now();

    const response = await axios.post(`${API_BASE_URL}/chat/text-to-speech`, {
      text,
      voice,
      model
    }, {
      responseType: 'blob',
      timeout: 20000 // Reduced to 20 second timeout for TTS generation
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ TTS API request completed in ${duration}ms`);

    return response.data;
  } catch (error) {
    console.error('TTS Service Error:', error);
    
    // Provide more specific error messages
    if (error.code === 'ECONNABORTED') {
      throw new Error('TTS generation failed: timeout of 20000ms exceeded');
    } else if (error.response?.status === 404) {
      throw new Error('TTS endpoint not found. Please check if the backend server is running with TTS support.');
    } else if (error.response?.status === 500) {
      throw new Error('TTS server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      throw new Error('Network error. Please check your internet connection and server status.');
    } else {
      throw new Error(`TTS generation failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

/**
 * Play audio blob with custom rate and controls
 * @param {Blob} audioBlob - The audio blob to play
 * @param {Object} options - Playback options
 * @returns {Promise<void>}
 */
export async function playAudioWithControls(audioBlob, options = {}) {
  try {
    console.log('🔊 Starting audio playback...');
    
    // Request audio permissions first
    const hasPermission = await requestAudioPermissions();
    if (!hasPermission) {
      console.log('⚠️ Audio permission denied, skipping audio playback');
      return;
    }

    // For iOS, use native audio player
    if (Platform.OS === 'ios') {
      console.log('🍎 iOS detected - using native audio player...');
      try {
        // Convert blob to base64 with timeout
        console.log('🔄 Converting blob to base64...');
        const base64String = await Promise.race([
          blobToBase64(audioBlob),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Blob conversion timeout')), 15000)
          )
        ]);
        
        console.log('📄 Audio data converted to base64, length:', base64String.length);
        
        // Use native audio player
        await nativeAudioService.playAudio(base64String);
        console.log('✅ Native audio playback successful');
        return;
      } catch (nativeError) {
        console.log('⚠️ Native audio failed, falling back to react-native-sound:', nativeError.message);
        // Fall through to react-native-sound fallback
      }
    }

    // Configure audio session for react-native-sound (Android or iOS fallback)
    if (Platform.OS === 'ios') {
      console.log('🍎 Configuring iOS audio session for react-native-sound fallback...');
      try {
        // Try different audio session configurations
        Sound.setCategory('Playback', false); // Disable mixWithOthers first
        Sound.setMode('Default');
        Sound.setActive(true);
        console.log('✅ iOS audio session configured');
      } catch (sessionError) {
        console.log('⚠️ Audio session configuration warning:', sessionError.message);
        // Continue anyway
      }
    }

    return new Promise((resolve) => {
      // Add overall timeout for the entire playback process
      const overallTimeout = setTimeout(() => {
        console.log('⏰ Audio playback timeout, skipping gracefully');
        resolve();
      }, 25000); // 25 second timeout for entire playback process

      try {
        // Convert blob to base64 for React Native Sound with timeout
        console.log('🔄 Converting blob to base64 for react-native-sound...');
        
        const conversionPromise = new Promise((resolveConversion, rejectConversion) => {
          const reader = new FileReader();
          
          reader.onload = () => {
            try {
              const base64Data = reader.result.split(',')[1];
              if (!base64Data) {
                rejectConversion(new Error('Invalid base64 data from FileReader'));
                return;
              }
              console.log('📄 Audio data converted to base64, length:', base64Data.length);
              resolveConversion(base64Data);
            } catch (error) {
              rejectConversion(new Error(`Base64 parsing error: ${error.message}`));
            }
          };
          
          reader.onerror = (error) => {
            rejectConversion(new Error(`FileReader error: ${error.message || 'Unknown error'}`));
          };
          
          reader.readAsDataURL(audioBlob);
        });

        // Race between conversion and timeout
        Promise.race([
          conversionPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Blob conversion timeout')), 10000)
          )
        ]).then((base64Data) => {
          // Create sound instance
          const sound = new Sound(base64Data, '', (error) => {
            if (error) {
              console.error('❌ Sound initialization error:', error);
              console.error('Error details:', JSON.stringify(error, null, 2));
              
              // Handle specific iOS audio session errors
              if (error.code === 'ENSOSSTATUSERRORDOMAIN-43' || error.message.includes('OSStatus error -43')) {
                console.log('🔄 iOS Audio Session Error -43 detected. Trying alternative approach...');
                
                // Try with different audio category
                try {
                  Sound.setCategory('Playback', true); // Enable mixWithOthers
                  Sound.setMode('Default');
                  
                  // Retry with simpler approach
                  const retrySound = new Sound(base64Data, '', (retryError) => {
                    clearTimeout(overallTimeout);
                    if (retryError) {
                      console.error('❌ Retry failed:', retryError);
                      console.log('🔄 All audio methods failed, skipping audio playback gracefully');
                      resolve(); // Don't reject, just skip gracefully
                    } else {
                      console.log('✅ Retry successful, playing audio...');
                      retrySound.setVolume(options.volume || 1.0);
                      retrySound.play((success) => {
                        clearTimeout(overallTimeout);
                        if (success) {
                          console.log('🎵 Audio playback completed successfully');
                        } else {
                          console.error('❌ Audio playback failed');
                        }
                        retrySound.release();
                        resolve(); // Always resolve, don't reject
                      });
                    }
                  });
                } catch (retryError) {
                  clearTimeout(overallTimeout);
                  console.error('❌ Retry setup failed:', retryError);
                  console.log('🔄 All audio methods failed, skipping audio playback gracefully');
                  resolve(); // Don't reject, just skip gracefully
                }
                return;
              }
              
              clearTimeout(overallTimeout);
              console.log('🔄 Sound initialization failed, skipping audio playback gracefully');
              resolve(); // Don't reject, just skip gracefully
              return;
            }
            
            console.log('✅ Sound initialized successfully');
            // Set playback options
            sound.setVolume(options.volume || 1.0);
            
            sound.play((success) => {
              clearTimeout(overallTimeout);
              if (success) {
                console.log('🎵 Audio playback completed successfully');
              } else {
                console.error('❌ Audio playback failed');
              }
              sound.release();
              resolve(); // Always resolve, don't reject
            });
          });
        }).catch((conversionError) => {
          clearTimeout(overallTimeout);
          console.error('❌ Blob conversion failed:', conversionError.message);
          console.log('🔄 Blob conversion failed, skipping audio playback gracefully');
          resolve(); // Don't reject, just skip gracefully
        });
        
      } catch (error) {
        clearTimeout(overallTimeout);
        console.error('❌ PlayAudioWithControls error:', error);
        console.log('🔄 PlayAudioWithControls failed, skipping audio playback gracefully');
        resolve(); // Don't reject, just skip gracefully
      }
    });
  } catch (error) {
    console.error('❌ Audio permission or setup error:', error);
    console.log('🔄 Audio setup failed, skipping audio playback gracefully');
    // Don't throw error, just skip gracefully
  }
}


/**
 * Convert text to speech and play it with fallback mechanism
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use
 * @param {string} model - The model to use
 * @returns {Promise<void>}
 */
export async function speakText(text, voice = 'alloy', model = 'tts-1') {
  try {
    // Validate text input
    if (!text || typeof text !== 'string' || text.trim() === '') {
      console.log('⚠️ Invalid text provided to TTS, skipping...');
      return Promise.resolve();
    }
    
    console.log('🎤 Starting TTS for text:', text.substring(0, 50) + '...');
    
    // Check audio system availability first
    const audioAvailable = await checkAudioSystemAvailability();
    if (!audioAvailable) {
      console.log('⚠️ Audio system not available, skipping TTS');
      return Promise.resolve();
    }
    
    // Try TTS service first
    try {
      console.log('🌐 Attempting TTS service...');
      const audioBlob = await textToSpeech(text, voice, model);
      console.log('✅ TTS audio generated successfully');
      
      await playAudioWithControls(audioBlob);
      console.log('🔊 Audio playback completed');
      return;
      
    } catch (ttsError) {
      console.log('⚠️ TTS service failed:', ttsError.message);
      
      // Fallback to native iOS TTS if available
      if (Platform.OS === 'ios' && nativeTTSService.isNativeTTSAvailable()) {
        console.log('🍎 Falling back to native iOS TTS...');
        try {
          await nativeTTSService.speakText(text, {
            language: 'en-US',
            rate: 1.0,
            pitch: 1.0
          });
          console.log('✅ Native iOS TTS completed successfully');
          return;
        } catch (nativeError) {
          console.log('⚠️ Native iOS TTS also failed:', nativeError.message);
          // Continue to final error handling
        }
      } else {
        console.log('⚠️ Native iOS TTS not available on this platform');
      }
      
      // If all TTS methods fail, throw the original error
      throw ttsError;
    }
    
  } catch (error) {
    console.error('❌ Speak Text Error:', error);
    
    // Provide more specific error information
    if (error.message.includes('Audio permission denied')) {
      console.log('🔒 Audio permission denied - please grant audio permissions in device settings');
    } else if (error.message.includes('iOS Audio Session Error')) {
      console.log('🍎 iOS Audio Session Error - this is a known iOS issue with audio initialization');
      console.log('💡 Try restarting the app or checking device audio settings');
    } else if (error.message.includes('Failed to initialize audio')) {
      console.log('🔧 Audio initialization failed - this may be due to iOS audio session issues');
    } else if (error.message.includes('Audio playback failed')) {
      console.log('🔊 Audio playback failed - check device audio settings and volume');
    } else if (error.message.includes('Network error')) {
      console.log('🌐 Network error - check internet connection and server status');
    } else if (error.message.includes('TTS service not available')) {
      console.log('🌐 TTS service unavailable - check backend server status');
    } else {
      console.log('❓ TTS error:', error.message);
    }
    
    console.log('🔇 TTS not available, skipping audio playback gracefully');
    // Don't throw error, just skip TTS gracefully
    return Promise.resolve();
  }
}

/**
 * Stop current TTS playback
 * @returns {Promise<void>}
 */
export async function stopTTS() {
  try {
    console.log('🛑 Stopping TTS playback...');
    
    // Stop native iOS TTS if available and speaking
    if (Platform.OS === 'ios' && nativeTTSService.isNativeTTSAvailable()) {
      const isSpeaking = await nativeTTSService.isCurrentlySpeaking();
      if (isSpeaking) {
        await nativeTTSService.stopSpeaking();
        console.log('✅ Native iOS TTS stopped');
        return;
      }
    }
    
    // Stop native audio player if available
    try {
      await nativeAudioService.stopAudio();
      console.log('✅ Native audio player stopped');
    } catch (error) {
      console.log('⚠️ Native audio stop failed:', error.message);
    }
    
    console.log('🛑 TTS stop completed');
  } catch (error) {
    console.error('❌ Stop TTS error:', error);
  }
}

/**
 * Check if TTS is currently speaking
 * @returns {Promise<boolean>}
 */
export async function isTTSSpeaking() {
  try {
    // Check native iOS TTS first
    if (Platform.OS === 'ios' && nativeTTSService.isNativeTTSAvailable()) {
      return await nativeTTSService.isCurrentlySpeaking();
    }
    
    // Check native audio player
    return await nativeAudioService.isPlaying();
  } catch (error) {
    console.error('❌ Check TTS speaking error:', error);
    return false;
  }
}

// Cache for TTS options to prevent repeated API calls
let ttsOptionsCache = null;
let ttsOptionsCacheTime = null;
const TTS_CACHE_DURATION = 5 * 24 * 60 * 60 * 1000; // 5 * 24 hours cache duration

/**
 * Get available TTS options from backend with caching
 * @returns {Promise<Object>} - Available voices and models
 */
export async function getTTSOptions() {
  // Check if we have valid cached data
  if (ttsOptionsCache && ttsOptionsCacheTime && 
      (Date.now() - ttsOptionsCacheTime) < TTS_CACHE_DURATION) {
    console.log('📦 Using cached TTS options');
    return ttsOptionsCache;
  }

  try {
    console.log('🌐 Fetching TTS options from API...');
    const response = await axios.get(`${API_BASE_URL}/chat/tts-options`, {
      timeout: 5000 // 5 second timeout
    });
    
    // Cache the successful response
    ttsOptionsCache = response.data;
    ttsOptionsCacheTime = Date.now();
    console.log('✅ TTS options cached successfully');
    
    return response.data;
  } catch (error) {
    console.error('Error getting TTS options:', error);
    
    // If we have cached data (even if expired), use it as fallback
    if (ttsOptionsCache) {
      console.log('⚠️ Using expired cached TTS options as fallback');
      return ttsOptionsCache;
    }
    
    // Return default options if no cache and endpoint fails
    // Valid OpenAI voices: nova, shimmer, echo, onyx, fable, alloy, ash, sage, coral
    const defaultOptions = {
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral'],
      models: ['tts-1', 'tts-1-hd']
    };
    
    // Cache the default options so we don't keep hitting the API
    ttsOptionsCache = defaultOptions;
    ttsOptionsCacheTime = Date.now();
    
    return defaultOptions;
  }
}

/**
 * Clear TTS options cache (useful for testing or when options might have changed)
 */
export function clearTTSOptionsCache() {
  console.log('🗑️ Clearing TTS options cache');
  ttsOptionsCache = null;
  ttsOptionsCacheTime = null;
}

// Export native TTS service for direct access if needed
export { nativeTTSService };
