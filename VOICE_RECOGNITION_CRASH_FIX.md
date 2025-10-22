# Voice Recognition iOS Crash Fix

## Problem
App crashed when switching between ChatPage and SpeakingScreen multiple times with error:
```
*** Assertion failure in -[SFSpeechAudioBufferRecognitionRequest _startedLocalConnectionWithLanguageCode:delegate:taskHint:requestIdentifier:taskIdentifier:], SFSpeechRecognitionRequest.m:506
*** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'SFSpeechAudioBufferRecognitionRequest cannot be re-used'
```

## Root Cause
iOS Speech Framework **does not allow reusing** the same `SFSpeechAudioBufferRecognitionRequest` instance. The Voice recognition instance was not being properly cleaned up when:
1. Navigating from ChatPage → SpeakingScreen
2. Navigating back from SpeakingScreen → ChatPage
3. Re-opening SpeakingScreen

The old Voice instance remained in memory, causing iOS to throw an exception when trying to start recognition again.

## Solution Applied

### 1. **Enhanced Cleanup in SpeakingScreen.js**

#### A. Improved useEffect Cleanup (Lines 262-272)
```javascript
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
```
**Changes:**
- Added sequential cleanup: `cancel()` → `stop()` → `destroy()` → `removeAllListeners()`
- Added error handling to prevent cleanup failures from blocking unmount
- Clear silence timer and stop animations

#### B. Enhanced startListening Function (Lines 276-344)
```javascript
const startListening = async () => {
  try {
    console.log('[Voice] Starting listening...');
    
    // CRITICAL: Ensure Voice is completely clean before starting
    try {
      await Voice.cancel();
      await Voice.stop();
      Voice.removeAllListeners();
    } catch (cleanupErr) {
      console.log('[Voice] Pre-start cleanup (expected if Voice not active):', cleanupErr?.message);
    }
    
    // Re-bind listeners (in case they were removed)
    Voice.onSpeechStart = () => { ... };
    Voice.onSpeechResults = (e) => { ... };
    Voice.onSpeechEnd = () => { ... };
    Voice.onSpeechError = (err) => { ... };
    Voice.onSpeechVolumeChanged = (e) => { ... };
    
    dispatch({ type: 'START_LISTEN' });
    await Voice.start('en-US');
    startPulse();
  } catch (e) {
    console.error('[Voice] Failed to start listening:', e);
    dispatch({ type: 'ERROR', error: e });
  }
};
```
**Changes:**
- Added pre-start cleanup to ensure fresh Voice instance
- Re-bind all listeners before starting (prevents stale listener issues)
- Graceful error handling for cleanup errors

#### C. Improved Back Button Handler (Lines 557-579)
```javascript
onPress={async () => {
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
}}
```
**Changes:**
- Made back button handler async to properly await cleanup
- Sequential cleanup before navigation
- Added finally block to ensure navigation even if cleanup fails

#### D. Enhanced Audio/TTS Restart Logic (Lines 519-533, 557-571)
```javascript
// After audio/TTS playback
try {
  console.log('[Audio] Audio finished, waiting before restart...');
  
  // Wait to ensure clean state
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Use startListening which has proper cleanup logic
  console.log('[Audio] Restarting voice recognition using startListening...');
  await startListening();
  console.log('[Audio] Voice restarted successfully, ready for new speech');
} catch (e) {
  console.error('[Audio] Failed to restart voice:', e);
  dispatch({ type: 'ERROR', error: e });
}
```
**Changes:**
- Increased delay from 300ms to 500ms for cleaner state transition
- Use `startListening()` instead of direct `Voice.start()` (ensures cleanup)
- Same pattern applied to both `playApiAudio` and `speakTTS` functions

#### E. Delayed Autostart on Mount (Lines 574-581)
```javascript
useEffect(() => {
  // Add small delay to ensure clean state after navigation
  const timer = setTimeout(() => {
    startListening();
  }, 300);
  
  return () => {
    clearTimeout(timer);
  };
}, []);
```
**Changes:**
- Added 300ms delay before autostart to ensure clean state after navigation
- Prevents immediate Voice.start() which might conflict with cleanup from previous screen

### 2. **Enhanced Navigation in ChatPage.js**

#### A. Improved handleSpeakClick (Lines 718-743)
```javascript
const handleSpeakClick = async () => {
  if (isSpeaking) {
    console.log('Speaking mode blocked: Teacher is currently speaking');
    return;
  }
  
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
```
**Changes:**
- Made function async
- Stop audio and clear timeouts before navigation
- Added 200ms delay before showing SpeakingScreen

#### B. Enhanced handleSpeakingScreenClose (Lines 531-550)
```javascript
const handleSpeakingScreenClose = async (updatedMessages) => {
  console.log('[ChatPage] Returning from SpeakingScreen...');
  setShowSpeakingScreen(false);
  
  if (updatedMessages && updatedMessages.length > 0) {
    setMessages(updatedMessages);
    
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
```
**Changes:**
- Increased delay from 1000ms to 1500ms before restarting auto-prompt
- Added logging for debugging
- Ensures Voice cleanup is complete before ChatPage resumes activity

## Key Principles Applied

1. **Complete Cleanup Before Start**: Always run `cancel()` → `stop()` → `destroy()` → `removeAllListeners()` before starting new Voice instance

2. **Sequential Operations**: Never overlap Voice cleanup and start operations

3. **Proper Delays**: Add sufficient delays between cleanup and start operations (300-500ms)

4. **Graceful Error Handling**: Wrap cleanup in try-catch to prevent errors from blocking critical operations

5. **Listener Re-binding**: Always re-bind listeners after cleanup to prevent stale closures

6. **Navigation Guards**: Clean up before navigation, add delays to ensure clean state transitions

## Testing Recommendations

Test the following flow multiple times:
1. ChatPage → tap speak button → SpeakingScreen
2. Speak a few phrases (test Voice recognition)
3. Back to ChatPage
4. Wait a moment
5. Tap speak button again → SpeakingScreen
6. Repeat steps 2-5 at least 5 times

**Expected Result**: No crashes, Voice recognition works correctly each time

## Technical Notes

- **iOS Speech Framework Limitation**: `SFSpeechAudioBufferRecognitionRequest` cannot be reused. Each recognition session requires a fresh instance.
- **React Native Voice Library**: The `@react-native-voice/voice` library must be completely destroyed and recreated for each session.
- **State Management**: Using refs (`isProcessingRef`, `transcriptRef`) to avoid stale closures in Voice listeners.
- **Timing is Critical**: The 300-500ms delays are necessary for iOS to fully release the Speech Framework resources.

## Related Files
- `/mobile/src/components/SpeakingScreen.js`
- `/mobile/src/pages/ChatPage.js`

## Date
Fixed: January 2024

