// src/services/conversationSettingsManager.js
// Centralized manager for conversation settings (voice, speed, topic, and all conversation options)
// Synchronizes state across SpeakingScreen, ConversationSettings, ChatPage, and SideMenu

import AsyncStorage from '@react-native-async-storage/async-storage';

// Default options matching backend openaiService.js
const OPTIONS_DEFAULT = {
  // Pedagogy
  grammar_check: true,
  force_repeat: 'soft',
  correction_mode: 'explicit',
  difficulty: 'auto',
  focus: ['vocabulary', 'pronunciation'],
  min_examples_per_point: 1,

  // Language shaping
  max_sentence_words: 10,
  max_sentences_per_turn: 2,
  bilingual_support: 'off',
  ipa_pronunciation: false,
  phonics_hints: false,

  // Engagement & game mechanics
  anti_loop: true,
  reengage_after_seconds: 30,
  // Removed: reengage_style, activity_preference, praise_frequency, challenge_ratio

  // Flow & topic control
  topic_strictness: 'normal',
  wrap_up_on_turns: 14,

  // Safety & content
  banned_topics: [],
  profanity_filter: true,

  // Voice/TTS & prosody
  voice_fixed: 'alloy',
  speaking_rate: 'slow',
  ssml: false,
  pause_ms_between_sentences: 200,

  // Model steering
  temperature_base: 0.7,
  frequency_penalty: 0.3,
  presence_penalty: 0.2,
};

class ConversationSettingsManager {
  constructor() {
    // Default values - legacy settings for backward compatibility
    this.settings = {
      selectedVoice: 'alloy',
      speechRate: 1.0,
      currentTopic: null,
    };
    
    // Full conversation options
    this.options = { ...OPTIONS_DEFAULT };
    
    // Listeners for changes
    this.listeners = [];
    
    // Storage keys
    this.STORAGE_KEYS = {
      VOICE: 'conversation_voice',
      SPEECH_RATE: 'conversation_speech_rate',
      CURRENT_TOPIC: 'conversation_current_topic',
      OPTIONS: 'conversation_options_v2',
    };
    
    // Initialize from storage
    this.initialized = false;
  }

  /**
   * Initialize settings from AsyncStorage
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      const [voice, rate, topic, options] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.VOICE),
        AsyncStorage.getItem(this.STORAGE_KEYS.SPEECH_RATE),
        AsyncStorage.getItem(this.STORAGE_KEYS.CURRENT_TOPIC),
        AsyncStorage.getItem(this.STORAGE_KEYS.OPTIONS),
      ]);

      if (voice) this.settings.selectedVoice = voice;
      if (rate) this.settings.speechRate = parseFloat(rate);
      if (topic) this.settings.currentTopic = JSON.parse(topic);
      if (options) {
        const parsedOptions = JSON.parse(options);
        this.options = { ...OPTIONS_DEFAULT, ...parsedOptions };
      }

      this.initialized = true;
      console.log('[ConversationSettings] Initialized:', this.settings);
      console.log('[ConversationSettings] Options loaded:', this.options);
    } catch (error) {
      console.error('[ConversationSettings] Failed to initialize:', error);
    }
  }

  /**
   * Get current settings (legacy)
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Get all conversation options
   */
  getOptions() {
    console.log('[ConversationSettings] getOptions called, returning:', JSON.stringify(this.options, null, 2));
    return { ...this.options };
  }

  /**
   * Update conversation options
   */
  async updateOptions(updates) {
    this.options = { ...this.options, ...updates };
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.OPTIONS, JSON.stringify(this.options));
      this.notifyListeners('options', this.options);
      console.log('[ConversationSettings] Options updated:', updates);
      console.log('[ConversationSettings] Full options now:', JSON.stringify(this.options, null, 2));
    } catch (error) {
      console.error('[ConversationSettings] Failed to save options:', error);
    }
  }

  /**
   * Update single option
   */
  async updateOption(key, value) {
    await this.updateOptions({ [key]: value });
  }

  /**
   * Reset options to defaults
   */
  async resetOptionsToDefaults() {
    this.options = { ...OPTIONS_DEFAULT };
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.OPTIONS, JSON.stringify(this.options));
      this.notifyListeners('options', this.options);
      console.log('[ConversationSettings] Options reset to defaults');
    } catch (error) {
      console.error('[ConversationSettings] Failed to reset options:', error);
    }
  }

  /**
   * Get selected voice
   */
  getVoice() {
    return this.settings.selectedVoice;
  }

  /**
   * Set selected voice
   */
  async setVoice(voice) {
    if (this.settings.selectedVoice === voice) return;
    
    this.settings.selectedVoice = voice;
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.VOICE, voice);
      this.notifyListeners('voice', voice);
      console.log('[ConversationSettings] Voice updated:', voice);
    } catch (error) {
      console.error('[ConversationSettings] Failed to save voice:', error);
    }
  }

  /**
   * Get speech rate
   */
  getSpeechRate() {
    return this.settings.speechRate;
  }

  /**
   * Set speech rate
   */
  async setSpeechRate(rate) {
    if (this.settings.speechRate === rate) return;
    
    this.settings.speechRate = rate;
    
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SPEECH_RATE, rate.toString());
      this.notifyListeners('speechRate', rate);
      console.log('[ConversationSettings] Speech rate updated:', rate);
    } catch (error) {
      console.error('[ConversationSettings] Failed to save speech rate:', error);
    }
  }

  /**
   * Get current topic
   */
  getCurrentTopic() {
    return this.settings.currentTopic;
  }

  /**
   * Set current topic
   */
  async setCurrentTopic(topic) {
    this.settings.currentTopic = topic;
    
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CURRENT_TOPIC,
        JSON.stringify(topic)
      );
      this.notifyListeners('currentTopic', topic);
      console.log('[ConversationSettings] Topic updated:', topic?.title || 'none');
    } catch (error) {
      console.error('[ConversationSettings] Failed to save topic:', error);
    }
  }

  /**
   * Clear current topic
   */
  async clearCurrentTopic() {
    this.settings.currentTopic = null;
    
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_TOPIC);
      this.notifyListeners('currentTopic', null);
      console.log('[ConversationSettings] Topic cleared');
    } catch (error) {
      console.error('[ConversationSettings] Failed to clear topic:', error);
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateSettings(updates) {
    const promises = [];
    
    if (updates.selectedVoice !== undefined && updates.selectedVoice !== this.settings.selectedVoice) {
      this.settings.selectedVoice = updates.selectedVoice;
      promises.push(
        AsyncStorage.setItem(this.STORAGE_KEYS.VOICE, updates.selectedVoice)
      );
    }
    
    if (updates.speechRate !== undefined && updates.speechRate !== this.settings.speechRate) {
      this.settings.speechRate = updates.speechRate;
      promises.push(
        AsyncStorage.setItem(this.STORAGE_KEYS.SPEECH_RATE, updates.speechRate.toString())
      );
    }
    
    if (updates.currentTopic !== undefined) {
      this.settings.currentTopic = updates.currentTopic;
      promises.push(
        AsyncStorage.setItem(
          this.STORAGE_KEYS.CURRENT_TOPIC,
          JSON.stringify(updates.currentTopic)
        )
      );
    }

    try {
      await Promise.all(promises);
      this.notifyListeners('all', this.settings);
      console.log('[ConversationSettings] Batch update completed:', this.settings);
    } catch (error) {
      console.error('[ConversationSettings] Failed to update settings:', error);
    }
  }

  /**
   * Subscribe to settings changes
   * @param {Function} callback - Called with (settingKey, newValue)
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of a change
   */
  notifyListeners(key, value) {
    this.listeners.forEach(listener => {
      try {
        listener(key, value, this.settings);
      } catch (error) {
        console.error('[ConversationSettings] Listener error:', error);
      }
    });
  }

  /**
   * Reset all settings to defaults
   */
  async resetToDefaults() {
    this.settings = {
      selectedVoice: 'alloy',
      speechRate: 1.0,
      currentTopic: null,
    };
    this.options = { ...OPTIONS_DEFAULT };

    try {
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEYS.VOICE, 'alloy'),
        AsyncStorage.setItem(this.STORAGE_KEYS.SPEECH_RATE, '1.0'),
        AsyncStorage.removeItem(this.STORAGE_KEYS.CURRENT_TOPIC),
        AsyncStorage.setItem(this.STORAGE_KEYS.OPTIONS, JSON.stringify(this.options)),
      ]);
      this.notifyListeners('all', this.settings);
      this.notifyListeners('options', this.options);
      console.log('[ConversationSettings] Reset to defaults');
    } catch (error) {
      console.error('[ConversationSettings] Failed to reset settings:', error);
    }
  }

  /**
   * Get available voices (OpenAI TTS voices as of 2024)
   */
  getAvailableVoices() {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral'];
  }

  /**
   * Get available speech rates
   */
  getAvailableSpeechRates() {
    return [0.5, 0.7, 0.8, 1.0, 1.2];
  }

  /**
   * Export settings for backup/sync
   */
  exportSettings() {
    return JSON.stringify(this.settings);
  }

  /**
   * Import settings from backup/sync
   */
  async importSettings(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      await this.updateSettings(imported);
      console.log('[ConversationSettings] Settings imported successfully');
    } catch (error) {
      console.error('[ConversationSettings] Failed to import settings:', error);
      throw error;
    }
  }
}

// Create singleton instance
const conversationSettingsManager = new ConversationSettingsManager();

export default conversationSettingsManager;

