#!/bin/bash

# Rebuild Android app with IAP fixes
# Usage: ./rebuild-android-iap.sh

echo "🔧 Rebuilding Android app with IAP fixes..."
echo "============================================"
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
echo "This will compile the updated KSPurchaseManager.kt"
echo ""

npm run android

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📝 Next steps:"
echo "1. Check logs for KSPurchaseManager messages:"
echo "   adb logcat | grep KSPurchaseManager"
echo ""
echo "2. Common issues:"
echo "   - 'Billing service unavailable' usually means:"
echo "     * Google Play Services not installed on device/emulator"
echo "     * App not uploaded to Play Store (internal testing required)"
echo "     * Testing on emulator without Google Play Store"
echo ""
echo "3. To test IAP properly:"
echo "   - Upload app to Play Store internal testing track"
echo "   - Test on real device with Google Play Store"
echo "   - Or use emulator with Google Play Services"

