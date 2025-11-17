// src/components/AppSettingsPage.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Linking,
  Alert,
  Share,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import PaywallScreen, { StoreType } from './PaywallScreen';
import UserInfoScreen from './UserInfoScreen';
import { markUserInfoCompleted } from '../utils/onboardingStorage';

function AppSettingsPage({ isVisible, onClose, mode = 'modal' }) {
  const insets = useSafeAreaInsets();
  const [showWebView, setShowWebView] = useState(false);
  const [webViewSource, setWebViewSource] = useState(null);
  const [webViewTitle, setWebViewTitle] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);

  const handleStorePress = () => {
    setShowPaywall(true);
  };

  const handleManageSubscriptionPress = () => {
    if (Platform.OS === 'ios') {
      const subscriptionUrl = 'itms-apps://apps.apple.com/account/subscriptions';
      
      Linking.canOpenURL(subscriptionUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(subscriptionUrl);
          } else {
            Alert.alert('Error', 'Unable to open subscription settings');
          }
        })
        .catch((err) => {
          console.error('Error opening subscription settings:', err);
          Alert.alert('Error', 'Could not open subscription settings');
        });
    } else {
      // Android: Open Google Play subscriptions
      const playStoreUrl = 'https://play.google.com/store/account/subscriptions';
      
      Linking.canOpenURL(playStoreUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(playStoreUrl);
          } else {
            Alert.alert('Error', 'Unable to open subscription settings');
          }
        })
        .catch((err) => {
          console.error('Error opening subscription settings:', err);
          Alert.alert('Error', 'Could not open subscription settings');
        });
    }
  };

  const handleReviewAppPress = () => {
    const appID = '6754305763';
    
    if (Platform.OS === 'ios') {
      const reviewUrl = `itms-apps://itunes.apple.com/US/app/id${appID}?action=write-review`;
      
      Linking.canOpenURL(reviewUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(reviewUrl);
          } else {
            // Fallback to web URL if app store link doesn't work
            const webUrl = `https://apps.apple.com/app/id${appID}?action=write-review`;
            Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error('Error opening review page:', err);
          Alert.alert('Error', 'Could not open App Store review page');
        });
    } else {
      // Android: Open Google Play Store review page
      const playStoreUrl = 'market://details?id=com.kidspeak'; // Replace with your Android package name
      
      Linking.canOpenURL(playStoreUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(playStoreUrl);
          } else {
            Alert.alert('Error', 'Unable to open Play Store');
          }
        })
        .catch((err) => {
          console.error('Error opening Play Store:', err);
          Alert.alert('Error', 'Could not open Play Store');
        });
    }
  };

  const handleContactUsPress = () => {
    const email = 'support@kidspeak.com';
    const subject = 'SpeakFun AI App Support';
    const body = 'Hello,\n\nI need help with:\n\n';
    
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(emailUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(emailUrl);
        } else {
          Alert.alert('Error', 'Email app is not available on this device');
        }
      })
      .catch((err) => {
        Alert.alert('Error', 'Could not open email app');
      });
  };

  const handleFAQsPress = () => {
    setWebViewSource(
      Platform.OS === 'ios'
        ? require('../../ios/KidSpeak/faqs.html')
        : {uri: 'file:///android_asset/faqs.html'}
    );
    setWebViewTitle('FAQs');
    setShowWebView(true);
  };

  const handleShareAppPress = async () => {
    try {
      const appStoreUrl = 'https://apps.apple.com/app/id6754305763';
      const shareMessage = Platform.OS === 'ios'
        ? `Check out SpeakFun AI - the amazing language learning app for kids! ${appStoreUrl}`
        : 'Check out SpeakFun AI - the amazing language learning app for kids!';

      const result = await Share.share({
        message: shareMessage,
        url: Platform.OS === 'ios' ? appStoreUrl : undefined,
        title: 'SpeakFun AI App',
      });

      if (result.action === Share.sharedAction) {
        // Content was shared
        console.log('App shared successfully');
      } else if (result.action === Share.dismissedAction) {
        // Share dialog was dismissed
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share the app');
    }
  };

  const handleOtherAppsPress = () => {
    Alert.alert('Our Other Apps', 'Check out our other apps coming soon!');
  };

  const handlePrivacyPolicyPress = () => {
    setWebViewSource(
      Platform.OS === 'ios'
        ? require('../../ios/KidSpeak/privacy-policy.html')
        : {uri: 'file:///android_asset/privacy-policy.html'}
    );
    setWebViewTitle('Privacy Policy');
    setShowWebView(true);
  };

  const handleUserInfoPress = () => {
    setShowUserInfo(true);
  };

  const handleUserInfoSubmit = async (userData) => {
    await markUserInfoCompleted(userData);
    setShowUserInfo(false);
    Alert.alert('Success', 'Your information has been updated!');
  };

  const SettingItem = ({ iconSource, title, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingItemContent}>
        <View style={styles.settingIconContainer}>
          <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingGroup}>
        {children}
      </View>
    </View>
  );

  const Header = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      {mode === 'modal' ? (
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
      <Text style={styles.headerTitle}>Settings</Text>
      <View style={styles.headerRightPlaceholder} />
    </View>
  );

  const MainContent = () => (
    <View style={styles.modalContainer}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <Header />

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SettingSection title="Account">
          <SettingItem
            iconSource={require('../assets/images/ic_setting_store.png')}
            title="Store"
            onPress={handleStorePress}
          />
          <SettingItem
            iconSource={require('../assets/images/ic_setting_manage_subscription.png')}
            title="Manage Subscription"
            onPress={handleManageSubscriptionPress}
          />
          <SettingItem
            iconSource={require('../assets/images/ic_setting_userinfo.png')}
            title="User Info"
            onPress={handleUserInfoPress}
          />
        </SettingSection>

        {/* Support & Feedback Section */}
        <SettingSection title="Support & Feedback">
          <SettingItem
            iconSource={require('../assets/images/ic_setting_review.png')}
            title="Review App"
            onPress={handleReviewAppPress}
          />
          <SettingItem
            iconSource={require('../assets/images/ic_setting_email.png')}
            title="Contact us"
            onPress={handleContactUsPress}
          />
          <SettingItem
            iconSource={require('../assets/images/ic_setting_faqs.png')}
            title="FAQs"
            onPress={handleFAQsPress}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title="About">
          <SettingItem
            iconSource={require('../assets/images/ic_setting_share.png')}
            title="Share our app with friend"
            onPress={handleShareAppPress}
          />
          <SettingItem
            iconSource={require('../assets/images/ic_setting_policy.png')}
            title="Privacy policy"
            onPress={handlePrivacyPolicyPress}
          />
        </SettingSection>
      </ScrollView>
    </View>
  );

  return mode === 'modal' ? (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      onRequestClose={onClose}
    >
      <MainContent />

      {/* WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={[styles.webViewHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity 
              onPress={() => setShowWebView(false)} 
              style={styles.webViewCloseButton}
            >
              <Text style={styles.webViewCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>{webViewTitle}</Text>
            <View style={styles.webViewPlaceholder} />
          </View>
          <WebView
            originWhitelist={['*']}
            source={webViewSource}
            style={styles.webView}
            startInLoadingState={true}
            scalesPageToFit={true}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Error', 'Failed to load the page');
            }}
          />
        </View>
      </Modal>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          storeType={StoreType.STORE}
          onClose={() => setShowPaywall(false)}
          onSubscribe={(planId) => {
            console.log('Subscribed to:', planId);
            setShowPaywall(false);
          }}
        />
      </Modal>

      {/* UserInfo Modal */}
      <Modal
        visible={showUserInfo}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowUserInfo(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          {Platform.OS === 'ios' ? (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
              <View style={styles.userInfoHeader}>
                <TouchableOpacity 
                  onPress={() => setShowUserInfo(false)} 
                  style={styles.userInfoCloseButton}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.userInfoTitle}>User Info</Text>
                <View style={styles.headerRightPlaceholder} />
              </View>
            </SafeAreaView>
          ) : (
            <View style={[styles.userInfoHeader, { paddingTop: Math.max(insets.top, 16) }]}>
              <TouchableOpacity 
                onPress={() => setShowUserInfo(false)} 
                style={styles.userInfoCloseButton}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.userInfoTitle}>User Info</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          )}
          <UserInfoScreen onUserInfoSubmit={handleUserInfoSubmit} isFromSettings={true} />
        </View>
      </Modal>
    </Modal>
  ) : (
    <>
      <MainContent />
      {/* WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowWebView(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          <View style={[styles.webViewHeader, { paddingTop: insets.top + 16 }]}>
            <TouchableOpacity 
              onPress={() => setShowWebView(false)} 
              style={styles.webViewCloseButton}
            >
              <Text style={styles.webViewCloseButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>{webViewTitle}</Text>
            <View style={styles.webViewPlaceholder} />
          </View>
          <WebView
            originWhitelist={['*']}
            source={webViewSource}
            style={styles.webView}
            startInLoadingState={true}
            scalesPageToFit={true}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              Alert.alert('Error', 'Failed to load the page');
            }}
          />
        </View>
      </Modal>
      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen
          storeType={StoreType.STORE}
          onClose={() => setShowPaywall(false)}
          onSubscribe={(planId) => {
            console.log('Subscribed to:', planId);
            setShowPaywall(false);
          }}
        />
      </Modal>
      {/* UserInfo Modal */}
      <Modal
        visible={showUserInfo}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowUserInfo(false)}
      >
        <View style={styles.modalContainer}>
          <StatusBar barStyle="dark-content" />
          {Platform.OS === 'ios' ? (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
              <View style={styles.userInfoHeader}>
                <TouchableOpacity 
                  onPress={() => setShowUserInfo(false)} 
                  style={styles.userInfoCloseButton}
                >
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.userInfoTitle}>User Info</Text>
                <View style={styles.headerRightPlaceholder} />
              </View>
            </SafeAreaView>
          ) : (
            <View style={[styles.userInfoHeader, { paddingTop: Math.max(insets.top, 16) }]}>
              <TouchableOpacity 
                onPress={() => setShowUserInfo(false)} 
                style={styles.userInfoCloseButton}
              >
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.userInfoTitle}>User Info</Text>
              <View style={styles.headerRightPlaceholder} />
            </View>
          )}
          <UserInfoScreen onUserInfoSubmit={handleUserInfoSubmit} isFromSettings={true} />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#FCFCFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPlaceholder: {
    width: 48,
  },
  backIcon: {
    fontSize: 24,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  headerRightPlaceholder: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  settingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F3F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
    color: '#4CB2E6',
  },
  iconImage: {
    width: 24,
    height: 24,
    tintColor: '#4CB2E6',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '400',
    flex: 1,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#999999',
    fontWeight: '300',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  webViewCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewCloseButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
  webViewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  webViewPlaceholder: {
    width: 32,
  },
  webView: {
    flex: 1,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  userInfoCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
});

export default AppSettingsPage;
