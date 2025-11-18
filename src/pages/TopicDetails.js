import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TOPICS } from './NewTopicSelection';

// Activity icons mapping
const getActivityIcon = (activityType) => {
  const iconMap = {
    'quiz': '❓',
    'conversation': '💬',
    'matching': '🖼️',
    'game': '🎮',
    'practice': '📝',
  };
  return iconMap[activityType] || '⭐';
};

// Generate activities based on topic
const getTopicActivities = (topicId) => {
  const activitiesMap = {
    'animals': [
      {
        id: 'animal-sounds-quiz',
        title: 'Animal Sounds Quiz',
        description: 'Listen and guess the animal!',
        type: 'quiz',
      },
      {
        id: 'talk-to-zookeeper',
        title: 'Talk to a Zookeeper',
        description: 'Practice conversation with our AI friend.',
        type: 'conversation',
      },
      {
        id: 'match-the-picture',
        title: 'Match the Picture',
        description: 'Find the matching pairs.',
        type: 'matching',
      },
    ],
    'general-speaking': [
      {
        id: 'greetings-practice',
        title: 'Greetings Practice',
        description: 'Practice polite expressions and greetings.',
        type: 'practice',
      },
      {
        id: 'daily-conversation',
        title: 'Daily Conversation',
        description: 'Chat about everyday topics.',
        type: 'conversation',
      },
      {
        id: 'social-skills-game',
        title: 'Social Skills Game',
        description: 'Learn through interactive games.',
        type: 'game',
      },
    ],
    'daily-activities': [
      {
        id: 'routine-quiz',
        title: 'Daily Routine Quiz',
        description: 'Test your knowledge of daily activities.',
        type: 'quiz',
      },
      {
        id: 'talk-about-day',
        title: 'Talk About Your Day',
        description: 'Practice describing your daily routine.',
        type: 'conversation',
      },
      {
        id: 'time-matching',
        title: 'Time Matching',
        description: 'Match activities with times.',
        type: 'matching',
      },
    ],
  };

  // Default activities for topics not in the map
  const defaultActivities = [
    {
      id: 'topic-quiz',
      title: `${TOPICS.find(t => t.id === topicId)?.title || 'Topic'} Quiz`,
      description: 'Test your knowledge!',
      type: 'quiz',
    },
    {
      id: 'practice-conversation',
      title: 'Practice Conversation',
      description: 'Chat with our AI friend.',
      type: 'conversation',
    },
    {
      id: 'interactive-game',
      title: 'Interactive Game',
      description: 'Learn through fun games.',
      type: 'game',
    },
  ];

  return activitiesMap[topicId] || defaultActivities;
};

function TopicDetails({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const topic = route?.params?.topic;

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text>Topic not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartActivity = () => {
    // Navigate to chat with the selected topic
    navigation.navigate('AuthWrapper', { topic });
  };

  const activities = getTopicActivities(topic.id);

  const headerContent = (
    <View style={[
      styles.header,
      Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 12) }
    ]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{topic.title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {Platform.OS === 'ios' ? (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {headerContent}
        </SafeAreaView>
      ) : (
        headerContent
      )}

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Math.max(insets.bottom, 100) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            <Text style={styles.illustrationEmoji}>{topic.icon}</Text>
          </View>
        </View>

        {/* What You'll Learn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Learn</Text>
          <Text style={styles.learnText}>{topic.description}</Text>
        </View>

        {/* Key Words Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Words</Text>
          <View style={styles.keyWordsContainer}>
            {topic.vocabulary?.map((word, index) => (
              <View key={index} style={styles.keyWordTag}>
                <Text style={styles.keyWordText}>{word}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.activitiesList}>
            {activities.map((activity, index) => (
              <View
                key={activity.id}
                style={styles.activityCard}
              >
                <View style={styles.activityIconContainer}>
                  <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Start First Activity Button */}
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleStartActivity}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Chat Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF', // background-light
  },
  safeArea: {
    backgroundColor: '#F0F8FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  backIcon: {
    fontSize: 24,
    color: '#1E293B',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  illustrationContainer: {
    width: '100%',
    marginBottom: 8,
  },
  illustration: {
    width: '100%',
    minHeight: 200,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  illustrationEmoji: {
    fontSize: 120,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  learnText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  keyWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  keyWordTag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 0,
  },
  keyWordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#A0E7E5', // Teal accent color
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIcon: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#4A90E2', // primary
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default TopicDetails;

