// src/components/SideMenu.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import UserInfo from './UserInfo';
import AppSettingsPage from './AppSettingsPage';
import { getUserData, markUserInfoCompleted } from '../utils/onboardingStorage';

function SideMenu({ 
  isVisible, 
  onClose, 
  onConversationSelect, 
  onSettingsPress,
  onPremiumPress,
  chatAreaRef
}) {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUserInfoEdit, setShowUserInfoEdit] = useState(false);
  const [showAppSettings, setShowAppSettings] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const slideAnim = useState(new Animated.Value(-Dimensions.get('window').width * 0.9))[0];
  const chatSlideAnim = useState(new Animated.Value(0))[0];

  // Load conversations from storage
  useEffect(() => {
    if (isVisible) {
      loadConversations();
      loadUserData();
      // Animate side menu slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(chatSlideAnim, {
          toValue: Dimensions.get('window').width * 0.9,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Animate side menu slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -Dimensions.get('window').width * 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(chatSlideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const loadUserData = async () => {
    try {
      const userData = await getUserData();
      setCurrentUserData(userData);
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const cleanUpConversations = async () => {
    try {
      const storedConversations = await AsyncStorage.getItem('conversationHistory');
      if (storedConversations) {
        const parsedConversations = JSON.parse(storedConversations);
        // Keep only conversations with more than 1 message
        const validConversations = parsedConversations.filter(
          conversation => (conversation.messageCount || 0) > 1
        );
        // Save cleaned up conversations back to storage
        await AsyncStorage.setItem('conversationHistory', JSON.stringify(validConversations));
        console.log(`Cleaned up conversations: removed ${parsedConversations.length - validConversations.length} greeting-only conversations`);
      }
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const storedConversations = await AsyncStorage.getItem('conversationHistory');
      if (storedConversations) {
        const parsedConversations = JSON.parse(storedConversations);
        // Filter conversations with more than 1 message (exclude greeting-only conversations)
        const filteredConversations = parsedConversations.filter(
          conversation => (conversation.messageCount || 0) > 1
        );
        // Sort by date (newest first)
        const sortedConversations = filteredConversations.sort((a, b) => 
          new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );
        setConversations(sortedConversations);
        
        // Clean up storage after successfully loading
        await cleanUpConversations();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelect = (conversation) => {
    onConversationSelect(conversation);
    onClose();
  };

  const handleSettingsPress = () => {
    setShowAppSettings(true);
  };

  const handlePremiumPress = () => {
    if (onPremiumPress) {
      onPremiumPress();
      onClose();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            onClose();
          }
        }
      ]
    );
  };

  const handleEditUserInfo = () => {
    setShowUserInfoEdit(true);
  };

  const handleUserInfoSubmit = async (userData) => {
    try {
      await markUserInfoCompleted(userData);
      setCurrentUserData(userData);
      setShowUserInfoEdit(false);
      Alert.alert('Success', 'Personal information has been updated!');
    } catch (error) {
      console.log('Error updating user info:', error);
      Alert.alert('Error', 'Unable to update personal information');
    }
  };

  const handleCancelEdit = () => {
    setShowUserInfoEdit(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-US');
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          {/* Header with SafeArea */}
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Settings & History</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Conversation History Section */}
          <View style={styles.conversationHistorySection}>
            <Text style={styles.sectionTitle}>Conversation History</Text>
            <ScrollView style={styles.conversationsList}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No conversations yet</Text>
                  <Text style={styles.emptySubText}>Start learning English to create your first conversation!</Text>
                </View>
              ) : (
                conversations.map((conversation, index) => (
                  <TouchableOpacity
                    key={conversation.id || index}
                    style={styles.conversationItem}
                    onPress={() => handleConversationSelect(conversation)}
                  >
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationTitle}>
                        {conversation.topic?.title || 'Conversation'}
                      </Text>
                      <Text style={styles.conversationDate}>
                        {formatDate(conversation.lastMessageTime)}
                      </Text>
                    </View>
                    <Text style={styles.conversationPreview}>
                      {truncateText(conversation.lastMessage || 'No messages yet')}
                    </Text>
                    <View style={styles.conversationStats}>
                      <Text style={styles.messageCount}>
                        {conversation.messageCount || 0} messages
                      </Text>
                      {conversation.topic?.icon && (
                        <Text style={styles.topicIcon}>{conversation.topic.icon}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* User Info Section with SafeArea */}
          <SafeAreaView style={styles.bottomSafeArea}>
            <View style={styles.userSection}>
              <View style={styles.userInfoCard}>
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {currentUserData?.name ? currentUserData.name.charAt(0).toUpperCase() : (user?.name ? user.name.charAt(0).toUpperCase() : '👤')}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>
                      {currentUserData?.name || user?.name || 'User'}
                    </Text>
                    <Text style={styles.userAge}>
                      {currentUserData?.age ? `${currentUserData.age} years old` : 'Age not set'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={handleEditUserInfo}
                >
                  <Text style={styles.editIconText}>✏️</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.userActions}>
                <TouchableOpacity 
                  style={styles.premiumButton}
                  onPress={handlePremiumPress}
                >
                  <Text style={styles.premiumButtonText}>⭐ Upgrade to Premium</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.settingsButton}
                  onPress={handleSettingsPress}
                >
                  <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
                </TouchableOpacity>
                
                {user && !user.isGuest && (
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutButtonText}>🚪 Logout</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
      
      {/* User Info Edit Modal */}
      {showUserInfoEdit && (
        <Modal
          visible={showUserInfoEdit}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleCancelEdit}
        >
          <View style={styles.userInfoModalContainer}>
            <View style={styles.userInfoModalHeader}>
              <Text style={styles.userInfoModalTitle}>Edit Personal Information</Text>
              <TouchableOpacity onPress={handleCancelEdit} style={styles.userInfoModalCloseButton}>
                <Text style={styles.userInfoModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <UserInfo 
              onUserInfoSubmit={handleUserInfoSubmit}
              initialData={currentUserData}
            />
          </View>
        </Modal>
      )}

      {/* App Settings Modal */}
      <AppSettingsPage 
        isVisible={showAppSettings}
        onClose={() => setShowAppSettings(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  sideMenu: {
    width: '90%',
    height: '100%',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerSafeArea: {
    backgroundColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  conversationHistorySection: {
    flex: 1,
    paddingTop: 16,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  conversationItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  conversationDate: {
    fontSize: 12,
    color: '#666666',
  },
  conversationPreview: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 18,
  },
  conversationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    color: '#999999',
  },
  topicIcon: {
    fontSize: 16,
  },
  bottomSafeArea: {
    backgroundColor: '#f8f9fa',
  },
  userSection: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  userAge: {
    fontSize: 14,
    color: '#666666',
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editIconText: {
    fontSize: 18,
  },
  userActions: {
    flexDirection: 'column',
    gap: 8,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  premiumButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: 'bold',
  },
  settingsButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfoModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  userInfoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfoModalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoModalCloseText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
});

export default SideMenu;
