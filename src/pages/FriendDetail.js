import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapFriendToTopic, getFriendAvatar } from './FriendList';

// Map interests to emoji icons
const getInterestIcon = (interest) => {
  const iconMap = {
    'Animals': '🐾',
    'Colors': '🎨',
    'Toys': '🧸',
    'Food': '🍦',
    'Science': '🔬',
    'Geography': '🌍',
    'Weather': '☀️',
    'Daily Activities': '🌅',
    'Body Parts': '👤',
    'Numbers': '🔢',
    'School': '🎒',
    'History': '📜',
    'General Speaking': '🗣️',
    'Family': '👨‍👩‍👧‍👦',
    'Clothes': '👕',
  };
  return iconMap[interest] || '⭐';
};

// Map traits to emoji icons
const getTraitIcon = (trait) => {
  const iconMap = {
    'Creative': '🖌️',
    'Friendly': '😊',
    'Imaginative': '💡',
    'Artistic': '✏️',
    'Curious': '🔍',
    'Smart': '🧠',
    'Adventurous': '🗺️',
    'Thoughtful': '🤔',
    'Energetic': '⚡',
    'Athletic': '🏃',
    'Confident': '💪',
    'Leader': '👑',
    'Kind': '❤️',
    'Helpful': '🤝',
    'Responsible': '📋',
    'Gentle': '🕊️',
    'Cheerful': '😄',
    'Musical': '🎵',
    'Expressive': '🎭',
    'Happy': '😃',
    'Intelligent': '🎓',
    'Patient': '⏳',
    'Organized': '📁',
    'Sweet': '🍭',
    'Shy': '😌',
    'Careful': '👀',
    'Funny': '😆',
    'Outgoing': '👋',
    'Social': '👥',
    'Entertaining': '🎪',
    'Stylish': '👗',
    'Bold': '🔥',
    'Excited': '🎉',
  };
  return iconMap[trait] || '⭐';
};

// Get accent color for interest/trait backgrounds
const getAccentColor = (index, type = 'interest') => {
  const colors = {
    interest: ['#FFAEC0', '#FFD972', '#A0E7E5', '#B490E2'], // pink, yellow, green, purple
    trait: ['#FFD972', '#FFAEC0', '#B490E2', '#A0E7E5'], // yellow, pink, purple, green
  };
  const colorArray = colors[type] || colors.interest;
  return colorArray[index % colorArray.length];
};

function FriendDetail({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const friend = route?.params?.friend;

  if (!friend) {
    return (
      <View style={styles.container}>
        <Text>Friend not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChatNow = () => {
    const friendTopic = mapFriendToTopic(friend);
    navigation.navigate('AuthWrapper', { topic: friendTopic });
  };

  const handleConversationHistory = () => {
    // Navigate to conversation history filtered by this friend
    navigation.navigate('ConversationHistory', { friendId: friend.id });
  };

  const headerContent = (
    <View style={[
      styles.header,
      Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 12) }
    ]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Meet {friend.name}</Text>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 100) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image - Large banner style */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImageWrapper}>
            <View style={styles.profileImage}>
              <Image
                source={getFriendAvatar(friend.id)}
                style={styles.profileAvatar}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Name and Tagline */}
        <Text style={styles.name}>{friend.name}</Text>
        <Text style={styles.tagline}>{friend.personality}</Text>

        {/* About Me Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.aboutText}>
            Hi there! I'm {friend.name.split(' ')[0]}. {friend.description}
          </Text>
        </View>

        {/* Interests Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsGrid}>
            {friend.interests?.slice(0, 4).map((interest, index) => (
              <View
                key={index}
                style={[
                  styles.interestItem,
                  { backgroundColor: `${getAccentColor(index, 'interest')}30` }
                ]}
              >
                <Text style={styles.interestIcon}>{getInterestIcon(interest)}</Text>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Specialties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesList}>
            {friend.traits?.map((trait, index) => (
              <View
                key={index}
                style={[
                  styles.specialtyItem,
                  { backgroundColor: `${getAccentColor(index, 'trait')}30` }
                ]}
              >
                <Text style={styles.specialtyIcon}>{getTraitIcon(trait)}</Text>
                <Text style={styles.specialtyText}>{trait}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.chatButton} onPress={handleChatNow}>
            <Text style={styles.chatButtonText}>Chat Now</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.historyButton} onPress={handleConversationHistory}>
            <Text style={styles.historyButtonText}>Conversation History</Text>
          </TouchableOpacity> */}
        </View>
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
  profileImageContainer: {
    width: '100%',
    marginBottom: 8,
  },
  profileImageWrapper: {
    width: '100%',
    minHeight: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
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
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A90E2', // primary
    textAlign: 'center',
    marginBottom: 24,
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
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestItem: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  interestIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    textAlign: 'center',
  },
  specialtiesList: {
    gap: 8,
  },
  specialtyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  specialtyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  actionsContainer: {
    paddingTop: 24,
    gap: 12,
    paddingBottom: 24,
  },
  chatButton: {
    backgroundColor: '#4A90E2', // primary
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
});

export default FriendDetail;

