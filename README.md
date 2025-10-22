# KidSpeak Mobile - React Native App

A React Native application for English learning for kids, converted from React.js.

## Features

- **User Authentication**: Login/Register with guest mode support
- **Topic Selection**: Choose from various learning topics (Animals, Colors, Family, etc.)
- **Interactive Chat**: AI-powered English tutor with voice interaction
- **Text-to-Speech**: OpenAI TTS integration with voice controls
- **Speech Recognition**: Voice input for practicing pronunciation
- **User Profiles**: Age-appropriate content based on user information

## Prerequisites

- Node.js (>= 16)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **iOS Setup (macOS only):**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android Setup:**
   - Open Android Studio
   - Open the `android` folder
   - Sync Gradle files

4. **Quick Start Scripts:**
   ```bash
   # For iOS (macOS only)
   ./run-ios.sh
   
   # For Android
   ./run-android.sh
   ```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Development Server
```bash
npm start
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthWrapper.js   # Authentication wrapper
│   ├── Login.js         # Login form
│   ├── Register.js      # Registration form
│   ├── ChatBubble.js    # Chat message component
│   ├── TopicSelection.js # Topic selection grid
│   ├── UserInfo.js      # User information form
│   └── Header.js        # App header
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication context
├── pages/               # Main pages
│   └── ChatPage.js      # Main chat interface
├── services/            # API and external services
│   ├── authService.js   # Authentication service
│   └── ttsService.js    # Text-to-speech service
├── utils/               # Utility functions
│   └── sentenceSplitter.js # Text processing utilities
└── config/              # Configuration files
    └── api.js           # API configuration
```

## Key Dependencies

- **@react-navigation/native**: Navigation
- **react-native-sound**: Audio playback
- **react-native-voice**: Speech recognition
- **react-native-async-storage**: Local storage
- **axios**: HTTP client
- **react-native-permissions**: Permission handling

## Configuration

### API Configuration
Update `src/config/api.js` with your backend API URL:

```javascript
export const API_BASE_URL = 'http://your-api-url.com/api';
```

### Environment Variables
Create a `.env` file in the root directory:

```
REACT_APP_API_URL=http://your-api-url.com/api
```

## Features Converted from React.js

✅ **Authentication System**
- Login/Register forms with validation
- Guest mode support
- AsyncStorage for token management

✅ **UI Components**
- Responsive design adapted for mobile
- Touch-friendly interface
- Native mobile styling

✅ **Chat Interface**
- Real-time messaging
- Voice input/output
- Topic-based learning

✅ **Services**
- TTS integration with React Native Sound
- Speech recognition with react-native-voice
- API integration with axios

## Development Notes

- The app uses React Native's StyleSheet for styling instead of CSS
- Voice recognition requires microphone permissions
- TTS requires network connection for OpenAI API
- AsyncStorage replaces localStorage for data persistence

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx react-native start --reset-cache
   ```

2. **iOS build issues:**
   ```bash
   cd ios && pod install && cd ..
   ```

3. **Android build issues:**
   - Clean and rebuild in Android Studio
   - Check Android SDK and build tools versions

### Permissions

Make sure to grant the following permissions:
- **Microphone**: For speech recognition
- **Internet**: For API calls and TTS
- **Storage**: For caching audio files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

## License

This project is licensed under the MIT License.