# Conversation Settings Synchronization

## 📅 Date: October 15, 2025

## 🎯 Objective
Ensure both **ChatPage.js** and **SpeakingScreen.js** use dynamic conversation settings from `useConversationSettings` hook instead of hardcoded options.

---

## ✅ Changes Made

### 1. **SpeakingScreen.js** - Updated to Use Dynamic Settings

#### **Added Import:**
```javascript
import { useConversationSettings } from '../hooks/useConversationSettings';
```

#### **Added Hook Usage:**
```javascript
export default function SpeakingScreen({...}) {
  const { isAuthenticated } = useAuth();
  const { getOptions } = useConversationSettings(); // ✅ NEW
  
  // ... rest of component
}
```

#### **Before (Hardcoded Options):**
```javascript
// Line 317-332 (OLD)
const options = {
  grammar_check: true,
  force_repeat: 'soft',
  correction_mode: 'sandwich',
  difficulty: 'starters',
  focus: ['vocabulary', 'pronunciation'],
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

#### **After (Dynamic Options from Settings):**
```javascript
// Line 318-322 (NEW)
// Configure options for getOpenAIResponseV2 (from conversation settings)
const options = {
  ...getOptions(),
};
```

### 2. **ChatPage.js** - Already Using Dynamic Settings ✅

```javascript
// Already correct (Line 478-481)
const options = {
  ...getOptions(),
};
```

---

## 🔄 Architecture

### **Conversation Settings Flow:**

```
┌─────────────────────────────────────┐
│  useConversationSettings Hook       │
│  (hooks/useConversationSettings.js) │
└──────────────┬──────────────────────┘
               │ getOptions()
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌─────────────────┐
│ ChatPage.js  │  │ SpeakingScreen  │
│              │  │                 │
│ getOptions() │  │ getOptions()    │
└──────┬───────┘  └────────┬────────┘
       │                   │
       └───────┬───────────┘
               ▼
    ┌────────────────────┐
    │  Backend API       │
    │  /chat/send-message│
    │                    │
    │  getOpenAIResponseV2()
    │  with options      │
    └────────────────────┘
```

---

## 📊 Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Options Source** | Hardcoded in SpeakingScreen | Dynamic from settings hook |
| **Consistency** | ChatPage ≠ SpeakingScreen | Both use same settings |
| **Maintainability** | Need to update in 2 places | Update in one place (hook) |
| **User Control** | Limited | User can customize via settings |
| **Flexibility** | Static values | Dynamic based on user preferences |

---

## 🎛️ Settings That Are Now Dynamic

All the following options are now pulled from user conversation settings:

### **Pedagogy Settings:**
- `grammar_check` - Enable/disable grammar checking
- `force_repeat` - Repeat policy ('off', 'soft', 'strict')
- `correction_mode` - Correction style ('implicit', 'explicit', 'sandwich')
- `difficulty` - Difficulty level ('auto', 'starters', 'movers', 'flyers')
- `focus` - Learning focus areas (vocabulary, pronunciation, grammar, fluency)
- `min_examples_per_point` - Examples per teaching point
- `scaffold_level` - Scaffolding intensity (0-3)

### **Language Shaping:**
- `max_sentence_words` - Maximum words per sentence
- `max_sentences_per_turn` - Maximum sentences per response
- `emoji_usage` - Emoji frequency ('off', 'light', 'medium')
- `bilingual_support` - Bilingual hints ('off', 'keyword_gloss', 'brief_hint')
- `ipa_pronunciation` - Show IPA notation
- `phonics_hints` - Show phonics hints

### **Engagement & Game Mechanics:**
- `anti_loop` - Anti-repetition logic
- `reengage_after_seconds` - Timeout before re-engagement
- `reengage_style` - Re-engagement style ('playful', 'calm', 'quiz')
- `activity_preference` - Preferred activities (repeat_after_me, AB_choice, etc.)
- `praise_frequency` - Praise frequency ('low', 'normal', 'high')
- `challenge_ratio` - Challenge difficulty ratio (0-1)

### **Flow & Topic Control:**
- `topic_strictness` - Topic adherence ('loose', 'normal', 'strict')
- `open_question_ratio` - Open-ended question ratio (0-1)
- `wrap_up_on_turns` - Turns before wrap-up

### **Voice/TTS & Prosody:**
- `voice_policy` - Voice selection ('auto_by_level', 'fixed')
- `voice` - TTS voice name
- `speaking_rate` - Speech speed ('slow', 'normal')
- `ssml` - Use SSML markup
- `pause_ms_between_sentences` - Pause duration

### **Model Steering:**
- `temperature_base` - AI creativity (0-1.5)
- `frequency_penalty` - Repetition penalty (0-2)
- `presence_penalty` - Topic diversity (0-2)

---

## 🔍 Code Comparison

### **Import Statements:**

```javascript
// Both screens now import:
import { useConversationSettings } from '../hooks/useConversationSettings';
```

### **Hook Usage:**

```javascript
// Both screens now use:
const { getOptions } = useConversationSettings();
```

### **Options Configuration:**

```javascript
// Both screens now configure options identically:
const options = {
  ...getOptions(),
};
```

---

## 🧪 Test Plan

### Test 1: Verify Settings Are Applied (Both Screens)

**ChatPage.js:**
```
1. Open app → Go to ChatPage
2. Check network request payload
3. ✅ Verify: options object contains user settings
4. Change a setting (e.g., difficulty level)
5. Send a message
6. ✅ Verify: New setting is reflected in request
```

**SpeakingScreen.js:**
```
1. Open app → Go to Speaking Mode
2. Speak a message
3. Check network request payload
4. ✅ Verify: options object contains user settings
5. ✅ Verify: Options match ChatPage settings
```

### Test 2: Settings Synchronization

```
1. Open ConversationSettings modal
2. Change multiple settings:
   - Difficulty: 'starters' → 'movers'
   - Emoji usage: 'light' → 'medium'
   - Praise frequency: 'high' → 'normal'
3. Close modal
4. Send message in ChatPage
5. ✅ Verify: Backend receives updated settings
6. Switch to SpeakingScreen
7. Speak a message
8. ✅ Verify: Backend receives same updated settings
```

### Test 3: Default Values

```
1. Fresh install (no saved settings)
2. Check options in network request
3. ✅ Verify: Uses default values from OPTIONS_DEFAULT
4. ✅ Verify: Both screens use same defaults
```

---

## 📝 Related Files

| File | Role | Status |
|------|------|--------|
| `hooks/useConversationSettings.js` | Provides getOptions() | ✅ No changes |
| `mobile/src/pages/ChatPage.js` | Uses dynamic options | ✅ Already updated |
| `mobile/src/components/SpeakingScreen.js` | Uses dynamic options | ✅ Updated |
| `services/conversationSettingsManager.js` | Settings storage | ✅ No changes |
| `backend/src/services/openaiService.js` | Processes options | ✅ No changes |

---

## 🎯 Key Takeaways

1. ✅ **Both screens now use the same settings source**
2. ✅ **Settings are centralized** in `useConversationSettings` hook
3. ✅ **Reduced code duplication** (from 16 lines → 3 lines)
4. ✅ **User settings are respected** in both ChatPage and SpeakingScreen
5. ✅ **Easy to maintain** - update settings logic in one place
6. ✅ **Consistent behavior** across all conversation modes

---

## 🚀 Future Enhancements

### Potential Additions:
- [ ] Add UI for users to customize all options
- [ ] Add profiles/presets (e.g., "Beginner", "Advanced", "Exam Prep")
- [ ] Add per-topic settings override
- [ ] Add analytics to track which settings work best
- [ ] Add A/B testing for different option combinations

---

## 📌 Summary

**Before:**
- SpeakingScreen: ❌ Hardcoded options
- ChatPage: ✅ Dynamic options
- Inconsistent between screens

**After:**
- SpeakingScreen: ✅ Dynamic options from hook
- ChatPage: ✅ Dynamic options from hook
- ✅ Consistent across all screens
- ✅ User settings respected everywhere

**Code Reduction:**
- Removed 14 lines of hardcoded values
- Replaced with 3 lines using hook
- **Simpler + More flexible + User-controllable**

