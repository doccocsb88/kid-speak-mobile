#!/bin/bash

# Build Android Release AAB for Play Store Internal Testing
# Usage: ./build-android-release.sh
# 
# Optional environment variables:
#   KEYSTORE_PASSWORD - Password for keystore
#   KEY_ALIAS - Key alias (default: kidspeak)
#   KEY_PASSWORD - Key password (default: same as KEYSTORE_PASSWORD)

echo "🔨 Building Android Release AAB for Play Store..."
echo "=================================================="
echo ""

cd "$(dirname "$0")"

# Check if keystore exists
KEYSTORE_PATH="android-cer/kidspeak.jks"
if [ ! -f "$KEYSTORE_PATH" ]; then
    echo "❌ Error: Keystore file not found at $KEYSTORE_PATH"
    exit 1
fi

echo "✅ Found keystore: $KEYSTORE_PATH"

# Check for keystore password
if [ -z "$KEYSTORE_PASSWORD" ]; then
    echo ""
    echo "⚠️  KEYSTORE_PASSWORD not set in environment"
    echo "   You can either:"
    echo "   1. Set environment variable: export KEYSTORE_PASSWORD=your_password"
    echo "   2. Create android/keystore.properties file with:"
    echo "      storePassword=your_password"
    echo "      keyAlias=kidspeak"
    echo "      keyPassword=your_password"
    echo ""
    read -sp "Enter keystore password (or press Enter to skip): " KEYSTORE_PASSWORD
    echo ""
    if [ -n "$KEYSTORE_PASSWORD" ]; then
        export KEYSTORE_PASSWORD
        export KEY_PASSWORD=${KEY_PASSWORD:-$KEYSTORE_PASSWORD}
        export KEY_ALIAS=${KEY_ALIAS:-kidspeak}
    fi
fi

echo ""
echo "📦 Step 1: Cleaning previous builds..."
cd android
./gradlew clean
if [ $? -ne 0 ]; then
    echo "❌ Clean failed!"
    exit 1
fi
cd ..

echo ""
echo "📱 Step 2: Building Release AAB with keystore..."
cd android
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    echo ""
    echo "💡 Tip: If signing failed, check:"
    echo "   1. Keystore password is correct"
    echo "   2. Key alias is correct (default: kidspeak)"
    echo "   3. Keystore file exists at: $KEYSTORE_PATH"
    exit 1
fi
cd ..

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 AAB file location:"
echo "   android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📝 Next steps to test IAP:"
echo ""
echo "1. Upload AAB to Play Console:"
echo "   - Go to: https://play.google.com/console"
echo "   - Select your app"
echo "   - Release → Testing → Internal testing"
echo "   - Create new release"
echo "   - Upload: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "2. Add License Testers:"
echo "   - Settings → License testing"
echo "   - Add your Gmail email"
echo ""
echo "3. Add Internal Testers:"
echo "   - Testing → Internal testing → Testers"
echo "   - Add email addresses"
echo ""
echo "4. Download from Play Store:"
echo "   - Testers will receive email with Internal testing link"
echo "   - Download app from Play Store (NOT install APK directly)"
echo "   - Test IAP in the downloaded app"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - IAP only works with apps downloaded from Play Store"
echo "   - Direct APK installation will NOT work for IAP"
echo "   - Must wait for Play Store to process (can take 1-2 hours)"

