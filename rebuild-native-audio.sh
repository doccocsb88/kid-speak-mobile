#!/bin/bash

# Rebuild Android app with native audio module
# Usage: ./rebuild-native-audio.sh

echo "🔧 Rebuilding Android app with Native Audio Player module..."
echo "============================================================"
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
echo "This will compile the new NativeAudioPlayerModule.kt"
echo ""

npm run android

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📝 Next steps:"
echo "1. Watch logs with: ./debug-audio.sh"
echo "2. Test audio playback in the app"
echo "3. Look for these logs:"
echo "   - [Audio] Android detected - using native audio service"
echo "   - 🔊 Native audio service: Starting playback on android..."
echo "   - ✅ Native audio service: Playback started"
echo "   - 🎵 Native audio TRULY finished"

