# Tổng Quan Cập Nhật Conversation Settings UI

## 📋 Tóm Tắt

Đã cập nhật component `ConversationSettings.js` để hỗ trợ đầy đủ tất cả các options từ `openaiService.js` backend. UI mới cho phép người dùng điều chỉnh mọi khía cạnh của cuộc trò chuyện AI.

## ✅ Những Gì Đã Hoàn Thành

### 1. Component ConversationSettings.js
**File:** `/mobile/src/components/ConversationSettings.js`

**Thay đổi chính:**
- ✅ Thêm 7 sections có thể thu gọn (collapsible)
- ✅ Tổng cộng 30+ options điều chỉnh được
- ✅ 4 loại control: Toggle, Enum Selector, Multi-Select, Number Slider
- ✅ UI responsive với scroll mượt mà
- ✅ Color-coded sections để dễ phân biệt

**Props mới:**
```javascript
<ConversationSettings
  isVisible={boolean}
  onClose={() => {}}
  currentTopic={object}
  options={object}              // ⭐ MỚI
  onOptionsChange={(opts) => {}}  // ⭐ MỚI
  onChangeTopic={() => {}}
/>
```

### 2. Hook Mới: useConversationSettings_v2
**File:** `/mobile/src/hooks/useConversationSettings_v2.js`

**Tính năng:**
- ✅ Quản lý tất cả options
- ✅ Tự động lưu vào AsyncStorage
- ✅ Load options khi khởi động
- ✅ Backward compatible với hook cũ
- ✅ Hỗ trợ reset về defaults

**Sử dụng:**
```javascript
const {
  options,              // Object chứa tất cả options
  currentTopic,         // Topic hiện tại
  updateOptions,        // Update nhiều options cùng lúc
  updateOption,         // Update 1 option
  resetToDefaults,      // Reset về mặc định
  setCurrentTopic,      // Set topic
  isInitialized,        // Loading state
} = useConversationSettingsV2();
```

### 3. Tài Liệu Hướng Dẫn

**CONVERSATION_SETTINGS_UI_UPGRADE.md** - Hướng dẫn chi tiết:
- Cách integrate vào ChatPage
- Cách gửi options đến backend
- Ví dụ code đầy đủ
- Persistence với AsyncStorage

**INTEGRATION_EXAMPLE_ChatPage.js** - Ví dụ thực tế:
- Code hoàn chỉnh cho ChatPage
- Backend route update example
- Migration checklist

**SETTINGS_UI_REFERENCE.md** - Reference UI:
- Visual layout của từng section
- Chi tiết từng option
- Color scheme
- UX features

## 🎨 7 Sections Trong UI

### 1. 🎓 Pedagogy (7 options)
```
✅ Grammar Check (toggle)
✅ Force Repeat (off/soft/strict)
✅ Correction Mode (implicit/explicit/sandwich)
✅ Difficulty (auto/starters/movers/flyers)
✅ Focus Areas (multi-select: pronunciation, vocabulary, grammar, fluency)
✅ Min Examples/Point (1-5)
✅ Scaffold Level (0-3)
```

### 2. 💬 Language Shaping (6 options)
```
✅ Max Words/Sentence (5-20)
✅ Max Sentences/Turn (1-4)
✅ Emoji Usage (off/light/medium)
✅ Bilingual Support (off/keyword_gloss/brief_hint)
✅ IPA Pronunciation (toggle)
✅ Phonics Hints (toggle)
```

### 3. 🎮 Engagement & Games (6 options)
```
✅ Anti-Loop Protection (toggle)
✅ Re-engage After (15-60s)
✅ Re-engage Style (playful/calm/quiz)
✅ Activity Preference (multi-select: 6 activities)
✅ Praise Frequency (low/normal/high)
✅ Challenge Ratio (0-1)
```

### 4. 🔄 Flow & Topic (3 options)
```
✅ Topic Strictness (loose/normal/strict)
✅ Open Question Ratio (0-1)
✅ Wrap-up After Turns (10-30)
```

### 5. 🛡️ Safety & Content (2 options)
```
✅ Profanity Filter (toggle)
✅ Age Gate (3-12 years)
```

### 6. 🎤 Voice & Speech (5 options)
```
✅ Voice Policy (auto_by_level/fixed)
✅ Voice (6 voices: alloy, echo, fable, onyx, nova, shimmer)
✅ Speaking Rate (slow/normal)
✅ SSML Support (toggle)
✅ Pause Between Sentences (100-500ms)
```

### 7. ⚙️ Advanced (Model) (3 options)
```
✅ Temperature (0.3-1.2)
✅ Frequency Penalty (0-1)
✅ Presence Penalty (0-1)
```

## 🔗 Integration Flow

### Frontend (Mobile)
```
ChatPage.js
    ↓ uses
useConversationSettings_v2 hook
    ↓ manages
options state (30+ settings)
    ↓ passes to
ConversationSettings component
    ↓ user changes
onOptionsChange callback
    ↓ updates
options state + AsyncStorage
    ↓ sends to backend
API request with options
```

### Backend
```
chatRoutes.js receives options
    ↓
getOpenAIResponseV2(message, history, topic, userInfo, options)
    ↓
sanitizeOptions(options) - validate & apply defaults
    ↓
Build system prompt with option directives
    ↓
Call OpenAI with adjusted parameters
    ↓
Return response with applied options
```

## 🚀 Các Bước Tiếp Theo

### Bước 1: Update ChatPage.js
```javascript
// Thay thế hook cũ
import { useConversationSettingsV2 } from '../hooks/useConversationSettings_v2';

// Trong component
const { options, updateOptions, currentTopic, setCurrentTopic } = useConversationSettingsV2();

// Update ConversationSettings component
<ConversationSettings
  isVisible={showSettings}
  onClose={() => setShowSettings(false)}
  currentTopic={currentTopic}
  options={options}  // ⭐ Thêm dòng này
  onOptionsChange={updateOptions}  // ⭐ Thêm dòng này
  onChangeTopic={handleChangeTopic}
/>
```

### Bước 2: Update API Request
```javascript
const response = await fetch(`${API_URL}/chat`, {
  method: 'POST',
  body: JSON.stringify({
    message,
    chatHistory,
    topic: currentTopic,
    userInfo,
    options: options,  // ⭐ Thêm options
  }),
});
```

### Bước 3: Backend - Update chatRoutes.js
```javascript
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, chatHistory, topic, userInfo, options } = req.body;
  
  const response = await getOpenAIResponseV2(
    message,
    chatHistory,
    topic,
    userInfo,
    false,
    'alloy',
    'tts-1',
    options  // ⭐ Pass options
  );
  
  res.json({ ...response });
});
```

### Bước 4: Test
1. Mở settings trong app
2. Thay đổi một vài options
3. Gửi message
4. Kiểm tra backend logs xem options có được apply không
5. Verify AI behavior thay đổi theo settings

## 📊 So Sánh Trước & Sau

### Trước (v1)
```
Settings có:
- Speech Rate (5 options)
- Voice (6 options)
- Current Topic

Tổng: 2 settings điều chỉnh được
```

### Sau (v2)
```
Settings có:
- 7 sections với 30+ options
- Collapsible UI
- Full options support
- Persistence
- Backend integration

Tổng: 30+ settings điều chỉnh được
```

## 🎯 Lợi Ích

1. **Tùy Biến Cao** - User có thể điều chỉnh mọi khía cạnh
2. **UX Tốt** - UI organized, không overwhelming
3. **Persistence** - Settings được lưu lại
4. **Backend-Ready** - Sync hoàn toàn với backend options
5. **Extensible** - Dễ thêm options mới sau này

## ⚠️ Lưu Ý

1. **AsyncStorage** - Cần install `@react-native-async-storage/async-storage` nếu chưa có
2. **Testing** - Test kỹ từng option để đảm bảo affect đúng AI behavior
3. **Performance** - Options được validate trên backend, không cần validate frontend
4. **Default Values** - Backend sẽ apply defaults cho missing options

## 📞 Support

Nếu gặp vấn đề:
1. Check console logs cho errors
2. Verify options được gửi đến backend
3. Check backend logs xem sanitizeOptions() output
4. Test với OPTIONS_DEFAULT trước, rồi mới customize

---

**Ngày tạo:** 2025-10-14  
**Phiên bản:** 2.0  
**Tương thích:** openaiService.js v2.1

