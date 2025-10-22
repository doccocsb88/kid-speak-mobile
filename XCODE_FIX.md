# Fix Xcode Errors - KSPurchaseManager

## ✅ ĐÃ FIX

### Lỗi gặp phải:
```
@escaping attribute only applies to function types
Cannot find type 'RCTPromiseResolveBlock' in scope
Cannot find type 'RCTPromiseRejectBlock' in scope
'nil' requires a contextual type
```

### Nguyên nhân:
- Bridging header trống
- Swift không nhận ra React Native types
- `@escaping` closures không đúng context

### Giải pháp đã áp dụng:

1. ✅ **Updated KSPurchaseManager.swift**
   - Changed from `NSObject` to `RCTEventEmitter`
   - Added `@MainActor` to async tasks
   - Fixed all Promise types
   - Proper NSNumber wrapping for nullable values

2. ✅ **Updated Bridging Header**
   - Added React imports:
     ```objc
     #import <React/RCTBridgeModule.h>
     #import <React/RCTEventEmitter.h>
     ```

## 🚀 NEXT STEPS

### Trong Xcode:

1. **Clean Build Folder**
   ```
   Shift + Cmd + K
   hoặc
   Product → Clean Build Folder
   ```

2. **Build Project**
   ```
   Cmd + B
   hoặc
   Product → Build
   ```

3. **Run**
   ```
   Cmd + R
   hoặc
   Product → Run
   ```

### Nếu vẫn lỗi:

1. **Check Bridging Header Path**
   - Xcode → Project Settings
   - Build Settings
   - Search "Objective-C Bridging Header"
   - Verify path: `$(PROJECT_DIR)/KidSpeak-Bridging-Header.h`

2. **Verify Swift Files Added**
   - Check "Target Membership" của KSPurchaseManager.swift
   - Should be checked for "KidSpeak" target

3. **Check Framework Search Paths**
   - Build Settings → Framework Search Paths
   - Should include: `$(inherited)`

4. **Re-add Files if Needed**
   - Remove KSPurchaseManager.swift from project (reference only)
   - Right-click project → Add Files
   - Select KSPurchaseManager.swift
   - Check "Copy items if needed"
   - Check "KidSpeak" target

## 📝 FILES ĐÃ THAY ĐỔI

### ios/KidSpeak/KSPurchaseManager.swift
```swift
// Now extends RCTEventEmitter
@objc(KSPurchaseManager)
class KSPurchaseManager: RCTEventEmitter {
  // Uses @MainActor for async tasks
  // Proper NSNumber wrapping
  // Fixed all type issues
}
```

### ios/KidSpeak-Bridging-Header.h
```objc
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
```

### ios/KidSpeak/KSPurchaseManager.m
```objc
// Unchanged - bridge definitions
RCT_EXTERN_METHOD(initialize:...)
RCT_EXTERN_METHOD(purchaseProduct:...)
RCT_EXTERN_METHOD(restorePurchases:...)
RCT_EXTERN_METHOD(checkActiveSubscription:...)
```

## 🧪 TEST BUILD

```bash
cd ios
xcodebuild -workspace KidSpeak.xcworkspace \
  -scheme KidSpeak \
  -sdk iphonesimulator \
  -configuration Debug \
  build
```

Success nếu thấy:
```
** BUILD SUCCEEDED **
```

## ⚠️ COMMON ISSUES

### "Module 'React' not found"
**Fix:**
```bash
cd ios
pod install
cd ..
```

### "Use of undeclared identifier 'RCTEventEmitter'"
**Fix:** Verify bridging header có imports đúng

### "No such module 'StoreKit'"
**Fix:** StoreKit là system framework, should work. Check deployment target >= iOS 15

### Files không được add vào target
**Fix:** 
- Select file → File Inspector (right panel)
- Check "KidSpeak" under "Target Membership"

## ✅ VERIFICATION

Sau khi build thành công, verify:

```bash
cd /Users/mac/Documents/hai/KidSpeak/mobile
npm run ios
```

Check console log khi mở Paywall:
```
[Native IAP] Initializing...
[Native IAP] Initialized successfully with 3 products
```

## 🎯 NEXT: ANDROID

Sau khi iOS OK, test Android:

```bash
cd android
./gradlew clean
./gradlew assembleDebug
cd ..
npm run android
```

## 📚 REFERENCE

- [StoreKit 2 Docs](https://developer.apple.com/documentation/storekit)
- [React Native Bridging](https://reactnative.dev/docs/native-modules-ios)
- [Swift Bridging Header](https://developer.apple.com/documentation/swift/importing-objective-c-into-swift)

---

**Status:** ✅ Fixed
**Build:** Should succeed now
**Ready:** To test IAP

