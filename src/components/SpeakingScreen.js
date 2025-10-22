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
  ImageBackground,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Voice from '@react-native-voice/voice';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { speakText, textToSpeech } from '../services/ttsService';
import nativeAudioService from '../services/nativeAudioService';
import { API_BASE_URL } from '../config/api';
import ConversationSettings from './ConversationSettings';
import conversationSettingsManager from '../services/conversationSettingsManager';
import { useConversationSettings } from '../hooks/useConversationSettings';

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

  // === State for conversation messages ===
  const [conversationMessages, setConversationMessages] = useState(initialMessages);

  // === State for settings (synchronized with manager) ===
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(initialSelectedVoice);
  const [speechRate, setSpeechRate] = useState(1.0);

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

  const [S, dispatch] = useReducer(reducer, initial);

  // === Refs to avoid stale closures ===
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef('');
  const isPlayingRef = useRef(false);
  const isProcessingRef = useRef(false); // Flag to block transcript updates during API/playback

  // Keep refs in sync with state
  useEffect(() => { transcriptRef.current = S.transcript; }, [S.transcript]);
  useEffect(() => { 
    isPlayingRef.current = (S.state === STATES.PLAYING); 
    isProcessingRef.current = (S.state === STATES.REQUESTING || S.state === STATES.PLAYING);
  }, [S.state]);

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
    Voice.onSpeechStart = () => {
      if (isProcessingRef.current) { 
        console.log('[Voice] Ignoring speech start - processing API/audio');
        return; 
      }
      console.log('[Voice] Speech started');
      // No need to clear transcript here - Voice engine was restarted after playback
      dispatch({ type: 'START_LISTEN' });
      startPulse();
      showUserBubble();
    };

    Voice.onSpeechResults = (e) => {
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
      // Complete cleanup sequence
      Voice.cancel()
        .then(() => Voice.stop())
        .then(() => Voice.destroy())
        .then(() => Voice.removeAllListeners())
        .catch(err => console.warn('[Voice] Cleanup error:', err));
    };
  }, []);

  // === Start/Stop listening ===
  const startListening = async () => {
    try {
      console.log('[Voice] Starting listening...');
      
      // CRITICAL: Ensure Voice is completely clean before starting (prevents iOS reuse error)
      try {
        await Voice.cancel();
        await Voice.stop();
        Voice.removeAllListeners();
      } catch (cleanupErr) {
        console.log('[Voice] Pre-start cleanup (expected if Voice not active):', cleanupErr?.message);
      }
      
      // Re-bind listeners (in case they were removed)
      Voice.onSpeechStart = () => {
        if (isProcessingRef.current) { 
          console.log('[Voice] Ignoring speech start - processing API/audio');
          return; 
        }
        console.log('[Voice] Speech started');
        dispatch({ type: 'START_LISTEN' });
        startPulse();
        showUserBubble();
      };

      Voice.onSpeechResults = (e) => {
        if (isProcessingRef.current) {
          console.log('[Voice] Ignoring speech results - processing API/audio');
          return;
        }
        const t = e?.value?.[0] || '';
        console.log('[Voice] Results received:', t);
        transcriptRef.current = t;
        dispatch({ type: 'TRANSCRIPT_UPDATE', text: t });
        showUserBubble();
        armSilence2s();
      };

      Voice.onSpeechEnd = () => {
        if (isProcessingRef.current) {
          console.log('[Voice] Ignoring speech end - processing API/audio');
          return;
        }
        console.log('[Voice] Speech ended');
        const t = (transcriptRef.current || '').trim();
        if (t.length > 0) armSilence2s();
      };

      Voice.onSpeechError = (err) => {
        console.warn('[Voice] error', err);
        dispatch({ type: 'ERROR', error: err });
      };

      Voice.onSpeechVolumeChanged = (e) => {
        // Optional: you can use this to show volume indicator
      };
      
      // First dispatch to update UI state
      dispatch({ type: 'START_LISTEN' });
      // Then start voice recognition
      await Voice.start('en-US');
      console.log('[Voice] Listening started successfully, state should be LISTENING');
      // Double-check state is set
      startPulse();
    } catch (e) {
      console.error('[Voice] Failed to start listening:', e);
      dispatch({ type: 'ERROR', error: e });
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
        target_vocab: selectedTopic?.vocabulary || [],
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

      // Add AI message to conversation
      const aiMessage = { sender: 'ai', text: text };
      setConversationMessages(prev => [...prev, aiMessage]);

      dispatch({ type: 'SET_AI_TEXT', text });
      showAiBubble();

      console.log('[API] Received response, preparing to play audio/TTS...');
      if (audio) {
        await playApiAudio(audio);
      } else {
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

  // Normalize any audio (string/base64 or array) to base64
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
      
      const b64 = normalizeToBase64(audioData);
      console.log('[Audio] Playing audio...');
      await nativeAudioService.playAudio(b64);
      console.log('[Audio] Audio playback completed');
    } catch (err) {
      console.warn('[Audio] playback error', err);
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
      
      console.log('[TTS] Speaking text...');
      await speakText(text, selectedVoice, 'gpt-4o-mini-tts');
      console.log('[TTS] TTS playback completed');
    } catch (err) {
      console.warn('[TTS] speak error', err);
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
    // Add small delay to ensure clean state after navigation
    const timer = setTimeout(() => {
      startListening();
    }, 300);
    
    return () => {
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

  return (
    <ImageBackground source={require('../assets/images/speak_bg.png')} style={styles.container} resizeMode="cover">
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, isBusy && styles.disabledButton]}
          disabled={isBusy}
          onPress={async () => {
            if (!isBusy) {
              try {
                console.log('[Navigation] Back button pressed, cleaning up Voice...');
                clearSilenceTimer();
                stopPulse();
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
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.kidText}>KID</Text>
            <Text style={styles.speakText}> SPEAK</Text>
          </Text>
          {S.offline && (
            <View style={styles.offlineIndicator}>
              <Text style={styles.offlineText}>📴 Working Offline</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRightContainer}>
          {isRequesting && (
            <View style={styles.loadingIndicator}>
              <View style={styles.loadingCircle}>
                <Text style={styles.loadingText}>⏳</Text>
              </View>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.settingsIcon, isBusy && styles.disabledButton]}
            disabled={isBusy}
            onPress={() => {
              if (isBusy) return;
              setShowSettings(true);
            }}
          >
            <Text style={styles.settingsEmoji}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* User bubble */}
        <Animated.View
          style={[
            styles.userSpeechBubble,
            {
              opacity: userBubbleAnim,
              transform: [
                { scale: userBubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
            },
          ]}
        >
          <Text style={styles.speechBubbleLabel}>You said:</Text>
          <Text style={styles.speechBubbleText}>
            {S.transcript || S.lastUserInput || (isListening ? 'Listening…' : 'Tap to speak')}
          </Text>
        </Animated.View>

        {/* Center mic */}
        <View style={styles.centerArea}>
          <View style={styles.microphoneButtonContainer}>
            <View
              style={[styles.microphoneButton, isListening && styles.listeningButton, micDisabled && styles.disabledButton]}
            >
              <Animated.Text style={[styles.microphoneButtonText, { transform: [{ scale: pulseAnim }] }]}>
                {isPlaying ? '🔇' : isRequesting ? '⏳' : isListening ? '🔴' : '🎤'}
              </Animated.Text>
            </View>
            <Text style={styles.microphoneStatusText}>
              {isPlaying ? 'Playing audio…' : isRequesting ? 'Processing…' : isListening ? 'Listening…' : 'Tap to speak'}
            </Text>
          </View>
        </View>

        {/* AI bubble */}
        <Animated.View
          style={[
            styles.aiSpeechBubble,
            {
              opacity: aiBubbleAnim,
              transform: [
                { scale: aiBubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
              ],
            },
          ]}
        >
          <View style={styles.aiResponseHeader}>
            <View style={styles.miniRobotAvatar}>
              <Text style={styles.miniAvatarEmoji}>🤖</Text>
            </View>
            <Text style={styles.speechBubbleLabel}>App responds:</Text>
          </View>
          <Text style={styles.speechBubbleText}>{S.aiText || 'Ready to chat!'}</Text>
        </Animated.View>
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 10 },
  backButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoText: { fontSize: 24, fontWeight: 'bold', textShadowColor: '#ffffff', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 4 },
  kidText: { color: '#ff6b9d' },
  speakText: { color: '#ff9f43' },
  settingsIcon: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  settingsEmoji: { fontSize: 16 },
  userSpeechBubble: { backgroundColor: '#87CEEB', borderRadius: 20, padding: 16, marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, alignSelf: 'stretch' },
  speechBubbleLabel: { fontSize: 14, fontWeight: '600', color: '#2c3e50', marginBottom: 4 },
  speechBubbleText: { fontSize: 16, color: '#2c3e50', lineHeight: 22 },
  aiSpeechBubble: { backgroundColor: '#98FB98', borderRadius: 20, padding: 16, marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, alignSelf: 'stretch' },
  aiResponseHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  miniRobotAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4ecdc4', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  miniAvatarEmoji: { fontSize: 12 },
  microphoneButtonContainer: { position: 'absolute', top: '50%', left: '50%', marginTop: -40, marginLeft: -40, zIndex: 10 },
  microphoneButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12, borderWidth: 4, borderColor: '#ffffff' },
  listeningButton: { backgroundColor: '#ff4444' },
  disabledButton: { backgroundColor: 'rgba(255,255,255,0.1)' },
  microphoneButtonText: { fontSize: 28, color: '#ffffff' },
  microphoneStatusText: { fontSize: 12, color: '#ffffff', textAlign: 'center', marginTop: 8, fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  offlineIndicator: { backgroundColor: 'rgba(255, 193, 7, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  offlineText: { fontSize: 12, color: '#f57c00', fontWeight: '600', textAlign: 'center' },
  headerRightContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingIndicator: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 },
  loadingCircle: { width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#ffffff' },
});