// src/components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function Header({ onMenuPress, onSettingsPress, hideSettingsButton = false }) {
  const HeaderContent = (
    <View style={styles.header}>
       <TouchableOpacity 
        style={styles.menuButton}
        onPress={onMenuPress}
      >
        <Text style={styles.menuButtonText}>☰</Text>
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>
          <Text style={styles.kidText}>KID</Text>
          <Text style={styles.speakText}> SPEAK</Text>
        </Text>
      </View>
   
      {!hideSettingsButton ? (
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={onSettingsPress}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.settingsButtonPlaceholder} />
      )}
    </View>
  );

  // Use SafeAreaView for iOS to handle status bar
  if (Platform.OS === 'ios') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {HeaderContent}
      </SafeAreaView>
    );
  }

  return HeaderContent;
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  settingsButtonText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#ffffff',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  kidText: {
    color: '#ff6b9d',
  },
  speakText: {
    color: '#ff9f43',
  },
  microphoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#90EE90',
    justifyContent: 'center',
    alignItems: 'center',
  },
  microphoneText: {
    fontSize: 18,
  },
});

export default Header;