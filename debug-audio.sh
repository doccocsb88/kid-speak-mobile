#!/bin/bash

# Comprehensive audio debugging script
# Usage: ./debug-audio.sh

echo "🔍 Audio Playback Debugging Tool"
echo "================================="
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

# Get package name (adjust if different)
PACKAGE_NAME="com.kidspeak"

echo "🔍 Step 1: Checking if app is installed..."
if adb shell pm list packages | grep -q "$PACKAGE_NAME"; then
    echo "✅ App is installed: $PACKAGE_NAME"
else
    echo "❌ App not found: $PACKAGE_NAME"
    echo "Please install the app first."
    exit 1
fi
echo ""

echo "🔍 Step 2: Checking React Native JS logs..."
echo "Looking for: [Audio], [TTS], [Voice], [API], playAudio, RNFS"
echo "Press Ctrl+C to stop watching logs"
echo ""

# Clear logs first
adb logcat -c

# Watch for React Native logs with multiple filters
adb logcat | grep -iE "ReactNativeJS|ReactNative|\[Audio\]|\[TTS\]|\[Voice\]|\[API\]|playAudio|playApiAudio|RNFS|react-native-fs|SpeakingScreen|Sound|Error|Exception" --color=always

