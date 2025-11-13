#!/bin/bash

echo "🔧 Rebuilding Android app to fix native module linking..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

echo "1️⃣ Cleaning Android build..."
cd android
./gradlew clean
cd ..

echo "2️⃣ Cleaning Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf /tmp/metro-*

echo "3️⃣ Cleaning React Native cache..."
rm -rf /tmp/react-*

echo "4️⃣ Cleaning Android build artifacts..."
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/build

echo "5️⃣ Reinstalling node modules..."
rm -rf node_modules
npm install

echo "6️⃣ Applying patches..."
npm run postinstall

echo "7️⃣ Building and running Android app..."
npx react-native run-android

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📋 Check logs for:"
echo "   - MainApplication: Autolinked packages"
echo "   - MainApplication: VoicePackage found in autolinking"
echo "   - MainApplication: Final packages"
echo ""
echo "If Voice module still doesn't work, check Android logs:"
echo "   adb logcat | grep -E 'MainApplication|Voice'"

