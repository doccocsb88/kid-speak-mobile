// src/components/TopicSelection.js
// This component combines topics and friends with tab navigation
// Data is imported from NewTopicSelection.js and FriendList.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { TOPICS } from '../pages/NewTopicSelection';
import { FRIENDS, mapFriendToTopic } from '../pages/FriendList';

function TopicSelection({ onTopicSelect, selectedAge = 7 }) {
  const [activeTab, setActiveTab] = useState('topics');

  // Filter topics based on age appropriateness
  const filteredTopics = TOPICS.filter(topic => {
    const [minAge, maxAge] = topic.ageRange.split('-').map(Number);
    return selectedAge >= minAge && selectedAge <= maxAge;
  });

  // Filter friends based on age range (show friends within 3 years age difference)
  const filteredFriends = FRIENDS.filter(friend => {
    return Math.abs(friend.age - selectedAge) <= 3;
  });

  const renderTopics = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>🎯 Choose Your Learning Topic!</Text>
        <Text style={styles.subtitle}>Pick a topic you'd like to learn about today. We'll have fun exploring it together!</Text>
      </View>
      
      <View style={styles.topicsGrid}>
        {filteredTopics.map(topic => (
          <TouchableOpacity 
            key={topic.id}
            style={styles.topicCard}
            onPress={() => onTopicSelect(topic)}
          >
            <Text style={styles.topicIcon}>{topic.icon}</Text>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicDescription}>{topic.description}</Text>
            <View style={styles.topicVocabulary}>
              {/* <Text style={styles.vocabLabel}>Words you'll learn:</Text> */}
              {/* <View style={styles.vocabWords}>
                {topic.vocabulary.slice(0, 4).map(word => (
                  <Text key={word} style={styles.vocabWord}>{word}</Text>
                ))}
                {topic.vocabulary.length > 4 && (
                  <Text style={styles.vocabMore}>+{topic.vocabulary.length - 4} more</Text>
                )}
              </View> */}
            </View>
            {/* <Text style={styles.topicAge}>Ages {topic.ageRange}</Text> */}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Don't worry! You can change topics anytime during your lesson.</Text>
      </View>
    </>
  );

  const renderFriends = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Choose Your Learning Friend!</Text>
        <Text style={styles.subtitle}>Pick a friend to practice English with. Each friend has unique interests and personality!</Text>
      </View>
      
      <View style={styles.friendsContainer}>
        {filteredFriends.map(friend => (
          <TouchableOpacity 
            key={friend.id}
            style={styles.friendCard}
            onPress={() => {
              const friendTopic = mapFriendToTopic(friend);
              onTopicSelect(friendTopic);
            }}
          >
            <Text style={styles.friendIcon}>{friend.icon}</Text>
            <View style={styles.friendInfo}>
              <View style={styles.friendHeader}>
                <Text style={styles.friendName}>{friend.name}</Text>
                <Text style={styles.friendAge}>Age {friend.age}</Text>
              </View>
              <Text style={styles.friendPersonality}>{friend.personality}</Text>
              <Text style={styles.friendDescription}>{friend.description}</Text>
              <View style={styles.friendInterests}>
                <Text style={styles.interestsLabel}>Interested in:</Text>
                <View style={styles.interestTags}>
                  {friend.interests.map(interest => (
                    <Text key={interest} style={styles.interestTag}>{interest}</Text>
                  ))}
                </View>
              </View>
              <View style={styles.friendTraits}>
                {friend.traits.map(trait => (
                  <Text key={trait} style={styles.traitBadge}>✨ {trait}</Text>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>💡 Each friend will adapt conversations based on their personality and interests!</Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'topics' && styles.activeTab]}
          onPress={() => setActiveTab('topics')}
        >
          <Text style={[styles.tabText, activeTab === 'topics' && styles.activeTabText]}>
            📚 Topics
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            👥 Friends
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'topics' ? renderTopics() : renderFriends()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicIcon: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  topicDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  topicVocabulary: {
    marginBottom: 12,
  },
  vocabLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  vocabWords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vocabWord: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  vocabMore: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  topicAge: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Friends Section Styles
  friendsContainer: {
    paddingBottom: 16,
  },
  friendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  friendName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  friendAge: {
    fontSize: 14,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
  },
  friendPersonality: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  friendDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  friendInterests: {
    marginBottom: 12,
  },
  interestsLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 6,
    fontWeight: '600',
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    fontSize: 12,
    color: '#FF6B6B',
    backgroundColor: '#ffe3e3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    fontWeight: '500',
  },
  friendTraits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  traitBadge: {
    fontSize: 12,
    color: '#4CAF50',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TopicSelection;
// Re-export FRIENDS and TOPICS for backward compatibility
export { FRIENDS } from '../pages/FriendList';
export { TOPICS } from '../pages/NewTopicSelection';
