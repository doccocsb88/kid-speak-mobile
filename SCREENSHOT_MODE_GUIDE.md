# 📸 Screenshot Mode Guide for AppStore Preview

## Overview
This guide explains how to use Screenshot Mode to generate beautiful conversation previews for AppStore screenshots. There are two screenshot modes available:
1. **ChatPage Screenshot Mode** - For text chat interface
2. **SpeakingScreen Screenshot Mode** - For voice/speaking interface

## How to Use

### Option 1: ChatPage Screenshot Mode (Text Chat Interface)

#### Step 1: Enable Screenshot Mode
Open `mobile/src/pages/ChatPage.js` and find line 74:

```javascript
const SCREENSHOT_MODE = false; // Change to true when taking screenshots
```

Change it to:

```javascript
const SCREENSHOT_MODE = true; // Change to true when taking screenshots
```

### Option 2: SpeakingScreen Screenshot Mode (Voice Interface)

#### Step 1: Enable Screenshot Mode
Open `mobile/src/components/SpeakingScreen.js` and find line 111:

```javascript
const SCREENSHOT_MODE = false; // Change to true when taking screenshots
```

Change it to:

```javascript
const SCREENSHOT_MODE = true; // Change to true when taking screenshots
```

### Step 2: Run the App
```bash
cd mobile
npm start
# or
npx react-native run-ios
# or
npx react-native run-android
```

### Step 3: Navigate to Screen
- **For ChatPage:** The conversation loads automatically on the main chat screen
- **For SpeakingScreen:** Tap the microphone/speak button to enter speaking mode

### Step 4: Take Screenshots
- Wait 1-2 seconds for the conversation to fully load
- Both bubbles and text will appear automatically
- Take your screenshots for AppStore submission

### Step 5: Disable Screenshot Mode
After taking screenshots, remember to set it back in both files:

```javascript
const SCREENSHOT_MODE = false; // Change to true when taking screenshots
```

## Sample Conversation Previews

### ChatPage Conversation (Text Chat)

**Topic:** Daily Activities 📅

1. **AI:** "Hey there! 👋 Tell me, what's your favorite part of the day? Morning, afternoon, or evening?"
   
2. **User:** "I love the afternoon! I play with my friends!"

3. **AI:** "That sounds so fun! 🎮 What games do you play together? Tag, hide and seek, or video games?"

4. **User:** "We play soccer at the park! ⚽"

5. **AI:** "Awesome! ⚽️ Soccer is great exercise! How long do you usually play? And do you drink water after playing?"

6. **User:** "We play for one hour. Yes, I always drink water!"

7. **AI:** "Perfect! 💧 You're doing everything right! After playing soccer, what do you do next? Homework or dinner time?"

---

### SpeakingScreen Conversation (Voice Mode)

**Topic:** Daily Activities 📅

1. **User:** "I wake up at 7 o'clock every morning!"

2. **AI:** "That's great! 🌅 7 o'clock is a good time to wake up! What do you do after waking up?"

3. **User:** "I take a shower and get dressed for school."

4. **AI:** "Perfect! 🚿 Taking a shower in the morning helps you feel fresh! Do you eat breakfast before going to school?"

5. **User:** "Yes! I usually eat cereal and drink orange juice."

6. **AI:** "Excellent! 🥣🍊 Breakfast is the most important meal of the day! It gives you energy for learning. What time do you go to bed at night?"

**Note:** The SpeakingScreen shows the last user message in the "You said:" bubble and the last AI response in the "App responds:" bubble.

## Customizing the Sample Conversation

### For ChatPage
Edit the `loadSampleConversation()` function in `ChatPage.js` (around line 82).

### For SpeakingScreen
Edit the `loadSampleConversation()` function in `SpeakingScreen.js` (around line 157).

You can modify:
- Message texts
- Emojis
- Topic information
- Number of messages
- User/AI response order

## Tips for Best Screenshots

1. **Clean UI**: The sample conversation is designed to show natural, engaging dialogue
2. **Emojis**: Emojis make the conversation more visually appealing
3. **Length**: 6-7 messages are ideal for showing conversation flow without overcrowding
4. **Educational Value**: The conversation demonstrates the learning aspect of the app
5. **Engagement**: Shows both question/answer and encouragement from the AI teacher

## Different Topics (Optional)

You can create different sample conversations for different topics by modifying the function:

### Example: Food & Nutrition Topic
```javascript
const sampleMessages = [
  {
    sender: 'ai',
    text: "What's your favorite food? 🍕🍎🍜"
  },
  {
    sender: 'user',
    text: "I love pizza and ice cream!"
  },
  {
    sender: 'ai',
    text: "Yummy! 😋 Pizza and ice cream are tasty! Do you also eat vegetables and fruits?"
  },
  // ... more messages
];

setSelectedTopic({ 
  id: 'food-nutrition', 
  title: 'Food & Nutrition',
  description: 'Learn about healthy eating and your favorite foods',
  icon: '🍎'
});
```

## Troubleshooting

**Problem:** Conversation doesn't appear
- Solution: Make sure SCREENSHOT_MODE is set to true in the correct file
- Solution: Check console logs for "🎬 Screenshot mode: Sample conversation loaded"
- Solution: For SpeakingScreen, make sure you navigated to the speaking mode screen

**Problem:** SpeakingScreen crashes or shows errors
- Solution: Screenshot mode disables Voice listeners - this is normal and intended
- Solution: Make sure to disable SCREENSHOT_MODE before testing real voice functionality

**Problem:** UI looks different than expected
- Solution: Clear app cache and restart
- Solution: Make sure you're using the latest version of the code
- Solution: Wait 1-2 seconds for animations to complete

**Problem:** Want to test with real conversation
- Solution: Set SCREENSHOT_MODE back to false in both files and use the app normally

**Problem:** Both bubbles don't show in SpeakingScreen
- Solution: The animations take ~800ms to load, be patient
- Solution: Check console for animation errors

## Important Notes

⚠️ **Always disable SCREENSHOT_MODE in BOTH files before building for production or submitting to stores!**
- `mobile/src/pages/ChatPage.js` line 74
- `mobile/src/components/SpeakingScreen.js` line 111

✅ This feature is only for creating marketing materials and AppStore previews

✅ The sample conversations are in English to appeal to wider audience in AppStore

✅ Voice recognition is automatically disabled in SpeakingScreen screenshot mode to prevent errors

✅ Each screen has a different conversation sample to show variety in the app

---

**Created:** October 28, 2025
**Last Updated:** October 28, 2025
**Version:** 1.0

