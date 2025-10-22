// src/components/SettingsExample.js
// Example component demonstrating conversation settings manager usage

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useConversationSettings } from '../hooks/useConversationSettings';

/**
 * Example component showing how to use the conversation settings manager
 * This demonstrates the recommended pattern for integrating settings
 */
function SettingsExample() {
  const {
    selectedVoice,
    speechRate,
    currentTopic,
    setVoice,
    setSpeechRate,
    setCurrentTopic,
    clearCurrentTopic,
    getAvailableVoices,
    getAvailableSpeechRates,
    isInitialized,
  } = useConversationSettings();

  // Handler for voice change
  const handleVoiceChange = async (voice) => {
    await setVoice(voice);
    console.log('Voice changed to:', voice);
  };

  // Handler for speed change
  const handleSpeedChange = async (rate) => {
    await setSpeechRate(rate);
    console.log('Speech rate changed to:', rate);
  };

  // Handler for topic selection
  const handleTopicSelect = async () => {
    const exampleTopic = {
      id: 'example',
      title: 'Example Topic',
      description: 'This is an example topic',
      icon: '📚',
      vocabulary: ['word1', 'word2', 'word3'],
    };
    await setCurrentTopic(exampleTopic);
  };

  // Handler for topic clearing
  const handleTopicClear = async () => {
    await clearCurrentTopic();
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation Settings</Text>

      {/* Current Settings Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Settings:</Text>
        <Text style={styles.settingText}>Voice: {selectedVoice}</Text>
        <Text style={styles.settingText}>Speed: {speechRate}x</Text>
        <Text style={styles.settingText}>
          Topic: {currentTopic ? currentTopic.title : 'None'}
        </Text>
      </View>

      {/* Voice Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Voice:</Text>
        <View style={styles.buttonRow}>
          {getAvailableVoices().map((voice) => (
            <TouchableOpacity
              key={voice}
              style={[
                styles.button,
                selectedVoice === voice && styles.buttonActive,
              ]}
              onPress={() => handleVoiceChange(voice)}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedVoice === voice && styles.buttonTextActive,
                ]}
              >
                {voice}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Speed Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Speed:</Text>
        <View style={styles.buttonRow}>
          {getAvailableSpeechRates().map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.button,
                speechRate === rate && styles.buttonActive,
              ]}
              onPress={() => handleSpeedChange(rate)}
            >
              <Text
                style={[
                  styles.buttonText,
                  speechRate === rate && styles.buttonTextActive,
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topic Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Topic Actions:</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleTopicSelect}
        >
          <Text style={styles.actionButtonText}>Set Example Topic</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleTopicClear}
        >
          <Text style={styles.actionButtonText}>Clear Topic</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsExample;

