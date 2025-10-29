// src/components/ConversationSettings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  SafeAreaView,
  Switch,
  TextInput,
} from 'react-native';
import conversationSettingsManager from '../services/conversationSettingsManager';
import TopicSelection from './TopicSelection';
import { getAvailableVoices } from '../services/ttsService';

function ConversationSettings({
  isVisible,
  onClose,
  currentTopic,
  onChangeTopic,
}) {
  // Use the centralized conversation settings manager for synchronization
  const [options, setOptions] = React.useState(conversationSettingsManager.getOptions());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showTopicSelection, setShowTopicSelection] = React.useState(false);
  const [availableVoices, setAvailableVoices] = React.useState(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);

  // Initialize and subscribe to changes
  React.useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await conversationSettingsManager.initialize();
      setOptions(conversationSettingsManager.getOptions());
      setIsInitialized(true);
      setIsLoading(false);
    };
    
    init();

    // Subscribe to options changes from other components
    const unsubscribe = conversationSettingsManager.subscribe((key, value) => {
      if (key === 'options' || key === 'all') {
        setOptions(conversationSettingsManager.getOptions());
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch available voices from API
  React.useEffect(() => {
    const fetchVoices = async () => {
      try {
        const voices = await getAvailableVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);
        }
      } catch (error) {
        console.error('Error fetching voices:', error);
        // Keep the default fallback voices already set in state
      }
    };
    
    fetchVoices();
  }, []);

  // Update functions that use conversationSettingsManager
  const updateOption = async (key, value) => {
    await conversationSettingsManager.updateOption(key, value);
  };

  const updateOptions = async (updates) => {
    await conversationSettingsManager.updateOptions(updates);
  };

  const resetToDefaults = async () => {
    await conversationSettingsManager.resetOptionsToDefaults();
  };

  const setCurrentTopic = async (topic) => {
    await conversationSettingsManager.setCurrentTopic(topic);
  };

  // Update current topic when prop changes
  useEffect(() => {
    if (currentTopic && isInitialized) {
      conversationSettingsManager.setCurrentTopic(currentTopic);
    }
  }, [currentTopic, isInitialized]);

  const toggleArrayItem = (key, item) => {
    const currentArray = options[key] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateOption(key, newArray);
  };

  // Handle topic change
  const handleChangeTopic = () => {
    if (onChangeTopic) {
      // Let parent control topic selection flow
      onChangeTopic();
    } else {
      // Fallback: open internal Topic Selection modal
      if (onClose) {
        // Close settings first to avoid overlapping modals that can block touches
        onClose();
        setTimeout(() => setShowTopicSelection(true), 250);
      } else {
        setShowTopicSelection(true);
      }
    }
  };

  // Render helper components
  const renderToggle = (label, key, description = null) => (
    <View style={styles.optionRow}>
      <View style={styles.optionLabelContainer}>
        <Text style={styles.optionLabel}>{label}</Text>
        {description && <Text style={styles.optionDescription}>{description}</Text>}
      </View>
      <Switch
        value={options[key] ?? true}
        onValueChange={(value) => updateOption(key, value)}
        trackColor={{ false: '#d1d1d6', true: '#34C759' }}
        thumbColor="#ffffff"
      />
    </View>
  );

  const renderEnumSelector = (label, key, enumValues, displayMap = {}) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.enumButtons}>
        {enumValues.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.enumButton,
              options[key] === value && styles.enumButtonActive
            ]}
            onPress={() => updateOption(key, value)}
          >
            <Text style={[
              styles.enumButtonText,
              options[key] === value && styles.enumButtonTextActive
            ]}>
              {displayMap[value] || value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMultiSelect = (label, key, enumValues) => (
    <View style={styles.optionRow}>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.multiSelectGrid}>
        {enumValues.map((item) => {
          const isSelected = (options[key] || []).includes(item);
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.multiSelectButton,
                isSelected && styles.multiSelectButtonActive
              ]}
              onPress={() => toggleArrayItem(key, item)}
            >
              <Text style={[
                styles.multiSelectButtonText,
                isSelected && styles.multiSelectButtonTextActive
              ]}>
                {item.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderNumberSlider = (label, key, min, max, step = 1, suffix = '') => {
    const value = options[key] ?? min;
    const range = [];
    for (let i = min; i <= max; i += step) {
      range.push(i);
    }
    return (
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>{label}: {value}{suffix}</Text>
        <View style={styles.sliderButtons}>
          {range.map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.sliderButton,
                value === val && styles.sliderButtonActive
              ]}
              onPress={() => updateOption(key, val)}
            >
              <Text style={[
                styles.sliderButtonText,
                value === val && styles.sliderButtonTextActive
              ]}>
                {val}{suffix}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSection = (title, key, icon, children) => (
    <View style={styles.collapsibleSection}>
      <View style={styles.sectionHeaderCollapsible}>
        <View style={styles.sectionHeaderLeft}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <>
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header with SafeArea */}
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Conversation Settings</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={resetToDefaults} 
                  style={styles.resetButton}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading settings...</Text>
              </View>
            )}

            {/* Current Topic Section */}
            {currentTopic && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>📚 Current Topic</Text>
                  <TouchableOpacity 
                    style={styles.changeTopicButton}
                    onPress={handleChangeTopic}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeTopicButtonText}>Change</Text>
                    <View style={styles.arrowIcon}>
                      <Text style={styles.arrowText}>›</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.topicCard}>
                  <Text style={styles.topicIcon}>{currentTopic.icon || '📚'}</Text>
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicTitle}>{currentTopic.title}</Text>
                    {currentTopic.description && (
                      <Text style={styles.topicDescription}>{currentTopic.description}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Pedagogy Settings */}
            {renderSection('Pedagogy', 'pedagogy', '🎓', (
              <>
                {renderToggle('Grammar Check', 'grammar_check', 'Correct grammar mistakes')}
                {renderEnumSelector('Force Repeat', 'force_repeat', ['off', 'soft', 'strict'])}
                {renderEnumSelector('Correction Mode', 'correction_mode', ['implicit', 'explicit', 'sandwich'])}
                {renderEnumSelector('Difficulty', 'difficulty', ['auto', 'starters', 'movers', 'flyers'])}
                {renderMultiSelect('Focus Areas', 'focus', ['pronunciation', 'vocabulary', 'grammar', 'fluency'])}
              </>
            ))}

            {/* Language Shaping */}
            {renderSection('Language Shaping', 'language', '💬', (
              <>
                {renderNumberSlider('Max Words/Sentence', 'max_sentence_words', 5, 20, 5)}
                {renderNumberSlider('Max Sentences/Turn', 'max_sentences_per_turn', 1, 4, 1)}
                {renderToggle('IPA Pronunciation', 'ipa_pronunciation', 'Show phonetic symbols')}
                {renderToggle('Phonics Hints', 'phonics_hints', 'Show phonics help')}
              </>
            ))}

            {/* Engagement & Game Mechanics */}
            {renderSection('Engagement & Games', 'engagement', '🎮', (
              <>
                {renderToggle('Anti-Loop Protection', 'anti_loop', 'Prevent repetitive responses')}
              </>
            ))}

            {/* Flow & Topic Control */}
            {renderSection('Flow & Topic', 'flow', '🔄', (
              <>
                {renderEnumSelector('Topic Strictness', 'topic_strictness', ['loose', 'normal', 'strict'])}
              </>
            ))}

            {/* Safety & Content */}
            {renderSection('Safety & Content', 'safety', '🛡️', (
              <>
                {renderToggle('Profanity Filter', 'profanity_filter', 'Block inappropriate content')}
              </>
            ))}

            {/* Voice & TTS Settings */}
            {renderSection('Voice & Speech', 'voice', '🎤', (
              <>
                
                {/* Voice Selection */}
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Fixed Voice</Text>
                  <View style={styles.voiceGrid}>
                    {availableVoices.map((voice) => (
                      <TouchableOpacity
                        key={voice}
                        style={[
                          styles.voiceButton,
                          options.voice_fixed === voice && styles.voiceButtonActive
                        ]}
                        onPress={() => updateOption('voice_fixed', voice)}
                      >
                        <Text style={[
                          styles.voiceButtonText,
                          options.voice_fixed === voice && styles.voiceButtonTextActive
                        ]}>
                          {voice.charAt(0).toUpperCase() + voice.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {renderEnumSelector('Speaking Rate', 'speaking_rate', ['slow', 'normal'])}
                {/* {renderToggle('SSML Support', 'ssml', 'Use Speech Synthesis Markup')} */}
                {renderNumberSlider('Pause Between Sentences', 'pause_ms_between_sentences', 100, 500, 100, 'ms')}
              </>
            ))}

            {/* Model Steering (Advanced) */}
            {/* {renderCollapsibleSection('Advanced (Model)', 'model', '⚙️', (
              <>
                {renderNumberSlider('Temperature', 'temperature_base', 0.3, 1.2, 0.1)}
                {renderNumberSlider('Frequency Penalty', 'frequency_penalty', 0, 1, 0.1)}
                {renderNumberSlider('Presence Penalty', 'presence_penalty', 0, 1, 0.1)}
              </>
            ))} */}

            {/* Bottom padding for scrolling */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
    {/* Internal Topic Selection fallback (used when parent doesn't provide onChangeTopic) */}
    <Modal
      visible={showTopicSelection}
      animationType="slide"
      onRequestClose={() => setShowTopicSelection(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <View style={[styles.sectionHeader, { backgroundColor: '#007AFF', paddingTop: 16, paddingBottom: 12 }]}> 
          <Text style={[styles.headerTitle]}>Change Topic</Text>
          <TouchableOpacity onPress={() => setShowTopicSelection(false)} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        <TopicSelection
          onTopicSelect={async (topic) => {
            await conversationSettingsManager.setCurrentTopic(topic);
            setShowTopicSelection(false);
            if (onClose) onClose();
          }}
          selectedAge={7}
        />
      </SafeAreaView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerSafeArea: {
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    backgroundColor: '#ffffff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  changeTopicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeTopicButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  arrowIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  topicIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  // Collapsible sections
  collapsibleSection: {
    backgroundColor: '#ffffff',
    marginBottom: 2,
  },
  sectionHeaderCollapsible: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  chevron: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: 'bold',
  },
  sectionContent: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
  },
  // Option controls
  optionRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  optionLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8e8e93',
    marginTop: 2,
  },
  // Enum buttons (single select)
  enumButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  enumButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  enumButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  enumButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  enumButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Multi-select buttons
  multiSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  multiSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d1d1d6',
  },
  multiSelectButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  multiSelectButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  multiSelectButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Number sliders
  sliderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sliderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d1d1d6',
    minWidth: 50,
    alignItems: 'center',
  },
  sliderButtonActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  sliderButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  sliderButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Voice grid (keep existing styles)
  voiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  voiceButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d1d1d6',
    minWidth: 90,
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  voiceButtonText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  voiceButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Loading indicator
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 2,
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
});

export default ConversationSettings;

