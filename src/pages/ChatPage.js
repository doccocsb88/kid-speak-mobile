// src/pages/ChatPage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Image,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import { FRIENDS } from '../pages/FriendList';
import { TOPICS } from '../pages/NewTopicSelection';
import AppSettingsPage from '../components/AppSettingsPage';
import ConversationSettings from '../components/ConversationSettings';
import SpeakingScreen from '../components/SpeakingScreen';
import { getTTSOptions } from '../services/ttsService';
import { playAudioOrTTS, stopAudio } from '../services/playaudioService';
import { API_BASE_URL } from '../config/api';
import ConversationService from '../services/conversationService';
import OfflineService from '../services/offlineService';
import { getUserData } from '../utils/onboardingStorage';
import conversationSettingsManager from '../services/conversationSettingsManager';
import { useConversationSettings } from '../hooks/useConversationSettings';
import userManager from '../services/UserManager';

function ChatPage({ navigation, initialConversation, initialSelectedTopic }) {
  const { user, isAuthenticated, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { getOptions } = useConversationSettings();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({ voices: ['alloy'], models: ['tts-1'] });
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversationSettings, setShowConversationSettings] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSpeakingScreen, setShowSpeakingScreen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const messagesEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const messagesRef = useRef(messages); // Add ref to always have latest messages
  const inputRef = useRef(null); // Add ref for TextInput to maintain focus
  const hasAppliedInitialTopicRef = useRef(false);

  // Update messagesRef whenever messages change
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load TTS options and initialize settings manager
  useEffect(() => {
    const loadTTSOptions = async () => {
      try {
        const options = await getTTSOptions();
        setTtsOptions(options);
        
        // Initialize settings manager
        await conversationSettingsManager.initialize();
        const settings = conversationSettingsManager.getSettings();
        setSelectedVoice(settings.selectedVoice);
        setSpeechRate(settings.speechRate);
        if (settings.currentTopic) {
          setSelectedTopic(settings.currentTopic);
        }
      } catch (error) {
        console.error('Failed to load TTS options:', error);
      }
    };
    loadTTSOptions();

    // Subscribe to settings changes from other components
    const unsubscribe = conversationSettingsManager.subscribe((key, value) => {
      if (key === 'voice' || key === 'all') {
        setSelectedVoice(conversationSettingsManager.getVoice());
      }
      if (key === 'speechRate' || key === 'all') {
        setSpeechRate(conversationSettingsManager.getSpeechRate());
      }
      if (key === 'currentTopic' || key === 'all') {
        const topic = conversationSettingsManager.getCurrentTopic();
        if (topic) setSelectedTopic(topic);
      }
    });

    return () => unsubscribe();
  }, []);

  // If navigated from Conversation History with a selected conversation, hydrate state
  useEffect(() => {
    if (initialConversation && initialConversation.id !== currentConversationId) {
      setMessages(initialConversation.messages || []);
      setSelectedTopic(initialConversation.topic || null);
      setCurrentConversationId(initialConversation.id);
      setInputMessage('');
    }
  }, [initialConversation]);

  // Update userInfo when user authentication changes
  useEffect(() => {
    const updateUserInfo = async () => {
      // Always load saved user data first (from onboarding) - this includes the name
      const savedUserData = await getUserData();
      
      if (isAuthenticated && user) {
        // Update selected voice to user's preference
        if (user.voicePreference) {
          setSelectedVoice(user.voicePreference);
        }
        
        // Merge saved user data with auth user data, prioritizing saved name
        setUserInfo({
          name: savedUserData?.name || (user.isGuest ? null : user.name), // Use saved name first, then auth name if not guest
          age: savedUserData?.age || user.age,
          gender: savedUserData?.gender,
          languagePreference: user.languagePreference
        });
      } else if (savedUserData) {
        // If not authenticated, use saved user data
        setUserInfo(savedUserData);
      } else {
        setUserInfo(null);
      }
    };
    
    updateUserInfo();
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      const savedUserData = await getUserData();
      if (savedUserData) {
        return savedUserData;
      }
      return null;
    } catch (error) {
      console.log('Error loading user data:', error);
      return null;
    }
  };

  // Start chat session when topic is selected and user is authenticated
  const startChatSession = async (topic) => {
    if (!isAuthenticated) return;
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.post(`${API_BASE_URL}/chat/start-session`, {
        topic: topic.title
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCurrentSessionId(response.data.data.sessionId);
      }
    } catch (error) {
      console.error('Failed to start chat session:', error);
    }
  };

  // Save conversation to storage
  const saveConversation = async (messages, topic) => {
    try {
      const conversationData = {
        id: currentConversationId || ConversationService.generateId(),
        topic: topic,
        messages: messages,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].text : '',
        lastMessageTime: new Date().toISOString(),
        messageCount: messages.length,
      };

      const savedConversation = await ConversationService.saveConversation(conversationData);
      setCurrentConversationId(savedConversation.id);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Handle back button press - navigate back
  const handleBackPress = () => {
    Keyboard.dismiss();
    if (navigation && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Handle settings button press - open conversation settings
  const handleSettingsPress = () => {
    Keyboard.dismiss();
    setShowConversationSettings(true);
  };

  // Handle avatar press - navigate to TopicDetails or FriendDetail
  const handleAvatarPress = () => {
    if (!selectedTopic) return;
    
    Keyboard.dismiss();
    
    // Check if it's a friend topic
    if (selectedTopic.id?.startsWith('friend_')) {
      // Extract friend ID and find friend from FRIENDS array
      const friendId = selectedTopic.id.replace('friend_', '');
      const friend = FRIENDS.find(f => f.id === friendId);
      
      if (friend && navigation) {
        navigation.navigate('FriendDetail', { friend });
      }
    } else {
      // Find topic from TOPICS array
      const topic = TOPICS.find(t => t.id === selectedTopic.id);
      
      if (topic && navigation) {
        navigation.navigate('TopicDetails', { topic });
      }
    }
  };

  // Handle premium button press
  const handlePremiumPress = () => {
    Keyboard.dismiss();
    if (navigation) {
      navigation.navigate('Paywall');
    }
  };

  // Handle speech rate change (synchronized with settings manager)
  const handleSpeechRateChange = (newRate) => {
    setSpeechRate(newRate);
    conversationSettingsManager.setSpeechRate(newRate);
  };

  // Handle voice change (synchronized with settings manager)
  const handleVoiceChange = async (newVoice) => {
    setSelectedVoice(newVoice);
    await conversationSettingsManager.setVoice(newVoice);
  };

  // Play audio from backend or fallback to TTS
  const speakTextWithTTS = async (text, audioData = null) => {
    try {
      setIsSpeaking(true);
      
      // Use centralized audio service
      await playAudioOrTTS(text, audioData, selectedVoice, 'gpt-4o-mini-tts');
    } catch (error) {
      console.error('[ChatPage] Audio/TTS Error:', error);
      console.log('[ChatPage] Audio/TTS not available, continuing without audio');
      // Don't show error to user, just continue without TTS
    } finally {
      setIsSpeaking(false);
    }
  };

  // Stop current speech
  const stopSpeaking = async () => {
    try {
      // Stop audio using centralized service
      await stopAudio();
    } catch (error) {
      console.log('Error stopping audio:', error);
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Pause ChatPage logic when SpeakingScreen is open
  useEffect(() => {
    if (showSpeakingScreen) {
      // Pause ChatPage logic
      stopSpeaking();
    }
  }, [showSpeakingScreen]);

  // Generate appropriate greeting based on topic type
  const generateGreeting = (topic, userInfo) => {
    // Always use the name from userInfo if available (loaded from saved onboarding data)
    const studentName = userInfo?.name?.trim() || 'there';
    
    // Check if this is a friend topic
    if (topic?.id?.startsWith('friend_')) {
      // Extract friend id from topic id (format: "friend_emma" -> "emma")
      const friendId = topic.id.replace('friend_', '');
      
      // Find friend data from FRIENDS array
      const friend = FRIENDS.find(f => f.id === friendId);
      
      if (friend) {
        // Use original friend description and convert to first person
        let personalizedDescription = friend.description
          .replace(new RegExp(friend.name, 'g'), 'I')
          .replace(/\bShe is\b/g, "I'm")
          .replace(/\bHe is\b/g, "I'm")
          .replace(/\bShe loves\b/g, 'I love')
          .replace(/\bHe loves\b/g, 'I love')
          .replace(/\bShe enjoys\b/g, 'I enjoy')
          .replace(/\bHe enjoys\b/g, 'I enjoy')
          .replace(/\bShe\b/g, 'I')
          .replace(/\bHe\b/g, 'I')
          .replace(/\bher\b/g, 'my')
          .replace(/\bhis\b/g, 'my');
        
        // Get top 3 interests for introduction
        const interests = friend.interests.slice(0, Math.min(3, friend.interests.length)).join(', ');
        
        return `Hi ${studentName}! I'm ${friend.name}! ${personalizedDescription} My favorite topics are ${interests}. What about you? What do you like?`;
      }
      
      // Fallback if friend not found
      const friendName = topic.title?.replace('Chat with ', '') || 'your friend';
      return `Hi ${studentName}! I'm ${friendName}, and I'm excited to chat with you today! What would you like to talk about?`;
    }
    
    // Regular topic greeting (uses studentName from userInfo)
    return OfflineService.generateTopicGreeting(topic, userInfo);
  };

  // Handle topic selection (synchronized with settings manager)
  const handleTopicSelect = async (topic) => {
    console.log('[TopicSelect] Starting new topic flow:', topic.title);
    setInputMessage('');
    // Complete flow restart - stop all ongoing processes
    await stopSpeaking();
    
    // Reset all conversation-related state
    setSelectedTopic(topic);
    await conversationSettingsManager.setCurrentTopic(topic);
    setIsOfflineMode(false); // Reset offline mode
    OfflineService.setOfflineMode(false);
    
    // Generate new conversation ID and session
    const newConversationId = ConversationService.generateId();
    setCurrentConversationId(newConversationId);
    setCurrentSessionId(null); // Reset session ID
    
    // Start fresh chat session if user is authenticated (clears backend history + creates new session)
    if (isAuthenticated) {
      await startChatSession(topic);
    }
    
    // Start the lesson with the selected topic, using student's name
    const topicGreeting = generateGreeting(topic, userInfo);
    
    const initialMessages = [{ sender: 'ai', text: topicGreeting }];
    setMessages(initialMessages);
    
    // Save initial conversation
    await saveConversation(initialMessages, topic);
    
    // Play greeting and start timeout flow
    // speakTextWithTTS(topicGreeting);
    
    console.log('[TopicSelect] New topic flow started successfully');
  };

  // Auto-apply topic passed from navigation (from NewTopicSelection)
  useEffect(() => {
    if (
      !hasAppliedInitialTopicRef.current &&
      initialSelectedTopic &&
      userInfo
    ) {
      hasAppliedInitialTopicRef.current = true;
      handleTopicSelect(initialSelectedTopic);
    }
  }, [initialSelectedTopic, userInfo]);


  // Handle returning from speaking screen
  const handleSpeakingScreenClose = async (updatedMessages) => {
    console.log('[ChatPage] Returning from SpeakingScreen...');
    setShowSpeakingScreen(false);
    
    // Update messages với conversation từ SpeakingScreen
    if (updatedMessages && updatedMessages.length > 0) {
      setMessages(updatedMessages);
      
      // Save updated conversation
      if (selectedTopic) {
        await saveConversation(updatedMessages, selectedTopic);
      }
    }
    
  };

  const sendMessage = useCallback(async (messageToSend = inputMessage) => {
    if (!messageToSend.trim()) return;
    
    // Block user input when teacher is speaking
    if (isSpeaking) {
      console.log('User input blocked: Teacher is currently speaking');
      return;
    }

    // Block when out of daily requests and show paywall
    try {
      const allowed = await userManager.canSendRequest();
      if (!allowed) {
        Keyboard.dismiss();
        if (navigation) {
          navigation.navigate('Paywall');
        }
        return;
      }
    } catch (e) {
      console.log('UserManager.canSendRequest error:', e);
    }

    console.log('[ChatPage] Sending message:', messageToSend);
    console.log('[ChatPage] selectedTopic:', JSON.stringify(selectedTopic));
    console.log('[ChatPage] selectedTopic.id:', selectedTopic?.id);
    console.log('[ChatPage] selectedTopic.title:', selectedTopic?.title);
    const userMessage = { sender: 'user', text: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage(''); // Xóa nội dung input
    
    // Focus lại vào input để bàn phím không bị ẩn
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // If currently offline, do not attempt smart/offline responses; just show offline notice
    if (isOfflineMode) {
      const aiOffline = { sender: 'ai', text: 'App is offline. Please check your internet connection and try again.' };
      setMessages((prev) => [...prev, aiOffline]);
      return;
    }

    try {
      // Configure options for getOpenAIResponseV2
      const options = {
        ...getOptions(),
      };

      // Prepare chat history (bỏ message đầu tiên - initial greeting)
      // Format: array of {sender: 'user'/'ai', text: string}
      const chatHistory = messages.slice(1).map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      // Prepare topic data - extract only plain values to avoid serialization issues
      let topicData = null;
      if (selectedTopic) {
        topicData = {
          id: String(selectedTopic.id || ''),
          title: String(selectedTopic.title || ''),
          vocabulary: Array.isArray(selectedTopic.vocabulary) ? selectedTopic.vocabulary.map(String) : [],
          description: String(selectedTopic.description || '')
        };
      }

      // Prepare request data
      const requestData = {
        message: messageToSend,
        chatHistory: chatHistory, // Đính kèm toàn bộ lịch sử hội thoại
        provider: 'openai',
        includeAudio: true, // Request audio from backend to use getOpenAIResponseV2
        voice: selectedVoice || 'alloy',
        model: 'gpt-4o-mini-tts', // Use new TTS model with instructions support
        topic: topicData,
        userInfo: userInfo,
        sessionId: currentSessionId,
        options: options
      };

      console.log('[ChatPage] Request payload topic:', JSON.stringify(requestData.topic));
      console.log('[ChatPage] typeof requestData.topic:', typeof requestData.topic);
      console.log('[ChatPage] Full requestData before sending:', JSON.stringify(requestData, null, 2));

      // Add authentication headers if user is logged in
      const headers = {
        'Content-Type': 'application/json'
      };
      if (isAuthenticated) {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      }

      console.log('[ChatPage] Request headers:', headers);
      console.log('[ChatPage] About to send request...');

      setIsSpeaking(true);
      
      const response = await axios.post(`${API_BASE_URL}/chat/send-message`, requestData, { 
        headers
      });
      const aiResponseText = response.data.data?.response || response.data.response;
      const audioData = response.data.data?.audio || response.data.audio; // Get audio from backend
      // Store audioData on the AI message so we can replay using the same path later
      const aiMessage = { sender: 'ai', text: aiResponseText, audioData };
      const updatedMessages = [...messages, userMessage, aiMessage];
      setMessages(updatedMessages);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      // Update session ID if provided
      if (response.data.data?.sessionId) {
        setCurrentSessionId(response.data.data.sessionId);
      }
      
      // Save conversation after each exchange
      if (selectedTopic) {
        await saveConversation(updatedMessages, selectedTopic);
      }
      
      // Count successful API request
      await userManager.recordRequest();
      
      // Play audio from backend (or fallback to client TTS)
      speakTextWithTTS(aiResponseText, audioData);
      
      // Reset offline mode if we successfully connected
      if (isOfflineMode) {
        setIsOfflineMode(false);
        OfflineService.setOfflineMode(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check if we should use offline mode
      if (OfflineService.shouldUseOfflineMode(error)) {
        console.log('Switching to offline mode due to network error');
        setIsOfflineMode(true);
        OfflineService.setOfflineMode(true);
        
        // Show offline notice instead of generating smart response
        const aiMessage = { sender: 'ai', text: 'App is offline. Please check your internet connection and try again.' };
        const updatedMessages = [...messages, userMessage, aiMessage];
        setMessages(updatedMessages);
        
        // Save conversation after each exchange
        if (selectedTopic) {
          await saveConversation(updatedMessages, selectedTopic);
        }
      } else {
        // For other errors, show generic error message
        setMessages((prev) => [...prev, { sender: 'ai', text: 'Oops! Something went wrong. Please try again.' }]);
      }
    }
  }, [inputMessage, isAuthenticated, currentSessionId, selectedTopic, userInfo, isSpeaking, isOfflineMode]);

  // Cuộn xuống cuối tin nhắn mới với delay để đảm bảo nội dung đã render
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // Sử dụng setTimeout để đảm bảo scroll sau khi render hoàn tất
      // keyboardShouldPersistTaps ensures keyboard doesn't dismiss on scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Handle dismissing keyboard when tapping on ScrollView
  const handleScrollViewPress = () => {
    Keyboard.dismiss();
  };

  const handleSpeakClick = async () => {
    // Block when teacher is speaking
    if (isSpeaking) {
      console.log('Speaking mode blocked: Teacher is currently speaking');
      return;
    }
    
    try {
      const allowed = await userManager.canSendRequest();
      if (!allowed) {
        Keyboard.dismiss();
        if (navigation) {
          navigation.navigate('Paywall');
        }
        return;
      }
    } catch (e) {
      console.log('UserManager.canSendRequest error:', e);
    }
    
    // Navigate to SpeakingScreen
    if (!isSpeaking && selectedTopic && userInfo) {
      console.log('[ChatPage] Opening SpeakingScreen...');
      Keyboard.dismiss();
      
      // Stop any ongoing audio before navigation
      await stopSpeaking();
      
      // Add small delay to ensure clean state
      setTimeout(() => {
        setShowSpeakingScreen(true);
      }, 200);
    } else if (!selectedTopic) {
      Alert.alert('Please select a topic first', 'You need to select a topic before starting the speaking mode.');
    } else if (!userInfo) {
      Alert.alert('Please complete your profile first', 'You need to provide your information before starting the speaking mode.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Ngăn xuống dòng trong textarea nếu có
      const currentMessage = e.target.value.trim();
      console.log('Enter pressed, current message:', currentMessage); // Debug log
      if (currentMessage) {
        sendMessage(currentMessage);
      }
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/images/speak_bg.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header 
          onBackPress={handleBackPress}
          onSettingsPress={handleSettingsPress}
          hideSettingsButton={false}
          selectedTopic={selectedTopic}
          onAvatarPress={handleAvatarPress}
        />
      
        <View style={styles.chatContainer}>

          {/* Offline Mode Indicator */}
          {isOfflineMode && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineIcon}>📴</Text>
              <Text style={styles.offlineText}>App is offline — responses are unavailable</Text>
            </View>
          )}

          {/* Teacher Speaking Indicator */}
          {isSpeaking && (
            <View style={styles.teacherSpeakingIndicator}>
              <Text style={styles.speakingIcon}>🎤</Text>
              <Text style={styles.speakingText}>Teacher is speaking... Please wait</Text>
            </View>
          )}

          <ScrollView 
            style={styles.chatArea}
            ref={messagesEndRef}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableWithoutFeedback onPress={handleScrollViewPress}>
              <View>
                {/* Today separator */}
                {messages.length > 0 && (
                  <View style={styles.dateSeparator}>
                    <Text style={styles.dateSeparatorText}>Today</Text>
                  </View>
                )}
                {messages.map((msg, index) => {
                  const isGreetingMessage = msg.sender === 'ai' && index === 0;
                  return (
                    <View key={index} style={styles.messageContainer}>
                      <ChatBubble 
                        sender={msg.sender} 
                        message={msg.text}
                        // Hide/disable speak button for the initial greeting message
                        // by not passing onSpeak for that specific bubble.
                        // For all other AI messages, keep the speak button as before.
                        onSpeak={
                          !isGreetingMessage && msg.sender === 'ai'
                            ? () => speakTextWithTTS(msg.text, msg.audioData)
                            : undefined
                        }
                        isSpeaking={isSpeaking && msg.sender === 'ai'}
                      />
                    </View>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
          <View style={[styles.chatInputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={[
                styles.micButton, 
                isSpeaking && styles.blockedButton
              ]}
              onPress={handleSpeakClick}
              disabled={isSpeaking}
            >
              <Text style={styles.micButtonIcon}>🎤</Text>
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.messageInput, isSpeaking && styles.blockedInput]}
                placeholder={isSpeaking ? "Please wait...." : "Type your message..."}
                placeholderTextColor="#617c89"
                value={inputMessage}
                onChangeText={(value) => {
                  if (!isSpeaking){
                    setInputMessage(value);
                  }
                }}
                multiline
                blurOnSubmit={false}
              />
            </View>
            <TouchableOpacity 
              style={[styles.sendButton, isSpeaking && styles.blockedButton]} 
              onPress={() => {
                sendMessage();
              }}
              disabled={isSpeaking || !inputMessage.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
            
            {/* Transparent overlay to block interactions when teacher is speaking */}
            {isSpeaking && (
              <View style={styles.inputBlockOverlay} />
            )}
          </View>
        </View>

      {/* App Settings Page */}
      <AppSettingsPage
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Conversation Settings */}
      <ConversationSettings
        isVisible={showConversationSettings}
        onClose={() => setShowConversationSettings(false)}
        currentTopic={selectedTopic}
        onChangeTopic={async () => {
          Keyboard.dismiss();
          setShowConversationSettings(false);
          // Topic selection removed - user can navigate to NewTopicSelection page instead
        }}
      />

      {/* Speaking Screen Modal with Presentation Animation */}
      <Modal
        visible={showSpeakingScreen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleSpeakingScreenClose}
      >
        <SpeakingScreen
          userInfo={userInfo}
          selectedTopic={selectedTopic}
          currentSessionId={currentSessionId}
          selectedVoice={selectedVoice}
          initialMessages={messages}
          onBack={handleSpeakingScreenClose}
        />
      </Modal>

      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffeaa7',
  },
  offlineIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
  },
  teacherSpeakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8f5e8',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
  },
  speakingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  speakingText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  chatContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#617c89',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  messageContainer: {
    marginBottom: 0,
  },
  chatInputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 224, 224, 0.5)',
  },
  inputContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  inputBlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  micButtonIcon: {
    fontSize: 24,
  },
  blockedButton: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  messageInput: {
    borderWidth: 0,
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#4A4A4A',
    maxHeight: 100,
    minHeight: 48,
    lineHeight: 20,
  },
  blockedInput: {
    backgroundColor: '#f5f5f5',
    color: '#999999',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 60,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatPage;