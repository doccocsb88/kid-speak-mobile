# KSSpeech Native Module Integration

## Tổng quan

Đã tích hợp native module `KSSpeechModule.kt` vào `SpeakingScreen.js` với khả năng tự động chọn giữa:
- **KSSpeech Native Module** (ưu tiên trên Android nếu có)
- **@react-native-voice/voice** (fallback)

## Các thay đổi đã thực hiện

### 1. ✅ Cải thiện KSSpeechModule.kt

**File:** `mobile/android/app/src/main/java/com/kidspeak/mobile/KSSpeechModule.kt`

- ✅ Thêm method `cancel()` để match với Voice library API
- ✅ Cải thiện `onError()` để trả về cả error code và message
- ✅ Cải thiện `onRmsChanged()` để emit cả `rms` và `value` (match Voice format)

### 2. ✅ Tạo KSSpeechAdapter Service

**File:** `mobile/src/services/ksSpeechAdapter.js`

Adapter service để map KSSpeech events sang format của Voice library:

- **Events mapping:**
  - `KSSpeech.onStart` → `onSpeechStart`
  - `KSSpeech.onResults` + `KSSpeech.onPartialResults` → `onSpeechResults` (gộp cả partial và final)
  - `KSSpeech.onEnd` → `onSpeechEnd`
  - `KSSpeech.onError` → `onSpeechError` (convert code + message → error object)
  - `KSSpeech.onRmsChanged` → `onSpeechVolumeChanged` (map `rms` → `value`)

- **Methods:**
  - `start(language)` - match Voice API
  - `stop()` - match Voice API
  - `cancel()` - match Voice API (mới thêm)
  - `destroy()` - match Voice API
  - `removeAllListeners()` - cleanup event listeners

### 3. ✅ Cập nhật SpeakingScreen.js

**File:** `mobile/src/components/SpeakingScreen.js`

- ✅ Import `ksSpeechAdapter`
- ✅ Tự động chọn module:
  ```javascript
  const useKSSpeech = Platform.OS === 'android' && ksSpeechAdapter.isAvailable();
  const SpeechModule = useKSSpeech ? ksSpeechAdapter : Voice;
  ```
- ✅ Cập nhật tất cả event listeners để dùng `SpeechModule` thay vì `Voice`
- ✅ Cập nhật tất cả method calls (`start`, `stop`, `cancel`, `destroy`) để dùng `SpeechModule`
- ✅ Dynamic logging với `moduleName` để dễ debug

## Cách hoạt động

1. **Khi component mount:**
   - Kiểm tra xem KSSpeech có available không (chỉ trên Android)
   - Nếu có → dùng KSSpeech adapter
   - Nếu không → fallback về Voice library

2. **Event handling:**
   - KSSpeech adapter tự động map events từ KSSpeech format sang Voice format
   - SpeakingScreen không cần biết đang dùng module nào

3. **Method calls:**
   - Tất cả calls đều qua `SpeechModule` abstraction
   - Adapter tự động forward calls đến native module hoặc Voice library

## Lợi ích

1. **Tương thích ngược:** Vẫn hoạt động với Voice library nếu KSSpeech không available
2. **Tự động chọn:** Không cần config, tự động chọn module tốt nhất
3. **Dễ debug:** Logging rõ ràng với module name
4. **API nhất quán:** Cùng một API cho cả 2 module

## Testing

Để test:

1. **Với KSSpeech (Android):**
   - Build app: `cd android && ./gradlew clean && cd .. && npm run android`
   - Check logs: `[KSSpeech]` prefix trong console

2. **Với Voice library (fallback):**
   - Nếu KSSpeech không available, sẽ tự động dùng Voice
   - Check logs: `[Voice]` prefix trong console

## Notes

- KSSpeech chỉ available trên Android
- iOS vẫn dùng Voice library
- Adapter tự động handle tất cả format differences
- Không cần thay đổi logic business trong SpeakingScreen

