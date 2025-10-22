# API Synchronization Summary

## 📅 Date: October 15, 2025

## 🎯 Objective
Ensure both **ChatPage.js** and **SpeakingScreen.js** call the same API endpoint and use **`getOpenAIResponseV2`** from the backend consistently.

---

## ✅ Changes Made

### 1. **Backend Analysis** (`chatRoutes.js`)
- ✅ Endpoint: `/chat/send-message` is correctly configured
- ✅ When `includeAudio: true` → calls `getOpenAIResponseV2(...)` (line 84)
- ✅ Accepts parameters: `provider`, `includeAudio`, `voice`, `model`, `options`

### 2. **SpeakingScreen.js** - Already Correct ✅
```javascript
// Line 354
const payload = {
  message,
  provider: 'openai',
  includeAudio: true,        // ✅ Ensures getOpenAIResponseV2
  voice: selectedVoice || 'alloy',
  model: 'tts-1',
  topic: selectedTopic ? {...} : null,
  userInfo,
  sessionId: currentSessionId,
  difficultyLevel: 'beginner',
  options: options,
};
```

### 3. **ChatPage.js** - Updated ✅

#### **Added Import:**
```javascript
import nativeAudioService from '../services/nativeAudioService';
```

#### **Updated `sendMessage()` Request Payload (Line 484-500):**
```javascript
const requestData = {
  message: messageToSend,
  provider: 'openai',          // ✅ NEW
  includeAudio: true,          // ✅ NEW - Ensures getOpenAIResponseV2
  voice: selectedVoice || 'alloy',  // ✅ NEW
  model: 'tts-1',              // ✅ NEW
  topic: selectedTopic ? {...} : null,
  userInfo: userInfo,
  sessionId: currentSessionId,
  difficultyLevel: 'beginner', // ✅ NEW
  options: options
};
```

#### **Updated `handleAutoPrompt()` Request (Line 320-336):**
```javascript
const response = await axios.post(`${API_BASE_URL}/chat/send-message`, {
  message: "[AUTO_PROMPT] ...",
  provider: 'openai',          // ✅ NEW
  includeAudio: true,          // ✅ NEW
  voice: selectedVoice || 'alloy',  // ✅ NEW
  model: 'tts-1',              // ✅ NEW
  topic: selectedTopic ? {...} : null,
  userInfo: userInfo,
  sessionId: currentSessionId,
  difficultyLevel: 'beginner', // ✅ NEW
  options: options
});
```

#### **Added Audio Normalization Helpers (Line 226-252):**
```javascript
// Helper to normalize audio data (array/string → base64)
const arrayToBase64 = (bytes) => { ... };
const normalizeToBase64 = (audioData) => { ... };
```

#### **Enhanced `speakTextWithTTS()` Function (Line 255-281):**
```javascript
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
      await speakText(text, selectedVoice, 'tts-1');
    }
  } catch (error) {
    console.error('TTS Error:', error);
  } finally {
    setIsSpeaking(false);
    setTimeout(() => { resetTimeout(); }, 1000);
  }
};
```

#### **Updated Response Handling (Line 563-580):**
```javascript
const response = await axios.post(`${API_BASE_URL}/chat/send-message`, requestData, { headers });
const aiResponseText = response.data.data?.response || response.data.response;
const audioData = response.data.data?.audio || response.data.audio; // ✅ NEW

// Play audio from backend (or fallback to client TTS)
speakTextWithTTS(aiResponseText, audioData); // ✅ Pass audio
```

---

## 🔄 Architecture Flow

### **Before:**
```
ChatPage.js → /chat/send-message (WITHOUT includeAudio)
  → Backend: getOpenAIResponse() [text only]
  → Frontend: Generate TTS on client-side
```

### **After (Unified):**
```
ChatPage.js → /chat/send-message (WITH includeAudio=true)
  → Backend: getOpenAIResponseV2() [text + audio]
  → Frontend: Play audio directly from backend

SpeakingScreen.js → /chat/send-message (WITH includeAudio=true)
  → Backend: getOpenAIResponseV2() [text + audio]
  → Frontend: Play audio directly from backend
```

---

## 📊 Benefits

1. **Consistency**: Both screens now use the same API call pattern
2. **Performance**: Audio is generated once on backend (not twice on client)
3. **Quality**: Backend uses `getOpenAIResponseV2` with full options support
4. **Reliability**: Fallback to client-side TTS if backend audio fails
5. **Options Support**: Both screens now pass `options` parameter to backend

---

## 🧪 Testing Checklist

- [ ] Test ChatPage normal conversation with audio
- [ ] Test ChatPage auto-prompt with audio
- [ ] Test SpeakingScreen conversation with audio
- [ ] Test offline fallback (should use client TTS)
- [ ] Verify voice selection works correctly
- [ ] Verify options are passed to backend
- [ ] Check network logs to confirm `includeAudio: true`

---

## 📝 Notes

- The backend already supports `getOpenAIResponseV2` with full options (confirmed in `openaiService.js` line 549-596)
- Both screens now send identical API request structures
- Audio is normalized from various formats (array/string/base64) before playback
- If backend audio fails, the system automatically falls back to client-side TTS

---

## 🔗 Related Files

- `/mobile/src/pages/ChatPage.js` - Updated
- `/mobile/src/components/SpeakingScreen.js` - No changes needed
- `/backend/src/routes/chatRoutes.js` - Already correct
- `/backend/src/services/openaiService.js` - Already correct

