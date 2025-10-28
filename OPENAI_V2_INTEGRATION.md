# OpenAI V2 Integration with Options

## Overview
Successfully integrated `getOpenAIResponseV2` with full options support across the mobile app and backend. The system now uses advanced AI teacher options for better pedagogy and engagement.

## Changes Made

### 1. Backend Route (`backend/src/routes/chatRoutes.js`)
- ✅ Added `options` parameter acceptance in `/chat/send-message` endpoint
- ✅ Pass options to `getOpenAIResponseV2()` for audio-enabled requests
- ✅ Pass options to `getOpenAIResponse()` for text-only requests
- ✅ Return additional response fields: `engagementLevel`, `style`, `options`

### 2. Mobile ChatPage (`mobile/src/pages/ChatPage.js`)
- ✅ Added options configuration in `sendMessage` function
- ✅ Added options configuration in auto-prompt handler (`handleAutoPrompt`)
- ✅ Options include:
  - `grammar_check: true`
  - `force_repeat: 'soft'`
  - `correction_mode: 'sandwich'`
  - `difficulty: 'starters'`
  - `focus: ['vocabulary', 'pronunciation']`
  - `emoji_usage: 'light'`
  - `anti_loop: true`
  - `activity_preference: ['AB_choice', 'repeat_after_me']`
  - `praise_frequency: 'high'`
  - `voice_policy: 'auto_by_level'`
  - `speaking_rate: 'slow'`
  - `temperature_base: 0.65`
  - `frequency_penalty: 0.4`

### 3. SpeakingScreen (`mobile/src/components/SpeakingScreen.js`)
- ✅ Added options configuration in `sendTranscript` function
- ✅ Same options structure as ChatPage for consistency
- ✅ Fixed inappropriate placeholder text in `fallbackReply` function

## Options Schema

The options object controls various aspects of the AI teacher's behavior:

### Pedagogy
- **grammar_check**: Enable/disable grammar corrections
- **force_repeat**: How strictly to enforce repetition ('off' | 'soft' | 'strict')
- **correction_mode**: How to deliver corrections ('implicit' | 'explicit' | 'sandwich')
- **difficulty**: Lesson difficulty level ('auto' | 'starters' | 'movers' | 'flyers')
- **focus**: Learning focus areas (vocabulary, pronunciation, grammar, fluency)
- **target_vocab**: Specific vocabulary words to practice

### Language Shaping
- **max_sentence_words**: Maximum words per sentence
- **max_sentences_per_turn**: Maximum sentences per response
- **emoji_usage**: Emoji frequency ('off' | 'light' | 'medium')

### Engagement
- **anti_loop**: Prevent repetitive responses
- **activity_preference**: Preferred activity types
- **praise_frequency**: How often to praise ('low' | 'normal' | 'high')

### Voice/TTS
- **voice_policy**: Voice selection strategy ('auto_by_level' | 'fixed')
- **speaking_rate**: Speech speed ('slow' | 'normal')

### Model Parameters
- **temperature_base**: AI creativity level (0-1.5)
- **frequency_penalty**: Reduce repetition (0-2)

## API Request Format

```javascript
const response = await axios.post(`${API_BASE_URL}/chat/send-message`, {
  message: "Hello teacher",
  topic: {
    id: 'animals',
    title: 'Animals',
    vocabulary: ['dragon', 'powerful', 'fly'],
    description: 'Learning about animals'
  },
  userInfo: {
    name: 'Student Name',
    age: 6
  },
  sessionId: 'session-id',
  includeAudio: true,
  voice: 'alloy',
  model: 'tts-1',
  options: {
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
    frequency_penalty: 0.4
  }
});
```

## API Response Format

```javascript
{
  success: true,
  data: {
    response: "AI teacher's text response",
    audio: Buffer, // MP3 audio (if includeAudio: true)
    audioFormat: 'mp3',
    voice: 'alloy',
    model: 'tts-1',
    engagementLevel: 'WARM_UP' | 'CORE' | 'CHALLENGE' | 'REENGAGE' | 'WRAP_UP',
    style: 'soft-friendly' | 'clear-slow' | 'energetic' | 'playful' | 'warm-summary',
    options: { /* sanitized options object */ },
    provider: 'openai',
    sessionId: 'session-id',
    chatHistoryLength: 5,
    includeAudio: true
  }
}
```

## Benefits

1. **Enhanced Pedagogy**: Grammar checking, correction modes, and scaffolding levels
2. **Better Engagement**: Anti-loop protection, dynamic activities, appropriate praise
3. **Personalization**: Difficulty levels, voice policies, and speaking rates
4. **Topic-Aware**: Automatically uses topic vocabulary in lessons
5. **Age-Appropriate**: Settings optimized for young learners (6-11 years)

## Testing Recommendations

1. Test with different topics and vocabulary lists
2. Verify grammar corrections work properly
3. Test auto-prompt with options
4. Test SpeakingScreen with voice recognition
5. Verify audio quality and speaking rate
6. Check engagement level progression
7. Test anti-loop behavior with repetitive inputs

## Notes

- Options are validated and sanitized by backend's `sanitizeOptions()` function
- Invalid options will fall back to safe defaults
- Voice policy 'auto_by_level' automatically selects voices based on engagement level
- Speaking rate 'slow' is recommended for young learners

## Files Modified

1. `/backend/src/routes/chatRoutes.js`
2. `/mobile/src/pages/ChatPage.js`
3. `/mobile/src/components/SpeakingScreen.js`

Date: October 14, 2025

