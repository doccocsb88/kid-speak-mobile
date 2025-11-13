# Hướng Dẫn Tạo Gói Giá Cho Android - Google Play Console

## 📋 Tổng Quan

Hướng dẫn này sẽ giúp bạn tạo các gói subscription (đăng ký) cho ứng dụng Android trên Google Play Console. Dự án KidSpeak hiện tại có 3 gói subscription cần được tạo trong Google Play Console.

## 🎯 Các Gói Cần Tạo

Dựa trên code trong `PaywallScreen.js` và `nativeIapService.js`, bạn cần tạo 3 gói subscription sau:

1. **Weekly Trial** - `com.kidspeak.mobile.weeklytrial1`
2. **Weekly Plan** - `com.kidspeak.mobile.weekly1`
3. **Monthly Plan** - `com.kidspeak.mobile.monthly1`

## 📝 Bước 1: Đăng Nhập Google Play Console

1. Truy cập: https://play.google.com/console
2. Đăng nhập bằng tài khoản Google Developer của bạn
3. Chọn ứng dụng **KidSpeak** (hoặc tạo mới nếu chưa có)

## 📝 Bước 2: Tạo Subscription Products

### 2.1. Điều Hướng Đến Trang Subscriptions

1. Trong Google Play Console, chọn ứng dụng của bạn
2. Trong menu bên trái, tìm mục **Monetize** (hoặc **Monetization**)
3. Click vào **Products** → **Subscriptions**
4. Click nút **Create subscription** (hoặc **+ Create subscription**)

### 2.2. Tạo Gói 1: Weekly Trial

**Thông tin cơ bản:**
- **Product ID**: `com.kidspeak.mobile.weeklytrial1`
  - ⚠️ **QUAN TRỌNG**: Product ID phải khớp chính xác với ID trong code
  - Không được có khoảng trắng hoặc ký tự đặc biệt không hợp lệ
  
- **Name** (Tên hiển thị): `KidSpeak Weekly Trial`
  - Tên này sẽ hiển thị cho người dùng trong Play Store

- **Description** (Mô tả): `7-day trial access to KidSpeak Premium features`
  - Mô tả ngắn gọn về gói subscription

**Cấu hình Billing:**
- **Billing period**: Chọn **Week** → Nhập `1`
- **Price**: 
  - Chọn currency: **USD** (hoặc currency bạn muốn)
  - Nhập giá: **$2.99** (hoặc tương đương trong currency khác)
  - Hoặc chọn từ **Price tier** nếu có

**Free trial (Dùng thử miễn phí):**
- Nếu muốn có free trial, bạn có thể bật tùy chọn này
- Nhưng trong trường hợp này, gói Weekly Trial đã là trial rồi nên có thể không cần

**Grace period & Account hold:**
- Có thể để mặc định hoặc cấu hình theo nhu cầu

**Click "Save"** để lưu gói đầu tiên

### 2.3. Tạo Gói 2: Weekly Plan

**Thông tin cơ bản:**
- **Product ID**: `com.kidspeak.mobile.weekly1`
- **Name**: `KidSpeak Weekly Plan`
- **Description**: `Perfect for short-term learning - Weekly subscription`

**Cấu hình Billing:**
- **Billing period**: **Week** → `1`
- **Price**: **$4.99** (USD)

**Click "Save"**

### 2.4. Tạo Gói 3: Monthly Plan

**Thông tin cơ bản:**
- **Product ID**: `com.kidspeak.mobile.monthly1`
- **Name**: `KidSpeak Monthly Plan`
- **Description**: `Best value for continuous learning - Monthly subscription`

**Cấu hình Billing:**
- **Billing period**: **Month** → `1`
- **Price**: **$14.99** (USD)

**Click "Save"**

## 📝 Bước 3: Tạo Base Plan và Offers (Nếu Cần)

Google Play Billing Library 5+ sử dụng hệ thống Base Plans và Offers. Tuy nhiên, với cấu hình đơn giản, bạn có thể để mặc định.

### 3.1. Base Plan

Mỗi subscription sẽ có một Base Plan mặc định:
- **Base Plan ID**: Thường là `default` hoặc tự động tạo
- **Billing period**: Đã cấu hình ở trên
- **Price**: Đã cấu hình ở trên

### 3.2. Offers (Tùy chọn)

Nếu bạn muốn thêm:
- **Free trial**: Dùng thử miễn phí
- **Introductory pricing**: Giá giới thiệu
- **Grace period**: Thời gian gia hạn sau khi thanh toán thất bại

Với gói Weekly Trial, bạn có thể tạo một Offer với free trial 7 ngày.

## 📝 Bước 4: Activate Subscriptions

Sau khi tạo xong các gói:

1. Quay lại trang **Subscriptions**
2. Bạn sẽ thấy danh sách các subscription vừa tạo
3. Mỗi subscription sẽ có trạng thái **Draft** (Nháp)
4. Click vào từng subscription để review
5. Click nút **Activate** để kích hoạt

⚠️ **Lưu ý**: 
- Subscriptions phải được **Activate** trước khi có thể sử dụng trong app
- Sau khi activate, có thể mất vài giờ để Google Play cập nhật

## 📝 Bước 5: Setup License Testing (Quan Trọng cho Testing)

Để test purchases mà không bị charge thật:

1. Trong Google Play Console, vào **Settings** → **License testing**
2. Thêm email của các tester vào danh sách **License testers**
3. Các tester này sẽ:
   - Không bị charge thật khi mua
   - Nhận purchases ngay lập tức (không cần chờ xử lý)
   - Có thể test restore purchases

**Cách thêm tester:**
- Click **Add email addresses**
- Nhập email Gmail của tester (phải là Gmail thật)
- Click **Save**

## 📝 Bước 6: Upload App để Testing

Để test IAP, bạn cần:

1. **Build APK/AAB** của app
2. **Upload lên Google Play Console**:
   - Vào **Release** → **Testing** → **Internal testing**
   - Tạo release mới
   - Upload APK/AAB
   - Thêm testers vào Internal testing track
3. **Testers download app** từ Play Store (Internal testing link)
4. **Test purchases** trong app

⚠️ **Lưu ý**: 
- IAP chỉ hoạt động với app được download từ Play Store (không hoạt động với debug APK trực tiếp)
- Phải có ít nhất 1 tester trong License testing list

## 📝 Bước 7: Verify Product IDs trong Code

Đảm bảo Product IDs trong code khớp với Google Play Console:

### File: `mobile/src/services/nativeIapService.js`
```javascript
export const SUBSCRIPTION_IDS = [
  'com.kidspeak.mobile.weeklytrial1',  // ✅ Khớp với Google Play
  'com.kidspeak.mobile.weekly1',        // ✅ Khớp với Google Play
  'com.kidspeak.mobile.monthly1',       // ✅ Khớp với Google Play
];
```

### File: `mobile/android/app/src/main/java/com/kidspeak/mobile/KSPurchaseManager.kt`
```kotlin
private val productIds = listOf(
    "com.kidspeak.mobile.weeklytrial1",  // ✅ Khớp với Google Play
    "com.kidspeak.mobile.weekly1",        // ✅ Khớp với Google Play
    "com.kidspeak.mobile.monthly1"        // ✅ Khớp với Google Play
)
```

### File: `mobile/src/components/PaywallScreen.js`
```javascript
const SUBSCRIPTION_PLANS = [
  {
    id: 'com.kidspeak.mobile.weeklytrial1',  // ✅ Khớp với Google Play
    // ...
  },
  {
    id: 'com.kidspeak.mobile.weekly1',      // ✅ Khớp với Google Play
    // ...
  },
  {
    id: 'com.kidspeak.mobile.monthly1',      // ✅ Khớp với Google Play
    // ...
  },
];
```

## 🔍 Kiểm Tra và Troubleshooting

### Kiểm tra Subscriptions đã được tạo:

1. Vào Google Play Console → **Monetize** → **Products** → **Subscriptions**
2. Bạn sẽ thấy danh sách 3 subscriptions:
   - ✅ `com.kidspeak.mobile.weeklytrial1` - Status: Active
   - ✅ `com.kidspeak.mobile.weekly1` - Status: Active
   - ✅ `com.kidspeak.mobile.monthly1` - Status: Active

### Lỗi thường gặp:

**1. "Product not found" khi purchase:**
- ✅ Kiểm tra Product ID có khớp chính xác không
- ✅ Đảm bảo subscription đã được **Activate**
- ✅ Đảm bảo app đã được upload lên Play Store (Internal testing)
- ✅ Đảm bảo tester đã được thêm vào License testing

**2. "Billing unavailable":**
- ✅ Kiểm tra app có được download từ Play Store không (không phải debug APK)
- ✅ Kiểm tra Google Play Services đã được cài đặt trên device
- ✅ Kiểm tra device có kết nối internet không

**3. Prices không hiển thị đúng:**
- ✅ Đợi vài giờ sau khi activate subscriptions (Google cần thời gian sync)
- ✅ Kiểm tra `updatePricesFromStore()` trong PaywallScreen.js có được gọi không
- ✅ Xem logs trong console để kiểm tra products có được load không

## 📊 Checklist Hoàn Thành

- [ ] Đã tạo 3 subscriptions trong Google Play Console
- [ ] Product IDs khớp với code
- [ ] Tất cả subscriptions đã được **Activate**
- [ ] Đã thêm testers vào License testing
- [ ] Đã upload app lên Internal testing track
- [ ] Đã test purchase thành công
- [ ] Đã test restore purchases thành công
- [ ] Prices hiển thị đúng trong app

## 🚀 Bước Tiếp Theo

Sau khi setup xong:

1. **Test thoroughly** với các test accounts
2. **Monitor** purchases trong Google Play Console → **Monetize** → **Revenue**
3. **Setup notifications** (nếu cần) để handle subscription renewals/cancellations
4. **Prepare for production** release

## 📚 Tài Liệu Tham Khảo

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Play Billing Library Migration Guide](https://developer.android.com/google/play/billing/migrate)

## 💡 Tips

1. **Product IDs không thể thay đổi** sau khi tạo - hãy chắc chắn về ID trước khi activate
2. **Test với Internal testing** trước khi release production
3. **Monitor revenue** trong Google Play Console để track subscriptions
4. **Handle edge cases**: subscription expires, payment fails, user cancels, etc.

---

**Tác giả**: AI Assistant  
**Ngày tạo**: 2024  
**Phiên bản**: 1.0

