// src/services/playaudioService.js
// Centralized audio playback service for SpeakingScreen and ChatPage
import nativeAudioService from './nativeAudioService';
import { speakText } from './ttsService';

/**
 * Convert array of bytes to base64 string
 * @param {number[]} bytes - Array of byte values
 * @returns {string} - Base64 encoded string
 */
export function arrayToBase64(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;
    const bitmap = (a << 16) | (b << 8) | c;
    result += chars[(bitmap >> 18) & 63] + chars[(bitmap >> 12) & 63];
    result += i - 2 < bytes.length ? chars[(bitmap >> 6) & 63] : '=';
    result += i - 1 < bytes.length ? chars[bitmap & 63] : '=';
  }
  return result;
}

/**
 * Normalize audio data to base64 string
 * Handles various formats: string (already base64), array, or object with data array
 * @param {string|number[]|Object} audioData - Audio data in various formats
 * @returns {string} - Base64 encoded string
 * @throws {Error} - If audioData is invalid
 */
export function normalizeToBase64(audioData) {
  if (!audioData) throw new Error('No audio data');
  if (typeof audioData === 'string') return audioData; // already base64
  if (Array.isArray(audioData)) return arrayToBase64(audioData);
  if (audioData?.data && Array.isArray(audioData.data)) return arrayToBase64(audioData.data);
  // last resort: try to convert to array
  const s = JSON.stringify(audioData);
  const arr = Array.from(new Uint8Array([...s].map((c) => c.charCodeAt(0))));
  return arrayToBase64(arr);
}

/**
 * Play audio from base64 data using native audio service
 * @param {string|number[]|Object} audioData - Audio data (will be normalized to base64)
 * @returns {Promise<void>}
 */
export async function playAudioFromData(audioData) {
  try {
    console.log('[PlayAudio] Preparing to play audio...');
    const b64 = normalizeToBase64(audioData);
    console.log('[PlayAudio] Playing audio from base64 data...');
    await nativeAudioService.playAudio(b64);
    console.log('[PlayAudio] Audio playback completed');
  } catch (err) {
    console.warn('[PlayAudio] Playback error:', err);
    throw err;
  }
}

/**
 * Play TTS from text using TTS service
 * @param {string} text - Text to speak
 * @param {string} voice - Voice to use (default: 'alloy')
 * @param {string} model - Model to use (default: 'gpt-4o-mini-tts')
 * @returns {Promise<void>}
 */
export async function playTTS(text, voice = 'alloy', model = 'gpt-4o-mini-tts') {
  try {
    console.log('[PlayAudio] Preparing to speak TTS...');
    console.log('[PlayAudio] Speaking text...');
    await speakText(text, voice, model);
    console.log('[PlayAudio] TTS playback completed');
  } catch (err) {
    console.warn('[PlayAudio] TTS error:', err);
    throw err;
  }
}

/**
 * Unified function to play audio or TTS
 * Tries to play audio data first, falls back to TTS if no audio data
 * @param {string} text - Text to speak (required for TTS fallback)
 * @param {string|number[]|Object|null} audioData - Audio data from API (optional)
 * @param {string} voice - Voice to use for TTS fallback (default: 'alloy')
 * @param {string} model - Model to use for TTS fallback (default: 'gpt-4o-mini-tts')
 * @returns {Promise<void>}
 */
export async function playAudioOrTTS(text, audioData = null, voice = 'alloy', model = 'gpt-4o-mini-tts') {
  try {
    // If we have audio data from backend, play it directly
    if (audioData) {
      console.log('[PlayAudio] Playing audio from backend...');
      await playAudioFromData(audioData);
    } else {
      // Fallback to TTS
      console.log('[PlayAudio] No audio data, using TTS fallback...');
      await playTTS(text, voice, model);
    }
  } catch (err) {
    console.error('[PlayAudio] Error in playAudioOrTTS:', err);
    // Try TTS fallback if audio playback failed
    if (audioData) {
      console.log('[PlayAudio] Audio playback failed, trying TTS fallback...');
      try {
        await playTTS(text, voice, model);
      } catch (ttsErr) {
        console.warn('[PlayAudio] TTS fallback also failed:', ttsErr);
        // Don't throw - gracefully handle the error
      }
    } else {
      throw err;
    }
  }
}

/**
 * Stop current audio playback
 * @returns {Promise<void>}
 */
export async function stopAudio() {
  try {
    await nativeAudioService.stopAudio();
    console.log('[PlayAudio] Audio stopped');
  } catch (err) {
    console.warn('[PlayAudio] Error stopping audio:', err);
  }
}

