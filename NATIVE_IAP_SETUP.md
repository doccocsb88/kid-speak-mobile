# Native IAP Setup - Custom Implementation

## 🎯 GIẢI PHÁP

Thay vì dùng `react-native-iap` (có dependency conflicts), chúng ta đã build **native IAP module riêng**:

- ✅ iOS: StoreKit 2 (Swift)
- ✅ Android: Play Billing Library 5 (Kotlin)
- ✅ React Native Bridge
- ✅ Không cần third-party packages

## 📦 FILES ĐÃ TẠO

### iOS (Native):
```
ios/KidSpeak/
  ├── KSPurchaseManager.swift  ← StoreKit 2 implementation
  └── KSPurchaseManager.m      ← React Native bridge
```

### Android (Native):
```
android/app/src/main/java/com/kidspeak/mobile/
  ├── KSPurchaseManager.kt     ← Play Billing implementation
  ├── KSPurchasePackage.kt     ← Package registration
  └── MainApplication.java     ← Updated to register package
```

### React Native:
```
src/services/
  └── nativeIapService.js      ← JavaScript interface
```

### Updated:
```
src/components/
  └── PaywallScreen.js         ← Uses native service
```

## 🚀 SETUP INSTRUCTIONS

### 1. iOS Setup (10 phút)

#### Bước 1.1: Thêm files vào Xcode
```bash
open ios/KidSpeak.xcworkspace
```

Trong Xcode:
1. Right-click folder "KidSpeak" → Add Files to "KidSpeak"
2. Chọn 2 files:
   - `KSPurchaseManager.swift`
   - `KSPurchaseManager.m`
3. Check "Copy items if needed"
4. Click "Add"

#### Bước 1.2: Configure Swift Bridge (nếu cần)
Nếu Xcode hỏi tạo bridging header:
- Click "Create Bridging Header"

Hoặc thủ công tạo file `KidSpeak-Bridging-Header.h`:
```objc
// Nếu cần import Objective-C headers vào Swift
```

#### Bước 1.3: Enable In-App Purchase Capability
1. Select project "KidSpeak" trong Project Navigator
2. Select target "KidSpeak"
3. Tab "Signing & Capabilities"
4. Click "+" → Search "In-App Purchase" → Add

#### Bước 1.4: Build Settings
Verify Swift settings:
- Build Settings → Swift Compiler
- Swift Language Version: Swift 5

#### Bước 1.5: Build & Test
```bash
cd ios
xcodebuild clean
cd ..
npm run ios
```

### 2. Android Setup (5 phút)

#### Bước 2.1: Files đã được tạo
✅ Files đã có trong:
```
android/app/src/main/java/com/kidspeak/mobile/
  ├── KSPurchaseManager.kt
  ├── KSPurchasePackage.kt
  └── MainApplication.java (updated)
```

#### Bước 2.2: Update build.gradle
File: `android/app/build.gradle`

Thêm dependency:
```gradle
dependencies {
    // Existing dependencies...
    
    // Play Billing Library
    implementation 'com.android.billingclient:billing:6.0.1'
    implementation 'com.android.billingclient:billing-ktx:6.0.1'
}
```

#### Bước 2.3: AndroidManifest.xml
File: `android/app/src/main/AndroidManifest.xml`

Thêm permission:
```xml
<manifest ...>
    <!-- Billing permission -->
    <uses-permission android:name="com.android.vending.BILLING" />
    
    <application ...>
        ...
    </application>
</manifest>
```

#### Bước 2.4: Build & Test
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 3. Tạo Products trong Stores (30 phút)

#### iOS - App Store Connect:
1. Đăng nhập: https://appstoreconnect.apple.com
2. My Apps → [Your App]
3. Features → In-App Purchases
4. Tạo 3 Auto-Renewable Subscriptions:

**Product 1: Weekly Trial**
- Product ID: `com.kidspeak.mobile.weeklytrial1`
- Reference Name: KidSpeak Weekly Trial
- Subscription Duration: 1 Week
- Price: $2.99

**Product 2: Weekly**
- Product ID: `com.kidspeak.mobile.weekly1`
- Reference Name: KidSpeak Weekly
- Subscription Duration: 1 Week
- Price: $4.99

**Product 3: Monthly**
- Product ID: `com.kidspeak.mobile.monthly1`
- Reference Name: KidSpeak Monthly
- Subscription Duration: 1 Month
- Price: $14.99

5. Create Subscription Group: "KidSpeak Premium"
6. Add all 3 subscriptions to group

#### Android - Google Play Console:
1. Đăng nhập: https://play.google.com/console
2. Select App
3. Monetize → Products → Subscriptions
4. Create 3 subscriptions với cùng Product IDs như iOS

### 4. Testing

#### iOS Testing:
```bash
# Bước 1: Tạo Sandbox tester
# App Store Connect → Users and Access → Sandbox

# Bước 2: Sign out khỏi App Store trên device
# Settings → iTunes & App Store → Sign Out

# Bước 3: Run app
npm run ios

# Bước 4: Test purchase
# Khi popup xuất hiện, đăng nhập bằng Sandbox account
```

#### Android Testing:
```bash
# Bước 1: Build release APK
cd android
./gradlew assembleRelease

# Bước 2: Upload lên Internal Testing track
# Google Play Console → Release → Testing → Internal testing

# Bước 3: Add test users
# Setup → License testing → Add test accounts

# Bước 4: Test purchase
# Download app từ Play Store (Internal Testing link)
```

## 🎯 API USAGE

### JavaScript API

```javascript
import NativeIAPService from './services/nativeIapService';

// Initialize
await NativeIAPService.initialize();

// Get products
const products = await NativeIAPService.getProducts();
// Returns: [{ id, displayName, displayPrice, description }]

// Purchase
await NativeIAPService.purchaseProduct('com.kidspeak.mobile.monthly1');
// Throws error if failed or user cancelled

// Restore
const result = await NativeIAPService.restorePurchases();
// Returns: { success, count, message, purchases }

// Check active subscription
const hasActive = await NativeIAPService.hasActiveSubscription();
// Returns: boolean

// Get current subscription
const current = await NativeIAPService.getCurrentSubscription();
// Returns: { productId, transactionId, purchaseDate, ... }
```

## 🔧 TROUBLESHOOTING

### iOS Issues:

**"Module 'KSPurchaseManager' not found"**
- Solution: Add files vào Xcode project (Build Phases → Compile Sources)

**"Use of undeclared type 'Product'"**
- Solution: Import StoreKit đã có trong code

**"Cannot find 'RCTPromiseResolveBlock' in scope"**
- Solution: Bridging header issue. Verify React-Core linked.

### Android Issues:

**"Unresolved reference: BillingClient"**
- Solution: Add billing dependency vào build.gradle

**"Package does not match expected"**
- Solution: Verify package name là `com.kidspeak.mobile`

**"Module not registered"**
- Solution: Verify MainApplication.java đã add KSPurchasePackage

### Common Issues:

**"Product not available"**
- Đợi 1-2 giờ sau khi tạo products trong stores
- Check Product IDs khớp 100%
- iOS: Check Agreements trong App Store Connect

**"Cannot connect to iTunes Store"**
- Sign out và sign in lại
- Check internet connection
- Restart device

## 📋 CHECKLIST

### iOS:
- [ ] Files added vào Xcode project
- [ ] In-App Purchase capability enabled
- [ ] Products created trong App Store Connect
- [ ] Subscription group created
- [ ] Sandbox testers created
- [ ] Build successful
- [ ] Test purchase works

### Android:
- [ ] Billing dependency added
- [ ] BILLING permission added
- [ ] Package registered trong MainApplication
- [ ] Products created trong Google Play Console
- [ ] Internal testing setup
- [ ] Build successful
- [ ] Test purchase works

### React Native:
- [ ] NativeIAPService imports correctly
- [ ] PaywallScreen updated
- [ ] No console errors
- [ ] Products load correctly
- [ ] Purchase flow works
- [ ] Restore works

## 🎉 ƯU ĐIỂM NATIVE APPROACH

So với `react-native-iap`:

| Feature | react-native-iap | Native Module |
|---------|------------------|---------------|
| Setup complexity | Medium | Medium |
| Dependencies | Many | Zero |
| Version conflicts | Yes | No |
| Control | Limited | Full |
| Performance | Good | Excellent |
| Debugging | Hard | Easy |
| Updates | Breaking changes | Stable |
| Code size | Large | Small |

## 📚 CODE EXPLANATION

### iOS (StoreKit 2):

```swift
// Fetch products
products = try await Product.products(for: productIDs)

// Purchase
let result = try await product.purchase()

// Verify transaction
case .verified(let transaction):
    await transaction.finish()

// Restore
for await result in Transaction.currentEntitlements {
    // Process verified transactions
}
```

### Android (Play Billing):

```kotlin
// Initialize
billingClient = BillingClient.newBuilder(context)
    .enablePendingPurchases()
    .build()

// Query products
billingClient.queryProductDetailsAsync(params) { result, products ->
    // Handle products
}

// Purchase
billingClient.launchBillingFlow(activity, params)

// Restore
billingClient.queryPurchasesAsync(params) { result, purchases ->
    // Handle purchases
}
```

### React Native Bridge:

```javascript
// iOS
RCT_EXTERN_METHOD(purchaseProduct:(NSString *)productId ...)

// Android
@ReactMethod
fun purchaseProduct(productId: String, promise: Promise)

// JavaScript
const { KSPurchaseManager } = NativeModules;
await KSPurchaseManager.purchaseProduct(productId);
```

## 🚀 NEXT STEPS

1. **Build & Test**
   ```bash
   npm run ios
   npm run android
   ```

2. **Test Purchase Flow**
   - Initialize
   - Load products
   - Purchase
   - Restore

3. **Production Release**
   - Submit iOS app for review
   - Upload Android to production track

## ❓ FAQ

**Q: Có cần react-native-iap không?**
A: ❌ KHÔNG. Native module thay thế hoàn toàn.

**Q: Có thể remove react-native-iap khỏi package.json?**
A: ✅ CÓ. Không còn cần nữa.

**Q: Native module có khó maintain không?**
A: ❌ KHÔNG. Code rất đơn giản, StoreKit 2 và Play Billing ổn định.

**Q: Nếu cần thêm features?**
A: Dễ dàng extend native code, full control.

**Q: Performance thế nào?**
A: Tốt hơn react-native-iap vì không có extra layers.

---

**Chúc bạn thành công! 🎉**

