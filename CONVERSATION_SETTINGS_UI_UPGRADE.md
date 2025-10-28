# Conversation Settings UI - Full Options Integration

## 📋 Overview

The `ConversationSettings.js` component has been upgraded to support all options defined in the backend `openaiService.js`. The UI now provides comprehensive controls for pedagogy, language shaping, engagement, flow control, safety, voice/TTS, and model parameters.

## 🎨 Features

### Organized Sections (Collapsible)
- **🎓 Pedagogy** - Grammar check, correction mode, difficulty, focus areas, scaffold level
- **💬 Language Shaping** - Word limits, emoji usage, bilingual support, phonics
- **🎮 Engagement & Games** - Anti-loop, re-engagement, activities, praise frequency
- **🔄 Flow & Topic** - Topic strictness, question ratio, wrap-up timing
- **🛡️ Safety & Content** - Profanity filter, age gate
- **🎤 Voice & Speech** - Voice selection, speaking rate, SSML, pauses
- **⚙️ Advanced (Model)** - Temperature, frequency/presence penalties

### Control Types
1. **Toggle Switch** - Boolean options (grammar_check, anti_loop, etc.)
2. **Enum Selector** - Single choice buttons (correction_mode, difficulty, etc.)
3. **Multi-Select** - Multiple choice buttons (focus areas, activity_preference)
4. **Number Slider** - Value selection with visual buttons

## 🔧 Integration Example

### In ChatPage.js (or parent component)

```javascript
import ConversationSettings from '../components/ConversationSettings';
import { sanitizeOptions, OPTIONS_DEFAULT } from '../../backend/src/services/openaiService';

function ChatPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [conversationOptions, setConversationOptions] = useState(OPTIONS_DEFAULT);

  // Handle options change
  const handleOptionsChange = (newOptions) => {
    setConversationOptions(newOptions);
    // Optionally save to AsyncStorage
    AsyncStorage.setItem('conversation_options', JSON.stringify(newOptions));
  };

  // When sending messages to backend
  const sendMessage = async (message) => {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        chatHistory,
        topic: currentTopic,
        userInfo,
        options: conversationOptions, // Send options to backend
      }),
    });
    // Handle response...
  };

  return (
    <View>
      {/* Your chat UI */}
      <TouchableOpacity onPress={() => setShowSettings(true)}>
        <Text>⚙️ Settings</Text>
      </TouchableOpacity>

      <ConversationSettings
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
        currentTopic={currentTopic}
        options={conversationOptions}
        onOptionsChange={handleOptionsChange}
        onChangeTopic={() => {
          setShowSettings(false);
          setShowTopicSelector(true);
        }}
      />
    </View>
  );
}
```

## 📦 Props

| Prop | Type | Description |
|------|------|-------------|
| `isVisible` | boolean | Show/hide modal |
| `onClose` | function | Called when modal closes |
| `currentTopic` | object | Current topic with `{ title, description, icon }` |
| `options` | object | Current options state (all options from OPTIONS_DEFAULT) |
| `onOptionsChange` | function | Called when any option changes, receives new options object |
| `onChangeTopic` | function | Called when user clicks "Change" topic button |

## 🎯 Options Structure

The `options` object follows the structure from `openaiService.js`:

```javascript
{
  // Pedagogy
  grammar_check: true,
  force_repeat: 'soft', // 'off' | 'soft' | 'strict'
  correction_mode: 'explicit', // 'implicit' | 'explicit' | 'sandwich'
  difficulty: 'auto', // 'auto' | 'starters' | 'movers' | 'flyers'
  focus: ['vocabulary', 'pronunciation'], // Array
  scaffold_level: 1, // 0-3
  
  // Language shaping
  max_sentence_words: 10, // 5-20
  max_sentences_per_turn: 2, // 1-4
  emoji_usage: 'light', // 'off' | 'light' | 'medium'
  bilingual_support: 'off', // 'off' | 'keyword_gloss' | 'brief_hint'
  ipa_pronunciation: false,
  phonics_hints: false,
  
  // Engagement & game mechanics
  anti_loop: true,
  reengage_after_seconds: 30, // 15-60
  reengage_style: 'playful', // 'playful' | 'calm' | 'quiz'
  activity_preference: ['repeat_after_me', 'AB_choice', 'fill_blank'], // Array
  praise_frequency: 'normal', // 'low' | 'normal' | 'high'
  challenge_ratio: 0.4, // 0-1
  
  // Flow & topic control
  topic_strictness: 'normal', // 'loose' | 'normal' | 'strict'
  wrap_up_on_turns: 14, // 10-30
  
  // Safety & content
  profanity_filter: true,
  age_gate: 6, // 3-12
  
  // Voice/TTS & prosody
  voice_policy: 'auto_by_level', // 'auto_by_level' | 'fixed'
  voice: 'alloy', // 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speaking_rate: 'slow', // 'slow' | 'normal'
  ssml: false,
  pause_ms_between_sentences: 250, // 100-500
  
  // Model steering
  temperature_base: 0.7, // 0.3-1.2
  frequency_penalty: 0.3, // 0-1
  presence_penalty: 0.2, // 0-1
}
```

## 🔄 Backend Integration

The backend `chatRoutes.js` should accept and use these options:

```javascript
// backend/src/routes/chatRoutes.js
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, chatHistory, topic, userInfo, options } = req.body;
  
  const response = await getOpenAIResponseV2(
    message,
    chatHistory,
    topic,
    userInfo,
    false, // isFollowUp
    'alloy', // fallbackVoice
    'tts-1', // ttsModel
    options // Pass options here
  );
  
  // Return response...
});
```

## 💾 Persistence (Optional)

To save user preferences:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load options on app start
useEffect(() => {
  const loadOptions = async () => {
    const saved = await AsyncStorage.getItem('conversation_options');
    if (saved) {
      setConversationOptions(JSON.parse(saved));
    }
  };
  loadOptions();
}, []);

// Save when options change
const handleOptionsChange = async (newOptions) => {
  setConversationOptions(newOptions);
  await AsyncStorage.setItem('conversation_options', JSON.stringify(newOptions));
};
```

## 🎨 UI/UX Features

1. **Collapsible Sections** - Only the Voice section is expanded by default to avoid overwhelming users
2. **Color Coding**:
   - Blue (#007AFF) - Primary actions (topic change, enum selectors)
   - Green (#34C759) - Voice/confirmation actions (voice buttons, multi-select)
   - Orange (#FF9500) - Number sliders
3. **Visual Feedback** - Active states for all interactive elements
4. **Scrollable** - Full vertical scroll with proper spacing
5. **Modal Height** - 85% of screen height for comfortable viewing

## 🚀 Next Steps

1. **Update ChatPage.js** to pass `options` and `onOptionsChange` props
2. **Update backend route** to accept and use `options` parameter
3. **Test option changes** to ensure they properly affect AI behavior
4. **Add AsyncStorage persistence** if you want to save user preferences
5. **Consider adding a "Reset to Default"** button in the UI

## 📝 Notes

- All options are validated on the backend using `sanitizeOptions()`
- Invalid values automatically fall back to defaults
- The UI prevents invalid selections through controlled components
- Options are sent with every chat request to ensure consistency

## 🐛 Troubleshooting

**Options not affecting AI behavior:**
- Check that backend is receiving options in request
- Verify `sanitizeOptions()` is not rejecting values
- Check backend logs for applied options

**UI not updating:**
- Ensure `options` prop is a controlled state
- Verify `onOptionsChange` properly updates parent state
- Check React Native debugger for state changes

**Layout issues:**
- Clear Metro bundler cache: `npm start -- --reset-cache`
- Restart app completely
- Check for conflicting styles

---

**Last Updated:** 2025-10-14  
**Version:** 2.0  
**Compatible with:** openaiService.js v2.1

