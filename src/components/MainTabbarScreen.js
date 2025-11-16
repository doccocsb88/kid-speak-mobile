import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './HomeScreen';
import AppSettingsPage from './AppSettingsPage';
import ConversationHistory from '../pages/ConversationHistory';

function MainTabbarScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'history' | 'settings'
  const insets = useSafeAreaInsets();

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen navigation={navigation} hideBottomNav />;
      case 'history':
        return (
          <ConversationHistory
            navigation={navigation}
            hideBottomNav
            isTabMode
          />
        );
      case 'settings':
        return <AppSettingsPage isVisible={true} onClose={() => {}} mode="screen" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={activeTab === 'home' ? styles.navItemActive : styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Image
            source={require('../assets/images/ic_tab_home.png')}
            style={[
              styles.navIcon,
              activeTab === 'home' ? styles.navIconActive : styles.navIconInactive,
            ]}
            resizeMode="contain"
          />
          <Text style={activeTab === 'home' ? styles.navLabelActive : styles.navLabel}>
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'history' ? styles.navItemActive : styles.navItem}
          onPress={() => setActiveTab('history')}
        >
          <Image
            source={require('../assets/images/ic_tab_history.png')}
            style={[
              styles.navIcon,
              activeTab === 'history' ? styles.navIconActive : styles.navIconInactive,
            ]}
            resizeMode="contain"
          />
          <Text style={activeTab === 'history' ? styles.navLabelActive : styles.navLabel}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={activeTab === 'settings' ? styles.navItemActive : styles.navItem}
          onPress={() => setActiveTab('settings')}
        >
          <Image
            source={require('../assets/images/ic_tab_setting.png')}
            style={[
              styles.navIcon,
              activeTab === 'settings' ? styles.navIconActive : styles.navIconInactive,
            ]}
            resizeMode="contain"
          />
          <Text style={activeTab === 'settings' ? styles.navLabelActive : styles.navLabel}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 30,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 6,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActive: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navIconActive: {
    tintColor: '#2A66FF',
  },
  navIconInactive: {
    tintColor: '#6B7A90',
  },
  navLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7A90',
    fontWeight: '600',
  },
  navLabelActive: {
    marginTop: 4,
    fontSize: 12,
    color: '#2A66FF',
    fontWeight: '800',
  },
});

export default MainTabbarScreen;


