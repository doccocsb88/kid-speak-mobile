// SpeakingScreen (refactored + fixed stale-closure)
// Flow: idle -> listening -> detectingSilence(2s) -> requesting -> playing -> listening
// Key fixes:
// - Use refs (transcriptRef, isPlayingRef) so timers/readers always see latest values
// - Bind Voice listeners once ([], use refs inside)
// - Arm 2s timer on results AND onSpeechEnd (if transcript exists)

import React, { useEffect, useReducer, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  PermissionsAndroid,
  Alert,
  Image,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { playAudioFromData, playTTS } from '../services/playaudioService';
import ConversationSettings from './ConversationSettings';
import conversationSettingsManager from '../services/conversationSettingsManager';
import { useConversationSettings } from '../hooks/useConversationSettings';
import userManager from '../services/UserManager';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ====== State Machine ======
const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  DETECTING: 'detectingSilence',
  REQUESTING: 'requesting',
  PLAYING: 'playing',
  ERROR: 'error',
  INTERRUPTED: 'interrupted',
};

const initial = {
  state: STATES.IDLE,
  transcript: '',
  lastUserInput: '',
  aiText: '',
  offline: false,
  error: null,
};

function reducer(s, a) {
  switch (a.type) {
    case 'START_LISTEN':
      return { ...s, state: STATES.LISTENING, error: null };
    case 'STOP_LISTEN':
      return { ...s, state: STATES.IDLE };
    case 'TRANSCRIPT_UPDATE':
      return { ...s, transcript: a.text, lastUserInput: a.text };
    case 'ENTER_DETECTING':
      return { ...s, state: STATES.DETECTING };
    case 'REQUESTING':
      return { ...s, state: STATES.REQUESTING };
    case 'PLAYING':
      return { ...s, state: STATES.PLAYING };
    case 'SET_AI_TEXT':
      return { ...s, aiText: a.text };
    case 'CLEAR_TRANSCRIPT':
      // Clear both transcript and lastUserInput for fresh start
      return { ...s, transcript: '', lastUserInput: '' };
    case 'OFFLINE_ON':
      return { ...s, offline: true };
    case 'OFFLINE_OFF':
      return { ...s, offline: false };
    case 'ERROR':
      return { ...s, state: STATES.ERROR, error: a.error };
    case 'INTERRUPTED':
      return { ...s, state: STATES.INTERRUPTED };
    default:
      return s;
  }
}

// ====== Offline fallback generator ======
function fallbackReply(message) {
  const generic = [
    "That's a great question! Can you tell me more?",
    "Nice! What would you like to practice next?",
    "Great job! Could you give me an example?",
  ];
  const m = (message || '').toLowerCase();
  if (m.includes('hello') || m.includes('hi'))
    return "Hello! I'm here to practice English with you. What would you like to talk about?";
  if (m.includes('animal')) return 'Animals are fun! What is your favorite animal?';
  if (m.includes('color')) return 'Colors are beautiful! What is your favorite color?';
  return generic[Math.floor(Math.random() * generic.length)];
}

export default function SpeakingScreen({
  userInfo,
  selectedTopic,
  onBack,
  currentSessionId,
  selectedVoice: initialSelectedVoice = 'alloy',
  initialMessages = [],
}) {
  const { isAuthenticated } = useAuth();
  const { getOptions } = useConversationSettings();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // === State for conversation messages ===
  const [conversationMessages, setConversationMessages] = useState(initialMessages);

  // === State for settings (synchronized with manager) ===
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(initialSelectedVoice);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [premiumRequired, setPremiumRequired] = useState(false);

  // Initialize from settings manager
  useEffect(() => {
    const initSettings = async () => {
      await conversationSettingsManager.initialize();
      const settings = conversationSettingsManager.getSettings();
      setSelectedVoice(settings.selectedVoice);
      setSpeechRate(settings.speechRate);
    };
    initSettings();

    // Subscribe to settings changes
    const unsubscribe = conversationSettingsManager.subscribe((key, value) => {
      if (key === 'voice' || key === 'all') {
        setSelectedVoice(conversationSettingsManager.getVoice());
      }
      if (key === 'speechRate' || key === 'all') {
        setSpeechRate(conversationSettingsManager.getSpeechRate());
      }
    });

    return () => unsubscribe();
  }, []);

  // Update manager when local state changes
  const handleVoiceChange = (newVoice) => {
    setSelectedVoice(newVoice);
    conversationSettingsManager.setVoice(newVoice);
  };

  const handleSpeechRateChange = (newRate) => {
    setSpeechRate(newRate);
    conversationSettingsManager.setSpeechRate(newRate);
  };

  // === Animations ===
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const userBubbleAnim = useRef(new Animated.Value(0)).current;
  const aiBubbleAnim = useRef(new Animated.Value(0)).current;
  const audioBarsAnim = useRef(
    Array.from({ length: 16 }, () => new Animated.Value(0.1))
  ).current;

  const [S, dispatch] = useReducer(reducer, initial);

  // === Refs to avoid stale closures ===
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const isPlayingRef = useRef(false);
  const isProcessingRef = useRef(false); // Flag to block transcript updates during API/playback
  const gateBlockedRef = useRef(false); // Block STT when premium gate is hit
  const voiceInitializedRef = useRef(false); // Track if Voice has been initialized

  // Keep refs in sync with state
  useEffect(() => { transcriptRef.current = S.transcript; }, [S.transcript]);
  useEffect(() => { 
    isPlayingRef.current = (S.state === STATES.PLAYING); 
    isProcessingRef.current = (S.state === STATES.REQUESTING || S.state === STATES.PLAYING);
  }, [S.state]);
  useEffect(() => { gateBlockedRef.current = premiumRequired; }, [premiumRequired]);

  const openPaywall = () => {
    try {
      if (navigation?.navigate) {
        navigation.navigate('Paywall');
      }
    } catch (_) {}
  };

  // === Helpers: pulse ===
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  };
  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  };
  const showUserBubble = () => {
    Animated.timing(userBubbleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };
  const showAiBubble = () => {
    Animated.timing(aiBubbleAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  // === Audio visualization animation ===
  const startAudioVisualization = () => {
    const animations = audioBarsAnim.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random() * 0.9 + 0.1,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 0.9 + 0.1,
            duration: 200 + Math.random() * 300,
            useNativeDriver: false,
          }),
        ])
      );
    });
    Animated.parallel(animations).start();
  };

  const stopAudioVisualization = () => {
    audioBarsAnim.forEach(anim => {
      anim.stopAnimation();
      Animated.timing(anim, {
        toValue: 0.1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  };

  // === Silence timer helpers ===
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };
  const armSilence2s = () => {
    clearSilenceTimer();
    dispatch({ type: 'ENTER_DETECTING' });
    const armedAt = Date.now();
    console.log('[VAD] arm 2s at', armedAt, 'text=', transcriptRef.current);
    silenceTimerRef.current = setTimeout(() => {
      clearSilenceTimer();
      const t = (transcriptRef.current || '').trim();
      console.log('[VAD] fire 2s at', Date.now(), 'text=', t);
      if (t.length > 0) {
        sendTranscript(t);
      } else {
        console.log('hai log: No transcript to send');
      }
    }, 2000);
  };

  // === Voice listeners (bind once) ===
  useEffect(() => {
    // Verify Voice module is available before binding listeners
    console.log('[Voice] Checking Voice module availability...');
    console.log('[Voice] Voice object:', Voice);
    console.log('[Voice] Voice.start type:', typeof Voice?.start);
    console.log('[Voice] Voice.cancel type:', typeof Voice?.cancel);
    
    if (!Voice) {
      console.error('[Voice] Voice module is not available!');
      Alert.alert(
        'Voice Module Error',
        'Voice recognition module is not available. Please rebuild the app.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (typeof Voice.start !== 'function') {
      console.error('[Voice] Voice.start is not a function!');
      Alert.alert(
        'Voice Module Error',
        'Voice recognition module is not properly initialized. Please rebuild the app.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    console.log('[Voice] Binding listeners...');
    Voice.onSpeechStart = () => {
      console.log('[Voice] onSpeechStart event received');
      if (gateBlockedRef.current) {
        console.log('[Voice] Ignoring speech start - premium gate active');
        return; 
      }
      if (isProcessingRef.current) { 
        console.log('[Voice] Ignoring speech start - processing API/audio');
        return; 
      }
      console.log('[Voice] Speech started - updating UI state');
      // Update state to LISTENING (may already be set, but ensure it's correct)
      dispatch({ type: 'START_LISTEN' });
      startPulse();
      startAudioVisualization();
      showUserBubble();
    };

    Voice.onSpeechResults = (e) => {
      if (gateBlockedRef.current) {
        console.log('[Voice] Ignoring speech results - premium gate active');
        return; // ignore during premium gate
      }
      if (isProcessingRef.current) {
        console.log('[Voice] Ignoring speech results - processing API/audio');
        return; // ignore during processing
      }
      const t = e?.value?.[0] || '';
      console.log('[Voice] Results received:', t);
      transcriptRef.current = t; // keep fresh
      dispatch({ type: 'TRANSCRIPT_UPDATE', text: t });
      showUserBubble();
      armSilence2s(); // reset 2s window on each partial/final result
    };

    Voice.onSpeechEnd = () => {
      if (gateBlockedRef.current) {
        console.log('[Voice] Ignoring speech end - premium gate active');
        return;
      }
      if (isProcessingRef.current) {
        console.log('[Voice] Ignoring speech end - processing API/audio');
        return;
      }
      console.log('[Voice] Speech ended');
      // Some devices do not emit another results event after end
      const t = (transcriptRef.current || '').trim();
      if (t.length > 0) armSilence2s();
    };

    Voice.onSpeechError = (err) => {
      console.warn('[Voice] error', err);
      dispatch({ type: 'ERROR', error: err });
    };

    // Add listener for volume change to prevent warning
    Voice.onSpeechVolumeChanged = (e) => {
      // Optional: you can use this to show volume indicator
      // console.log('[Voice] Volume:', e?.value);
    };

      return () => {
      console.log('[Voice] Cleanup: Destroying Voice instance...');
      clearSilenceTimer();
      stopPulse();
      stopAudioVisualization();
      // Complete cleanup sequence
      Voice.cancel()
        .then(() => Voice.stop())
        .then(() => Voice.destroy())
        .then(() => Voice.removeAllListeners())
        .catch(err => console.warn('[Voice] Cleanup error:', err));
    };
  }, []);

  // === Request Android permissions ===
  const requestRecordAudioPermission = async () => {
    if (Platform.OS !== 'android') {
      return true; // iOS doesn't need runtime permission
    }

    try {
      // Check if permission is already granted
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      
      if (checkResult) {
        console.log('[Permission] RECORD_AUDIO already granted');
        return true;
      }

      // Request permission
      console.log('[Permission] Requesting RECORD_AUDIO permission...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'KidSpeak needs access to your microphone to recognize your speech and help you practice English.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('[Permission] RECORD_AUDIO permission granted');
        return true;
      } else {
        console.warn('[Permission] RECORD_AUDIO permission denied');
        Alert.alert(
          'Permission Required',
          'Microphone permission is required for speech recognition. Please enable it in app settings.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (err) {
      console.error('[Permission] Error requesting RECORD_AUDIO:', err);
      return false;
    }
  };

  // === Start/Stop listening ===
  const startListening = async () => {
    try {
      if (gateBlockedRef.current) {
        console.log('[Voice] startListening blocked by premium gate');
        return;
      }
      
      // Request permission first (Android)
      const hasPermission = await requestRecordAudioPermission();
      if (!hasPermission) {
        console.log('[Voice] Cannot start listening - permission denied');
        dispatch({ type: 'ERROR', error: new Error('Microphone permission denied') });
        return;
      }

      console.log('[Voice] Starting listening...');
      
      // Verify Voice module is available before starting
      if (!Voice || typeof Voice.start !== 'function') {
        throw new Error('Voice module is not available. Please rebuild the app.');
      }
      
      // CRITICAL: Check if native module is actually loaded
      const { NativeModules } = require('react-native');
      const voiceModuleKeys = Object.keys(NativeModules).filter(k => k.toLowerCase().includes('voice'));
      console.log('[Voice] NativeModules Voice-related keys:', voiceModuleKeys);
      
      // Check if native module exists - if not, it means the app needs to be rebuilt
      if (voiceModuleKeys.length === 0 && Platform.OS === 'android') {
        // Try to check the actual native module reference
        try {
          // Attempt to access the native module to see if it's null
          const testStart = Voice.start;
          if (!testStart) {
            throw new Error('Voice native module is not linked. Please rebuild the app: cd android && ./gradlew clean && cd .. && npm run android');
          }
        } catch (testErr) {
          console.error('[Voice] Native module check failed:', testErr);
          throw new Error('Voice native module is not linked. Please rebuild the app: cd android && ./gradlew clean && cd .. && npm run android');
        }
      }
      
      // CRITICAL: On React Native 0.82 with New Architecture disabled, 
      // native modules may need extra time to initialize
      console.log('[Voice] Attempting to initialize native module...');
      
      // Wait for React Native bridge to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if native module is now loaded
      console.log('[Voice] Checking native module load status...');
      console.log('[Voice] Voice._loaded:', Voice._loaded);
      
      // CRITICAL: On Android, only cleanup if Voice was already initialized
      // Don't call cancel/stop on first initialization as it can cause null reference
      if (voiceInitializedRef.current) {
        try {
          // Only cancel/stop if we're currently listening (don't destroy or remove listeners!)
          try {
            await Voice.cancel();
          } catch (cancelErr) {
            // Ignore if not active - this is expected
            console.log('[Voice] Cancel (not active, expected):', cancelErr?.message);
          }
          
          try {
            await Voice.stop();
          } catch (stopErr) {
            // Ignore if not active - this is expected
            console.log('[Voice] Stop (not active, expected):', stopErr?.message);
          }
          
          // Small delay to ensure clean state (especially on Android)
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (cleanupErr) {
          console.log('[Voice] Pre-start cleanup error (non-critical):', cleanupErr?.message);
          // Don't throw - continue to try starting
        }
      } else {
        // First time initialization - wait longer for native module to be ready
        console.log('[Voice] First initialization, waiting for module to be ready...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased wait time
      }
      
      // Listeners are already bound in useEffect - don't rebind them!
      // On Android, rebinding listeners can cause the native module to become null
      
      // Start voice recognition with retry logic FIRST
      console.log('[Voice] Calling Voice.start("en-US")...');
      
      // Retry logic for Android - sometimes native module needs a moment
      let retries = 5; // Increased retries
      let lastError = null;
      let startSuccess = false;
      
      while (retries > 0) {
        try {
          // Check if error is about null native module before retrying
          await Voice.start('en-US');
          voiceInitializedRef.current = true; // Mark as initialized after successful start
          startSuccess = true;
          console.log('[Voice] Voice.start() succeeded, waiting for onSpeechStart event...');
          break; // Success - exit retry loop
        } catch (startErr) {
          lastError = startErr;
          const errorMsg = startErr?.message || String(startErr);
          
          // If error indicates native module is null, don't retry - it needs rebuild
          if (errorMsg.includes('null') || errorMsg.includes('startSpeech') || errorMsg.includes('Cannot read property')) {
            console.error('[Voice] Native module is null - app needs rebuild');
            throw new Error('Voice native module is not properly linked. Please rebuild the app:\n\ncd android && ./gradlew clean && cd .. && npm run android');
          }
          
          retries--;
          console.warn(`[Voice] Start failed, retries left: ${retries}`, errorMsg);
          
          if (retries > 0) {
            // Wait longer before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Only update state if start was successful
      if (startSuccess) {
        // Update state immediately for UI feedback
        // onSpeechStart listener will also dispatch START_LISTEN when triggered
        dispatch({ type: 'START_LISTEN' });
        startPulse();
        startAudioVisualization();
        console.log('[Voice] Listening started successfully, state set to LISTENING');
        
        // On Android, onSpeechStart might be delayed, so we set state immediately
        // The listener will confirm when it fires, but UI should show listening state right away
      } else {
        // All retries failed
        throw lastError || new Error('Failed to start voice recognition after multiple attempts');
      }
    } catch (e) {
      console.error('[Voice] Failed to start listening:', e);
      voiceInitializedRef.current = false; // Reset on failure
      
      // Reset state to IDLE on error (not ERROR state, so user can retry)
      dispatch({ type: 'STOP_LISTEN' });
      dispatch({ type: 'ERROR', error: e });
      stopPulse();
      stopAudioVisualization();
      
      // Show user-friendly error message with rebuild instructions
      if (Platform.OS === 'android') {
        const errorMsg = e?.message || String(e);
        const needsRebuild = errorMsg.includes('null') || errorMsg.includes('startSpeech') || errorMsg.includes('not properly linked') || errorMsg.includes('not linked');
        
        Alert.alert(
          'Speech Recognition Error',
          needsRebuild 
            ? 'Voice recognition module is not properly linked. Please rebuild the app:\n\n1. Stop the app\n2. Run: cd android && ./gradlew clean\n3. Run: cd .. && npm run android'
            : 'Unable to start speech recognition. Please try again or restart the app.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const stopListening = async () => {
    try {
      console.log('[Voice] Stopping listening...');
      clearSilenceTimer();
      await Voice.stop();
      dispatch({ type: 'STOP_LISTEN' });
      console.log('[Voice] Listening stopped');
    } catch (e) {
      console.error('[Voice] Failed to stop listening:', e);
      dispatch({ type: 'ERROR', error: e });
    } finally {
      stopPulse();
      stopAudioVisualization();
    }
  };

  // === API + playback flow ===
  const sendTranscript = async (message) => {
    // Clear silence timer and set requesting state
    clearSilenceTimer();
    console.log('[API] Sending message to API...');
    console.log('[API] selectedTopic:', JSON.stringify(selectedTopic));
    console.log('[API] selectedTopic.id:', selectedTopic?.id);
    console.log('[API] selectedTopic.title:', selectedTopic?.title);
    // Gate: daily limit / premium requirement
    try {
      const allowed = await userManager.canSendRequest();
      if (!allowed) {
        console.log('[Gate] Daily limit reached — blocking and showing paywall');
        setPremiumRequired(true);
        try {
          await Voice.stop();
          await Voice.cancel();
        } catch (_) {}
        showUserBubble();
        openPaywall();
        return;
      }
    } catch (e) {
      console.warn('[Gate] canSendRequest check failed:', e?.message || e);
    }
    dispatch({ type: 'REQUESTING' });

    // Add user message to conversation
    const userMessage = { sender: 'user', text: message };
    setConversationMessages(prev => [...prev, userMessage]);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isAuthenticated) {
        const token = await AsyncStorage.getItem('authToken');
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      // Configure options for getOpenAIResponseV2 (from conversation settings)
      const options = {
        ...getOptions(),
      };

      // Build chatHistory from conversationMessages (before adding current message)
      const chatHistory = conversationMessages.map(msg => ({
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

      const payload = {
        message,
        provider: 'openai',
        includeAudio: true,
        voice: selectedVoice || 'alloy',
        model: 'gpt-4o-mini-tts', // Use new TTS model with instructions support
        topic: topicData,
        userInfo,
        sessionId: currentSessionId,
        options: options,
        chatHistory: chatHistory, // Include conversation history for context
      };

      console.log('[API] Payload topic:', JSON.stringify(payload.topic));
      console.log('[API] typeof payload.topic:', typeof payload.topic);
      console.log('[API] Full payload before sending:', JSON.stringify(payload, null, 2));
      console.log('[API] About to send request...');

      const res = await axios.post(`${API_BASE_URL}/chat/send-message`, payload, {
        headers,
        timeout: 15000
      });

      const data = res.data?.data || res.data || {};
      const text = data.response || '';
      const audio = data.audio;
      const format = data.audioFormat; // kept if backend uses

      // Count successful API request for free users
      try { await userManager.recordRequest(); } catch (_) {}

      // Add AI message to conversation
      const aiMessage = { sender: 'ai', text: text };
      setConversationMessages(prev => [...prev, aiMessage]);

      dispatch({ type: 'SET_AI_TEXT', text });
      showAiBubble();

      console.log('[API] Received response, preparing to play audio/TTS...');
      console.log('[API] Has audio data:', !!audio);
      console.log('[API] Audio data type:', typeof audio);
      console.log('[API] Audio is array:', Array.isArray(audio));
      if (audio) {
        console.log('[API] Calling playApiAudio...');
        await playApiAudio(audio);
      } else {
        console.log('[API] No audio, calling speakTTS...');
        await speakTTS(text);
      }

      console.log('[API] Audio/TTS playback finished, back to listening');
      dispatch({ type: 'OFFLINE_OFF' });
    } catch (err) {
      console.warn('[API] send-message failed', err?.message || err);
      const net = !err?.response;
      const text = net ? fallbackReply(message) : "I had trouble understanding that. Could you try again?";
      
      // Add AI error message to conversation
      const aiMessage = { sender: 'ai', text: text };
      setConversationMessages(prev => [...prev, aiMessage]);
      
      dispatch({ type: 'SET_AI_TEXT', text });
      showAiBubble();
      if (net) dispatch({ type: 'OFFLINE_ON' });
      // Speak error message, which will restart listening when done
      console.log('[API] Speaking error message...');
      try { await speakTTS(text); } catch (_) {}
    } finally {
      // Transcript is cleared by playApiAudio/speakTTS in their finally blocks
      console.log('[API] sendTranscript flow completed, ready for next input');
    }
  };

  const playApiAudio = async (audioData) => {
    try {
      console.log('[Audio] Preparing to play audio...');
      
      // CRITICAL: Stop Voice BEFORE playing audio to prevent self-recognition
      console.log('[Audio] Stopping voice recognition BEFORE playback...');
      await Voice.stop();
      await Voice.cancel(); // Extra step to fully clear buffer
      console.log('[Audio] Voice stopped, now safe to play audio');
      
      dispatch({ type: 'PLAYING' });
      dispatch({ type: 'CLEAR_TRANSCRIPT' });
      transcriptRef.current = '';
      
      // Use centralized audio service
      await playAudioFromData(audioData);
      
      console.log('[Audio] Audio playback completed');
      stopAudioVisualization();
    } catch (err) {
      console.warn('[Audio] playback error', err);
      stopAudioVisualization();
      // Don't throw - continue to restart voice even if audio fails
    }
    
    // Only after audio completes, restart voice and return to listening
    try {
      console.log('[Audio] Audio finished, waiting before restart...');
      
      // Wait a bit to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use startListening which has proper cleanup logic
      console.log('[Audio] Restarting voice recognition using startListening...');
      await startListening();
      console.log('[Audio] Voice restarted successfully, ready for new speech');
    } catch (e) {
      console.error('[Audio] Failed to restart voice:', e);
      dispatch({ type: 'ERROR', error: e });
    }
  };

  const speakTTS = async (text) => {
    try {
      console.log('[TTS] Preparing to speak...');
      
      // CRITICAL: Stop Voice BEFORE playing TTS to prevent self-recognition
      console.log('[TTS] Stopping voice recognition BEFORE playback...');
      await Voice.stop();
      await Voice.cancel(); // Extra step to fully clear buffer
      console.log('[TTS] Voice stopped, now safe to play TTS');
      
      dispatch({ type: 'PLAYING' });
      dispatch({ type: 'CLEAR_TRANSCRIPT' });
      transcriptRef.current = '';
      
      // Use centralized TTS service
      await playTTS(text, selectedVoice, 'gpt-4o-mini-tts');
      
      console.log('[TTS] TTS playback completed');
      stopAudioVisualization();
    } catch (err) {
      console.warn('[TTS] speak error', err);
      stopAudioVisualization();
    }
    
    // Only after TTS completes, restart voice and return to listening
    try {
      console.log('[TTS] TTS finished, waiting before restart...');
      
      // Wait a bit to ensure clean state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use startListening which has proper cleanup logic
      console.log('[TTS] Restarting voice recognition using startListening...');
      await startListening();
      console.log('[TTS] Voice restarted successfully, ready for new speech');
    } catch (e) {
      console.error('[TTS] Failed to restart voice:', e);
      dispatch({ type: 'ERROR', error: e });
    }
  };

  // Autostart listening on mount with delay to avoid iOS reuse error
  useEffect(() => {
    console.log('[Voice] Component mounted, scheduling autostart...');
    // Add small delay to ensure clean state after navigation
    // Also allows time for permission request dialog to show if needed
    const timer = setTimeout(() => {
      console.log('[Voice] Autostart timer fired, calling startListening...');
      startListening().catch(err => {
        console.error('[Voice] Autostart failed:', err);
      });
    }, 500); // Increased delay to allow permission dialog to show
    
    return () => {
      console.log('[Voice] Component unmounting, clearing autostart timer...');
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = S.state === STATES.LISTENING || S.state === STATES.DETECTING;
  const isRequesting = S.state === STATES.REQUESTING;
  const isPlaying = S.state === STATES.PLAYING; // for UI only

  const micDisabled = isRequesting || isPlaying;
  const isBusy = isRequesting || isPlaying;
  // const onMicPress = async () => {
  //   if (micDisabled) return;
  //   if (isListening) await stopListening();
  //   else await startListening();
  // };

  // Get last messages for display
  const lastUserMessage = conversationMessages.filter(m => m.sender === 'user').slice(-1)[0];
  const lastAiMessage = conversationMessages.filter(m => m.sender === 'ai').slice(-1)[0];
  const displayUserText = premiumRequired
    ? 'Daily limit reached. Tap to upgrade.'
    : (S.transcript || lastUserMessage?.text || (isListening ? 'Listening...' : ''));
  const displayAiText = S.aiText || lastAiMessage?.text || 'Ready to chat!';

  // Get user initial for avatar
  const userInitial = userInfo?.name?.[0]?.toUpperCase() || 'U';

  // Determine dynamic header title based on topic or friend
  const getHeaderTitle = () => {
    if (!selectedTopic) {
      return 'Speak with Sparky';
    }

    // Check if it's a friend (id starts with 'friend_')
    const isFriend = selectedTopic.id && String(selectedTopic.id).startsWith('friend_');
    
    if (isFriend) {
      // Extract friend name from title (format: "Chat with [Name]")
      const title = selectedTopic.title || '';
      const friendNameMatch = title.match(/Chat with (.+)/);
      if (friendNameMatch && friendNameMatch[1]) {
        return `Speak with ${friendNameMatch[1]}`;
      }
      // Fallback: use title as-is if format doesn't match
      return title || 'Speak with Sparky';
    }

    // Regular topic - show topic title
    if (selectedTopic.title) {
      return selectedTopic.title;
    }

    // Default fallback
    return 'Speak with Sparky';
  };

  const headerTitle = getHeaderTitle();

  const HeaderContent = (
    <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
      <TouchableOpacity
        style={[styles.backButton, isBusy && styles.disabledButton]}
        disabled={isBusy}
        onPress={async () => {
          if (!isBusy) {
            try {
              console.log('[Navigation] Back button pressed, cleaning up Voice...');
              clearSilenceTimer();
              stopPulse();
              stopAudioVisualization();
              // Complete cleanup before navigation
              await Voice.cancel();
              await Voice.stop();
              await Voice.destroy();
              Voice.removeAllListeners();
              console.log('[Navigation] Voice cleanup complete, navigating back...');
            } catch (err) {
              console.warn('[Navigation] Cleanup error:', err);
            } finally {
              // Navigate back even if cleanup fails
              onBack && onBack(conversationMessages);
            }
          }
        }}
      >
        <Text style={styles.backButtonIcon}>←</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{headerTitle}</Text>
      <View style={styles.headerRightSpacer} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {Platform.OS === 'ios' ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {HeaderContent}
        </SafeAreaView>
      ) : (
        HeaderContent
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Top Section: Avatar and Status */}
        <View style={styles.topSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrOfEQkVdMdCENiYkYSl6j7jlSnrsh6RbTYKRyWoz5pwriWvPucsmG364GhfVEcIlmQPqiBFRli6Nj9fzWYlCp0rVrqqwlZRSg_NIAq2OrHU3ls8YMWrsRNLyxAVNANN1K6p5T3fudlUkakL8BjCC-XmKz8HoX3VarkM6nOHwbw2EDzQ3YGnW4SVCfMPUkfFm7SdxDFA83eDWUBgq4jK2BTB8fkR9AnGu51_wIFCZIBXR2uzILHuSERag-UqvcybDlFP_O1En_zQ' }}
              style={styles.avatar}
              defaultSource={require('../assets/images/ic_audio.png')}
            />
          </View>
          <Text style={styles.listeningStatus}>
            {isPlaying ? 'Playing...' : isRequesting ? 'Processing...' : isListening ? "I'm listening..." : 'Ready to speak'}
          </Text>
        </View>

        {/* Chat Bubbles Section */}
        <View style={styles.chatSection}>
          {/* AI Message (Left) */}
          {displayAiText && displayAiText !== 'Ready to chat!' && (
            <Animated.View
              style={[
                styles.chatBubbleContainer,
                styles.aiBubbleContainer,
                {
                  opacity: aiBubbleAnim,
                  transform: [
                    { scale: aiBubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDrOfEQkVdMdCENiYkYSl6j7jlSnrsh6RbTYKRyWoz5pwriWvPucsmG364GhfVEcIlmQPqiBFRli6Nj9fzWYlCp0rVrqqwlZRSg_NIAq2OrHU3ls8YMWrsRNLyxAVNANN1K6p5T3fudlUkakL8BjCC-XmKz8HoX3VarkM6nOHwbw2EDzQ3YGnW4SVCfMPUkfFm7SdxDFA83eDWUBgq4jK2BTB8fkR9AnGu51_wIFCZIBXR2uzILHuSERag-UqvcybDlFP_O1En_zQ' }}
                style={styles.chatAvatar}
                defaultSource={require('../assets/images/ic_audio.png')}
              />
              <View style={styles.aiBubble}>
                <Text style={styles.aiBubbleText}>{displayAiText}</Text>
              </View>
            </Animated.View>
          )}

          {/* User Message (Right) */}
          {displayUserText && (
            <View style={[styles.chatBubbleContainer, styles.userBubbleContainer]}>
              <TouchableOpacity
                activeOpacity={premiumRequired ? 0.7 : 1}
                onPress={() => { if (premiumRequired) openPaywall(); }}
                style={{ flex: 1 }}
              >
                <Animated.View
                  style={[
                    styles.userBubble,
                    {
                      opacity: userBubbleAnim,
                      transform: [
                        { scale: userBubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.userBubbleText}>{displayUserText}</Text>
                </Animated.View>
              </TouchableOpacity>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{userInitial}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Audio Visualization and Mic Button */}
        <View style={styles.bottomSection}>
          {/* Audio Visualization */}
          {isListening && (
            <View style={styles.audioVisualization}>
              {audioBarsAnim.map((anim, index) => {
                const colors = ['#34D399', '#FFD159', '#58A4FF'];
                const color = colors[index % colors.length];
                const heights = [8, 20, 32, 12, 40, 48, 60, 72, 80, 56, 44, 64, 52, 36, 16, 28];
                const baseHeight = heights[index] || 20;
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.audioBar,
                      {
                        backgroundColor: color,
                        height: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [baseHeight * 0.1, baseHeight],
                        }),
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}

          {/* Microphone Button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonListening]}
            disabled={micDisabled}
            onPress={() => {
              if (micDisabled) return;
              if (isListening) stopListening();
              else startListening();
            }}
          >
            <Animated.View
              style={[
                styles.micButtonInner,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.micIcon}>🎤</Text>
            </Animated.View>
            {isListening && (
              <Animated.View
                style={[
                  styles.micButtonPulse,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0.5, 0],
                    }),
                  },
                ]}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversation Settings Modal */}
      <ConversationSettings
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentTopic={selectedTopic}
        speechRate={speechRate}
        onSpeechRateChange={handleSpeechRateChange}
        selectedVoice={selectedVoice}
        onVoiceChange={handleVoiceChange}
        availableVoices={conversationSettingsManager.getAvailableVoices()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonIcon: {
    fontSize: 24,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textAlign: 'center',
    paddingRight: 48,
  },
  headerRightSpacer: {
    width: 48,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    overflow: 'hidden',
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  listeningStatus: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 24,
    textAlign: 'center',
  },
  chatSection: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 24,
  },
  chatBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  aiBubbleContainer: {
    alignSelf: 'flex-start',
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderTopLeftRadius: 0,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '80%',
  },
  aiBubbleText: {
    fontSize: 16,
    color: '#1E3A8A',
    lineHeight: 22,
  },
  userBubble: {
    backgroundColor: '#58A4FF',
    borderRadius: 12,
    borderTopRightRadius: 0,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: '80%',
  },
  userBubbleText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD159',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSection: {
    alignItems: 'center',
    gap: 24,
  },
  audioVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 80,
    width: '100%',
  },
  audioBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 8,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#58A4FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#58A4FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  micButtonListening: {
    backgroundColor: '#58A4FF',
  },
  micButtonInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#58A4FF',
  },
  micIcon: {
    fontSize: 48,
  },
  disabledButton: {
    opacity: 0.5,
  },
});