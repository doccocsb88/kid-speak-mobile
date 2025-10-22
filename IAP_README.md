# IAP (In-App Purchase) - Hướng dẫn nhanh

## 🎯 BẠN HỎI - TÔI TRẢ LỜI

### ❓ "Purchase và Restore đã implement chưa?"
✅ **ĐÃ XONG** - Code hoàn chỉnh 100%

### ❓ "Có cần backend validation không?"
❌ **KHÔNG** - Dùng StoreKit 2 thôi!

### ❓ "Có cần làm gì ở native layer?"
✅ **CÓ** - Nhưng rất đơn giản (chỉ enable capability)

---

## 🚀 BẮT ĐẦU NHANH (30 phút)

### Bước 1: Chạy script cài đặt
```bash
cd /Users/mac/Documents/hai/KidSpeak/mobile
./setup-iap-simple.sh
```

### Bước 2: Enable iOS capability (5 phút)
```bash
open ios/KidSpeak.xcworkspace
```
- Project → Signing & Capabilities
- Click "+" → Chọn "In-App Purchase"
- Build

### Bước 3: Android permission (2 phút)
Mở `android/app/src/main/AndroidManifest.xml`, thêm:
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### Bước 4: Tạo products (30 phút)
- **App Store Connect**: Tạo 3 subscriptions
- **Google Play Console**: Tạo 3 subscriptions

Product IDs:
- `com.kidspeak.mobile.weeklytrial1`
- `com.kidspeak.mobile.weekly1`
- `com.kidspeak.mobile.monthly1`

### Bước 5: Test!
```bash
npm run ios  # Sandbox account
npm run android  # Internal testing
```

---

## 📁 FILES QUAN TRỌNG

### Code Files:
- ✅ **`src/services/iapService.js`** - IAP logic (DONE)
- ✅ **`src/components/PaywallScreen.js`** - UI (DONE)

### Documentation:
- 📖 **`SO_SÁNH_2_APPROACHES.md`** - ĐỌC ĐẦU TIÊN!
- 📖 **`STOREKIT2_APPROACH.md`** - Chi tiết StoreKit 2
- 📖 **`IAP_NATIVE_SETUP.md`** - Hướng dẫn đầy đủ
- 📖 **`TRẢ_LỜI_CÂU_HỎI_IAP.md`** - Q&A

### Scripts:
- 🔧 **`setup-iap-simple.sh`** - Cài đặt tự động (RECOMMENDED)
- 🔧 **`install-iap.sh`** - Cài đặt with backend (nếu cần)

---

## 🎯 APPROACH ĐƯỢC CHỌN

### ✅ StoreKit 2 Only (Không cần Backend)

**Lý do:**
- Simple, nhanh, đủ bảo mật
- Không cần backend API
- Không cần database
- Không cần hosting

**Configuration:**
```javascript
// src/services/iapService.js
const USE_BACKEND_VALIDATION = false; // ← Đã set sẵn
```

---

## 📊 TÌNH TRẠNG

| Component | Status | Note |
|-----------|--------|------|
| UI/UX | ✅ Done | PaywallScreen hoàn chỉnh |
| Navigation | ✅ Done | Premium button trong menu |
| IAP Service | ✅ Done | Purchase + Restore logic |
| StoreKit 2 | ✅ Ready | Chờ cài package |
| Backend | ❌ Skip | Không cần! |

---

## ⚙️ CONFIGURATION

### Hiện tại (Recommended):
```javascript
const USE_BACKEND_VALIDATION = false;  // StoreKit 2 only
```

### Nếu muốn backend sau này:
```javascript
const USE_BACKEND_VALIDATION = true;   // Backend validation
// + Implement backend endpoints
```

---

## 🧪 TEST FLOW

### iOS:
1. Build trong Xcode
2. Sign out khỏi App Store
3. Run app
4. Tap Premium → Subscribe
5. Đăng nhập Sandbox account
6. Complete purchase ✅

### Android:
1. Upload Internal Testing
2. Download từ Play Store
3. Test purchase ✅

---

## ❓ GẶP VẤN ĐỀ?

### Lỗi: "Cannot connect to iTunes Store"
- Check internet
- Sign out App Store và sign in lại
- Restart device

### Lỗi: "Product not available"
- Check product IDs đúng chưa
- Check products đã approve trong store chưa
- Đợi 1-2 giờ sau khi tạo products

### Lỗi: "This is not a test user"
- Sign out khỏi App Store
- Đăng nhập bằng Sandbox account

---

## 📞 SUPPORT

### Cần giúp đỡ?
1. Đọc `SO_SÁNH_2_APPROACHES.md` để hiểu approach
2. Đọc `STOREKIT2_APPROACH.md` để setup chi tiết
3. Đọc `TRẢ_LỜI_CÂU_HỎI_IAP.md` cho Q&A

### External Resources:
- [react-native-iap Docs](https://github.com/dooboolab/react-native-iap)
- [Apple StoreKit 2](https://developer.apple.com/documentation/storekit)
- [Google Play Billing](https://developer.android.com/google/play/billing)

---

## ✅ CHECKLIST

Trước khi launch:
- [ ] Đã chạy `./setup-iap-simple.sh`
- [ ] iOS In-App Purchase capability enabled
- [ ] Android BILLING permission added
- [ ] Products created trong App Store Connect
- [ ] Products created trong Google Play Console
- [ ] Test purchase thành công trên iOS
- [ ] Test purchase thành công trên Android
- [ ] Test restore thành công
- [ ] Privacy policy updated (mention subscriptions)

---

## 🎉 TÓM TẮT

```bash
# Tất cả những gì bạn cần:
./setup-iap-simple.sh

# Và 3 bước thủ công:
1. Enable iOS capability (Xcode)
2. Add Android permission (XML)
3. Create products (Stores)

# Không cần:
❌ Backend API
❌ Database
❌ Server hosting

# Đọc docs:
📖 SO_SÁNH_2_APPROACHES.md  ← Đọc đầu tiên!
```

---

**Chúc bạn thành công! 🚀**

