// EXAMPLE: How to integrate the updated ConversationSettings in ChatPage.js
// This is a reference implementation - adapt to your existing ChatPage structure

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ConversationSettings from '../components/ConversationSettings';
import { useConversationSettingsV2 } from '../hooks/useConversationSettings_v2';
import { API_URL } from '../config/environment';

function ChatPageExample() {
  // Use the enhanced settings hook
  const {
    options,
    currentTopic,
    updateOptions,
    setCurrentTopic,
    isInitialized,
  } = useConversationSettingsV2();

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // ===== Send message to backend with options =====
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isProcessing) return;

    try {
      setIsProcessing(true);

      // Add user message to history
      const userMessage = {
        sender: 'user',
        text: messageText,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);

      // Send to backend with full options
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${yourAuthToken}`, // Add your auth token
        },
        body: JSON.stringify({
          message: messageText,
          chatHistory: updatedHistory,
          topic: currentTopic,
          userInfo: {
            name: 'Student Name',
            age: 8,
          },
          options: options, // ⭐ Send full options object
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response to history
      const aiMessage = {
        sender: 'assistant',
        text: data.text,
        audio: data.audio, // Base64 audio
        audioFormat: data.audioFormat,
        voice: data.voice,
        engagementLevel: data.engagementLevel,
        timestamp: new Date().toISOString(),
      };

      setChatHistory([...updatedHistory, aiMessage]);

      // Play audio if available
      if (data.audio) {
        await playAudio(data.audio, data.audioFormat);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsProcessing(false);
    }
  };

  // ===== Handle options change from settings modal =====
  const handleOptionsChange = (newOptions) => {
    console.log('Options updated:', newOptions);
    updateOptions(newOptions);
  };

  // ===== Handle topic change =====
  const handleChangeTopic = () => {
    setShowSettings(false);
    setShowTopicSelector(true);
  };

  const handleTopicSelected = (topic) => {
    setCurrentTopic(topic);
    setShowTopicSelector(false);
  };

  // ===== Render =====
  return (
    <View style={styles.container}>
      {/* Header with settings button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KidSpeak</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Current Topic Display */}
      {currentTopic && (
        <View style={styles.topicBanner}>
          <Text style={styles.topicBannerText}>
            {currentTopic.icon} {currentTopic.title}
          </Text>
        </View>
      )}

      {/* Chat messages area */}
      <View style={styles.messagesContainer}>
        {/* Render your chat messages here */}
      </View>

      {/* Input area */}
      <View style={styles.inputContainer}>
        {/* Your message input and send button */}
      </View>

      {/* ⭐ Updated ConversationSettings Modal */}
      <ConversationSettings
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentTopic={currentTopic}
        options={options} // Pass current options
        onOptionsChange={handleOptionsChange} // Handle changes
        onChangeTopic={handleChangeTopic}
      />

      {/* Topic Selector Modal (your existing component) */}
      {/* <TopicSelector ... /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 24,
  },
  topicBanner: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
  },
  topicBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
});

export default ChatPageExample;

// ========================================
// BACKEND ROUTE UPDATE EXAMPLE
// ========================================
/*
In your backend/src/routes/chatRoutes.js:

router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { 
      message, 
      chatHistory = [], 
      topic = null, 
      userInfo = null,
      options = null  // ⭐ Accept options
    } = req.body;

    // Validate message
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid message format' 
      });
    }

    // Get AI response with options
    const response = await getOpenAIResponseV2(
      message,
      chatHistory,
      topic,
      userInfo,
      false, // isFollowUp
      'alloy', // fallbackVoice
      'tts-1', // ttsModel
      options // ⭐ Pass options to service
    );

    // Return complete response
    res.json({
      success: true,
      text: response.text,
      audio: response.audio ? response.audio.toString('base64') : null,
      audioFormat: response.audioFormat,
      voice: response.voice,
      model: response.model,
      engagementLevel: response.engagementLevel,
      style: response.style,
      appliedOptions: response.options, // Return what was actually applied
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process chat request',
      error: error.message 
    });
  }
});
*/

// ========================================
// MIGRATION CHECKLIST
// ========================================
/*
1. ✅ Update ConversationSettings.js (DONE)
2. ✅ Create useConversationSettings_v2.js hook (DONE)
3. ⬜ Update ChatPage.js to use new hook
4. ⬜ Update backend chatRoutes.js to accept options
5. ⬜ Test option changes affect AI behavior
6. ⬜ Add reset to defaults button (optional)
7. ⬜ Add preset configurations (optional - e.g., "Beginner", "Advanced")
8. ⬜ Add import/export settings (optional)
*/

