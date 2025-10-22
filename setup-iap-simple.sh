#!/bin/bash

# Script cài đặt IAP đơn giản - Chỉ dùng StoreKit 2 (Không cần Backend)
# Simple IAP setup - StoreKit 2 Only (No Backend Required)

echo "🎉 ======================================"
echo "🎉 SETUP IAP - STOREKIT 2 APPROACH"
echo "🎉 Không cần Backend!"
echo "🎉 ======================================"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Lỗi: Vui lòng chạy script này trong thư mục mobile/"
    echo "❌ Error: Please run this script from the mobile/ directory"
    exit 1
fi

echo "📦 Bước 1/4: Cài đặt react-native-iap..."
echo "📦 Step 1/4: Installing react-native-iap..."
echo ""

npm install react-native-iap --save

if [ $? -ne 0 ]; then
    echo "❌ Lỗi cài đặt react-native-iap"
    echo "Thử chạy lại: npm install react-native-iap --save"
    exit 1
fi

echo "✅ Đã cài đặt react-native-iap"
echo ""

# iOS Pod Install
echo "🍎 Bước 2/4: Cài đặt iOS Pods..."
echo "🍎 Step 2/4: Installing iOS Pods..."
echo ""

if [ -d "ios" ]; then
    cd ios
    echo "Running: pod install"
    pod install
    
    if [ $? -ne 0 ]; then
        echo "⚠️  Pod install thất bại"
        echo "Thử chạy thủ công: cd ios && pod install"
    else
        echo "✅ iOS Pods installed successfully"
    fi
    
    cd ..
else
    echo "⚠️  Không tìm thấy thư mục ios/"
fi

echo ""

# Check AndroidManifest
echo "🤖 Bước 3/4: Kiểm tra Android setup..."
echo "🤖 Step 3/4: Checking Android setup..."
echo ""

MANIFEST_FILE="android/app/src/main/AndroidManifest.xml"

if [ -f "$MANIFEST_FILE" ]; then
    if grep -q "com.android.vending.BILLING" "$MANIFEST_FILE"; then
        echo "✅ AndroidManifest.xml đã có BILLING permission"
    else
        echo "⚠️  CẦN THÊM BILLING PERMISSION"
        echo ""
        echo "Mở file: android/app/src/main/AndroidManifest.xml"
        echo "Thêm dòng sau vào trong <manifest> tag:"
        echo ""
        echo '<uses-permission android:name="com.android.vending.BILLING" />'
        echo ""
    fi
else
    echo "⚠️  Không tìm thấy AndroidManifest.xml"
fi

echo ""

# Configuration check
echo "⚙️  Bước 4/4: Kiểm tra configuration..."
echo "⚙️  Step 4/4: Checking configuration..."
echo ""

IAP_SERVICE="src/services/iapService.js"

if [ -f "$IAP_SERVICE" ]; then
    if grep -q "USE_BACKEND_VALIDATION = false" "$IAP_SERVICE"; then
        echo "✅ Backend validation đã TẮT (StoreKit 2 only mode)"
    else
        echo "⚠️  Backend validation đang BẬT"
        echo "Nếu bạn không muốn dùng backend, set:"
        echo "const USE_BACKEND_VALIDATION = false;"
        echo "trong file: src/services/iapService.js"
    fi
else
    echo "⚠️  Không tìm thấy iapService.js"
fi

echo ""
echo "🎉 ======================================"
echo "🎉 CÀI ĐẶT HOÀN TẤT!"
echo "🎉 INSTALLATION COMPLETE!"
echo "🎉 ======================================"
echo ""
echo "📋 CÁC BƯỚC TIẾP THEO:"
echo ""
echo "1. 🍎 iOS - Mở Xcode:"
echo "   open ios/KidSpeak.xcworkspace"
echo "   → Enable 'In-App Purchase' capability"
echo "   → Build project"
echo ""
echo "2. 🤖 Android - Kiểm tra permission:"
echo "   → android/app/src/main/AndroidManifest.xml"
echo "   → Thêm BILLING permission (nếu chưa có)"
echo ""
echo "3. 🏪 Tạo Products:"
echo "   → App Store Connect: 3 subscriptions"
echo "   → Google Play Console: 3 subscriptions"
echo "   Product IDs:"
echo "     - com.kidspeak.mobile.weeklytrial1"
echo "     - com.kidspeak.mobile.weekly1"
echo "     - com.kidspeak.mobile.monthly1"
echo ""
echo "4. 🧪 Test:"
echo "   → iOS: Sandbox testers"
echo "   → Android: Internal Testing"
echo ""
echo "5. ❌ KHÔNG CẦN:"
echo "   → Backend API"
echo "   → Database"
echo "   → Server hosting"
echo ""
echo "📚 Đọc thêm: STOREKIT2_APPROACH.md"
echo ""
echo "🚀 Bắt đầu test:"
echo "   npm run ios"
echo "   npm run android"
echo ""
echo "✨ Chúc may mắn! ✨"
echo ""

