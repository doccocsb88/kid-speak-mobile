import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Platform,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {WebView} from 'react-native-webview';
import NativeIAPService from '../services/nativeIapService';
import UserManager from '../services/UserManager';

// Get screen dimensions
const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const isSmallDevice = SCREEN_HEIGHT < 700;
const isLargeDevice = SCREEN_HEIGHT > 812;

// Store Type Enum
export const StoreType = {
  DIRECT_STORE: 'directStore',
  STORE: 'store',
};

// Common features for all plans
const COMMON_FEATURES = [
  'Full access to all features',
  'Unlimited conversations',
  'Cancel anytime',
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'com.kidspeak.mobile.weeklytrial1',
    title: 'Weekly Trial',
    price: '$2.99',
    duration: 'per week',
    description: '7-day trial access',
    badge: 'Trial',
    badgeColor: '#FF6B6B',
    isPopular: false,
  },
  {
    id: 'com.kidspeak.mobile.weekly1',
    title: 'Weekly Plan',
    price: '$4.99',
    duration: 'per week',
    description: 'Perfect for short-term learning',
    badge: null,
    isPopular: false,
  },
  {
    id: 'com.kidspeak.mobile.monthly1',
    title: 'Monthly Plan',
    price: '$14.99',
    duration: 'per month',
    description: 'Best value for continuous learning',
    badge: 'Best Value',
    badgeColor: '#4CAF50',
    isPopular: true,
  },
];

const PaywallScreen = ({navigation, onSubscribe, onClose, storeType = StoreType.DIRECT_STORE}) => {
  const [selectedPlan, setSelectedPlan] = useState('com.kidspeak.mobile.monthly1');
  const [loading, setLoading] = useState(false);
  const [iapReady, setIapReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  // Initialize IAP on component mount
  useEffect(() => {
    initializeIAP();
    
    // Cleanup on unmount
    return () => {
      // Don't disconnect here as it's a singleton
      // IAPService will cleanup when app closes
    };
  }, []);

  const initializeIAP = async () => {
    try {
      setLoading(true);
      const initialized = await NativeIAPService.initialize();
      
      if (initialized) {
        const availableProducts = await NativeIAPService.getProducts();
        setProducts(availableProducts);
        setIapReady(true);
        
        // Update prices from store if available
        updatePricesFromStore(availableProducts);
      } else {
        Alert.alert(
          'Error',
          'Unable to connect to the store. Please try again later.',
          [{ text: 'OK', onPress: handleClose }]
        );
      }
    } catch (error) {
      console.error('IAP initialization error:', error);
      Alert.alert('Error', 'Unable to initialize payment system');
    } finally {
      setLoading(false);
    }
  };

  const updatePricesFromStore = (storeProducts) => {
    // Update SUBSCRIPTION_PLANS with real prices from store
    storeProducts.forEach(product => {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === product.id);
      if (plan && product.displayPrice) {
        plan.price = product.displayPrice;
      }
    });
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
    
    if (!plan) {
      Alert.alert('Error', 'Please select a subscription plan');
      return;
    }

    if (!iapReady) {
      Alert.alert('Error', 'Payment system is not ready. Please try again');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Subscribing to plan:', selectedPlan);
      
      // Purchase subscription using Native IAP service
      await NativeIAPService.purchaseSubscription(selectedPlan);
      
      // Mark user as premium locally
      await UserManager.setPremiumUser(true);

      // Call callback if provided
      if (onSubscribe) {
        onSubscribe(selectedPlan);
      }
      
      // If storeType is directStore, dismiss immediately
      if (storeType === StoreType.DIRECT_STORE) {
        Alert.alert(
          'Success!',
          `You have successfully subscribed to ${plan.title}!`,
          [
            {
              text: 'Start Learning',
              onPress: () => {
                if (onClose) {
                  onClose();
                } else if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        // If storeType is store, don't dismiss - just show success message
        Alert.alert(
          'Success!',
          `You have successfully subscribed to ${plan.title}!`,
          [
            {
              text: 'OK',
              onPress: () => {}
            }
          ]
        );
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        error.message || 'Unable to complete subscription. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!iapReady) {
      Alert.alert('Error', 'Payment system is not ready');
      return;
    }

    setLoading(true);
    try {
      console.log('Restoring purchases...');
      
      const result = await NativeIAPService.restorePurchases();
      
      if (result.success) {
        // Mark user as premium locally on successful restore
        await UserManager.setPremiumUser(true);

        Alert.alert(
          'Restore Successful',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSubscribe) {
                  // Notify parent component that subscription is restored
                  onSubscribe('restored');
                }
                if (onClose) {
                  onClose();
                } else if (navigation) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Notice', result.message);
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Error',
        'Unable to restore purchases. Please try again later'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Show content only when we have products OR when not in initial loading */}
      {
        // Main content
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ImageBackground 
            source={require('../assets/images/paywallheader.png')}
            style={styles.header}
            resizeMode="cover"
          >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            {/* Features List */}
            <View style={styles.featuresInHeader}>
              {COMMON_FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && styles.planCardSelected,
                  plan.isPopular && styles.planCardPopular,
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={loading}
                activeOpacity={0.7}
              >
                {/* Badge */}
                {plan.badge && (
                  <View style={[styles.badge, {backgroundColor: plan.badgeColor}]}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}

                {/* Radio Button */}
                <View style={styles.radioContainer}>
                  <View style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected
                  ]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </View>

                {/* Plan Info */}
                <View style={styles.planInfo}>
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planDuration}> {plan.duration}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue with Limited Version Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleClose}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.continueButtonText}>Continue with Limited Version</Text>
        </TouchableOpacity>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
        </TouchableOpacity>

       

        {/* Terms and Policy Links */}
        <View style={styles.termsContainer}>
          <View style={styles.linksContainer}>
            <TouchableOpacity onPress={() => setShowTermsOfUse(true)}>
              <Text style={styles.linkText}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}> • </Text>

 {/* Restore Button */}
 <TouchableOpacity
          style={styles.linksContainer}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={styles.linkText}>Restore Purchases</Text>
        </TouchableOpacity>
            <Text style={styles.linkSeparator}> • </Text>
            <TouchableOpacity onPress={() => setShowPrivacyPolicy(true)}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
            {/* Store Policies */}
            <Text style={styles.policyText}>
            • Subscribed user has unlimited access to the services.{'\n\n'}
            • Payment will be charged to iTunes Account at purchase confirmation.{'\n'}
            • Subscription automatically renews within 24-hours prior to the end of the current subscription period.{'\n'}
            • Subscription may be managed and auto-renewal may be turned off by going to the User's Account Settings after purchased.{'\n'}
            • Any unused portion of a free trial period, if offered, will be forfeited when user purchases a subscription to that publication, where applicable.
          </Text>
        </View>
        </ScrollView>
      }

      {/* Loading Overlay - when performing actions */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#6C5CE7" />
            <Text style={styles.loadingText}>
              {products.length > 0 ? 'Processing...' : 'Loading subscription plans'}
            </Text>
          </View>
        </View>
      )}

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyPolicy}
        animationType="slide"
        onRequestClose={() => setShowPrivacyPolicy(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPrivacyPolicy(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={['*']}
            source={
              Platform.OS === 'ios'
                ? require('../../ios/KidSpeak/privacy-policy.html')
                : {uri: 'file:///android_asset/privacy-policy.html'}
            }
            style={styles.webview}
          />
        </SafeAreaView>
      </Modal>

      {/* Terms of Use Modal */}
      <Modal
        visible={showTermsOfUse}
        animationType="slide"
        onRequestClose={() => setShowTermsOfUse(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms of Use</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTermsOfUse(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={['*']}
            source={
              Platform.OS === 'ios'
                ? require('../../ios/KidSpeak/terms-of-use.html')
                : {uri: 'file:///android_asset/terms-of-use.html'}
            }
            style={styles.webview}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6C5CE7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6C5CE7',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingCard: {
    width: 250,
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    backgroundColor: '#FFF',
  },
  header: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: isLargeDevice ? 5 : (isSmallDevice ? 5 : 5),
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    minHeight: isLargeDevice ? 280 : (isSmallDevice ? 180 : 220),
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isSmallDevice ? 0 : 5,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresInHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 0,
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#FFF',
    paddingTop: 10,
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingTop: 16,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 0,

    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#6C5CE7',
    borderWidth: 2,
    shadowColor: '#6C5CE7',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  planCardPopular: {
    borderColor: '#4CAF50',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  radioContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#6C5CE7',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6C5CE7',
  },
  planInfo: {
    marginLeft: 35,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 3,
  },
  planDescription: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  planPrice: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6C5CE7',
  },
  planDuration: {
    fontSize: 15,
    color: '#7F8C8D',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCheck: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
    flex: 1,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  subscribeButton: {
    backgroundColor: '#6C5CE7',
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 50,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#7F8C8D',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  restoreButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  restoreButtonText: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 12,
    marginHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingBottom: 20,
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#95A5A6',
    lineHeight: 18,
    marginBottom: 8,
  },
  policyText: {
    fontSize: 10,
    color: '#95A5A6',
    lineHeight: 14,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'left',
  },

  linksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12,
    color: '#6C5CE7',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 12,
    color: '#95A5A6',
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#6C5CE7',
    fontSize: 20,
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
});

export default PaywallScreen;

