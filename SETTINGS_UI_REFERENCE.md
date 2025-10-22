# Conversation Settings UI - Visual Reference Guide

## 🎨 UI Layout

```
┌─────────────────────────────────────────┐
│  Conversation Settings            [✕]  │ ← Header (Blue #007AFF)
├─────────────────────────────────────────┤
│                                         │
│  📚 Current Topic         [Change ›]    │
│  ┌───────────────────────────────────┐ │
│  │ 🎨 Colors                         │ │
│  │ Learn basic colors in English     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🎓 Pedagogy                      ▶    │ ← Collapsed
│                                         │
│  💬 Language Shaping              ▼    │ ← Expanded
│  ├─────────────────────────────────────┤
│  │ Max Words/Sentence: 10              │
│  │ [5] [10] [15] [20]                  │
│  │                                     │
│  │ Max Sentences/Turn: 2               │
│  │ [1] [2] [3] [4]                     │
│  │                                     │
│  │ Emoji Usage                         │
│  │ [Off] [Light] [Medium]              │
│  └─────────────────────────────────────┘
│                                         │
│  🎮 Engagement & Games            ▶    │
│                                         │
│  🔄 Flow & Topic                  ▶    │
│                                         │
│  🛡️ Safety & Content              ▶    │
│                                         │
│  🎤 Voice & Speech                ▼    │ ← Open by default
│  ├─────────────────────────────────────┤
│  │ Voice Policy                        │
│  │ [Auto] [Fixed]                      │
│  │                                     │
│  │ Voice                               │
│  │ [Alloy] [Echo] [Fable]              │
│  │ [Onyx] [Nova] [Shimmer]             │
│  │                                     │
│  │ Speaking Rate                       │
│  │ [Slow] [Normal]                     │
│  └─────────────────────────────────────┘
│                                         │
│  ⚙️ Advanced (Model)              ▶    │
│                                         │
└─────────────────────────────────────────┘
```

## 📋 Section Details

### 📚 Current Topic
**Purpose:** Shows the active conversation topic  
**Features:**
- Displays topic icon, title, and description
- "Change" button opens topic selector
- Blue left border accent

```
┌───────────────────────────────────┐
│ 🎨 Colors                         │
│ Learn basic colors in English     │
└───────────────────────────────────┘
```

---

### 🎓 Pedagogy (7 options)

#### Grammar Check
- **Type:** Toggle Switch
- **Values:** On/Off
- **Default:** On
- **Description:** Correct grammar mistakes

#### Force Repeat
- **Type:** Enum Selector (3 buttons)
- **Values:** Off | Soft | Strict
- **Default:** Soft
- **Colors:** 
  - Inactive: Gray (#f0f0f0)
  - Active: Blue (#007AFF)

```
Force Repeat
[Off] [Soft✓] [Strict]
```

#### Correction Mode
- **Type:** Enum Selector (3 buttons)
- **Values:** Implicit | Explicit | Sandwich
- **Default:** Explicit

#### Difficulty
- **Type:** Enum Selector (4 buttons)
- **Values:** Auto | Starters | Movers | Flyers
- **Default:** Auto

#### Focus Areas
- **Type:** Multi-Select (4 buttons)
- **Values:** Pronunciation | Vocabulary | Grammar | Fluency
- **Default:** [Vocabulary, Pronunciation]
- **Colors:**
  - Inactive: Gray (#f0f0f0)
  - Active: Green (#34C759)
- **Note:** Can select multiple

```
Focus Areas
[Pronunciation✓] [Vocabulary✓] [Grammar] [Fluency]
```

#### Min Examples/Point
- **Type:** Number Slider (5 buttons)
- **Values:** 1 | 2 | 3 | 4 | 5
- **Default:** 1

#### Scaffold Level
- **Type:** Number Slider (4 buttons)
- **Values:** 0 | 1 | 2 | 3
- **Default:** 1

---

### 💬 Language Shaping (6 options)

#### Max Words/Sentence
- **Type:** Number Slider
- **Values:** 5 | 10 | 15 | 20
- **Default:** 10
- **Display:** "Max Words/Sentence: 10"

#### Max Sentences/Turn
- **Type:** Number Slider
- **Values:** 1 | 2 | 3 | 4
- **Default:** 2

#### Emoji Usage
- **Type:** Enum Selector
- **Values:** Off | Light | Medium
- **Default:** Light

#### Bilingual Support
- **Type:** Enum Selector
- **Values:** Off | Keyword | Brief Hint
- **Default:** Off

#### IPA Pronunciation
- **Type:** Toggle Switch
- **Default:** Off
- **Description:** Show phonetic symbols

#### Phonics Hints
- **Type:** Toggle Switch
- **Default:** Off
- **Description:** Show phonics help

---

### 🎮 Engagement & Games (6 options)

#### Anti-Loop Protection
- **Type:** Toggle Switch
- **Default:** On
- **Description:** Prevent repetitive responses

#### Re-engage After
- **Type:** Number Slider
- **Values:** 15s | 30s | 45s | 60s
- **Default:** 30s

#### Re-engage Style
- **Type:** Enum Selector
- **Values:** Playful | Calm | Quiz
- **Default:** Playful

#### Activity Preference
- **Type:** Multi-Select
- **Values:** 
  - repeat_after_me
  - AB_choice
  - fill_blank
  - roleplay
  - counting
  - spelling_bee
- **Default:** [repeat_after_me, AB_choice, fill_blank]

```
Activity Preference
[repeat after me✓] [AB choice✓] [fill blank✓]
[roleplay] [counting] [spelling bee]
```

#### Praise Frequency
- **Type:** Enum Selector
- **Values:** Low | Normal | High
- **Default:** Normal

#### Challenge Ratio
- **Type:** Number Slider
- **Values:** 0.0 | 0.2 | 0.4 | 0.6 | 0.8 | 1.0
- **Default:** 0.4

---

### 🔄 Flow & Topic (3 options)

#### Topic Strictness
- **Type:** Enum Selector
- **Values:** Loose | Normal | Strict
- **Default:** Normal

#### Open Question Ratio
- **Type:** Number Slider
- **Values:** 0.0 | 0.1 | 0.2 | ... | 1.0 (step 0.1)
- **Default:** 0.3

#### Wrap-up After Turns
- **Type:** Number Slider
- **Values:** 10 | 15 | 20 | 25 | 30
- **Default:** 14

---

### 🛡️ Safety & Content (2 options)

#### Profanity Filter
- **Type:** Toggle Switch
- **Default:** On
- **Description:** Block inappropriate content

#### Age Gate
- **Type:** Number Slider
- **Values:** 3 yrs | 4 yrs | 5 yrs | ... | 12 yrs
- **Default:** 6 yrs

---

### 🎤 Voice & Speech (5 options)

#### Voice Policy
- **Type:** Enum Selector
- **Values:** Auto | Fixed
- **Default:** Auto
- **Note:** 
  - Auto = Voice changes by engagement level
  - Fixed = Uses selected voice always

#### Voice
- **Type:** Voice Grid (6 buttons)
- **Values:** Alloy | Echo | Fable | Onyx | Nova | Shimmer
- **Default:** Alloy
- **Layout:** 2-3 buttons per row

```
Voice
[Alloy✓] [Echo] [Fable]
[Onyx] [Nova] [Shimmer]
```

#### Speaking Rate
- **Type:** Enum Selector
- **Values:** Slow | Normal
- **Default:** Slow

#### SSML Support
- **Type:** Toggle Switch
- **Default:** Off
- **Description:** Use Speech Synthesis Markup

#### Pause Between Sentences
- **Type:** Number Slider
- **Values:** 100ms | 200ms | 300ms | 400ms | 500ms
- **Default:** 250ms

---

### ⚙️ Advanced (Model) (3 options)

#### Temperature
- **Type:** Number Slider
- **Values:** 0.3 | 0.4 | 0.5 | ... | 1.2 (step 0.1)
- **Default:** 0.7
- **Color:** Orange (#FF9500)

#### Frequency Penalty
- **Type:** Number Slider
- **Values:** 0.0 | 0.1 | 0.2 | ... | 1.0 (step 0.1)
- **Default:** 0.3

#### Presence Penalty
- **Type:** Number Slider
- **Values:** 0.0 | 0.1 | 0.2 | ... | 1.0 (step 0.1)
- **Default:** 0.2

---

## 🎨 Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Header Background | Blue | #007AFF |
| Primary Buttons | Blue | #007AFF |
| Voice/Multi-Select Active | Green | #34C759 |
| Number Slider Active | Orange | #FF9500 |
| Background | Light Gray | #f5f5f7 |
| Card Background | White | #ffffff |
| Inactive Buttons | Light Gray | #f0f0f0 |
| Border | Light Gray | #e5e5ea |
| Text Primary | Black | #000000 |
| Text Secondary | Gray | #666666 |
| Text Tertiary | Light Gray | #8e8e93 |

---

## 📐 Spacing & Layout

- **Modal Height:** 85% of screen
- **Header Height:** ~50px
- **Section Padding:** 20px horizontal, 14px vertical
- **Option Row Padding:** 20px horizontal, 12px vertical
- **Button Padding:** 12-14px horizontal, 6-9px vertical
- **Button Border Radius:** 14-18px
- **Gap Between Buttons:** 8px
- **Font Sizes:**
  - Header Title: 18px
  - Section Title: 16px
  - Option Label: 15px
  - Button Text: 13px
  - Description: 13px

---

## 🔄 Interaction States

### Buttons
1. **Default:** Gray background, gray text, gray border
2. **Active:** Colored background (blue/green/orange), white text, matching border
3. **Pressed:** Slightly darker shade (via `activeOpacity={0.7}`)

### Switches
1. **Off:** Light gray track (#d1d1d6), white thumb
2. **On:** Green track (#34C759), white thumb

### Collapsible Sections
1. **Collapsed:** Chevron points right (▶), content hidden
2. **Expanded:** Chevron points down (▼), content visible

---

## 💡 UX Features

1. **Smart Defaults:** Only "Voice & Speech" section open by default
2. **Visual Hierarchy:** Icons + clear section titles
3. **Scrollable:** Full vertical scroll support
4. **Responsive:** Button text wraps gracefully
5. **Immediate Feedback:** All changes apply instantly
6. **Persistent:** Auto-saved to AsyncStorage
7. **Reversible:** Can collapse sections to reduce clutter

---

## 🚀 Performance Notes

- **Lazy Rendering:** Collapsed sections don't render content
- **Optimized Re-renders:** Only changed options trigger updates
- **Lightweight:** No heavy animations or transitions
- **Fast Load:** Default values load instantly, saved values async

---

## 📱 Mobile Optimization

- **Touch Targets:** All buttons ≥44x44 points
- **Scrolling:** Smooth native scroll
- **Gestures:** Swipe down to close modal
- **Safe Areas:** Header respects safe area insets
- **Landscape:** Fully functional in both orientations

---

**Created:** 2025-10-14  
**Version:** 2.0  
**Last Updated:** 2025-10-14

