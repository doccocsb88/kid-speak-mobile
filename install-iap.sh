#!/bin/bash

# Script cài đặt IAP (In-App Purchase) cho KidSpeak Mobile
# Installation script for In-App Purchase functionality

echo "🚀 Bắt đầu cài đặt IAP..."
echo "🚀 Starting IAP installation..."
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Lỗi: Vui lòng chạy script này trong thư mục mobile/"
    echo "❌ Error: Please run this script from the mobile/ directory"
    exit 1
fi

# Step 1: Install react-native-iap
echo "📦 Bước 1: Cài đặt react-native-iap..."
echo "📦 Step 1: Installing react-native-iap..."
npm install react-native-iap --save

if [ $? -ne 0 ]; then
    echo "❌ Lỗi cài đặt react-native-iap"
    exit 1
fi

echo "✅ Đã cài đặt react-native-iap thành công"
echo ""

# Step 2: iOS Pod Install
echo "🍎 Bước 2: Cài đặt iOS Pods..."
echo "🍎 Step 2: Installing iOS Pods..."

if [ -d "ios" ]; then
    cd ios
    pod install
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Cảnh báo: Pod install thất bại"
        echo "⚠️  Warning: Pod install failed"
        echo "Vui lòng chạy thủ công: cd ios && pod install"
        echo "Please run manually: cd ios && pod install"
    else
        echo "✅ Đã cài đặt iOS Pods thành công"
    fi
    
    cd ..
else
    echo "⚠️  Không tìm thấy thư mục ios/"
    echo "⚠️  ios/ directory not found"
fi

echo ""

# Step 3: Update AndroidManifest.xml
echo "🤖 Bước 3: Cập nhật AndroidManifest.xml..."
echo "🤖 Step 3: Updating AndroidManifest.xml..."

MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST_FILE" ]; then
    # Check if BILLING permission already exists
    if grep -q "com.android.vending.BILLING" "$MANIFEST_FILE"; then
        echo "✅ AndroidManifest.xml đã có BILLING permission"
        echo "✅ AndroidManifest.xml already has BILLING permission"
    else
        echo "⚠️  Cần thêm BILLING permission thủ công vào AndroidManifest.xml"
        echo "⚠️  Need to manually add BILLING permission to AndroidManifest.xml"
        echo ""
        echo "Thêm dòng sau vào <manifest> tag:"
        echo "Add this line to <manifest> tag:"
        echo '<uses-permission android:name="com.android.vending.BILLING" />'
    fi
else
    echo "⚠️  Không tìm thấy AndroidManifest.xml"
    echo "⚠️  AndroidManifest.xml not found"
fi

echo ""
echo "============================================"
echo "✅ CÀI ĐẶT HOÀN TẤT / INSTALLATION COMPLETE"
echo "============================================"
echo ""
echo "📋 CÁC BƯỚC TIẾP THEO / NEXT STEPS:"
echo ""
echo "1. 🍎 iOS Setup:"
echo "   - Mở Xcode: open ios/KidSpeak.xcworkspace"
echo "   - Enable 'In-App Purchase' capability"
echo "   - Tạo subscriptions trong App Store Connect"
echo "   - Xem chi tiết: IAP_NATIVE_SETUP.md"
echo ""
echo "2. 🤖 Android Setup:"
echo "   - Kiểm tra android/app/build.gradle có billing dependency"
echo "   - Tạo subscriptions trong Google Play Console"
echo "   - Xem chi tiết: IAP_NATIVE_SETUP.md"
echo ""
echo "3. 🔒 Backend Setup:"
echo "   - Tạo endpoint /api/iap/validate-ios"
echo "   - Tạo endpoint /api/iap/validate-android"
echo "   - Tạo bảng user_subscriptions"
echo "   - Xem chi tiết: IAP_NATIVE_SETUP.md"
echo ""
echo "4. 🧪 Test:"
echo "   - iOS: Sử dụng Sandbox testers"
echo "   - Android: Sử dụng Internal Testing track"
echo ""
echo "📚 Tài liệu đầy đủ: IAP_NATIVE_SETUP.md"
echo "📚 Full documentation: IAP_NATIVE_SETUP.md"
echo ""

