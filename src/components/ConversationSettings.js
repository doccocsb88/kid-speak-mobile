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
  const renderToggle = (label, key, description = null, icon = null) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        {icon && (
          <View style={styles.toggleIconContainer}>
            <Text style={styles.toggleIcon}>{icon}</Text>
          </View>
        )}
        <View style={styles.toggleLabelContainer}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {description && <Text style={styles.toggleDescription}>{description}</Text>}
        </View>
      </View>
      <Switch
        value={options[key] ?? true}
        onValueChange={(value) => updateOption(key, value)}
        trackColor={{ false: '#f0f3f4', true: '#4cb2e6' }}
        thumbColor="#ffffff"
        ios_backgroundColor="#f0f3f4"
      />
    </View>
  );

  const renderEnumSelector = (label, key, enumValues, displayMap = {}, description = null, isSegmented = false) => {
    if (isSegmented) {
      return (
        <View style={styles.optionGroup}>
          <Text style={styles.optionGroupLabel}>{label}</Text>
          {description && <Text style={styles.optionGroupDescription}>{description}</Text>}
          <View style={styles.segmentedControl}>
            {enumValues.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.segmentedButton,
                  options[key] === value && styles.segmentedButtonActive
                ]}
                onPress={() => updateOption(key, value)}
              >
                <Text style={[
                  styles.segmentedButtonText,
                  options[key] === value && styles.segmentedButtonTextActive
                ]}>
                  {displayMap[value] || value.charAt(0).toUpperCase() + value.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.optionGroup}>
        <Text style={styles.optionGroupLabel}>{label}</Text>
        {description && <Text style={styles.optionGroupDescription}>{description}</Text>}
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
  };

  const renderCorrectionMode = () => {
    const correctionModeMap = {
      'implicit': 'Gentle',
      'explicit': 'Direct',
      'sandwich': 'Helpful'
    };
    const correctionIcons = {
      'implicit': '😊',
      'explicit': '📋',
      'sandwich': '💬'
    };
    const currentMode = options.correction_mode || 'implicit';
    
    return (
      <View style={styles.optionGroup}>
        <Text style={styles.optionGroupLabel}>Correction Mode</Text>
        <Text style={styles.optionGroupDescription}>How your friend corrects your mistakes.</Text>
        <View style={styles.correctionModeGrid}>
          {['implicit', 'explicit', 'sandwich'].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.correctionModeButton,
                currentMode === value && styles.correctionModeButtonActive
              ]}
              onPress={() => updateOption('correction_mode', value)}
            >
              <Text style={styles.correctionModeIcon}>{correctionIcons[value]}</Text>
              <Text style={[
                styles.correctionModeText,
                currentMode === value && styles.correctionModeTextActive
              ]}>
                {correctionModeMap[value]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderDifficultyLevel = () => {
    const difficultyMap = {
      'auto': 'Auto',
      'starters': 'Starters',
      'movers': 'Movers',
      'flyers': 'Flyers'
    };
    const difficultyIcons = {
      'auto': '✨',
      'starters': '⭐',
      'movers': '⭐',
      'flyers': '⭐'
    };
    const currentDifficulty = options.difficulty || 'auto';
    
    return (
      <View style={styles.optionGroup}>
        <Text style={styles.optionGroupLabel}>Difficulty Level</Text>
        <Text style={styles.optionGroupDescription}>Choose the English level for your chat.</Text>
        <View style={styles.difficultyGrid}>
          {['auto', 'starters', 'movers', 'flyers'].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.difficultyButton,
                currentDifficulty === value && styles.difficultyButtonActive
              ]}
              onPress={() => updateOption('difficulty', value)}
            >
              <Text style={styles.difficultyIcon}>{difficultyIcons[value]}</Text>
              <Text style={[
                styles.difficultyText,
                currentDifficulty === value && styles.difficultyTextActive
              ]}>
                {difficultyMap[value]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

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
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.helpIcon}>ℹ️</Text>
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
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Chat Settings</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  onPress={resetToDefaults} 
                  style={styles.resetButton}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

            {/* Correction & Feedback Section */}
            {renderSection('Correction & Feedback', 'correction', 'ℹ️', (
              <>
                {renderToggle('Grammar Check', 'grammar_check', null, 'A')}
                <View style={styles.divider} />
                {renderCorrectionMode()}
              </>
            ))}

            {/* Practice Style Section */}
            {renderSection('Practice Style', 'practice', 'ℹ️', (
              <>
                {renderEnumSelector('Force Repeat', 'force_repeat', ['off', 'soft', 'strict'], {}, null, true)}
                <View style={styles.divider} />
                {renderDifficultyLevel()}
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
    backgroundColor: '#f6f7f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
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
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#111517',
    fontWeight: '400',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111517',
    textAlign: 'center',
    letterSpacing: -0.015,
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  resetButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#4cb2e6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    padding: 16,
  },
  // Section Card Styles
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111517',
    letterSpacing: -0.015,
    flex: 1,
  },
  helpIcon: {
    fontSize: 20,
    color: '#647b87',
    marginLeft: 8,
  },
  sectionContent: {
    // Content spacing handled by individual components
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5ea',
    marginVertical: 4,
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
  // Toggle Styles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f3f4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toggleIcon: {
    fontSize: 20,
    color: '#111517',
  },
  toggleLabelContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '400',
    color: '#111517',
    lineHeight: 22,
  },
  toggleDescription: {
    fontSize: 13,
    color: '#647b87',
    marginTop: 2,
  },
  // Option Group Styles
  optionGroup: {
    marginTop: 8,
  },
  optionGroupLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111517',
    marginBottom: 4,
    paddingTop: 4,
  },
  optionGroupDescription: {
    fontSize: 14,
    color: '#647b87',
    marginTop: -4,
    marginBottom: 12,
    lineHeight: 20,
  },
  // Segmented Control Styles
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f0f3f4',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647b87',
  },
  segmentedButtonTextActive: {
    color: '#111517',
    fontWeight: '600',
  },
  // Correction Mode Styles
  correctionModeGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  correctionModeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f0f3f4',
  },
  correctionModeButtonActive: {
    borderColor: '#4cb2e6',
    backgroundColor: 'rgba(76, 178, 230, 0.2)',
  },
  correctionModeIcon: {
    fontSize: 24,
  },
  correctionModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647b87',
  },
  correctionModeTextActive: {
    color: '#111517',
    fontWeight: '600',
  },
  // Difficulty Level Styles
  difficultyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  difficultyButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f0f3f4',
  },
  difficultyButtonActive: {
    borderColor: '#4cb2e6',
    backgroundColor: 'rgba(76, 178, 230, 0.2)',
  },
  difficultyIcon: {
    fontSize: 20,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647b87',
  },
  difficultyTextActive: {
    color: '#111517',
    fontWeight: '600',
  },
  // Option controls (legacy - keeping for other sections)
  optionRow: {
    paddingVertical: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111517',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 13,
    color: '#647b87',
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
    borderRadius: 8,
    backgroundColor: '#f0f3f4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  enumButtonActive: {
    backgroundColor: 'rgba(76, 178, 230, 0.2)',
    borderColor: '#4cb2e6',
  },
  enumButtonText: {
    fontSize: 13,
    color: '#647b87',
    fontWeight: '500',
  },
  enumButtonTextActive: {
    color: '#111517',
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

