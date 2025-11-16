import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FRIENDS } from '../pages/FriendList';
import HomeTopicGrid from './HomeTopicGrid';
import AppSettingsPage from './AppSettingsPage';

function HomeScreen({ navigation, hideBottomNav = false, hideHeader = false }) {
  const insets = useSafeAreaInsets();
  const featuredFriends = FRIENDS.slice(0, 4);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  const handleGoToChat = (friend) => {
    // Map friend -> topic and navigate into auth/chat flow with preselected topic
    if (friend) {
      const topic = {
        id: `friend_${friend.id}`,
        title: `Chat with ${friend.name}`,
        icon: friend.icon,
        description: friend.description,
        vocabulary: Array.isArray(friend.interests) ? friend.interests : [],
      };
      navigation.navigate('AuthWrapper', { topic });
      return;
    }
    navigation.navigate('AuthWrapper');
  };
  const handleGoToHistory = () => {
    navigation.navigate('ConversationHistory');
  };
  const handleTopicPress = (topic) => {
    // Open chat with the selected topic
    if (topic) {
      navigation.navigate('AuthWrapper', { topic });
      return;
    }
    navigation.navigate('AuthWrapper');
  };
  const handleViewAllTopics = () => {
    navigation.navigate('NewTopicSelection');
  };
  const handleOpenSettings = () => {
    setIsSettingsVisible(true);
  };
  const handleGoToFriendList = () => {
    navigation.navigate('FriendList');
  };

  const headerContent = (
    <View style={[
      styles.header,
      Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 12) }
    ]}>
      <View style={{ width: 40 }} />
      <Text style={styles.headerTitle}>SpeakFun AI</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {!hideHeader && (
        Platform.OS === 'ios' ? (
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {headerContent}
          </SafeAreaView>
        ) : (
          headerContent
        )
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Choose Your Friend */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Choose Your Friend</Text>
          <TouchableOpacity onPress={handleGoToFriendList}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.friendScroll}
          contentContainerStyle={styles.friendRowContent}
        >
          {featuredFriends.map((f, idx) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.friendCard, idx === 0 && styles.friendCardActive]}
              onPress={() => handleGoToChat(f)}
            >
              <View style={styles.friendImage}>
                <Text style={styles.friendEmoji}>{f.icon}</Text>
              </View>
              <Text style={styles.friendName}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Explore Topics (reuse TopicSelection UI list for brevity) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Explore Topics</Text>
          <TouchableOpacity onPress={handleViewAllTopics}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.topicWrapper}>
          <HomeTopicGrid onPressTopic={handleTopicPress} />
        </View>
      </ScrollView>

      {/* Bottom Navigation (static) */}
      {!hideBottomNav && (
        <View style={styles.bottomNav}>
          <View style={styles.navItemActive}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabelActive}>Home</Text>
          </View>
          <TouchableOpacity style={styles.navItem} onPress={handleGoToHistory}>
            <Text style={styles.navIcon}>⏱️</Text>
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={handleOpenSettings}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
      <AppSettingsPage
        isVisible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  safeArea: {
    backgroundColor: '#F2F4F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F2647',
  },
  content: {
    paddingBottom: 100,
  },
  sectionHeaderRow: {
    marginTop: 8,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F2647',
  },
  viewAll: {
    color: '#2A66FF',
    fontWeight: '700',
  },
  friendRow: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  friendScroll: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  friendRowContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    paddingRight: 8,
  },
  friendCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  friendCardActive: {
    borderWidth: 2,
    borderColor: '#F5A623',
  },
  friendImage: {
    height: 110,
    borderRadius: 16,
    backgroundColor: '#F3F0E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  friendEmoji: {
    fontSize: 56,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2647',
    textAlign: 'center',
  },
  topicWrapper: {
    marginTop: 12,
    paddingHorizontal: 0,
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
    fontSize: 20,
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

export default HomeScreen;


