// SpeakingScreen (refactored + fixed stale-closure)
// Flow: idle -> listening -> detectingSilence(2s) -> requesting -> playing -> listening
// Key fixes:
// - Use refs (transcriptRef, isPlayingRef) so timers/readers always see latest values
// - Bind Voice listeners once ([], use refs inside)
// - Arm 2s timer on results AND onSpeechEnd (if transcript exists)

import React, { useEffect, useReducer, useRef, useState, useCallback } from 'react';
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
  StatusBar,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import { playAudioFromData, playTTS } from '../services/playaudioService';
import ConversationSettings from './ConversationSettings';
import { getFriendAvatar } from '../pages/FriendList';
import conversationSettingsManager from '../services/conversationSettingsManager';
import { useConversationSettings } from '../hooks/useConversationSettings';
import userManager from '../services/UserManager';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import ksSpeechAdapter from '../services/ksSpeechAdapter';

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
  const prevState = s.state;
  let newState = s;
  
  switch (a.type) {
    case 'START_LISTEN':
      newState = { ...s, state: STATES.LISTENING, error: null };
      break;
    case 'STOP_LISTEN':
      newState = { ...s, state: STATES.IDLE };
      break;
    case 'TRANSCRIPT_UPDATE':
      newState = { ...s, transcript: a.text, lastUserInput: a.text };
      break;
    case 'ENTER_DETECTING':
      newState = { ...s, state: STATES.DETECTING };
      break;
    case 'REQUESTING':
      newState = { ...s, state: STATES.REQUESTING };
      break;
    case 'PLAYING':
      newState = { ...s, state: STATES.PLAYING };
      break;
    case 'SET_AI_TEXT':
      newState = { ...s, aiText: a.text };
      break;
    case 'CLEAR_TRANSCRIPT':
      // Clear both transcript and lastUserInput for fresh start
      newState = { ...s, transcript: '', lastUserInput: '' };
      break;
    case 'OFFLINE_ON':
      newState = { ...s, offline: true };
      break;
    case 'OFFLINE_OFF':
      newState = { ...s, offline: false };
      break;
    case 'ERROR':
      newState = { ...s, state: STATES.ERROR, error: a.error };
      break;
    case 'INTERRUPTED':
      newState = { ...s, state: STATES.INTERRUPTED };
      break;
    default:
      return s;
  }
  
  // Log state changes for debugging
  if (prevState !== newState.state) {
    console.log(`[State] Changed: ${prevState} → ${newState.state} (action: ${a.type})`);
  }
  
  return newState;
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
  onBusyChange,
  onMessagesChange,
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
  const lastSpeechResultTimeRef = useRef(0); // Track last time we got speech results
  const healthCheckTimerRef = useRef(null); // Timer to check if voice recognition is still working
  
  // === Speech Recognition Module Selection ===
  // Default to react-native-voice library, KSSpeech native module is disabled
  const useKSSpeechRef = useRef(false);
  const SpeechModuleRef = useRef(null);
  const moduleNameRef = useRef('Voice');
  
  // Initialize module selection - Default to react-native-voice
  useEffect(() => {
    // Default to Voice library, only use KSSpeech if explicitly needed
    const useKSSpeech = false; // Default to false - prefer Voice library
    useKSSpeechRef.current = useKSSpeech;
    SpeechModuleRef.current = useKSSpeech ? ksSpeechAdapter : Voice;
    moduleNameRef.current = useKSSpeech ? 'KSSpeech' : 'Voice';
    console.log(`[ModuleSelection] Selected module: ${moduleNameRef.current} (KSSpeech available: ${Platform.OS === 'android' && ksSpeechAdapter?.isAvailable?.()})`);

    // Initialize KSSpeech adapter immediately if using it
    if (useKSSpeech) {
      console.log('[ModuleSelection] Initializing KSSpeech adapter...');
      ksSpeechAdapter.initialize();
    }

    // Debug: Check if Voice module is available
    if (!useKSSpeech) {
      console.log(`[ModuleSelection] Voice module available:`, !!Voice);
      console.log(`[ModuleSelection] Voice.start available:`, typeof Voice?.start === 'function');
      console.log(`[ModuleSelection] Voice.stop available:`, typeof Voice?.stop === 'function');
    }
  }, []);
  
  // Use refs for dynamic module selection (can change during runtime if KSSpeech fails)
  const useKSSpeech = useKSSpeechRef.current;
  const SpeechModule = SpeechModuleRef.current || Voice;
  const moduleName = moduleNameRef.current || 'Voice';

  // Keep refs in sync with state
  useEffect(() => { transcriptRef.current = S.transcript; }, [S.transcript]);
  useEffect(() => {
    isPlayingRef.current = (S.state === STATES.PLAYING);
    isProcessingRef.current = (S.state === STATES.REQUESTING || S.state === STATES.PLAYING);
    console.log(`[State] isProcessingRef updated to: ${isProcessingRef.current} (state: ${S.state})`);
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

  // === Speech Recognition listeners (bind once) ===
  useEffect(() => {
    console.log(`[DEBUG] Binding listeners useEffect - START`);
    const currentModule = SpeechModuleRef.current || Voice;
    const currentModuleName = moduleNameRef.current || 'Voice';
    const currentUseKSSpeech = useKSSpeechRef.current;
    console.log(`[DEBUG] currentModule:`, currentModule);
    console.log(`[DEBUG] currentModuleName:`, currentModuleName);
    console.log(`[DEBUG] currentUseKSSpeech:`, currentUseKSSpeech);
    
    console.log(`Speech Recognition [${currentModuleName}] Checking ${currentModuleName} module availability...`);
    console.log(`Speech Recognition Module: [${currentModuleName}] Using module:`, currentUseKSSpeech ? 'KSSpeech (Native)' : 'Voice (Library)');
    
    // Verify module is available
    if (!currentModule) {
      console.error(`[${currentModuleName}] Module is not available!`);
      Alert.alert(
        'Speech Recognition Error',
        'Speech recognition module is not available. Please rebuild the app.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (typeof currentModule.start !== 'function') {
      console.error(`[${currentModuleName}] start() is not a function!`);
      Alert.alert(
        'Speech Recognition Error',
        'Speech recognition module is not properly initialized. Please rebuild the app.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    console.log(`[${currentModuleName}] Binding listeners...`);

    // Debug: Check if event properties exist on module before assignment
    console.log(`[${currentModuleName}] Module has onSpeechStart property before:`, typeof currentModule.onSpeechStart);
    console.log(`[${currentModuleName}] Module has onSpeechResults property before:`, typeof currentModule.onSpeechResults);

    // Common event handlers (work for both Voice and KSSpeech via adapter)
    currentModule.onSpeechStart = () => {
      const moduleName = moduleNameRef.current || 'Voice';
      console.log(`[${moduleName}] ========== onSpeechStart event received ==========`);
      console.log(`[${moduleName}] Current state:`, S.state);
      console.log(`[${moduleName}] gateBlockedRef:`, gateBlockedRef.current);
      console.log(`[${moduleName}] isProcessingRef:`, isProcessingRef.current);
      console.log(`[${moduleName}] Should process:`, !gateBlockedRef.current && !isProcessingRef.current);

      if (gateBlockedRef.current) {
        console.log(`[${moduleName}] Ignoring speech start - premium gate active`);
        return;
      }
      if (isProcessingRef.current) {
        console.log(`[${moduleName}] Ignoring speech start - processing API/audio`);
        return;
      }
      console.log(`[${moduleName}] Speech started - updating UI state`);
      // Ensure processing state is false when we start listening
      isProcessingRef.current = false;
      dispatch({ type: 'START_LISTEN' });
      startPulse();
      startAudioVisualization();
      showUserBubble();
      console.log(`[${moduleName}] ========== onSpeechStart completed ==========`);

      // Debug: Add a timeout to check if we get stuck in listening state
      setTimeout(() => {
        console.log(`[${moduleName}] DEBUG: 3s after onSpeechStart, state is:`, S.state);
      }, 3000);
    };

    currentModule.onSpeechPartialResults = (e) => {
      const moduleName = moduleNameRef.current || 'Voice';
      // console.log(`[${moduleName}] Partial:`, e?.value?.[0]); // Optional log
      
      if (gateBlockedRef.current) return;
      if (isProcessingRef.current) return;

      const t = e?.value?.[0] || '';
      if (t) {
        transcriptRef.current = t;
        dispatch({ type: 'TRANSCRIPT_UPDATE', text: t });
        showUserBubble();
        // Arm silence timer on partials to act as VAD
        armSilence2s();
      }
    };

    currentModule.onSpeechResults = (e) => {
      const moduleName = moduleNameRef.current || 'Voice';
      console.log(`[${moduleName}] onSpeechResults event received, raw data:`, JSON.stringify(e));
      
      // Update last speech result time for health check
      lastSpeechResultTimeRef.current = Date.now();
      
      if (gateBlockedRef.current) {
        console.log(`[${moduleName}] Ignoring speech results - premium gate active`);
        return;
      }
      if (isProcessingRef.current) {
        console.log(`[${moduleName}] Ignoring speech results - processing API/audio`);
        return;
      }
      const t = e?.value?.[0] || '';
      console.log(`[${moduleName}] Results received:`, t);
      if (t) {
        transcriptRef.current = t;
        dispatch({ type: 'TRANSCRIPT_UPDATE', text: t });
        showUserBubble();
        armSilence2s();
      } else {
        console.warn(`[${moduleName}] Empty transcript received`);
      }
    };

    currentModule.onSpeechEnd = () => {
      const moduleName = moduleNameRef.current || 'Voice';
      console.log(`[${moduleName}] onSpeechEnd event received`);
      if (gateBlockedRef.current) {
        console.log(`[${moduleName}] Ignoring speech end - premium gate active`);
        return;
      }
      if (isProcessingRef.current) {
        console.log(`[${moduleName}] Ignoring speech end - processing API/audio`);
        return;
      }
      console.log(`[${moduleName}] Speech ended`);
      const t = (transcriptRef.current || '').trim();
      console.log(`[${moduleName}] Current transcript on speech end:`, t);
      if (t.length > 0) {
        console.log(`[${moduleName}] Transcript exists, arming 2s silence timer...`);
        armSilence2s();
      } else {
        console.log(`[${moduleName}] No transcript, not arming silence timer`);
      }
    };

    currentModule.onSpeechError = async (err) => {
      const moduleName = moduleNameRef.current || 'Voice';
      const errorMsg = err?.error?.message || err?.message || String(err);
      const errorCode = err?.code || err?.error?.code;
      console.warn(`[${moduleName}] onSpeechError event received:`, errorMsg);
      console.warn(`[${moduleName}] Error details:`, JSON.stringify(err, null, 2));
      console.warn(`[${moduleName}] Error code:`, errorCode);
      console.warn(`[${moduleName}] Full error object:`, err);

      // Handle NO_SPEECH_DETECTED (-1) and NO_MATCH (7) errors more aggressively
      const isSpeechError = errorCode === -1 || errorCode === 7 ||
                           errorMsg.toLowerCase().includes('no speech detected') ||
                           errorMsg.toLowerCase().includes('no match');

      if (isSpeechError) {
        console.warn(`[${moduleName}] Speech recognition failed (${errorCode}), restarting...`);

        // Stop current session
        try {
          const currentModule = SpeechModuleRef.current || Voice;
          if (currentModule.stop) await currentModule.stop();
          if (currentModule.cancel) await currentModule.cancel();
        } catch (cleanupErr) {
          console.warn(`[${moduleName}] Cleanup error:`, cleanupErr.message);
        }

        // Reset state and restart after a delay
        dispatch({ type: 'STOP_LISTEN' });
        stopPulse();
        stopAudioVisualization();

        setTimeout(async () => {
          console.log(`[${moduleName}] Restarting speech recognition after error...`);
          try {
            await startListening();
          } catch (restartErr) {
            console.error(`[${moduleName}] Failed to restart after error:`, restartErr);
            dispatch({ type: 'ERROR', error: restartErr });
          }
        }, 1000);
        return;
      }

      // Don't set ERROR state for minor errors that don't affect listening
      // Only set ERROR for critical errors
      const criticalErrors = ['permission', 'not available', 'null', 'not linked'];
      const isCritical = criticalErrors.some(keyword =>
        errorMsg.toLowerCase().includes(keyword)
      );

      if (isCritical) {
        console.error(`[${moduleName}] Critical error detected, setting ERROR state`);
        dispatch({ type: 'ERROR', error: err });
      } else {
        console.warn(`[${moduleName}] Non-critical error, ignoring (listening may still work)`);
        // Don't change state - let listening continue
      }
    };

    currentModule.onSpeechVolumeChanged = (e) => {
      // Optional: you can use this to show volume indicator
      const moduleName = moduleNameRef.current || 'Voice';
      console.log(`[${moduleName}] Volume:`, e?.value);
    };

    // Debug: Check if listeners were assigned
    console.log(`[${currentModuleName}] After assignment - onSpeechStart:`, typeof currentModule.listeners?.onSpeechStart);
    console.log(`[${currentModuleName}] After assignment - onSpeechResults:`, typeof currentModule.listeners?.onSpeechResults);
    console.log(`[${currentModuleName}] Module listeners object:`, currentModule.listeners);

    return () => {
      const moduleName = moduleNameRef.current || 'Voice';
      const currentModule = SpeechModuleRef.current || Voice;
      console.log(`[${moduleName}] ========== Cleanup: Destroying ${moduleName} instance ==========`);
      clearSilenceTimer();
      stopPulse();
      stopAudioVisualization();
      
      // Reset initialization flag so next mount will do full initialization
      voiceInitializedRef.current = false;
      console.log(`[${moduleName}] Reset voiceInitializedRef to false`);
      
      // Complete cleanup sequence
      const cleanup = async () => {
        try {
          console.log(`[${moduleName}] Starting cleanup sequence...`);
          if (currentModule.cancel) {
            try {
              await currentModule.cancel();
              console.log(`[${moduleName}] cancel() completed`);
            } catch (e) {
              console.log(`[${moduleName}] cancel() error (expected if not active):`, e?.message);
            }
          }
          if (currentModule.stop) {
            try {
              await currentModule.stop();
              console.log(`[${moduleName}] stop() completed`);
            } catch (e) {
              console.log(`[${moduleName}] stop() error (expected if not active):`, e?.message);
            }
          }
          if (currentModule.destroy) {
            try {
              await currentModule.destroy();
              console.log(`[${moduleName}] destroy() completed`);
            } catch (e) {
              console.warn(`[${moduleName}] destroy() error:`, e?.message);
            }
          }
          if (currentModule.removeAllListeners) {
            currentModule.removeAllListeners();
            console.log(`[${moduleName}] removeAllListeners() completed`);
          } else if (useKSSpeechRef.current) {
            // KSSpeech adapter has removeAllListeners method
            ksSpeechAdapter.removeAllListeners();
            console.log(`[${moduleName}] KSSpeech removeAllListeners() completed`);
          }
          console.log(`[${moduleName}] ========== Cleanup completed ==========`);
        } catch (err) {
          console.error(`[${moduleName}] Cleanup error:`, err);
        }
      };
      cleanup();
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
    console.log(`[DEBUG] startListening() called - BEGIN DEBUGGING`);
    const currentModuleName = moduleNameRef.current || 'Voice';
    console.log(`[${currentModuleName}] startListening() called`);
    console.log(`[DEBUG] useKSSpeechRef.current:`, useKSSpeechRef.current);
    console.log(`[DEBUG] moduleNameRef.current:`, moduleNameRef.current);
    console.log(`[DEBUG] SpeechModuleRef.current:`, SpeechModuleRef.current);
    
    try {
      if (gateBlockedRef.current) {
        console.log(`[${currentModuleName}] startListening blocked by premium gate`);
        return;
      }
      
      console.log(`[${currentModuleName}] Checking permission...`);
      // Request permission first (Android)
      const hasPermission = await requestRecordAudioPermission();
      if (!hasPermission) {
        console.log(`[${currentModuleName}] Cannot start listening - permission denied`);
        dispatch({ type: 'ERROR', error: new Error('Microphone permission denied') });
        return;
      }
      console.log(`[${currentModuleName}] Permission granted, proceeding...`);

      const currentModule = SpeechModuleRef.current || Voice;
      
      console.log(`[${currentModuleName}] Starting listening...`);
      
      // Verify module is available before starting
      if (!currentModule || typeof currentModule.start !== 'function') {
        throw new Error(`${currentModuleName} module is not available. Please rebuild the app.`);
      }
      
      // CRITICAL: On React Native 0.82 with New Architecture disabled, 
      // native modules may need extra time to initialize
      console.log(`[${currentModuleName}] Attempting to initialize native module...`);
      
      // Wait for React Native bridge to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CRITICAL: On Android, only cleanup if module was already initialized
      if (voiceInitializedRef.current) {
        try {
          try {
            if (currentModule.cancel) await currentModule.cancel();
          } catch (cancelErr) {
            console.log(`[${currentModuleName}] Cancel (not active, expected):`, cancelErr?.message);
          }
          
          try {
            if (currentModule.stop) await currentModule.stop();
          } catch (stopErr) {
            console.log(`[${currentModuleName}] Stop (not active, expected):`, stopErr?.message);
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (cleanupErr) {
          console.log(`[${currentModuleName}] Pre-start cleanup error (non-critical):`, cleanupErr?.message);
        }
      } else {
        console.log(`[${currentModuleName}] First initialization, waiting for module to be ready...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Start voice recognition with retry logic
      console.log(`[${currentModuleName}] Calling ${currentModuleName}.start("en-US")...`);

      // Debug: Check current module state before starting
      console.log(`[${currentModuleName}] Module object:`, currentModule);
      console.log(`[${currentModuleName}] Module start function:`, typeof currentModule.start);

      let retries = 5;
      let lastError = null;
      let startSuccess = false;

      while (retries > 0) {
        try {
          console.log(`[${currentModuleName}] Attempt ${6 - retries}/5: calling start...`);
          const startResult = await currentModule.start('en-US');
          console.log(`[${currentModuleName}] start() returned:`, startResult);
          voiceInitializedRef.current = true;
          startSuccess = true;
          console.log(`[${currentModuleName}] ${currentModuleName}.start() succeeded, waiting for onSpeechStart event...`);
          break;
        } catch (startErr) {
          lastError = startErr;
          const errorMsg = startErr?.message || String(startErr);
          
          // Since we default to Voice, log the error but don't fallback
          console.warn(`[${currentModuleName}] Start failed:`, errorMsg);
          
          // If error indicates native module is null, don't retry - it needs rebuild
          if (errorMsg.includes('null') || errorMsg.includes('startSpeech') || errorMsg.includes('Cannot read property')) {
            console.error(`[${currentModuleName}] Native module is null - app needs rebuild`);
            throw new Error(`${currentModuleName} native module is not properly linked. Please rebuild the app:\n\ncd android && ./gradlew clean && cd .. && npm run android`);
          }
          
          retries--;
          console.warn(`[${currentModuleName}] Start failed, retries left: ${retries}`, errorMsg);
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      // Only update state if start was successful
      if (startSuccess) {
        dispatch({ type: 'START_LISTEN' });
        startPulse();
        startAudioVisualization();
        console.log(`[${currentModuleName}] Listening started successfully, state set to LISTENING`);
        console.log(`[${currentModuleName}] Waiting for onSpeechStart event to confirm...`);
      } else {
        throw lastError || new Error(`Failed to start speech recognition after multiple attempts`);
      }
    } catch (e) {
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.error(`[${currentModuleName}] Failed to start listening:`, e);
      voiceInitializedRef.current = false;
      
      dispatch({ type: 'STOP_LISTEN' });
      dispatch({ type: 'ERROR', error: e });
      stopPulse();
      stopAudioVisualization();
      
      // Show user-friendly error message
      if (Platform.OS === 'android') {
        const errorMsg = e?.message || String(e);
        const needsRebuild = errorMsg.includes('null') || errorMsg.includes('startSpeech') || errorMsg.includes('not properly linked') || errorMsg.includes('not linked');
        
        Alert.alert(
          'Speech Recognition Error',
          needsRebuild 
            ? `Speech recognition module is not properly linked. Please rebuild the app:\n\n1. Stop the app\n2. Run: cd android && ./gradlew clean\n3. Run: cd .. && npm run android`
            : 'Unable to start speech recognition. Please try again or restart the app.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const stopListening = async () => {
    try {
      const currentModule = SpeechModuleRef.current || Voice;
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.log(`[${currentModuleName}] Stopping listening...`);
      clearSilenceTimer();
      if (currentModule.stop) await currentModule.stop();
      dispatch({ type: 'STOP_LISTEN' });
      console.log(`[${currentModuleName}] Listening stopped`);
    } catch (e) {
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.error(`[${currentModuleName}] Failed to stop listening:`, e);
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
          const currentModule = SpeechModuleRef.current || Voice;
          if (currentModule.stop) await currentModule.stop();
          if (currentModule.cancel) await currentModule.cancel();
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

      // Add AI message to conversation (include audio so ChatPage can replay without extra TTS)
      const aiMessage = {
        sender: 'ai',
        text,
        audioData: audio || null,
      };
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

  // Simple resume function - try simple restart first, then full cycle if needed
  const resumeListening = async () => {
    const currentModuleName = moduleNameRef.current || 'Voice';
    console.log(`[${currentModuleName}] ========== resumeListening() called ==========`);

    try {
      const currentModule = SpeechModuleRef.current || Voice;

      if (!currentModule || typeof currentModule.start !== 'function') {
        console.warn(`[${currentModuleName}] Cannot resume - module not available`);
        return;
      }

      // Try simple restart first (without destroy)
      console.log(`[${currentModuleName}] Attempting simple restart...`);
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        await currentModule.start('en-US');
        console.log(`[${currentModuleName}] Simple restart successful`);
        dispatch({ type: 'START_LISTEN' });
        startPulse();
        startAudioVisualization();
        console.log(`[${currentModuleName}] ========== resumeListening() completed ==========`);
        return;
      } catch (simpleErr) {
        console.warn(`[${currentModuleName}] Simple restart failed:`, simpleErr.message);
      }

      // If simple restart fails, try full destroy/restart cycle
      console.log(`[${currentModuleName}] Trying full destroy/restart cycle...`);

      // Clean up first
      try {
        if (currentModule.stop) await currentModule.stop();
        if (currentModule.cancel) await currentModule.cancel();
      } catch (cleanupErr) {
        console.warn(`[${currentModuleName}] Cleanup warning:`, cleanupErr.message);
      }

      // Wait longer for cleanup
      await new Promise(resolve => setTimeout(resolve, 800));

      // Try to start again
      await currentModule.start('en-US');

      console.log(`[${currentModuleName}] Full restart successful`);
      dispatch({ type: 'START_LISTEN' });
      startPulse();
      startAudioVisualization();
      console.log(`[${currentModuleName}] ========== resumeListening() completed ==========`);

    } catch (e) {
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.error(`[${currentModuleName}] All resume attempts failed:`, e);

      // Last resort: trigger a full component restart by calling startListening
      console.log(`[${currentModuleName}] Last resort: calling startListening...`);
      try {
        await startListening();
      } catch (finalErr) {
        console.error(`[${currentModuleName}] Final restart also failed:`, finalErr);
      }
    }
  };

  const playApiAudio = async (audioData) => {
    try {
      console.log('[Audio] Preparing to play audio...');
      
      // CRITICAL: Stop speech recognition BEFORE playing audio to prevent self-recognition
      const currentModule = SpeechModuleRef.current || Voice;
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.log(`[${currentModuleName}] Stopping speech recognition BEFORE playback...`);
      if (currentModule.stop) await currentModule.stop();
      if (currentModule.cancel) await currentModule.cancel();
      console.log(`[${currentModuleName}] Speech recognition stopped, now safe to play audio`);
      
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
      // Don't throw - continue to resume voice even if audio fails
    } finally {
      // Resume voice recognition after audio completes (simple resume, not full restart)
      try {
        console.log('[Audio] Audio finished, resuming voice recognition...');

        // CRITICAL: Reset processing state BEFORE starting listening
        isProcessingRef.current = false;
        console.log('[Audio] Manually reset isProcessingRef to false');

        // Wait a bit to ensure clean state
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use startListening instead of resume to ensure proper initialization
        await startListening();
        console.log('[Audio] Voice restarted, ready for new speech');
      } catch (e) {
        console.error('[Audio] Failed to resume voice:', e);
        // Reset processing state even on error
        isProcessingRef.current = false;
        // Don't set ERROR state - voice might still work, just log the error
      }
    }
  };

  const speakTTS = async (text) => {
    try {
      console.log('[TTS] Preparing to speak...');
      
      // CRITICAL: Stop speech recognition BEFORE playing TTS to prevent self-recognition
      const currentModule = SpeechModuleRef.current || Voice;
      const currentModuleName = moduleNameRef.current || 'Voice';
      console.log(`[${currentModuleName}] Stopping speech recognition BEFORE playback...`);
      if (currentModule.stop) await currentModule.stop();
      if (currentModule.cancel) await currentModule.cancel();
      console.log(`[${currentModuleName}] Speech recognition stopped, now safe to play TTS`);
      
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
    } finally {
      // Resume voice recognition after TTS completes (simple resume, not full restart)
      try {
        console.log('[TTS] TTS finished, resuming voice recognition...');

        // CRITICAL: Reset processing state BEFORE starting listening
        isProcessingRef.current = false;
        console.log('[TTS] Manually reset isProcessingRef to false');

        // Wait a bit to ensure clean state
        await new Promise(resolve => setTimeout(resolve, 300));

        // Use startListening instead of resume to ensure proper initialization
        await startListening();
        console.log('[TTS] Voice restarted, ready for new speech');
      } catch (e) {
        console.error('[TTS] Failed to resume voice:', e);
        // Reset processing state even on error
        isProcessingRef.current = false;
        // Don't set ERROR state - voice might still work, just log the error
      }
    }
  };

  // Autostart listening on mount with delay
  useEffect(() => {
    console.log('[Voice] ========== Component mounted, scheduling autostart ==========');
    
    const timer = setTimeout(async () => {
      console.log('[Voice] Autostart timer fired.');
      
      // CRITICAL FIX: Force cleanup existing instances before first start
      // This fixes the issue where user has to toggle stop/start to get it working
      try {
        console.log('[Voice] Force cleaning up before autostart...');
        const currentModule = SpeechModuleRef.current || Voice;
        if (currentModule.destroy) await currentModule.destroy();
        if (currentModule.removeAllListeners) currentModule.removeAllListeners();
        else if (useKSSpeechRef.current) ksSpeechAdapter.removeAllListeners();
      } catch (e) {
        console.warn('[Voice] Pre-autostart cleanup warning:', e);
      }

      console.log('[Voice] Calling startListening...');
      try {
        await startListening();
      } catch (err) {
        console.error('[Voice] Autostart failed:', err);
      }
    }, 800); // Increased delay to 800ms to ensure navigation transition is done and mic is free
    
    return () => {
      console.log('[Voice] ========== Component unmounting, clearing autostart timer ==========');
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isListening = S.state === STATES.LISTENING || S.state === STATES.DETECTING;
  const isRequesting = S.state === STATES.REQUESTING;
  const isPlaying = S.state === STATES.PLAYING; // for UI only

  const micDisabled = isRequesting || isPlaying;
  const isBusy = isRequesting || isPlaying;

  // Unified back handler: used by both header back button and Android hardware back
  const handleBackPress = useCallback(async () => {
    if (isBusy) {
      console.log('[Navigation] Back press ignored because isBusy = true');
      return;
    }

    try {
      console.log('[Navigation] Back pressed (UI/hardware), cleaning up Voice...');
      clearSilenceTimer();
      stopPulse();
      stopAudioVisualization();
      // Complete cleanup before navigation
      const currentModule = SpeechModuleRef.current || Voice;
      const currentModuleName = moduleNameRef.current || 'Voice';
      if (currentModule.cancel) await currentModule.cancel();
      if (currentModule.stop) await currentModule.stop();
      if (currentModule.destroy) await currentModule.destroy();
      if (currentModule.removeAllListeners) {
        currentModule.removeAllListeners();
      } else if (useKSSpeechRef.current) {
        ksSpeechAdapter.removeAllListeners();
      }
      console.log(`[${currentModuleName}] Cleanup complete, navigating back...`);
    } catch (err) {
      console.warn('[Navigation] Cleanup error on back press:', err);
    } finally {
      // Navigate back even if cleanup fails, and pass conversation history up
      onBack && onBack(conversationMessages);
    }
  }, [
    isBusy,
    clearSilenceTimer,
    stopPulse,
    stopAudioVisualization,
    onBack,
    conversationMessages,
  ]);
  // Notify parent (ChatPage) when busy state changes so it can block Modal close / hardware back
  useEffect(() => {
    if (typeof onBusyChange === 'function') {
      onBusyChange(isBusy);
    }
  }, [isBusy, onBusyChange]);

  // Keep ChatPage's messages in sync with SpeakingScreen conversation
  useEffect(() => {
    if (typeof onMessagesChange === 'function') {
      onMessagesChange(conversationMessages);
    }
  }, [conversationMessages, onMessagesChange]);
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

  // Determine if this is a friend-based topic and resolve avatar
  const isFriendTopic =
    selectedTopic && String(selectedTopic.id || '').startsWith('friend_');
  const friendAvatarSource = isFriendTopic
    ? getFriendAvatar(String(selectedTopic.id).replace('friend_', ''))
    : null;

  // Calculate safe padding for Android - ensure minimum padding even if insets not ready
  // Use StatusBar.currentHeight as fallback for Android, with minimum of 16
  const getAndroidPaddingTop = () => {
    if (Platform.OS !== 'android') return 0;
    const statusBarHeight = StatusBar.currentHeight || 0;
    const safeAreaTop = insets.top || 0;
    // Use the larger value between statusBarHeight and safeAreaTop, with minimum of 16
    return Math.max(statusBarHeight, safeAreaTop, 16);
  };

  // For iOS in Modal, SafeAreaView might not work consistently
  // So we'll use manual padding based on insets instead
  const getIOSPaddingTop = () => {
    if (Platform.OS !== 'ios') return 0;
    // Use insets.top directly, with minimum of 0 (insets should always be >= 0)
    return Math.max(insets.top || 0, 0);
  };

  const HeaderContent = (
    <View style={[
      styles.header, 
      Platform.OS === 'android' && { paddingTop: getAndroidPaddingTop() },
      // For iOS, we'll use manual padding instead of relying solely on SafeAreaView in Modal
      Platform.OS === 'ios' && { paddingTop: getIOSPaddingTop() }
    ]}>
      <TouchableOpacity
        style={[styles.backButton, isBusy && styles.disabledButton]}
        disabled={isBusy}
        onPress={handleBackPress}
      >
        <Text style={styles.backButtonIcon}>←</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{headerTitle}</Text>
      <View style={styles.headerRightSpacer} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" translucent={false} />
      {/* Header - For iOS in Modal, use manual padding instead of SafeAreaView for consistency */}
      {HeaderContent}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Top Section: Avatar and Status */}
        <View style={styles.topSection}>
          <View style={styles.avatarContainer}>
            {isFriendTopic && friendAvatarSource ? (
              <Image
                source={friendAvatarSource}
                style={styles.avatar}
                resizeMode="contain"
              />
            ) : selectedTopic?.icon ? (
              <View style={styles.topicAvatar}>
                <Text style={styles.topicAvatarEmoji}>{selectedTopic.icon}</Text>
              </View>
            ) : (
              <Image
                source={require('../assets/images/ic_audio.png')}
                style={styles.avatar}
                resizeMode="contain"
              />
            )}
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
              else resumeListening(); // Use resume instead of startListening to avoid permission checks
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 12,
    backgroundColor: '#F8F9FA',
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
  topicAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicAvatarEmoji: {
    fontSize: 64,
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