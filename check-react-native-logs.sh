#!/bin/bash

# Script to check React Native JS logs specifically
# Usage: ./check-react-native-logs.sh

echo "🔍 Checking React Native JS logs..."
echo "=========================================="
echo ""

# Check if adb is available
if ! command -v adb &> /dev/null; then
    echo "❌ adb not found. Please install Android SDK platform-tools."
    exit 1
fi

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "⚠️  No Android device/emulator connected."
    echo "Please connect a device or start an emulator."
    exit 1
fi

echo "📱 Connected devices:"
adb devices
echo ""

echo "📝 React Native JS logs (console.log, console.warn, console.error)..."
echo "Press Ctrl+C to stop"
echo ""

# Clear logs first
adb logcat -c

# Filter for React Native JS logs
adb logcat | grep -iE "ReactNativeJS|console|\[Audio\]|\[TTS\]|\[Voice\]|\[API\]|playAudio|playApiAudio|RNFS|react-native-fs|SpeakingScreen" --color=always

