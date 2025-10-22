// src/hooks/useConversationSettings_v2.js
// Enhanced React hook for full conversation options management
// Includes all OPTIONS_DEFAULT from openaiService.js

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default options matching backend openaiService.js
const OPTIONS_DEFAULT = {
  // Pedagogy
  grammar_check: true,
  force_repeat: 'soft',
  correction_mode: 'explicit',
  difficulty: 'auto',
  focus: ['vocabulary', 'pronunciation'],
  target_vocab: [],
  min_examples_per_point: 1,
  scaffold_level: 1,

  // Language shaping
  max_sentence_words: 10,
  max_sentences_per_turn: 2,
  emoji_usage: 'light',
  bilingual_support: 'off',
  ipa_pronunciation: false,
  phonics_hints: false,

  // Engagement & game mechanics
  anti_loop: true,
  reengage_after_seconds: 30,
  reengage_style: 'playful',
  activity_preference: ['repeat_after_me', 'AB_choice', 'fill_blank'],
  praise_frequency: 'normal',
  challenge_ratio: 0.4,

  // Flow & topic control
  topic_strictness: 'normal',
  open_question_ratio: 0.3,
  wrap_up_on_turns: 14,

  // Safety & content
  banned_topics: [],
  profanity_filter: true,
  age_gate: 6,

  // Voice/TTS & prosody
  voice_policy: 'per_level',
  voice_fixed: 'alloy',
  speaking_rate: 'slow',
  ssml: false,
  pause_ms_between_sentences: 250,

  // Model steering
  temperature_base: 0.7,
  frequency_penalty: 0.3,
  presence_penalty: 0.2,
};

const STORAGE_KEY = 'conversation_options_v2';

/**
 * Enhanced hook for managing conversation settings with full options support
 * Includes persistence via AsyncStorage
 * 
 * @returns {Object} Settings, options, and updater functions
 */
export function useConversationSettingsV2() {
  const [options, setOptions] = useState(OPTIONS_DEFAULT);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved options on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsedOptions = JSON.parse(saved);
          setOptions({ ...OPTIONS_DEFAULT, ...parsedOptions });
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load conversation options:', error);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Save options whenever they change
  const saveOptions = async (newOptions) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newOptions));
    } catch (error) {
      console.error('Failed to save conversation options:', error);
    }
  };

  // Update all options at once
  const updateOptions = async (updates) => {
    const newOptions = { ...options, ...updates };
    setOptions(newOptions);
    await saveOptions(newOptions);
  };

  // Update single option
  const updateOption = async (key, value) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    await saveOptions(newOptions);
  };

  // Reset to defaults
  const resetToDefaults = async () => {
    setOptions(OPTIONS_DEFAULT);
    await saveOptions(OPTIONS_DEFAULT);
  };

  // Topic management
  const updateCurrentTopic = (topic) => {
    setCurrentTopic(topic);
  };

  const clearCurrentTopic = () => {
    setCurrentTopic(null);
  };

  // Convenience getters for backward compatibility
  const selectedVoice = options.voice_fixed;
  const speechRate = options.speaking_rate === 'slow' ? 0.9 : 1.0;
  
  // Backward compatible setters
  const setVoice = (voice) => updateOption('voice_fixed', voice);
  const setSpeechRate = (rate) => {
    const rateString = rate < 1.0 ? 'slow' : 'normal';
    updateOption('speaking_rate', rateString);
  };

  // Get specific option values
  const getOption = (key) => options[key];

  // Check if an option is at default value
  const isDefault = (key) => options[key] === OPTIONS_DEFAULT[key];

  return {
    // Full options object
    options,
    
    // Topic
    currentTopic,
    
    // Status flags
    isInitialized,
    isLoading,
    
    // Update functions
    updateOptions,      // Update multiple options at once
    updateOption,       // Update single option
    resetToDefaults,    // Reset all to defaults
    
    // Topic functions
    setCurrentTopic: updateCurrentTopic,
    clearCurrentTopic,
    
    // Backward compatible functions
    selectedVoice,
    speechRate,
    setVoice,
    setSpeechRate,
    
    // Helper functions
    getOption,
    isDefault,
    
    // Constants
    defaults: OPTIONS_DEFAULT,
  };
}

export default useConversationSettingsV2;

// Export defaults for use in other components
export { OPTIONS_DEFAULT };

