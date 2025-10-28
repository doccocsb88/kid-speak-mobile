# 📸 Screenshot Mode - Quick Reference

## Enable Screenshot Mode

### ChatPage (Text Interface)
```javascript
// File: mobile/src/pages/ChatPage.js (line 74)
const SCREENSHOT_MODE = true;
```

### SpeakingScreen (Voice Interface)  
```javascript
// File: mobile/src/components/SpeakingScreen.js (line 111)
const SCREENSHOT_MODE = true;
```

---

## Sample Conversations

### 💬 ChatPage - Daily Activities
```
AI: "Hey there! 👋 Tell me, what's your favorite part of the day?"
User: "I love the afternoon! I play with my friends!"
AI: "That sounds so fun! 🎮 What games do you play together?"
User: "We play soccer at the park! ⚽"
AI: "Awesome! ⚽️ Soccer is great exercise! How long do you play?"
User: "We play for one hour. Yes, I always drink water!"
AI: "Perfect! 💧 What do you do next? Homework or dinner?"
```

### 🎤 SpeakingScreen - Daily Activities
```
User: "I wake up at 7 o'clock every morning!"
AI: "That's great! 🌅 What do you do after waking up?"
User: "I take a shower and get dressed for school."
AI: "Perfect! 🚿 Taking a shower helps you feel fresh!"
User: "Yes! I usually eat cereal and drink orange juice."
AI: "Excellent! 🥣🍊 Breakfast is the most important meal!"
```

---

## Steps

1. **Enable** - Set `SCREENSHOT_MODE = true` in desired file(s)
2. **Run** - `cd mobile && npm start`
3. **Navigate** - Go to desired screen
4. **Wait** - 1-2 seconds for animations
5. **Screenshot** - Take your AppStore preview images
6. **Disable** - Set `SCREENSHOT_MODE = false` in both files

---

## ⚠️ Important

- **Always disable before production builds!**
- Voice recognition is auto-disabled in SpeakingScreen screenshot mode
- Both files are independent - you can enable one or both

---

For full details, see [SCREENSHOT_MODE_GUIDE.md](./SCREENSHOT_MODE_GUIDE.md)

