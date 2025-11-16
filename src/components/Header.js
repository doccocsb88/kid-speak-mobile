// src/components/Header.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FRIENDS } from '../pages/FriendList';

function Header({ onBackPress, onSettingsPress, hideSettingsButton = false, selectedTopic = null }) {
  const insets = useSafeAreaInsets();
  
  // Get character name and avatar from selected topic
  const getCharacterInfo = () => {
    if (!selectedTopic) {
      return { name: 'SpeakFun AI', avatar: '🤖' };
    }
    
    // Check if it's a friend topic
    if (selectedTopic.id?.startsWith('friend_')) {
      const friendId = selectedTopic.id.replace('friend_', '');
      // Find friend from FRIENDS array
      const friend = FRIENDS.find(f => f.id === friendId);
      if (friend) {
        return {
          name: friend.name,
          avatar: friend.icon
        };
      }
      // Fallback if friend not found
      return { 
        name: selectedTopic.title?.replace('Chat with ', '') || 'Friend',
        avatar: selectedTopic.icon || '👤'
      };
    }
    
    // Regular topic - use topic icon and title
    return {
      name: selectedTopic.title || 'SpeakFun AI',
      avatar: selectedTopic.icon || '🤖'
    };
  };
  
  const characterInfo = getCharacterInfo();
  
  const HeaderContent = (
    <View style={[styles.header, Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.leftSection}>
        {onBackPress && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{characterInfo.avatar}</Text>
        </View>
        <Text style={styles.characterName} numberOfLines={1}>
          {characterInfo.name}
        </Text>
      </View>
   
      <View style={styles.rightSection}>
        {!hideSettingsButton && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={onSettingsPress}
          >
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        )}
      </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  iconText: {
    fontSize: 24,
    color: '#4A4A4A',
  },
});

export default Header;