# Paywall Quick Reference Card

## 🚀 Quick Access

**User Path**: Side Menu → ⭐ Nâng cấp Premium → Paywall Screen

## 📦 Product IDs (Copy & Paste Ready)

```
com.kidspeak.mobile.weeklytrial1
com.kidspeak.mobile.weekly1
com.kidspeak.mobile.monthly1
```

## 🎯 Files Modified

| File | Changes |
|------|---------|
| `PaywallScreen.js` | ✅ New component |
| `App.js` | ✅ Added to navigation |
| `SideMenu.js` | ✅ Premium button added |
| `AuthWrapper.js` | ✅ Navigation support |
| `ChatPage.js` | ✅ Navigation handler |

## 🎨 UI Components

### PaywallScreen Props:
```javascript
<PaywallScreen 
  navigation={navigation}      // For goBack()
  onSubscribe={(planId) => {}} // Called on purchase
  onClose={() => {}}           // Alternative to navigation
/>
```

### SideMenu New Prop:
```javascript
<SideMenu
  ...existingProps
  onPremiumPress={() => navigation.navigate('Paywall')}
/>
```

## 💳 Subscription Plans

| Plan | ID | Price | Badge |
|------|----|-------|-------|
| Weekly Trial | `weeklytrial1` | $2.99/wk | 🔴 Trial |
| Weekly | `weekly1` | $4.99/wk | - |
| Monthly | `monthly1` | $14.99/mo | 🟢 Best Value |

## 🔧 Testing Commands

```bash
# iOS
npm run ios

# Android
npm run android
```

## ⚡ Quick Navigation Test

From any component with navigation:
```javascript
import { useNavigation } from '@react-navigation/native';

function MyComponent() {
  const navigation = useNavigation();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Paywall')}
    >
      <Text>Go to Paywall</Text>
    </TouchableOpacity>
  );
}
```

## 📝 TODO for Production

- [ ] Install react-native-iap: `npm install react-native-iap`
- [ ] Create products in App Store Connect
- [ ] Create subscriptions in Google Play Console
- [ ] Implement IAP purchase flow (see PAYWALL_SETUP.md)
- [ ] Add receipt validation endpoint in backend
- [ ] Implement subscription status checking
- [ ] Gate premium features

## 🎨 Color Palette

```css
Purple Primary: #6C5CE7
Gold Premium:   #FFD700
Green Badge:    #4CAF50
Red Badge:      #FF6B6B
Background:     #F5F7FA
```

## 🔗 Navigation Stack

```
App.js
├── AuthWrapper (Screen)
│   └── ChatPage
│       └── SideMenu
│           └── [Premium Button] → navigate('Paywall')
└── Paywall (Screen) ← Direct navigation
```

## 📱 Button Location

**Side Menu** (Bottom section):
1. ⭐ Nâng cấp Premium (Golden button - NEW!)
2. ✏️ Chỉnh sửa thông tin
3. ⚙️ Cài đặt
4. 🚪 Đăng xuất

## 🎯 Key Functions

### In ChatPage.js:
```javascript
const handlePremiumPress = () => {
  if (navigation) {
    navigation.navigate('Paywall');
  }
};
```

### In PaywallScreen.js:
```javascript
const handleSubscribe = async () => {
  // TODO: Integrate with react-native-iap
  console.log('Subscribing to:', selectedPlan);
};
```

## ⚠️ Important Notes

1. **No actual IAP yet** - Currently shows simulated purchase
2. **Server validation required** - Don't trust client-side only
3. **Test with Sandbox** - Use test accounts for IAP testing
4. **Product IDs must match** - Exact match in App/Play Store

## 📚 Full Documentation

- **Setup Guide**: `PAYWALL_SETUP.md` (IAP integration steps)
- **Summary**: `PAYWALL_IMPLEMENTATION_SUMMARY.md` (overview)
- **This File**: Quick reference for daily use

## 🆘 Troubleshooting

### Paywall not showing?
1. Check navigation is passed to ChatPage
2. Verify 'Paywall' screen is in Stack.Navigator
3. Check console for navigation errors

### Premium button not visible?
1. Check SideMenu has `onPremiumPress` prop
2. Verify button is in userActions section
3. Look for the golden button with star emoji

### Linter errors?
```bash
npm run lint
```

All files should pass with no errors.

---

**Status**: ✅ UI Complete | ⏳ IAP Integration Pending
**Last Updated**: October 12, 2025

