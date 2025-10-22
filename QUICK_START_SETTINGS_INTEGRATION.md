# ⚡ Quick Start - Conversation Settings Integration

## 🎯 Goal
Integrate the new full-featured Conversation Settings UI into your KidSpeak app in 15 minutes.

## ✅ Prerequisites
- ✅ Component updated: `ConversationSettings.js`
- ✅ Hook created: `useConversationSettings_v2.js`
- ✅ Backend: `openaiService.js` with OPTIONS_DEFAULT

## 📋 Integration Checklist

### Step 1: Install Dependencies (if not already)
```bash
cd /Users/mac/Documents/hai/KidSpeak/mobile
npm install @react-native-async-storage/async-storage
```

### Step 2: Update ChatPage.js Imports
```javascript
// Add/replace this import
import { useConversationSettingsV2 } from '../hooks/useConversationSettings_v2';
```

### Step 3: Replace Hook Usage in ChatPage.js
**Find this (old):**
```javascript
const {
  selectedVoice,
  speechRate,
  currentTopic,
  setVoice,
  setSpeechRate,
  setCurrentTopic,
} = useConversationSettings();
```

**Replace with (new):**
```javascript
const {
  options,
  currentTopic,
  updateOptions,
  setCurrentTopic,
  selectedVoice,  // Still available for backward compatibility
  speechRate,     // Still available for backward compatibility
} = useConversationSettingsV2();
```

### Step 4: Update ConversationSettings Component Usage
**Find this (old):**
```javascript
<ConversationSettings
  isVisible={showSettings}
  onClose={() => setShowSettings(false)}
  currentTopic={currentTopic}
  speechRate={speechRate}
  onSpeechRateChange={handleSpeechRateChange}
  selectedVoice={selectedVoice}
  onVoiceChange={handleVoiceChange}
  availableVoices={['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral']}
  onChangeTopic={handleChangeTopic}
/>
```

**Replace with (new):**
```javascript
<ConversationSettings
  isVisible={showSettings}
  onClose={() => setShowSettings(false)}
  currentTopic={currentTopic}
  options={options}
  onOptionsChange={updateOptions}
  onChangeTopic={handleChangeTopic}
/>
```

### Step 5: Update API Call to Include Options
**Find your chat API call, probably looks like:**
```javascript
const response = await fetch(`${API_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: messageText,
    chatHistory: chatHistory,
    topic: currentTopic,
    userInfo: { name: 'Student', age: 8 },
  }),
});
```

**Add options to body:**
```javascript
const response = await fetch(`${API_URL}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    message: messageText,
    chatHistory: chatHistory,
    topic: currentTopic,
    userInfo: { name: 'Student', age: 8 },
    options: options,  // ⭐ ADD THIS LINE
  }),
});
```

### Step 6: Update Backend Route (if needed)
**File:** `backend/src/routes/chatRoutes.js`

**Find this:**
```javascript
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, chatHistory, topic, userInfo } = req.body;
  
  const response = await getOpenAIResponseV2(
    message,
    chatHistory,
    topic,
    userInfo,
    false,
    'alloy',
    'tts-1'
  );
```

**Update to:**
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
    options  // ⭐ ADD THIS PARAMETER
  );
```

### Step 7: Test!
1. **Start backend:**
   ```bash
   cd /Users/mac/Documents/hai/KidSpeak/backend
   npm start
   ```

2. **Start mobile app:**
   ```bash
   cd /Users/mac/Documents/hai/KidSpeak/mobile
   npm start
   # Then press 'i' for iOS or 'a' for Android
   ```

3. **Test in app:**
   - Open Settings (⚙️ button)
   - Should see 7 collapsible sections
   - Change some options (e.g., Force Repeat to "Strict")
   - Send a message with grammar mistakes
   - Verify AI behavior matches the settings

## 🧪 Quick Test Cases

### Test 1: Grammar Check
1. Settings → Pedagogy → Turn OFF "Grammar Check"
2. Send: "I is happy"
3. Expected: AI doesn't correct grammar
4. Turn ON "Grammar Check"
5. Send: "I is happy" again
6. Expected: AI corrects to "I am happy"

### Test 2: Force Repeat
1. Settings → Pedagogy → Set "Force Repeat" to "Strict"
2. Send a message with a grammar mistake
3. Expected: AI corrects AND asks you to repeat
4. Change to "Off"
5. Expected: AI corrects but doesn't ask to repeat

### Test 3: Voice Change
1. Settings → Voice & Speech → Select "Echo"
2. Send a message
3. Expected: Response audio uses Echo voice
4. Check backend logs: Should show `Voice: echo`

### Test 4: Emoji Usage
1. Settings → Language Shaping → Set "Emoji Usage" to "Off"
2. Send messages
3. Expected: No emojis in responses
4. Change to "Medium"
5. Expected: More emojis appear

### Test 5: Speaking Rate
1. Settings → Voice & Speech → Set "Speaking Rate" to "Slow"
2. Send message
3. Expected: Slower TTS audio
4. Change to "Normal"
5. Expected: Normal speed TTS

## 📊 Verification Checklist

- [ ] Settings modal opens and shows all 7 sections
- [ ] Can expand/collapse sections
- [ ] Changes save (close and reopen - should persist)
- [ ] Backend receives options (check logs)
- [ ] AI behavior changes with options
- [ ] Voice selection works
- [ ] Speaking rate affects TTS speed
- [ ] No console errors
- [ ] No linter errors

## 🐛 Troubleshooting

### Settings not persisting
```javascript
// Check if AsyncStorage is installed
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test manually
AsyncStorage.setItem('test', 'value')
  .then(() => console.log('✅ AsyncStorage works'))
  .catch(err => console.error('❌ AsyncStorage error:', err));
```

### Options not reaching backend
```javascript
// Add logging in ChatPage
console.log('Sending options:', JSON.stringify(options, null, 2));

// Check backend
console.log('Received options:', req.body.options);
```

### UI not updating
```javascript
// Force re-render
const [, forceUpdate] = useReducer(x => x + 1, 0);

// After option change
updateOptions(newOptions);
forceUpdate();
```

### Backend not applying options
```javascript
// In openaiService.js, check sanitization
console.log('Raw options:', options);
const opts = sanitizeOptions(options);
console.log('Sanitized options:', opts);
```

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Settings UI shows all sections
2. ✅ Changes save and persist
3. ✅ Backend logs show received options
4. ✅ AI responses change based on settings
5. ✅ Voice changes take effect
6. ✅ No errors in console

## 📚 Next Steps

After basic integration works:
1. **Fine-tune defaults** in `OPTIONS_DEFAULT` for your users
2. **Add presets** (e.g., "Beginner", "Advanced" mode buttons)
3. **Add reset button** to restore defaults
4. **Add tooltips** for complex options
5. **Add A/B testing** to find optimal settings
6. **Analytics** to track which options users change most

## 💡 Pro Tips

1. **Test with real kids** - Default options might need adjustment
2. **Monitor backend logs** - See which options are most effective
3. **Gradual rollout** - Maybe hide "Advanced (Model)" section for now
4. **Document changes** - Keep notes on which settings work best
5. **Backup** - Keep old implementation until fully tested

## 🆘 Need Help?

Check these files:
- `CONVERSATION_SETTINGS_UI_UPGRADE.md` - Full documentation
- `INTEGRATION_EXAMPLE_ChatPage.js` - Complete example
- `SETTINGS_UI_REFERENCE.md` - UI details
- `TỔNG_QUAN_CẬP_NHẬT_SETTINGS.md` - Vietnamese summary

---

**Time to complete:** ~15 minutes  
**Difficulty:** Easy (mostly copy-paste)  
**Impact:** High (30+ new settings!)

**Created:** 2025-10-14  
**Version:** 2.0

