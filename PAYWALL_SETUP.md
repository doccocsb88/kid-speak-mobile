# Paywall Screen Setup Guide

## Overview
A basic paywall screen has been implemented with 3 subscription plans:
- `com.kidspeak.mobile.weeklytrial1` - Weekly Trial ($2.99/week)
- `com.kidspeak.mobile.weekly1` - Weekly Plan ($4.99/week)
- `com.kidspeak.mobile.monthly1` - Monthly Plan ($14.99/month) - Best Value

## Current Status
✅ UI Implementation Complete
✅ Navigation Integration Complete
⚠️ IAP Integration Pending (requires react-native-iap)

## How to Navigate to Paywall

From any screen with navigation access, use:

```javascript
navigation.navigate('Paywall');
```

Example usage in a component:
```javascript
import { useNavigation } from '@react-navigation/native';

function MyComponent() {
  const navigation = useNavigation();
  
  const showPaywall = () => {
    navigation.navigate('Paywall');
  };
  
  return (
    <TouchableOpacity onPress={showPaywall}>
      <Text>Upgrade to Premium</Text>
    </TouchableOpacity>
  );
}
```

## Features
- ✅ Beautiful, modern UI design
- ✅ Three subscription tiers
- ✅ Visual selection indicator
- ✅ Badge system (Best Value, Trial)
- ✅ Feature list for each plan
- ✅ Loading states
- ✅ Restore purchases button
- ✅ Close functionality

## Next Steps: IAP Integration

To complete the paywall with actual purchase functionality, follow these steps:

### 1. Install react-native-iap

```bash
npm install react-native-iap
# or
yarn add react-native-iap
```

For iOS:
```bash
cd ios && pod install && cd ..
```

### 2. Configure App Store Connect / Google Play Console

**iOS (App Store Connect):**
1. Create App in App Store Connect
2. Go to "App Store" → "In-App Purchases"
3. Create 3 Auto-Renewable Subscriptions:
   - Product ID: `com.kidspeak.mobile.weeklytrial1`
   - Product ID: `com.kidspeak.mobile.weekly1`
   - Product ID: `com.kidspeak.mobile.monthly1`
4. Set prices and descriptions
5. Create Subscription Groups

**Android (Google Play Console):**
1. Create App in Google Play Console
2. Go to "Monetize" → "Products" → "Subscriptions"
3. Create 3 subscriptions with same Product IDs
4. Set prices and billing periods

### 3. Update PaywallScreen.js

Replace the TODO sections in `PaywallScreen.js` with actual IAP implementation:

```javascript
import RNIap, {
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
} from 'react-native-iap';

// Add to component
useEffect(() => {
  // Initialize IAP
  initIAP();
  
  return () => {
    // Cleanup listeners
  };
}, []);

const initIAP = async () => {
  try {
    await RNIap.initConnection();
    const products = await RNIap.getSubscriptions([
      'com.kidspeak.mobile.weeklytrial1',
      'com.kidspeak.mobile.weekly1',
      'com.kidspeak.mobile.monthly1',
    ]);
    console.log('Available products:', products);
    // Update SUBSCRIPTION_PLANS with real prices
  } catch (error) {
    console.error('IAP Init Error:', error);
  }
};

const handleSubscribe = async () => {
  try {
    setLoading(true);
    await RNIap.requestSubscription(selectedPlan);
  } catch (error) {
    console.error('Purchase error:', error);
    Alert.alert('Error', 'Purchase failed');
  } finally {
    setLoading(false);
  }
};

const handleRestore = async () => {
  try {
    setLoading(true);
    const purchases = await RNIap.getAvailablePurchases();
    if (purchases.length > 0) {
      Alert.alert('Success', 'Purchases restored!');
    } else {
      Alert.alert('No Purchases', 'No previous purchases found');
    }
  } catch (error) {
    console.error('Restore error:', error);
  } finally {
    setLoading(false);
  }
};
```

### 4. Add Purchase Listeners

```javascript
useEffect(() => {
  const purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
    const receipt = purchase.transactionReceipt;
    if (receipt) {
      try {
        // Validate receipt with your backend
        await validateReceipt(receipt);
        
        // Finish transaction
        await finishTransaction(purchase);
        
        Alert.alert('Success', 'Purchase completed!');
      } catch (error) {
        console.error('Receipt validation error:', error);
      }
    }
  });

  const purchaseErrorSubscription = purchaseErrorListener((error) => {
    console.warn('Purchase error:', error);
    Alert.alert('Purchase Error', error.message);
  });

  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
  };
}, []);
```

### 5. Backend Integration

Create an endpoint to validate receipts:

```javascript
// Backend endpoint: POST /api/validate-receipt
async function validateReceipt(receipt, productId, platform) {
  // Send to Apple/Google for verification
  // Store subscription in database
  // Update user's premium status
}
```

### 6. Check Subscription Status

Create a utility to check if user has active subscription:

```javascript
// utils/subscriptionService.js
export const checkSubscriptionStatus = async () => {
  try {
    const purchases = await RNIap.getAvailablePurchases();
    const activeSub = purchases.find(p => 
      p.productId.includes('com.kidspeak.mobile') &&
      new Date(p.expirationDate) > new Date()
    );
    return !!activeSub;
  } catch (error) {
    console.error('Check subscription error:', error);
    return false;
  }
};
```

### 7. Testing

**iOS:**
- Use Sandbox testers from App Store Connect
- Test in device (not simulator for real purchases)

**Android:**
- Use test account from Google Play Console
- Use license testing mode

## Integration Points

You can show the paywall at various points:
1. **After Onboarding** - Show immediately after user info
2. **Feature Gate** - Show when user tries to use premium feature
3. **Settings** - Add "Upgrade to Premium" button in settings
4. **Limit Reached** - Show when free tier limit is reached

### Example: Show After User Info

```javascript
// In App.js
const handleUserInfoFinish = async (userData) => {
  await markUserInfoCompleted(userData);
  // Navigate to paywall first
  setAppState('paywall');
};

// Add paywall case
case 'paywall':
  return <PaywallScreen onSubscribe={handleSubscription} />;
```

## Product IDs
- **Weekly Trial**: `com.kidspeak.mobile.weeklytrial1`
- **Weekly Plan**: `com.kidspeak.mobile.weekly1`
- **Monthly Plan**: `com.kidspeak.mobile.monthly1` (Recommended)

## Design Features
- Purple theme matching app design (#6C5CE7)
- Radio button selection
- Visual badges (Best Value, Trial)
- Feature lists with checkmarks
- Shadow effects for depth
- Loading states
- Error handling

## Security Notes
⚠️ Always validate receipts server-side
⚠️ Never trust client-side purchase verification
⚠️ Store subscription status in your backend
⚠️ Use HTTPS for all receipt validation

## Support
For IAP issues, refer to:
- [react-native-iap documentation](https://github.com/dooboolab/react-native-iap)
- [Apple IAP Guidelines](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

