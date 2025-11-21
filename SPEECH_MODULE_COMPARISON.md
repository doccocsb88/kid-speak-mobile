# So sánh @react-native-voice/voice vs KSSpeechModule.kt

## 📊 Bảng so sánh Events

| @react-native-voice/voice | KSSpeechModule.kt | Match? | Ghi chú |
|---------------------------|-------------------|--------|---------|
| `Voice.onSpeechStart` | `KSSpeech.onStart` | ✅ | Cả hai đều trigger khi bắt đầu speech |
| `Voice.onSpeechResults` | `KSSpeech.onResults` + `KSSpeech.onPartialResults` | ⚠️ **KHÔNG HOÀN TOÀN** | Voice gộp cả partial và final, KSSpeech tách riêng |
| `Voice.onSpeechEnd` | `KSSpeech.onEnd` | ✅ | Cả hai đều trigger khi kết thúc speech |
| `Voice.onSpeechError` | `KSSpeech.onError` | ⚠️ **FORMAT KHÁC** | Voice: error object, KSSpeech: `{code: int}` |
| `Voice.onSpeechVolumeChanged` | `KSSpeech.onRmsChanged` | ⚠️ **FORMAT KHÁC** | Voice: `{value: number}`, KSSpeech: `{rms: number}` |
| - | `KSSpeech.onReady` | ❌ | Voice không có event này |

## 📊 Bảng so sánh Methods

| @react-native-voice/voice | KSSpeechModule.kt | Match? | Ghi chú |
|---------------------------|-------------------|--------|---------|
| `Voice.start(language)` | `KSSpeech.start(language)` | ✅ | Cả hai đều nhận language string |
| `Voice.stop()` | `KSSpeech.stop()` | ✅ | Cả hai đều stop listening |
| `Voice.cancel()` | ❌ | ❌ **THIẾU** | KSSpeech không có method này |
| `Voice.destroy()` | `KSSpeech.destroy()` | ✅ | Cả hai đều cleanup resources |
| `Voice.removeAllListeners()` | ❌ | ❌ **THIẾU** | KSSpeech không có method này |

## 🔍 Chi tiết Events Format

### 1. onSpeechResults / onResults

**@react-native-voice/voice:**
```javascript
Voice.onSpeechResults = (e) => {
  const text = e?.value?.[0] || ''; // Array of strings, lấy phần tử đầu
  // Gộp cả partial và final results
}
```

**KSSpeechModule.kt:**
```kotlin
// Partial results
onPartialResults(partialResults: Bundle?) {
  emit("KSSpeech.onPartialResults", {text: string})
}

// Final results  
onResults(results: Bundle?) {
  emit("KSSpeech.onResults", {text: string})
}
```

**Vấn đề:** 
- Voice gộp partial và final vào 1 event
- KSSpeech tách thành 2 events riêng
- Cần xử lý cả 2 events trong KSSpeech để match behavior

### 2. onSpeechError / onError

**@react-native-voice/voice:**
```javascript
Voice.onSpeechError = (err) => {
  // err là error object với message, code, etc.
  dispatch({ type: 'ERROR', error: err });
}
```

**KSSpeechModule.kt:**
```kotlin
onError(error: Int) {
  emit("KSSpeech.onError", {code: int})
}
```

**Vấn đề:**
- Voice trả về full error object
- KSSpeech chỉ trả về error code (int)
- Cần convert error code sang error object

### 3. onSpeechVolumeChanged / onRmsChanged

**@react-native-voice/voice:**
```javascript
Voice.onSpeechVolumeChanged = (e) => {
  // e.value là volume number
  // console.log('[Voice] Volume:', e?.value);
}
```

**KSSpeechModule.kt:**
```kotlin
onRmsChanged(rmsdB: Float) {
  emit("KSSpeech.onRmsChanged", {rms: double})
}
```

**Vấn đề:**
- Voice: `{value: number}`
- KSSpeech: `{rms: number}`
- Cần map `rms` -> `value` hoặc đổi tên event

## ❌ Methods thiếu trong KSSpeechModule

### 1. `cancel()`
**Sử dụng trong SpeakingScreen.js:**
- Dòng 363, 479, 616, 740, 782, 925: `Voice.cancel()` được gọi để dừng ngay lập tức và clear buffer
- Quan trọng để prevent self-recognition khi play audio

**Cần thêm vào KSSpeechModule:**
```kotlin
@ReactMethod
fun cancel(promise: Promise) {
  speechRecognizer?.cancel()
  promise.resolve(null)
}
```

### 2. `removeAllListeners()`
**Sử dụng trong SpeakingScreen.js:**
- Dòng 366, 928: `Voice.removeAllListeners()` được gọi trong cleanup
- Quan trọng để cleanup event listeners

**Cần thêm vào KSSpeechModule:**
- Không cần vì KSSpeech dùng DeviceEventEmitter, không có listeners cần remove
- Nhưng có thể thêm method no-op để tương thích API

## ✅ Kết luận

### Các điểm CHƯA MATCH:

1. **Events:**
   - ❌ `onSpeechResults` vs `onResults` + `onPartialResults` (format và behavior khác)
   - ⚠️ `onSpeechError` format khác (object vs code)
   - ⚠️ `onSpeechVolumeChanged` format khác (value vs rms)
   - ❌ Thiếu `onReady` event (nhưng không dùng trong SpeakingScreen)

2. **Methods:**
   - ❌ Thiếu `cancel()` method (quan trọng!)
   - ❌ Thiếu `removeAllListeners()` method (có thể bỏ qua)

### Cần làm gì để match:

1. **Thêm `cancel()` method vào KSSpeechModule**
2. **Xử lý cả `onResults` và `onPartialResults` trong SpeakingScreen** (hoặc gộp trong native)
3. **Convert error code sang error object** trong event handler
4. **Map `rms` -> `value`** trong volume event handler
5. **Tạo wrapper/adapter** để match API của Voice library

