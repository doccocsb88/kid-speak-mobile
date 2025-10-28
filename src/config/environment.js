// Environment configuration for React Native
const getApiUrl = () => {
  // Check if we're in development mode
  const isDev = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development URLs - Use your computer's IP address for real device testing
    // Replace 192.168.2.73 with your actual IP address
    return 'http://172.16.2.124:5000/api';
    // return 'http://192.168.2.73:5000/api';
  } else {
    // Production URL - Update this with your actual production backend URL
    return 'https://kid-speak-backend.vercel.app/api';
  }
};

const config = {
  // API Configuration
  API_BASE_URL: getApiUrl(),
  
  // App Configuration
  APP_NAME: 'KidSpeak',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_VOICE_RECOGNITION: true,
  ENABLE_TTS: true,
  ENABLE_GUEST_MODE: true,
  
  // TTS Configuration
  DEFAULT_VOICE: 'alloy',
  DEFAULT_SPEECH_RATE: 0.8,
  
  // Speech Recognition Configuration
  SPEECH_RECOGNITION_LANGUAGE: 'en-US',
  
  // Timeout Configuration
  API_TIMEOUT: 30000, // 30 seconds
  TTS_TIMEOUT: 30000, // 30 seconds
  AUTO_PROMPT_TIMEOUT: 30000, // 30 seconds
};

export default config;
