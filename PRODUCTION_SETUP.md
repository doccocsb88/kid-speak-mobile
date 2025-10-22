# Production Setup Guide

## 🚀 Backend API Configuration

App đã được cấu hình để sử dụng production API thay vì localhost. 

### 📋 Cấu Hình Hiện Tại

```javascript
// src/config/environment.js
const getApiUrl = () => {
  const isDev = __DEV__ || process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return 'http://localhost:5000/api';  // Development
  } else {
    return 'https://kidspeak-backend.vercel.app/api';  // Production
  }
};
```

### 🔧 Để Cập Nhật Production URL

1. **Cập nhật URL trong file environment.js:**
   ```javascript
   // Thay đổi URL này trong src/config/environment.js
   return 'https://your-actual-backend-url.vercel.app/api';
   ```

2. **Test production API:**
   ```bash
   node check-backend.js
   ```

### 📱 Cách Hoạt Động

- **Development Mode**: App tự động dùng `localhost:5000`
- **Production Mode**: App sẽ dùng URL production 
- **Offline Mode**: Khi không kết nối được API → dùng fallback responses

### 🌐 Điều Kiện Hoạt Động

✅ **App sẽ hoạt động tốt khi:**
- Backend production đang chạy và accessible
- Network connection ổnirh
- Các endpoints `/chat/send-message`, `/chat/text-to-speech` available

✅ **App vẫn hoạt động khi:**
- Backend không available → Chuyển sang offline mode với fallback responses
- Network yếu → Timeout và hiển thị offline indicator

### 🎯 Offline Mode Features

- **Smart Responses**: Keyword-based fallback responses
- **Visual Indicator**: "📴 Working Offline" indicator  
- **Full Functionality**: Speech recognition và TTS fallback
- **Auto Recovery**: Tự động trở lại online mode khi API available

### 📝 Checklist Production

- [ ] Cập nhật production URL trong `environment.js`
- [ ] Test API endpoints với `check-backend.js`
- [ ] Verify offline mode hoạt động
- [ ] Test trên device thực tế (not simulator)
- [ ] Verify speech recognition permissions

### 🔍 Troubleshooting

**Lỗi Network Error:**
- App sẽ tự động chuyển sang offline mode
- Fallback responses sẽ được sử dụng
- User có thể tiếp tục học trong offline mode

**Backend không response:**
- Kiểm tra URL production có đúng không
- Verify backend server đang chạy
- Test với curl hoặc Postman
