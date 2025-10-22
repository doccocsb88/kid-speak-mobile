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
  Animated,
  Dimensions,
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
import TopicSelection from '../components/TopicSelection';
import SideMenu from '../components/SideMenu';
import AppSettingsPage from '../components/AppSettingsPage';
import ConversationSettings from '../components/ConversationSettings';
import SpeakingScreen from '../components/SpeakingScreen';
import { speakText, getTTSOptions } from '../services/ttsService';
import nativeAudioService from '../services/nativeAudioService';
import { API_BASE_URL } from '../config/api';
import ConversationService from '../services/conversationService';
import OfflineService from '../services/offlineService';
import { getUserData } from '../utils/onboardingStorage';
import conversationSettingsManager from '../services/conversationSettingsManager';
import { useConversationSettings } from '../hooks/useConversationSettings';
import userManager from '../services/UserManager';

function ChatPage({ navigation }) {
  const { user, isAuthenticated, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { getOptions } = useConversationSettings();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsOptions, setTtsOptions] = useState({ voices: ['alloy'], models: ['tts-1'] });
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicSelection, setShowTopicSelection] = useState(false);
  const [showTopicSelectionModal, setShowTopicSelectionModal] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.8);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConversationSettings, setShowConversationSettings] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSpeakingScreen, setShowSpeakingScreen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [autoPromptSent, setAutoPromptSent] = useState(false);
  const messagesEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastInteractionRef = useRef(Date.now());
  const chatAreaAnim = useRef(new Animated.Value(0)).current;
  const isProcessingAutoPromptRef = useRef(false);
  const messagesRef = useRef(messages); // Add ref to always have latest messages
  const inputRef = useRef(null); // Add ref for TextInput to maintain focus

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

  // Update userInfo when user authentication changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserInfo({
        name: user.name,
        age: user.age,
        languagePreference: user.languagePreference
      });
      // Update selected voice to user's preference
      if (user.voicePreference) {
        setSelectedVoice(user.voicePreference);
      }
      
      // Load saved user data from onboarding
      loadUserData();
      
      if (user.isGuest) {
        setShowTopicSelection(true);
      }
    } else {
      setUserInfo(null);
    }
  }, [isAuthenticated, user]);

  const loadUserData = async () => {
    try {
      const savedUserData = await getUserData();
      if (savedUserData) {
        setUserInfo(savedUserData);
        setShowTopicSelection(true);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
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

  // Handle side menu toggle
  const handleMenuPress = () => {
    Keyboard.dismiss();
    setShowSideMenu(true);
  };

  // Handle settings button press - open conversation settings
  const handleSettingsPress = () => {
    Keyboard.dismiss();
    setShowConversationSettings(true);
  };

  // Handle premium button press
  const handlePremiumPress = () => {
    Keyboard.dismiss();
    if (navigation) {
      navigation.navigate('Paywall');
    }
  };

  // Handle conversation selection from side menu
  const handleConversationSelect = (conversation) => {
    setMessages(conversation.messages || []);
    setSelectedTopic(conversation.topic);
    setCurrentConversationId(conversation.id);
    setShowSideMenu(false);
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

  // Helper to normalize audio data (array/string → base64)
  const arrayToBase64 = (bytes) => {
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
  };

  const normalizeToBase64 = (audioData) => {
    if (!audioData) throw new Error('No audio data');
    if (typeof audioData === 'string') return audioData; // already base64
    if (Array.isArray(audioData)) return arrayToBase64(audioData);
    if (audioData?.data && Array.isArray(audioData.data)) return arrayToBase64(audioData.data);
    // last resort
    const s = JSON.stringify(audioData);
    const arr = Array.from(new Uint8Array([...s].map((c) => c.charCodeAt(0))));
    return arrayToBase64(arr);
  };

  // Play audio from backend or fallback to TTS
  const speakTextWithTTS = async (text, audioData = null) => {
    try {
      setIsSpeaking(true);
      
      // If we have audio from backend, play it directly
      if (audioData) {
        console.log('[ChatPage] Playing audio from backend...');
        const b64 = normalizeToBase64(audioData);
        await nativeAudioService.playAudio(b64);
      } else {
        // Fallback to client-side TTS
        console.log('[ChatPage] Using client-side TTS...');
        await speakText(text, selectedVoice, 'gpt-4o-mini-tts');
      }
    } catch (error) {
      console.error('[ChatPage] TTS Error:', error);
      console.log('[ChatPage]TTS not available, continuing without audio');
      // Don't show error to user, just continue without TTS
    } finally {
      setIsSpeaking(false);
      
      // Start timeout only after teacher finishes speaking
      setTimeout(() => {
        schedulerTimerToSendAutoPrompt();
      }, 1000);
    }
  };

  // Stop current speech
  const stopSpeaking = async () => {
    try {
      // Stop native audio service
      await nativeAudioService.stopAudio();
    } catch (error) {
      console.log('Error stopping native audio:', error);
    }
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    
    // Start timeout when speech is manually stopped
    schedulerTimerToSendAutoPrompt();
  };

  // Clear timeout without starting a new one
  const clearUserTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Reset timeout timer
  const schedulerTimerToSendAutoPrompt = () => {
    lastInteractionRef.current = Date.now();
    clearUserTimeout();
    
    // Only start timeout if teacher is not currently speaking and no auto-prompt is being processed
    if (!isSpeaking && !isProcessingAutoPromptRef.current) {
      // Set new timeout for 30 seconds
      timeoutRef.current = setTimeout(() => {
        handleAutoPrompt();
      }, 30000); // 30 seconds
    }
  };

  // Handle auto-prompt when student doesn't respond
  const handleAutoPrompt = async () => {
    try {
      // Block auto-prompt when out of daily requests (no paywall shown)
      try {
        const allowed = await userManager.canSendRequest();
        if (!allowed) {
          console.log('[AutoPrompt] Request limit reached — skipping auto-prompt');
          setAutoPromptSent(true); // avoid repeated attempts until user interacts
          return;
        }
      } catch (e) {
        console.log('UserManager.canSendRequest error (auto-prompt):', e);
      }

      // Prevent concurrent auto-prompt processing
      if (isProcessingAutoPromptRef.current) {
        console.log('[AutoPrompt] Auto-prompt already being processed, skipping...');
        return;
      }
      
      // Check if we already sent an auto prompt and haven't received user response yet
      if (autoPromptSent) {
        console.log('[AutoPrompt] Auto prompt already sent, waiting for user response...');
        return;
      }
      
      // Skip auto-prompt entirely when offline
      if (isOfflineMode) {
        console.log('[AutoPrompt] Offline mode - skipping auto-prompt');
        return;
      }
      
      console.log('[AutoPrompt] selectedTopic:', JSON.stringify(selectedTopic));
      console.log('[AutoPrompt] selectedTopic.id:', selectedTopic?.id);
      console.log('[AutoPrompt] selectedTopic.title:', selectedTopic?.title);
      
      // Use messagesRef to get the latest messages (avoid closure issue)
      const currentMessages = messagesRef.current;
      
      // Check if the last message was from AI (teacher)
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (lastMessage && lastMessage.sender === 'ai') {
        // Check if the last message was already an auto prompt by looking at recent messages
        // Count how many AI messages we have in the last few messages
        const recentMessages = currentMessages.slice(-2); // Check last 3 messages
        const aiMessages = recentMessages.filter(msg => msg.sender === 'ai');
        const aiMessageCount = aiMessages.length;
        console.log('[ChatPage] Recent messages:', recentMessages);
        console.log('[ChatPage] AI messages:', aiMessages);
        console.log('[ChatPage] AI message count:', aiMessageCount);
        // If we have 2 or more consecutive AI messages, likely an auto-prompt was already sent
        if (aiMessageCount >= 2) {
          console.log('[ChatPage] Multiple consecutive AI messages detected, skipping auto-prompt...');
          return;
        }
        
        
        
        // Mark that we're processing an auto-prompt
        isProcessingAutoPromptRef.current = true;
        
        // Configure options for auto-prompt
        const options = {
          ...getOptions(),
          target_vocab: selectedTopic?.vocabulary || [],
        };

        // Prepare chat history for auto-prompt (bỏ message đầu tiên - initial greeting)
        const chatHistory = currentMessages.slice(1).map(msg => ({
          sender: msg.sender,
          text: msg.text
        }));

        // Prepare topic data - extract only plain values
        let topicData = null;
        if (selectedTopic) {
          topicData = {
            id: String(selectedTopic.id || ''),
            title: String(selectedTopic.title || ''),
            vocabulary: Array.isArray(selectedTopic.vocabulary) ? selectedTopic.vocabulary.map(String) : [],
            description: String(selectedTopic.description || '')
          };
        }

        // Send a special message to trigger teacher's re-engagement
        const response = await axios.post(`${API_BASE_URL}/chat/send-message`, {
          message: "[AUTO_PROMPT] The student hasn't responded for 30 seconds. Please re-engage them with an encouraging question or suggest a new activity to continue the lesson.",
          chatHistory: chatHistory, // Đính kèm toàn bộ lịch sử hội thoại
          provider: 'openai',
          includeAudio: true,
          voice: selectedVoice || 'alloy',
          model: 'gpt-4o-mini-tts', // Use new TTS model with instructions support
          topic: topicData,
          userInfo: userInfo,
          sessionId: currentSessionId,
          options: options
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Handle response safely
        const aiResponseText = response.data?.response || response.data?.data?.response || 
                              "Let's try something new! What would you like to learn about today?";
        const audioData = response.data?.audio || response.data?.data?.audio;
        
        if (aiResponseText && aiResponseText.trim() !== '') {
          const aiMessage = { sender: 'ai', text: aiResponseText };
          setMessages((prev) => [...prev, aiMessage]);
          speakTextWithTTS(aiResponseText, audioData); // Pass audio from backend
          setAutoPromptSent(true); // Mark that we've sent an auto prompt
          // Don't reset timeout here - wait for user response to reset it
        } else {
          console.log('⚠️ Empty response from AUTO_PROMPT, skipping...');
        }
      }
    } catch (error) {
      console.error('Error in auto-prompt:', error);
      
      // If offline or network error, only show offline notice
      if (OfflineService.shouldUseOfflineMode(error) || isOfflineMode) {
        setIsOfflineMode(true);
        OfflineService.setOfflineMode(true);
        const offlineNotice = { sender: 'ai', text: 'App is offline. Please check your internet connection and try again.' };
        setMessages((prev) => [...prev, offlineNotice]);
        setAutoPromptSent(true);
        return;
      }

      // For other errors, provide a generic fallback
      const fallbackMessage = "Let's try something new! What would you like to learn about today?";
      const aiMessage = { sender: 'ai', text: fallbackMessage };
      setMessages((prev) => [...prev, aiMessage]);
      speakTextWithTTS(fallbackMessage);
      setAutoPromptSent(true);
    } finally {
      // Always reset the processing flag
      isProcessingAutoPromptRef.current = false;
    }
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      clearUserTimeout();
    };
  }, []);

  // Pause ChatPage logic when SpeakingScreen is open
  useEffect(() => {
    if (showSpeakingScreen) {
      // Pause ChatPage logic
      clearUserTimeout();
      stopSpeaking();
    }
  }, [showSpeakingScreen]);

  // Handle chat area animation when side menu opens/closes
  useEffect(() => {
    if (showSideMenu) {
      Animated.timing(chatAreaAnim, {
        toValue: Dimensions.get('window').width * 0.9,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(chatAreaAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showSideMenu]);

  // Handle topic selection (synchronized with settings manager)
  const handleTopicSelect = async (topic) => {
    console.log('[TopicSelect] Starting new topic flow:', topic.title);
    
    // Complete flow restart - stop all ongoing processes
    await stopSpeaking();
    clearUserTimeout();
    
    // Reset all conversation-related state
    setSelectedTopic(topic);
    await conversationSettingsManager.setCurrentTopic(topic);
    setShowTopicSelection(false);
    setAutoPromptSent(false); // Reset auto prompt flag when starting new topic
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
    const studentName = userInfo?.name || 'there';
    const topicGreeting = OfflineService.generateTopicGreeting(topic, userInfo);
    
    const initialMessages = [{ sender: 'ai', text: topicGreeting }];
    setMessages(initialMessages);
    
    // Save initial conversation
    await saveConversation(initialMessages, topic);
    
    // Play greeting and start timeout flow
    // speakTextWithTTS(topicGreeting);
    
    // Start timeout after topic greeting
    setTimeout(() => {
      schedulerTimerToSendAutoPrompt();
    }, 1000);
    
    console.log('[TopicSelect] New topic flow started successfully');
  };


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
    
    // Add delay before restarting timeout logic to ensure clean state
    setTimeout(() => {
      console.log('[ChatPage] Restarting auto-prompt timer...');
      schedulerTimerToSendAutoPrompt();
    }, 1500);
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
    
    // Reset auto prompt flag when user responds
    setAutoPromptSent(false);
    
    // Reset auto-prompt processing flag
    isProcessingAutoPromptRef.current = false;
    
    // Clear timeout when user sends a message (will restart after teacher finishes speaking)
    clearUserTimeout();

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
        target_vocab: selectedTopic?.vocabulary || [],
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
      const aiMessage = { sender: 'ai', text: aiResponseText };
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
    
    // Navigate to SpeakingScreen
    if (!isSpeaking && selectedTopic && userInfo) {
      console.log('[ChatPage] Opening SpeakingScreen...');
      Keyboard.dismiss();
      
      // Stop any ongoing audio and clear timeouts before navigation
      await stopSpeaking();
      clearUserTimeout();
      
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

  // If showing speaking screen, render it
  if (showSpeakingScreen) {
    return (
      <SpeakingScreen
        userInfo={userInfo}
        selectedTopic={selectedTopic}
        currentSessionId={currentSessionId}
        selectedVoice={selectedVoice}
        initialMessages={messages}
        onBack={handleSpeakingScreenClose}
      />
    );
  }

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
          onMenuPress={handleMenuPress} 
          onSettingsPress={handleSettingsPress}
          hideSettingsButton={showTopicSelection}
        />
      
      {showTopicSelection ? (
        <TopicSelection 
          onTopicSelect={handleTopicSelect}
          selectedAge={userInfo?.age || 7}
        />
      ) : (
        <Animated.View 
          style={[
            styles.chatContainer,
            {
              transform: [{ translateX: chatAreaAnim }]
            }
          ]}
        >

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
                {messages.map((msg, index) => (
                  <View key={index} style={styles.messageContainer}>
                    <ChatBubble 
                      sender={msg.sender} 
                      message={msg.text}
                      onSpeak={() => msg.sender === 'ai' && speakTextWithTTS(msg.text)}
                      isSpeaking={isSpeaking && msg.sender === 'ai'}
                    />
                  </View>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
          <View style={[styles.chatInputArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TouchableOpacity
              style={[
                styles.speakButton, 
                isSpeaking && styles.blockedButton
              ]}
              onPress={handleSpeakClick}
              disabled={isSpeaking}
            >
              <Image 
                source={require('../assets/images/ic_audio.png')} 
                style={[
                  styles.speakButtonIcon,
                  isSpeaking && styles.blockedIcon
                ]} 
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={[styles.messageInput, isSpeaking && styles.blockedInput]}
              placeholder={isSpeaking ? "Please wait...." : "Ask a question..."}
              value={inputMessage}
              onChangeText={(value) => {
                if (!isSpeaking){
                  setInputMessage(value);
                  // Reset auto prompt timer when user is typing
                  schedulerTimerToSendAutoPrompt();
                }
              
              }}
              multiline
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              style={[styles.sendButton, isSpeaking && styles.blockedButton]} 
              onPress={() => {
                sendMessage();
              }}
              disabled={isSpeaking}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
            
            {/* Transparent overlay to block interactions when teacher is speaking */}
            {isSpeaking && (
              <View style={styles.inputBlockOverlay} />
            )}
          </View>
        </Animated.View>
      )}

      {/* Side Menu */}
      <SideMenu
        isVisible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        onConversationSelect={handleConversationSelect}
        onSettingsPress={handleSettingsPress}
        onPremiumPress={handlePremiumPress}
        currentTopic={selectedTopic}
        speechRate={speechRate}
        onSpeechRateChange={handleSpeechRateChange}
        selectedVoice={selectedVoice}
        onVoiceChange={handleVoiceChange}
        availableVoices={ttsOptions.voices}
        chatAreaRef={chatAreaAnim}
      />

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
          // Show topic selection modal
          setTimeout(() => {
            setShowTopicSelectionModal(true);
          }, 300);
        }}
      />

      {/* Topic Selection Modal */}
      <Modal
        visible={showTopicSelectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowTopicSelectionModal(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Topic</Text>
            <TouchableOpacity 
              onPress={() => {
                Keyboard.dismiss();
                setShowTopicSelectionModal(false);
              }}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TopicSelection 
            onTopicSelect={async (topic) => {
              console.log('[ModalTopicSelect] Starting new topic flow:', topic.title);
              
              // Complete flow restart - stop all ongoing processes
              await stopSpeaking();
              clearUserTimeout();
              
              // Reset all conversation-related state
              setSelectedTopic(topic);
              await conversationSettingsManager.setCurrentTopic(topic);
              setShowTopicSelectionModal(false);
              setAutoPromptSent(false);
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
              
              // Start the lesson with the selected topic and greeting message
              const topicGreeting = OfflineService.generateTopicGreeting(topic, userInfo);
              const initialMessages = [{ sender: 'ai', text: topicGreeting }];
              setMessages(initialMessages);
              
              // Save initial conversation
              await saveConversation(initialMessages, topic);
              
              // Play greeting and start timeout flow
              speakTextWithTTS(topicGreeting);
              
              // Start timeout after initial greeting
              setTimeout(() => {
                schedulerTimerToSendAutoPrompt();
              }, 1000);
              
              console.log('[ModalTopicSelect] New topic flow started successfully');
            }}
            selectedAge={userInfo?.age || 7}
          />
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
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
    backgroundColor: 'transparent',
  },
  chatContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  chatInputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12, // This will be overridden by the dynamic paddingBottom
    borderTopWidth: 1,
    borderTopColor: 'rgba(224, 224, 224, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
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
  speakButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedButton: {
    backgroundColor: '#cccccc',
  },
  speakButtonIcon: {
    width: 24,
    height: 24,
    tintColor: '#ffffff',
  },
  blockedIcon: {
    tintColor: '#999999',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    maxHeight: 100,
    minHeight: 44,
    lineHeight: 20,
  },
  blockedInput: {
    backgroundColor: '#f5f5f5',
    color: '#999999',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60, // Add space for status bar
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default ChatPage;