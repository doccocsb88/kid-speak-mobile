#!/bin/bash

# Setup Native IAP - Custom Implementation (No third-party dependencies)

echo "🎯 ================================================"
echo "🎯 SETUP NATIVE IAP MODULE"
echo "🎯 Không cần react-native-iap"
echo "🎯 ================================================"
echo ""

# Check directory
if [ ! -f "package.json" ]; then
    echo "❌ Vui lòng chạy trong thư mục mobile/"
    exit 1
fi

# Remove react-native-iap if exists
echo "🧹 Bước 1: Dọn dẹp react-native-iap (nếu có)..."
if grep -q "react-native-iap" package.json; then
    echo "Removing react-native-iap..."
    npm uninstall react-native-iap
    echo "✅ Đã xóa react-native-iap"
else
    echo "✅ react-native-iap không tồn tại"
fi
echo ""

# iOS Setup
echo "🍎 Bước 2: iOS Setup..."
echo ""
echo "Files đã được tạo:"
echo "  ✅ ios/KidSpeak/KSPurchaseManager.swift"
echo "  ✅ ios/KidSpeak/KSPurchaseManager.m"
echo ""
echo "⚠️  CẦN LÀM THỦ CÔNG:"
echo "  1. Mở Xcode: open ios/KidSpeak.xcworkspace"
echo "  2. Add 2 files trên vào project (nếu chưa có)"
echo "  3. Enable 'In-App Purchase' capability"
echo ""
read -p "Nhấn Enter khi đã hoàn thành iOS setup..."
echo ""

# Android Setup
echo "🤖 Bước 3: Android Setup..."
echo ""
echo "Files đã được tạo:"
echo "  ✅ android/.../KSPurchaseManager.kt"
echo "  ✅ android/.../KSPurchasePackage.kt"
echo "  ✅ android/.../MainApplication.java (updated)"
echo ""

# Check build.gradle
BUILD_GRADLE="android/app/build.gradle"
if grep -q "billing:6.0.1" "$BUILD_GRADLE"; then
    echo "✅ Billing dependency đã có"
else
    echo "⚠️  CẦN THÊM vào android/app/build.gradle:"
    echo ""
    echo "dependencies {"
    echo "    implementation 'com.android.billingclient:billing:6.0.1'"
    echo "    implementation 'com.android.billingclient:billing-ktx:6.0.1'"
    echo "}"
    echo ""
fi

# Check AndroidManifest
MANIFEST="android/app/src/main/AndroidManifest.xml"
if grep -q "com.android.vending.BILLING" "$MANIFEST"; then
    echo "✅ BILLING permission đã có"
else
    echo "⚠️  CẦN THÊM vào AndroidManifest.xml:"
    echo ""
    echo '<uses-permission android:name="com.android.vending.BILLING" />'
    echo ""
fi

echo ""

# React Native
echo "⚛️  Bước 4: React Native..."
echo "  ✅ src/services/nativeIapService.js"
echo "  ✅ src/components/PaywallScreen.js (updated)"
echo ""

# Clean & rebuild
echo "🧹 Bước 5: Clean & Rebuild..."
echo ""
echo "iOS:"
echo "  cd ios && xcodebuild clean && cd .."
echo ""
echo "Android:"
echo "  cd android && ./gradlew clean && cd .."
echo ""

# Summary
echo "✅ ================================================"
echo "✅ SETUP HOÀN TẤT"
echo "✅ ================================================"
echo ""
echo "📋 CẦN LÀM TIẾP:"
echo ""
echo "1. 🍎 iOS - Xcode:"
echo "   open ios/KidSpeak.xcworkspace"
echo "   - Add Swift files vào project"
echo "   - Enable In-App Purchase capability"
echo "   - Build"
echo ""
echo "2. 🤖 Android - build.gradle:"
echo "   - Thêm billing dependencies (nếu chưa)"
echo "   - Thêm BILLING permission (nếu chưa)"
echo "   - Build"
echo ""
echo "3. 🏪 Create Products:"
echo "   - App Store Connect: 3 subscriptions"
echo "   - Google Play Console: 3 subscriptions"
echo "   Product IDs:"
echo "     • com.kidspeak.mobile.weeklytrial1"
echo "     • com.kidspeak.mobile.weekly1"
echo "     • com.kidspeak.mobile.monthly1"
echo ""
echo "4. 🧪 Test:"
echo "   npm run ios    # Sandbox account"
echo "   npm run android  # Internal testing"
echo ""
echo "📚 Đọc thêm: NATIVE_IAP_SETUP.md"
echo ""
echo "🎉 Good luck!"
echo ""

