#!/bin/bash

echo "🚀 Starting KidSpeak React Native App for iOS..."
echo "📱 Make sure you have Xcode installed and an iOS simulator running"
echo ""

# Check if Metro is running
if ! pgrep -f "react-native start" > /dev/null; then
    echo "🔄 Starting Metro bundler..."
    npx react-native start --reset-cache &
    sleep 5
fi

echo "📲 Building and running iOS app..."
npx react-native run-ios

echo "✅ App should now be running on iOS simulator!"
