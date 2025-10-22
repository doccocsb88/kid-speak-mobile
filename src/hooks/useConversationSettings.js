// src/hooks/useConversationSettings.js
// React hook for using conversation settings manager

import { useState, useEffect } from 'react';
import conversationSettingsManager from '../services/conversationSettingsManager';

/**
 * Custom hook to use conversation settings across components
 * Automatically syncs with the settings manager and other components
 * 
 * @returns {Object} Settings and updater functions
 */
export function useConversationSettings() {
  const [settings, setSettings] = useState({
    selectedVoice: 'alloy',
    speechRate: 1.0,
    currentTopic: null,
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize settings from manager
  useEffect(() => {
    const initSettings = async () => {
      await conversationSettingsManager.initialize();
      const managerSettings = conversationSettingsManager.getSettings();
      setSettings(managerSettings);
      setIsInitialized(true);
    };

    initSettings();

    // Subscribe to changes from other components
    const unsubscribe = conversationSettingsManager.subscribe((key, value, allSettings) => {
      setSettings({ ...allSettings });
    });

    return () => unsubscribe();
  }, []);

  // Updater functions
  const setVoice = async (voice) => {
    await conversationSettingsManager.setVoice(voice);
  };

  const setSpeechRate = async (rate) => {
    await conversationSettingsManager.setSpeechRate(rate);
  };

  const setCurrentTopic = async (topic) => {
    await conversationSettingsManager.setCurrentTopic(topic);
  };

  const clearCurrentTopic = async () => {
    await conversationSettingsManager.clearCurrentTopic();
  };

  const updateSettings = async (updates) => {
    await conversationSettingsManager.updateSettings(updates);
  };

  const resetToDefaults = async () => {
    await conversationSettingsManager.resetToDefaults();
  };

  // Helper getters
  const getAvailableVoices = () => conversationSettingsManager.getAvailableVoices();
  const getAvailableSpeechRates = () => conversationSettingsManager.getAvailableSpeechRates();
  const getOptions = () => conversationSettingsManager.getOptions();

  return {
    // Current settings
    selectedVoice: settings.selectedVoice,
    speechRate: settings.speechRate,
    currentTopic: settings.currentTopic,
    isInitialized,
    
    // Updater functions
    setVoice,
    setSpeechRate,
    setCurrentTopic,
    clearCurrentTopic,
    updateSettings,
    resetToDefaults,
    
    // Helper functions
    getAvailableVoices,
    getAvailableSpeechRates,
    getOptions,
    
    // Full settings object
    settings,
  };
}

export default useConversationSettings;

