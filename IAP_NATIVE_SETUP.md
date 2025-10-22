# Hướng dẫn Setup IAP (In-App Purchase) - Lớp Native

## 📦 BƯỚC 1: Cài đặt react-native-iap

```bash
cd /Users/mac/Documents/hai/KidSpeak/mobile
npm install react-native-iap --save
```

### iOS:
```bash
cd ios
pod install
cd ..
```

## 🍎 BƯỚC 2: Setup iOS Native Layer

### 2.1. Xcode Configuration

1. **Mở Xcode:**
   ```bash
   open ios/KidSpeak.xcworkspace
   ```

2. **Enable In-App Purchase Capability:**
   - Chọn project "KidSpeak" trong Project Navigator
   - Chọn Target "KidSpeak"
   - Tab "Signing & Capabilities"
   - Click "+" → Tìm "In-App Purchase" → Add

3. **Info.plist Updates:**
   Thêm vào `ios/KidSpeak/Info.plist`:
   ```xml
   <key>SKAdNetworkItems</key>
   <array>
     <dict>
       <key>SKAdNetworkIdentifier</key>
       <string>cstr6suwn9.skadnetwork</string>
     </dict>
   </array>
   ```

### 2.2. App Store Connect Setup

1. **Tạo App ID:**
   - Đăng nhập https://developer.apple.com
   - Certificates, Identifiers & Profiles → Identifiers
   - Tìm Bundle ID của app (com.kidspeak.mobile)
   - Enable "In-App Purchase" capability

2. **Tạo Subscriptions trong App Store Connect:**
   - Đăng nhập https://appstoreconnect.apple.com
   - My Apps → [Your App] → Features → In-App Purchases
   - Click "+" để tạo subscription mới

   **Tạo 3 subscriptions:**
   
   **Subscription 1: Weekly Trial**
   - Reference Name: `KidSpeak Weekly Trial`
   - Product ID: `com.kidspeak.mobile.weeklytrial1`
   - Subscription Duration: 1 Week
   - Price: $2.99 (Tier 4)
   
   **Subscription 2: Weekly Plan**
   - Reference Name: `KidSpeak Weekly`
   - Product ID: `com.kidspeak.mobile.weekly1`
   - Subscription Duration: 1 Week
   - Price: $4.99 (Tier 10)
   
   **Subscription 3: Monthly Plan**
   - Reference Name: `KidSpeak Monthly`
   - Product ID: `com.kidspeak.mobile.monthly1`
   - Subscription Duration: 1 Month
   - Price: $14.99 (Tier 15)

3. **Tạo Subscription Group:**
   - App Store Connect → Subscriptions
   - Create Subscription Group: "KidSpeak Premium"
   - Add all 3 subscriptions vào group này

4. **Setup Sandbox Testers:**
   - App Store Connect → Users and Access → Sandbox
   - Create Test Users để test purchases

### 2.3. Podfile Configuration

File `ios/Podfile` nên có:
```ruby
platform :ios, '12.4'
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

target 'KidSpeak' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )

  # In-App Purchase
  pod 'RNIap', :path => '../node_modules/react-native-iap'

  post_install do |installer|
    react_native_post_install(installer)
  end
end
```

## 🤖 BƯỚC 3: Setup Android Native Layer

### 3.1. Google Play Console Setup

1. **Tạo App:**
   - Đăng nhập https://play.google.com/console
   - Create Application

2. **Tạo Subscriptions:**
   - Monetize → Products → Subscriptions
   - Create subscription

   **Subscription 1: Weekly Trial**
   - Product ID: `com.kidspeak.mobile.weeklytrial1`
   - Name: `KidSpeak Weekly Trial`
   - Billing period: Week (1)
   - Price: $2.99
   
   **Subscription 2: Weekly**
   - Product ID: `com.kidspeak.mobile.weekly1`
   - Name: `KidSpeak Weekly`
   - Billing period: Week (1)
   - Price: $4.99
   
   **Subscription 3: Monthly**
   - Product ID: `com.kidspeak.mobile.monthly1`
   - Name: `KidSpeak Monthly`
   - Billing period: Month (1)
   - Price: $14.99

3. **License Testing:**
   - Settings → License testing
   - Add test accounts (Gmail addresses)

### 3.2. AndroidManifest.xml

File `android/app/src/main/AndroidManifest.xml` cần có:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Existing permissions -->
    
    <!-- Billing permission -->
    <uses-permission android:name="com.android.vending.BILLING" />

    <application
        android:name=".MainApplication"
        ...
    >
        <!-- Your existing config -->
    </application>
</manifest>
```

### 3.3. build.gradle Configuration

File `android/app/build.gradle`:
```gradle
dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    
    // React Native
    implementation "com.facebook.react:react-native:+"
    
    // In-App Purchase
    implementation 'com.android.billingclient:billing:5.0.0'
    
    // Other dependencies...
}
```

## 🔒 BƯỚC 4: Backend Setup (Quan trọng!)

### 4.1. Tạo Receipt Validation Endpoint

**Backend cần có endpoint để validate receipts:**

```javascript
// backend/src/routes/iapRoutes.js
const express = require('express');
const router = express.Router();
const { verifyReceipt } = require('../services/iapService');

// Validate iOS receipt
router.post('/validate-ios', async (req, res) => {
  try {
    const { receipt, productId, userId } = req.body;
    
    // Verify with Apple
    const validation = await verifyIOSReceipt(receipt);
    
    if (validation.status === 0) {
      // Receipt valid - update user subscription
      await updateUserSubscription(userId, productId, validation);
      res.json({ success: true, subscription: validation });
    } else {
      res.status(400).json({ success: false, error: 'Invalid receipt' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate Android receipt
router.post('/validate-android', async (req, res) => {
  try {
    const { purchaseToken, productId, userId } = req.body;
    
    // Verify with Google Play
    const validation = await verifyAndroidReceipt(purchaseToken, productId);
    
    if (validation.valid) {
      await updateUserSubscription(userId, productId, validation);
      res.json({ success: true, subscription: validation });
    } else {
      res.status(400).json({ success: false, error: 'Invalid purchase' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

### 4.2. Database Schema

```sql
-- Add subscription table
CREATE TABLE user_subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  platform ENUM('ios', 'android') NOT NULL,
  purchase_token TEXT,
  original_transaction_id VARCHAR(255),
  expires_date TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add index
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_active ON user_subscriptions(is_active, expires_date);
```

## 📱 BƯỚC 5: Test IAP

### iOS Testing:
1. Build app trong Xcode
2. Sign out khỏi App Store trên device
3. Run app
4. Khi purchase, sẽ được hỏi đăng nhập Sandbox account
5. Đăng nhập bằng Sandbox tester account
6. Complete purchase

### Android Testing:
1. Upload APK/AAB lên Google Play Console (Internal Testing track)
2. Add testers vào Internal Testing
3. Testers download từ Play Store
4. Test purchases (sẽ không bị charge thật)

## ⚙️ Environment Variables

Tạo file `.env`:
```bash
# iOS
APPLE_SHARED_SECRET=your_shared_secret_from_app_store_connect

# Android
GOOGLE_SERVICE_ACCOUNT_KEY=path_to_service_account_json
GOOGLE_PACKAGE_NAME=com.kidspeak.mobile
```

## 🚨 Lưu ý quan trọng

1. **KHÔNG BAO GIỜ validate receipts ở client side only** - Phải validate trên server
2. **Store subscription status trong database** - Không trust client
3. **Handle subscription renewals** - Set up webhooks/notifications
4. **Test thoroughly** với Sandbox/Test accounts trước khi production
5. **Implement retry logic** - Network có thể fail
6. **Handle edge cases:**
   - User cancels subscription
   - Payment fails
   - Subscription expires
   - User changes subscription tier
   - Restore purchases on new device

## 📊 Monitoring & Analytics

Setup để track:
- Subscription starts
- Renewals
- Cancellations
- Revenue
- Failed payments
- Restore purchases usage

## 🔗 Resources

- [react-native-iap Documentation](https://github.com/dooboolab/react-native-iap)
- [Apple IAP Best Practices](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [Revenue Cat](https://www.revenuecat.com/) - Alternative IAP service (easier setup)

