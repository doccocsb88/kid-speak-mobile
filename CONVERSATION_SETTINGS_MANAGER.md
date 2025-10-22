# Conversation Settings Manager

## Overview

The Conversation Settings Manager is a centralized service for managing conversation-related settings across the KidSpeak mobile app. It ensures synchronization of voice, speech rate, and topic settings across all components.

## Architecture

### Components

1. **conversationSettingsManager** (`src/services/conversationSettingsManager.js`)
   - Singleton service class
   - Manages settings state
   - Persists to AsyncStorage
   - Provides pub/sub mechanism for real-time updates

2. **useConversationSettings** (`src/hooks/useConversationSettings.js`)
   - React hook wrapper
   - Simplifies integration in React components
   - Auto-subscribes to updates

### Managed Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `selectedVoice` | String | `'alloy'` | OpenAI TTS voice (alloy, echo, fable, onyx, nova, shimmer) |
| `speechRate` | Number | `1.0` | Playback speed (0.5, 0.7, 0.8, 1.0, 1.2) |
| `currentTopic` | Object/null | `null` | Currently selected conversation topic |

## Integration Guide

### Method 1: Direct Manager Usage

```javascript
import conversationSettingsManager from '../services/conversationSettingsManager';

// Initialize (call once on app start)
await conversationSettingsManager.initialize();

// Get current settings
const settings = conversationSettingsManager.getSettings();
const voice = conversationSettingsManager.getVoice();
const rate = conversationSettingsManager.getSpeechRate();
const topic = conversationSettingsManager.getCurrentTopic();

// Update settings
await conversationSettingsManager.setVoice('nova');
await conversationSettingsManager.setSpeechRate(1.2);
await conversationSettingsManager.setCurrentTopic(topicObject);
await conversationSettingsManager.clearCurrentTopic();

// Subscribe to changes
const unsubscribe = conversationSettingsManager.subscribe((key, value, allSettings) => {
  console.log(`Setting ${key} changed to:`, value);
});

// Clean up
unsubscribe();
```

### Method 2: React Hook (Recommended)

```javascript
import { useConversationSettings } from '../hooks/useConversationSettings';

function MyComponent() {
  const {
    selectedVoice,
    speechRate,
    currentTopic,
    setVoice,
    setSpeechRate,
    setCurrentTopic,
    clearCurrentTopic,
    getAvailableVoices,
    isInitialized,
  } = useConversationSettings();

  const handleVoiceChange = async (newVoice) => {
    await setVoice(newVoice);
  };

  return (
    <View>
      <Text>Current Voice: {selectedVoice}</Text>
      <Text>Speech Rate: {speechRate}x</Text>
      {currentTopic && <Text>Topic: {currentTopic.title}</Text>}
    </View>
  );
}
```

## Synchronized Components

### 1. SpeakingScreen.js
- **Usage**: Voice and speech rate for real-time conversation
- **Integration**: Direct manager with local state sync
- **Key Features**:
  - Subscribes on mount
  - Updates manager when user changes settings
  - Uses settings for TTS playback

### 2. ConversationSettings.js
- **Usage**: Settings modal UI
- **Integration**: Receives props from parent, updates via callbacks
- **Key Features**:
  - Displays current settings
  - Provides UI controls
  - Triggers parent callbacks that update manager

### 3. ChatPage.js
- **Usage**: Main chat interface with TTS
- **Integration**: Direct manager with state sync
- **Key Features**:
  - Initializes manager on mount
  - Subscribes to all setting changes
  - Updates manager when topic selected/changed
  - Passes settings to child components

### 4. SideMenu.js
- **Usage**: Side menu settings controls
- **Integration**: Updates manager when user changes settings
- **Key Features**:
  - Voice picker
  - Speech rate slider
  - Topic display
  - Syncs changes to manager

## Data Flow

```
User Action (Any Component)
    ↓
conversationSettingsManager.set*()
    ↓
AsyncStorage (persist)
    ↓
Notify all subscribers
    ↓
All Components Update (via subscription or hook)
```

## Persistence

Settings are automatically persisted to AsyncStorage with the following keys:

- `conversation_voice`: Selected voice
- `conversation_speech_rate`: Speech rate
- `conversation_current_topic`: Current topic (JSON)

## API Reference

### conversationSettingsManager

#### Methods

**initialize()**
```javascript
await conversationSettingsManager.initialize();
```
Load settings from AsyncStorage. Call once on app start.

**getSettings()**
```javascript
const settings = conversationSettingsManager.getSettings();
// Returns: { selectedVoice, speechRate, currentTopic }
```

**setVoice(voice)**
```javascript
await conversationSettingsManager.setVoice('nova');
```
Set selected voice and notify subscribers.

**setSpeechRate(rate)**
```javascript
await conversationSettingsManager.setSpeechRate(1.2);
```
Set speech rate and notify subscribers.

**setCurrentTopic(topic)**
```javascript
await conversationSettingsManager.setCurrentTopic({
  id: 'animals',
  title: 'Animals',
  description: 'Learn about animals',
  icon: '🐾',
  vocabulary: ['cat', 'dog', 'bird']
});
```
Set current topic and notify subscribers.

**clearCurrentTopic()**
```javascript
await conversationSettingsManager.clearCurrentTopic();
```
Clear current topic and notify subscribers.

**updateSettings(updates)**
```javascript
await conversationSettingsManager.updateSettings({
  selectedVoice: 'nova',
  speechRate: 1.2,
  currentTopic: topicObject
});
```
Update multiple settings at once.

**subscribe(callback)**
```javascript
const unsubscribe = conversationSettingsManager.subscribe((key, value, allSettings) => {
  // key: 'voice', 'speechRate', 'currentTopic', or 'all'
  // value: new value for that key
  // allSettings: complete settings object
});

// Later...
unsubscribe();
```
Subscribe to settings changes.

**resetToDefaults()**
```javascript
await conversationSettingsManager.resetToDefaults();
```
Reset all settings to default values.

**getAvailableVoices()**
```javascript
const voices = conversationSettingsManager.getAvailableVoices();
// Returns: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral']
```

**getAvailableSpeechRates()**
```javascript
const rates = conversationSettingsManager.getAvailableSpeechRates();
// Returns: [0.5, 0.7, 0.8, 1.0, 1.2]
```

## Best Practices

### 1. Initialize Early
Initialize the settings manager in your root component or app entry point:

```javascript
// App.js or index.js
useEffect(() => {
  conversationSettingsManager.initialize();
}, []);
```

### 2. Use the Hook for Components
Prefer using the `useConversationSettings` hook for cleaner code:

```javascript
// ✅ Good
const { selectedVoice, setVoice } = useConversationSettings();

// ❌ Less clean
const [voice, setVoice] = useState('alloy');
useEffect(() => {
  conversationSettingsManager.initialize();
  const unsubscribe = conversationSettingsManager.subscribe(...);
  return unsubscribe;
}, []);
```

### 3. Always Unsubscribe
When using direct manager subscription, always clean up:

```javascript
useEffect(() => {
  const unsubscribe = conversationSettingsManager.subscribe(handleChange);
  return () => unsubscribe(); // Important!
}, []);
```

### 4. Handle Async Operations
Settings updates are async (due to AsyncStorage). Use async/await:

```javascript
const handleVoiceChange = async (newVoice) => {
  await setVoice(newVoice);
  console.log('Voice updated successfully');
};
```

### 5. Batch Updates
When updating multiple settings, use `updateSettings`:

```javascript
// ✅ Good - single storage write
await conversationSettingsManager.updateSettings({
  selectedVoice: 'nova',
  speechRate: 1.2,
});

// ❌ Less efficient - two storage writes
await conversationSettingsManager.setVoice('nova');
await conversationSettingsManager.setSpeechRate(1.2);
```

## Troubleshooting

### Settings Not Syncing

**Problem**: Changes in one component don't reflect in another

**Solutions**:
1. Ensure `initialize()` is called before using settings
2. Check subscription is active (`useEffect` cleanup)
3. Verify AsyncStorage permissions

### Settings Lost on App Restart

**Problem**: Settings revert to defaults after app restart

**Solutions**:
1. Ensure `await` is used with set methods
2. Check AsyncStorage is working (try `AsyncStorage.getItem` directly)
3. Verify app has storage permissions

### Multiple Initializations

**Problem**: Settings manager initialized multiple times

**Solutions**:
1. Call `initialize()` only once in app root
2. Use `isInitialized` flag from hook
3. Check for multiple root components

## Testing

### Unit Tests

```javascript
import conversationSettingsManager from '../services/conversationSettingsManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('ConversationSettingsManager', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('should initialize with default values', async () => {
    await conversationSettingsManager.initialize();
    const settings = conversationSettingsManager.getSettings();
    expect(settings.selectedVoice).toBe('alloy');
    expect(settings.speechRate).toBe(1.0);
  });

  it('should persist voice changes', async () => {
    await conversationSettingsManager.setVoice('nova');
    const voice = await AsyncStorage.getItem('conversation_voice');
    expect(voice).toBe('nova');
  });

  it('should notify subscribers', async () => {
    const callback = jest.fn();
    conversationSettingsManager.subscribe(callback);
    await conversationSettingsManager.setVoice('nova');
    expect(callback).toHaveBeenCalledWith('voice', 'nova', expect.any(Object));
  });
});
```

### Integration Tests

Test in actual components to ensure proper synchronization.

## Migration Guide

### Migrating from Component State

**Before:**
```javascript
const [selectedVoice, setSelectedVoice] = useState('alloy');
const [speechRate, setSpeechRate] = useState(1.0);

useEffect(() => {
  AsyncStorage.getItem('voicePreference').then(setSelectedVoice);
}, []);

const handleVoiceChange = async (voice) => {
  setSelectedVoice(voice);
  await AsyncStorage.setItem('voicePreference', voice);
};
```

**After:**
```javascript
const { selectedVoice, speechRate, setVoice } = useConversationSettings();

const handleVoiceChange = async (voice) => {
  await setVoice(voice);
};
```

## Future Enhancements

- [ ] Cloud sync for authenticated users
- [ ] Settings history/undo
- [ ] Per-topic voice preferences
- [ ] Custom voice profiles
- [ ] Settings import/export
- [ ] Analytics integration

## Support

For issues or questions:
1. Check this documentation
2. Review component integration examples
3. Check console logs for error messages
4. Verify AsyncStorage functionality

---

**Last Updated**: 2025-10-13
**Version**: 1.0.0

