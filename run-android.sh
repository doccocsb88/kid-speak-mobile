#!/bin/bash

echo "🚀 Starting KidSpeak React Native App for Android..."
echo "📱 Make sure you have Android Studio installed and an emulator running"
echo ""

# Check if Metro is running
if ! pgrep -f "react-native start" > /dev/null; then
    echo "🔄 Starting Metro bundler..."
    npx react-native start --reset-cache &
    sleep 5
fi

echo "📲 Building and running Android app..."
npx react-native run-android

echo "✅ App should now be running on Android emulator!"
