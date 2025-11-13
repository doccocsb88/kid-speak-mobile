#!/bin/bash

# Script to check audio playback logs on Android
# Usage: ./check-audio-logs.sh

echo "🔍 Checking Android audio playback logs..."
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

echo "🎵 Filtering audio-related logs..."
echo "Press Ctrl+C to stop"
echo ""

# Filter logs for audio, Sound, and our app
adb logcat -c  # Clear existing logs first
adb logcat | grep -iE "(Audio|Sound|react-native-sound|RNFS|react-native-fs|SpeakingScreen|playAudio|playApiAudio|TTS|native.*audio)" --color=always

