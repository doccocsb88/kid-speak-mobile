# Onboarding System Setup Guide

## 📱 **Tổng quan hệ thống Onboarding**

Hệ thống onboarding của KidSpeak bao gồm 3 trang với flow hoàn chỉnh:

**Flow**: `Loading Screen` → `Onboarding (3 pages)` → `Main App`

## ✅ **Đã hoàn thành:**

### 1. **OnboardingScreen Component** (`src/components/OnboardingScreen.js`)
- 3 trang onboarding với background image riêng biệt
- Animation mượt mà với fade-in/fade-out
- Nút Next/Skip với thiết kế responsive
- Page indicators để hiển thị tiến trình
- Text content tùy chỉnh cho từng trang

### 2. **Storage Management** (`src/utils/onboardingStorage.js`)
- Lưu trạng thái onboarding đã hoàn thành
- Kiểm tra xem user đã thấy onboarding chưa
- Reset onboarding cho development/testing

### 3. **App Integration** (`src/App.js`)
- Flow state management hoàn chỉnh
- Tự động skip onboarding nếu đã hoàn thành
- Smooth transitions giữa các screens

## 🎨 **Thiết kế của từng trang:**

### **Trang 1**: `onb_page1.png`
- **Title**: "Welcome to KidSpeak!"
- **Subtitle**: "Speak • Learn • Grow Together"
- **Description**: "Start your amazing journey of language learning and fun conversations."
- **Button**: "Next" (màu đỏ #FF6B6B)

### **Trang 2**: `onb_page2.png`
- **Title**: "Have Fun Learning"
- **Subtitle**: "Interactive Conversations"
- **Description**: "Engage in exciting conversations with our friendly AI assistant."
- **Button**: "Next" (màu xanh lá #4ECDC4)

### **Trang 3**: `onb_page3.png`
- **Title**: "Ready to Start!"
- **Subtitle**: "Let's Begin Your Adventure"
- **Description**: "You're all set! Begin speaking, learning, and growing with KidSpeak."
- **Button**: "Get Started" (màu xanh dương #45B7D1)

## 🔧 **Tính năng:**

- ✅ **3 trang onboarding** với background image đẹp
- ✅ **Smooth animations** với fade và scale effects
- ✅ **Page indicators** hiển thị tiến trình
- ✅ **Skip button** cho 2 trang đầu
- ✅ **Auto-save status** - không hiển thị lại lần sau
- ✅ **Debug component** để reset onboarding trong development
- ✅ **Responsive design** hoạt động tốt trên mọi kích thước màn hình
- ✅ **Gradient overlay** để text dễ đọc trên background
- ✅ **Professional styling** với shadows và animations

## 🛠 **Debug & Testing:**

### Reset Onboarding Status:
```javascript
import {resetOnboardingStatus} from './src/utils/onboardingStorage';

await resetOnboardingStatus(); // Sẽ hiển thị onboarding lại lần sau
```

### Debug Component:
- Có sẵn nút "Reset Onboarding" trên góc phải khi ở màn hình onboarding
- Xuất hiện chỉ trong development mode
- Cho phép test onboarding flow mà không cần restart app

## 📱 **Flow hoạt động:**

1. **Load App** → Hiện Loading Screen (SplashScreen)
2. **Splash Complete** → Kiểm tra onboarding status
3. **First Time** → Hiện OnboardingScreen (3 pages)
4. **Onboarding Complete** → Lưu status & vào Main App
5. **Subsequent Launches** → Skip onboarding, vào thẳng Main App

## 🎯 **Customization:**

### Thay đổi text/content:
Chỉnh sửa `onboardingData` array trong `OnboardingScreen.js`:
```javascript
const onboardingData = [
  {
    id: 1,
    backgroundImage: require('../assets/images/onb_page1.png()),
    title: 'Your Custom Title',
    subtitle: 'Your Custom Subtitle',
    description: 'Your Custom Description',
    buttonText: 'Custom Button',
    buttonColor: '#YourColor',
  },
  // ... more pages
];
```

### Thay đổi animation timing:
```javascript
// Fade animation duration
Animated.timing(fadeAnim, {
  toValue: 0,
  duration: 500, // Thay đổi ở đây
  useNativeDriver: true,
}).start();
```

## 🚀 **Production Ready:**

- ✅ Error handling đầy đủ
- ✅ Performance optimized với native driver
- ✅ Memory leak prevention
- ✅ AsyncStorage integration
- ✅ Professional UI/UX design

Hệ thống onboarding của bạn đã sẵn sàng sử dụng! 🎉

**Backup note**: Lưu ý remove `OnboardingDebug` component trong production build.
