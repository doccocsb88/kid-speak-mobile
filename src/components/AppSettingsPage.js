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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import PaywallScreen from './PaywallScreen';

function AppSettingsPage({ isVisible, onClose }) {
  const insets = useSafeAreaInsets();
  const [showWebView, setShowWebView] = useState(false);
  const [webViewSource, setWebViewSource] = useState(null);
  const [webViewTitle, setWebViewTitle] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);

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
    const subject = 'KidSpeak App Support';
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
    setWebViewSource(require('../assets/faqs.html'));
    setWebViewTitle('FAQs');
    setShowWebView(true);
  };

  const handleShareAppPress = async () => {
    try {
      const appStoreUrl = 'https://apps.apple.com/app/id6754305763';
      const shareMessage = Platform.OS === 'ios'
        ? `Check out KidSpeak - the amazing language learning app for kids! ${appStoreUrl}`
        : 'Check out KidSpeak - the amazing language learning app for kids!';

      const result = await Share.share({
        message: shareMessage,
        url: Platform.OS === 'ios' ? appStoreUrl : undefined,
        title: 'KidSpeak App',
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
    setWebViewSource(require('../assets/privacy-policy.html'));
    setWebViewTitle('Privacy Policy');
    setShowWebView(true);
  };

  const SettingItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.arrowIcon}>›</Text>
    </TouchableOpacity>
  );

  const SettingGroup = ({ children }) => (
    <View style={styles.settingGroup}>
      {children}
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <StatusBar barStyle="dark-content" />
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* First Group */}
          <SettingGroup>
            <SettingItem
              icon="🏪"
              title="Store"
              onPress={handleStorePress}
            />
            <SettingItem
              icon="👑"
              title="Manage Subscription"
              onPress={handleManageSubscriptionPress}
            />
          </SettingGroup>

          {/* Second Group */}
          <SettingGroup>
            {/* <SettingItem
              icon="🔲"
              title="Change App Icon"
              onPress={handleChangeAppIconPress}
            /> */}
            <SettingItem
              icon="⭐"
              title="Review App"
              onPress={handleReviewAppPress}
            />
            <SettingItem
              icon="✉️"
              title="Contact us"
              onPress={handleContactUsPress}
            />
            <SettingItem
              icon="❓"
              title="FAQs"
              onPress={handleFAQsPress}
            />
            <SettingItem
              icon="📤"
              title="Share our app with friend"
              onPress={handleShareAppPress}
            />
          {/* </SettingGroup> */}

          {/* Third Group */}
          {/* <SettingGroup> */}
            {/* <SettingItem
              icon="🔳"
              title="Our other apps"
              onPress={handleOtherAppsPress}
            /> */}
            <SettingItem
              icon="🛡️"
              title="Privacy policy"
              onPress={handlePrivacyPolicyPress}
            />
          </SettingGroup>
        </ScrollView>
      </View>

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
          onClose={() => setShowPaywall(false)}
          onSubscribe={(planId) => {
            console.log('Subscribed to:', planId);
            setShowPaywall(false);
          }}
        />
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
    color: '#ffffff',
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#cccccc',
    fontWeight: 'bold',
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
});

export default AppSettingsPage;
