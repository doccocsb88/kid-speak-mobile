# Đồng Bộ Conversation Settings

## 📅 Ngày: 15 Tháng 10, 2025

## 🎯 Mục Tiêu
Đảm bảo cả **ChatPage.js** và **SpeakingScreen.js** đều sử dụng settings động từ `useConversationSettings` hook thay vì hardcode giá trị.

---

## ✅ Thay Đổi

### 1. **SpeakingScreen.js** - Đã Cập Nhật Dùng Dynamic Settings

#### **Thêm Import:**
```javascript
import { useConversationSettings } from '../hooks/useConversationSettings';
```

#### **Thêm Hook Usage:**
```javascript
export default function SpeakingScreen({...}) {
  const { isAuthenticated } = useAuth();
  const { getOptions } = useConversationSettings(); // ✅ MỚI
  
  // ... phần còn lại
}
```

#### **Trước (Hardcoded - 16 dòng):**
```javascript
// Dòng 317-332 (CŨ)
const options = {
  grammar_check: true,
  force_repeat: 'soft',
  correction_mode: 'sandwich',
  difficulty: 'starters',
  focus: ['vocabulary', 'pronunciation'],
  target_vocab: selectedTopic?.vocabulary || [],
  emoji_usage: 'light',
  anti_loop: true,
  activity_preference: ['AB_choice', 'repeat_after_me'],
  praise_frequency: 'high',
  voice_policy: 'auto_by_level',
  speaking_rate: 'slow',
  temperature_base: 0.65,
  frequency_penalty: 0.4,
};
```

#### **Sau (Dynamic - 3 dòng):**
```javascript
// Dòng 318-322 (MỚI)
const options = {
  ...getOptions(),
  target_vocab: selectedTopic?.vocabulary || [],
};
```

**➡️ Giảm từ 16 dòng xuống 3 dòng!** 🎉

---

## 🔄 So Sánh Trước/Sau

### **TRƯỚC:**

| Screen | Options Source | Code Lines |
|--------|----------------|------------|
| ChatPage | ✅ Dynamic (hook) | 3 |
| SpeakingScreen | ❌ Hardcoded | 16 |
| **Consistency** | ❌ Không đồng nhất | - |

### **SAU:**

| Screen | Options Source | Code Lines |
|--------|----------------|------------|
| ChatPage | ✅ Dynamic (hook) | 3 |
| SpeakingScreen | ✅ Dynamic (hook) | 3 |
| **Consistency** | ✅ Đồng nhất 100% | - |

---

## 🎛️ Các Settings Nào Được Đồng Bộ?

### **1. Pedagogy (Giảng dạy):**
- ✅ `grammar_check` - Kiểm tra ngữ pháp
- ✅ `force_repeat` - Yêu cầu nhắc lại ('off', 'soft', 'strict')
- ✅ `correction_mode` - Cách sửa lỗi ('implicit', 'explicit', 'sandwich')
- ✅ `difficulty` - Độ khó ('auto', 'starters', 'movers', 'flyers')
- ✅ `focus` - Trọng tâm (từ vựng, phát âm, ngữ pháp, lưu loát)

### **2. Language Shaping (Định hình ngôn ngữ):**
- ✅ `max_sentence_words` - Số từ tối đa/câu
- ✅ `max_sentences_per_turn` - Số câu tối đa/lượt
- ✅ `emoji_usage` - Dùng emoji ('off', 'light', 'medium')
- ✅ `bilingual_support` - Hỗ trợ song ngữ

### **3. Engagement & Games (Tương tác & Trò chơi):**
- ✅ `anti_loop` - Chống lặp lại
- ✅ `reengage_after_seconds` - Thời gian chờ (30s)
- ✅ `reengage_style` - Phong cách tái tương tác ('playful', 'calm', 'quiz')
- ✅ `activity_preference` - Hoạt động ưa thích
- ✅ `praise_frequency` - Tần suất khen ngợi ('low', 'normal', 'high')

### **4. Voice/TTS (Giọng nói):**
- ✅ `voice_policy` - Chính sách chọn giọng ('auto_by_level', 'fixed')
- ✅ `speaking_rate` - Tốc độ nói ('slow', 'normal')
- ✅ `pause_ms_between_sentences` - Độ dừng giữa câu

### **5. AI Parameters (Tham số AI):**
- ✅ `temperature_base` - Độ sáng tạo (0-1.5)
- ✅ `frequency_penalty` - Phạt lặp lại (0-2)
- ✅ `presence_penalty` - Đa dạng chủ đề (0-2)

---

## 📊 Lợi Ích

### **1. Consistency (Đồng nhất):**
```
Trước: ChatPage settings ≠ SpeakingScreen settings ❌
Sau:   ChatPage settings = SpeakingScreen settings ✅
```

### **2. Maintainability (Dễ bảo trì):**
```
Trước: Sửa 2 chỗ (ChatPage + SpeakingScreen) ❌
Sau:   Sửa 1 chỗ (hook) → tự động sync cả 2 ✅
```

### **3. User Control (Người dùng kiểm soát):**
```
Trước: SpeakingScreen dùng giá trị cố định ❌
Sau:   Cả 2 screens đều tôn trọng settings của user ✅
```

### **4. Code Quality (Chất lượng code):**
```
Trước: 16 dòng hardcode ❌
Sau:   3 dòng gọn gàng ✅
Giảm: 81% code!
```

---

## 🧪 Cách Test

### **Test 1: Kiểm Tra Settings Được Áp Dụng**

#### ChatPage:
```
1. Mở app → vào ChatPage
2. Gửi 1 tin nhắn
3. Kiểm tra network request (DevTools)
4. ✅ Xác nhận: options chứa user settings
```

#### SpeakingScreen:
```
1. Mở app → vào Speaking Mode
2. Nói 1 câu
3. Kiểm tra network request
4. ✅ Xác nhận: options giống ChatPage
```

### **Test 2: Thay Đổi Settings**

```
1. Mở ConversationSettings modal
2. Thay đổi:
   - Difficulty: 'starters' → 'movers'
   - Emoji: 'light' → 'medium'
   - Praise: 'high' → 'normal'
3. Đóng modal
4. Gửi tin nhắn ở ChatPage
5. ✅ Xác nhận: Backend nhận settings mới
6. Chuyển sang SpeakingScreen
7. Nói 1 câu
8. ✅ Xác nhận: Backend nhận settings giống hệt
```

### **Test 3: Console Logs**

```javascript
// Thêm log trong sendTranscript (SpeakingScreen line ~318)
console.log('📊 [SpeakingScreen] Options:', JSON.stringify(options, null, 2));

// Thêm log trong sendMessage (ChatPage line ~478)
console.log('📊 [ChatPage] Options:', JSON.stringify(options, null, 2));

// Kết quả mong đợi: 2 logs giống hệt nhau ✅
```

---

## 🔍 Chi Tiết Technical

### **useConversationSettings Hook:**

```javascript
// hooks/useConversationSettings.js
export const useConversationSettings = () => {
  const getOptions = () => {
    // Lấy settings từ conversationSettingsManager
    const settings = conversationSettingsManager.getSettings();
    
    // Trả về object options đầy đủ
    return {
      grammar_check: settings.grammarCheck,
      force_repeat: settings.forceRepeat,
      correction_mode: settings.correctionMode,
      difficulty: settings.difficulty,
      // ... tất cả các settings khác
    };
  };
  
  return { getOptions, ... };
};
```

### **Flow Hoàn Chỉnh:**

```
User thay đổi settings
        ↓
conversationSettingsManager.setSetting()
        ↓
Lưu vào AsyncStorage
        ↓
getOptions() đọc settings mới
        ↓
ChatPage/SpeakingScreen dùng options
        ↓
Gửi lên Backend
        ↓
getOpenAIResponseV2(options)
        ↓
AI response theo settings mới
```

---

## 📝 Files Liên Quan

| File | Vai trò | Thay đổi |
|------|---------|----------|
| `hooks/useConversationSettings.js` | Cung cấp getOptions() | ✅ Không đổi |
| `pages/ChatPage.js` | Dùng dynamic options | ✅ Đã đúng từ trước |
| `components/SpeakingScreen.js` | Dùng dynamic options | ✅ VỪA CẬP NHẬT |
| `services/conversationSettingsManager.js` | Lưu trữ settings | ✅ Không đổi |
| `backend/services/openaiService.js` | Xử lý options | ✅ Không đổi |

---

## 🎯 Tổng Kết

### **Vấn Đề:**
- SpeakingScreen hardcode options → không đồng bộ với ChatPage
- User thay đổi settings → chỉ ảnh hưởng ChatPage, không ảnh hưởng SpeakingScreen
- Code trùng lặp, khó maintain

### **Giải Pháp:**
- Cả 2 screens đều dùng `getOptions()` từ hook
- Settings được đồng bộ tự động
- Code gọn gàng, dễ maintain

### **Kết Quả:**
- ✅ Đồng nhất 100%
- ✅ Giảm 81% code (16 → 3 dòng)
- ✅ User settings được tôn trọng ở mọi nơi
- ✅ Dễ test, dễ maintain

---

## 🚀 Next Steps

### **Có thể làm thêm:**
1. [ ] Thêm UI để user tùy chỉnh tất cả options
2. [ ] Tạo profiles/presets (VD: "Beginner", "Advanced", "Exam Prep")
3. [ ] Settings riêng cho từng topic
4. [ ] Analytics để xem settings nào hiệu quả nhất
5. [ ] A/B testing các tổ hợp options khác nhau

---

## 📌 Checklist

- [x] Import `useConversationSettings` vào SpeakingScreen
- [x] Thêm `getOptions()` hook usage
- [x] Thay hardcoded options bằng `getOptions()`
- [x] Keep `target_vocab` từ topic
- [x] No linter errors
- [x] Tạo documentation
- [ ] Test trên device/emulator
- [ ] Verify network logs
- [ ] Check backend logs

---

## 💡 Ghi Chú Quan Trọng

⚠️ **Lưu ý:** 
- `target_vocab` được override bởi topic vocabulary (hợp lý vì mỗi topic có từ vựng riêng)
- Các settings khác đều lấy từ user preferences
- Nếu user chưa set → dùng default values từ `OPTIONS_DEFAULT`

✅ **Best Practice:**
- Luôn dùng hook để lấy settings
- Không hardcode values trong component
- Centralize settings logic ở một chỗ (hook)

