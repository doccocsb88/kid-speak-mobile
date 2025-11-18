import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConversationService from '../services/conversationService';
import { FRIENDS } from './FriendList';
import { TOPICS } from './NewTopicSelection';

function ConversationHistory({ navigation, hideBottomNav = false, isTabMode = false }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ConversationService.getConversations();
      const filtered = (data || []).filter(
        (c) => (c.messageCount || 0) > 1
      );
      const sorted = filtered.sort(
        (a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
      setConversations(sorted);
    } catch (e) {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    load();
    return unsubscribe;
  }, [navigation, load]);

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getConversationIcon = (conversation) => {
    // First, try to get icon from topic
    if (conversation?.topic?.icon) {
      return conversation.topic.icon;
    }
    
    // If no topic icon and it's a friend conversation, get icon from FRIENDS
    if (conversation?.topic?.id?.startsWith('friend_')) {
      const friendId = conversation.topic.id.replace('friend_', '');
      const friend = FRIENDS.find(f => f.id === friendId);
      if (friend?.icon) {
        return friend.icon;
      }
    }
    
    // Default fallback
    return '💬';
  };

  const handleSelect = (conversation) => {
    navigation.navigate('AuthWrapper', { conversation });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        {!isTabMode ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
          >
            <Text style={styles.headerBackIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitle}>Conversation History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubText}>
              Start learning English to create your first conversation!
            </Text>
            <TouchableOpacity
              onPress={() => {
                const generalTopic = TOPICS.find(t => t.id === 'general-speaking');
                navigation.navigate('AuthWrapper', { topic: generalTopic });
              }}
              style={styles.startButton}
            >
              <Text style={styles.startButtonText}>Start a Conversation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          conversations.map((c) => (
            <TouchableOpacity key={c.id} style={styles.item} onPress={() => handleSelect(c)}>
              <View style={styles.itemAvatar}>
                <Text style={styles.itemAvatarEmoji}>
                  {getConversationIcon(c)}
                </Text>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>
                  {c?.topic?.title || 'Conversation'}
                </Text>
                <Text style={styles.itemDate}>{formatDate(c.lastMessageTime)}</Text>
              </View>
              <Text style={styles.itemChevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Nav */}
      {!hideBottomNav && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.navIcon}>🏠</Text>
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <View style={styles.navItemActive}>
            <Text style={styles.navIcon}>⏱️</Text>
            <Text style={styles.navLabelActive}>History</Text>
          </View>
          <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AuthWrapper')}>
            <Text style={styles.navIcon}>⚙️</Text>
            <Text style={styles.navLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: 20,
    color: '#0F2647',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F2647',
  },
  content: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#2A66FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  itemAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6EEF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemAvatarEmoji: {
    fontSize: 28,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F2647',
  },
  itemDate: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7A90',
  },
  itemChevron: {
    fontSize: 24,
    color: '#6B7A90',
    paddingHorizontal: 4,
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

export default ConversationHistory;


