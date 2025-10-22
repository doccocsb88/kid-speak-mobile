# So Sánh API Call - Trước và Sau

## 🔍 Vấn Đề Phát Hiện

**ChatPage.js** và **SpeakingScreen.js** đang gọi API khác nhau:

### ❌ TRƯỚC KHI SỬA

#### ChatPage.js (SAI)
```javascript
// Request payload KHÔNG ĐỦ parameters
const requestData = {
  message: messageToSend,
  topic: selectedTopic ? {...} : null,
  userInfo: userInfo,
  sessionId: currentSessionId,
  options: options
  // ❌ THIẾU: provider, includeAudio, voice, model, difficultyLevel
};

// Backend sẽ gọi: getOpenAIResponse() - chỉ có text
// Frontend phải tự tạo TTS trên client
```

#### SpeakingScreen.js (ĐÚNG)
```javascript
// Request payload ĐẦY ĐỦ
const payload = {
  message,
  provider: 'openai',           // ✅
  includeAudio: true,           // ✅
  voice: selectedVoice || 'alloy', // ✅
  model: 'tts-1',               // ✅
  topic: selectedTopic ? {...} : null,
  userInfo,
  sessionId: currentSessionId,
  difficultyLevel: 'beginner',  // ✅
  options: options,
};

// Backend sẽ gọi: getOpenAIResponseV2() - có text + audio
// Frontend chơi audio trực tiếp
```

---

## ✅ SAU KHI SỬA

### Cả 2 screens đều gọi GIỐNG NHAU:

```javascript
const requestData = {
  message: messageToSend,
  provider: 'openai',              // ✅ MỚI THÊM
  includeAudio: true,              // ✅ MỚI THÊM - Quan trọng!
  voice: selectedVoice || 'alloy', // ✅ MỚI THÊM
  model: 'tts-1',                  // ✅ MỚI THÊM
  topic: selectedTopic ? {...} : null,
  userInfo: userInfo,
  sessionId: currentSessionId,
  difficultyLevel: 'beginner',     // ✅ MỚI THÊM
  options: options
};
```

---

## 🔄 Flow Backend

### Backend Logic (`chatRoutes.js` line 81-110)

```javascript
if (provider === 'openai') {
  if (includeAudio) {
    // ✅ Khi includeAudio = true
    const responseWithAudio = await getOpenAIResponseV2(
      message, 
      chatHistory, 
      topic, 
      userInfo, 
      false, 
      voice,    // từ request
      model,    // từ request
      options   // từ request
    );
    // Trả về: {text, audio, voice, model, engagementLevel, style, options}
  } else {
    // ❌ Khi includeAudio = false hoặc undefined
    const responseWithoutAudio = await getOpenAIResponse(
      message, 
      chatHistory, 
      topic, 
      userInfo, 
      false, 
      options
    );
    // Trả về: {text, audio: null, voice, engagementLevel, style, options}
  }
}
```

---

## 🎵 Cách Xử Lý Audio

### TRƯỚC (ChatPage):
```
1. Backend → text only
2. Frontend nhận text
3. Frontend gọi speakText() → tạo TTS mới trên client
4. Chơi audio từ client TTS
```

### SAU (Cả 2 screens):
```
1. Backend → text + audio (từ getOpenAIResponseV2)
2. Frontend nhận {text, audio}
3. Frontend check:
   - Nếu có audio → chơi trực tiếp (nativeAudioService)
   - Nếu không → fallback client TTS
```

---

## 📊 Code Changes Chi Tiết

### 1. Import thêm nativeAudioService
```javascript
import nativeAudioService from '../services/nativeAudioService';
```

### 2. Thêm helper functions để normalize audio
```javascript
const arrayToBase64 = (bytes) => {
  // Convert byte array to base64 string
  ...
};

const normalizeToBase64 = (audioData) => {
  if (typeof audioData === 'string') return audioData;
  if (Array.isArray(audioData)) return arrayToBase64(audioData);
  ...
};
```

### 3. Update speakTextWithTTS() để nhận audio parameter
```javascript
// TRƯỚC
const speakTextWithTTS = async (text) => {
  await speakText(text, selectedVoice, 'tts-1');
};

// SAU
const speakTextWithTTS = async (text, audioData = null) => {
  if (audioData) {
    // Chơi audio từ backend
    const b64 = normalizeToBase64(audioData);
    await nativeAudioService.playAudio(b64);
  } else {
    // Fallback: tạo TTS trên client
    await speakText(text, selectedVoice, 'tts-1');
  }
};
```

### 4. Extract audio từ response
```javascript
// TRƯỚC
const aiResponseText = response.data.data?.response || response.data.response;
speakTextWithTTS(aiResponseText);

// SAU
const aiResponseText = response.data.data?.response || response.data.response;
const audioData = response.data.data?.audio || response.data.audio; // ✅ Extract audio
speakTextWithTTS(aiResponseText, audioData); // ✅ Pass audio
```

---

## 🎯 Lợi Ích

| Khía cạnh | Trước | Sau |
|-----------|-------|-----|
| **Consistency** | 2 screens khác nhau | 2 screens giống nhau |
| **Performance** | TTS tạo 2 lần (backend + client) | TTS tạo 1 lần (backend only) |
| **Quality** | Client TTS đơn giản | Backend TTS với full options |
| **Reliability** | Chỉ có client TTS | Backend audio + fallback client |
| **Options** | ChatPage không dùng full options | Cả 2 đều dùng full options |

---

## 🧪 Test Plan

### Test 1: Normal Conversation (ChatPage)
```
1. Chọn topic
2. Gửi tin nhắn text hoặc voice
3. ✅ Xác nhận: Backend log shows "getOpenAIResponseV2"
4. ✅ Xác nhận: Audio chơi từ backend
5. ✅ Xác nhận: Console log "[ChatPage] Playing audio from backend..."
```

### Test 2: Auto-Prompt (ChatPage)
```
1. Đợi 30 giây không tương tác
2. ✅ Xác nhận: Auto-prompt trigger
3. ✅ Xác nhận: Backend nhận includeAudio=true
4. ✅ Xác nhận: Audio chơi từ backend
```

### Test 3: Speaking Mode (SpeakingScreen)
```
1. Click vào mic button
2. Nói một câu
3. ✅ Xác nhận: AI trả lời với audio
4. ✅ Xác nhận: Audio chơi từ backend
```

### Test 4: Offline Fallback
```
1. Tắt backend server
2. Gửi tin nhắn
3. ✅ Xác nhận: Offline mode kích hoạt
4. ✅ Xác nhận: Client TTS được dùng (fallback)
5. ✅ Xác nhận: Console log "[ChatPage] Using client-side TTS..."
```

---

## 🔗 Files Changed

| File | Status | Changes |
|------|--------|---------|
| `mobile/src/pages/ChatPage.js` | ✅ Updated | Added includeAudio, voice, model, audio handling |
| `mobile/src/components/SpeakingScreen.js` | ✅ No changes | Already correct |
| `backend/src/routes/chatRoutes.js` | ✅ No changes | Already correct |
| `backend/src/services/openaiService.js` | ✅ No changes | Already correct |

---

## ✅ Checklist

- [x] ChatPage.js request payload updated
- [x] Auto-prompt request payload updated
- [x] Audio normalization helpers added
- [x] speakTextWithTTS() updated to handle backend audio
- [x] Response handling updated to extract audio
- [x] Import nativeAudioService added
- [x] No linter errors
- [x] Documentation created

---

## 🚀 Next Steps

1. Test trên emulator/device
2. Verify network logs (includeAudio=true)
3. Check backend logs (getOpenAIResponseV2)
4. Test offline fallback
5. Test voice selection với các giọng khác nhau

