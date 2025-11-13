#!/bin/bash

# Rebuild Android app after adding react-native-fs
# Usage: ./rebuild-android-audio.sh

echo "🔧 Rebuilding Android app with react-native-fs..."
echo "=================================================="
echo ""

cd "$(dirname "$0")"

echo "📦 Step 1: Cleaning Android build..."
cd android
./gradlew clean
if [ $? -ne 0 ]; then
    echo "❌ Clean failed!"
    exit 1
fi
cd ..

echo ""
echo "📱 Step 2: Rebuilding and running Android app..."
echo "This will install react-native-fs native module"
echo ""

npm run android

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📝 Next steps:"
echo "1. Watch logs with: ./debug-audio.sh"
echo "2. Test audio playback in the app"
echo "3. Check for [Audio] logs in the console"

