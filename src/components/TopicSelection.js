// src/components/TopicSelection.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const FRIENDS = [
  {
    id: 'emma',
    name: 'Emma',
    age: 8,
    gender: 'female',
    icon: '👧',
    personality: 'Creative and imaginative',
    description: 'Emma loves to draw, paint, and create stories. She is always coming up with new ideas and loves to share her artwork with friends.',
    interests: ['Animals', 'Colors', 'Toys', 'Food'],
    favoriteActivity: 'Drawing animals and making up stories about them',
    traits: ['Creative', 'Friendly', 'Imaginative', 'Artistic']
  },
  {
    id: 'liam',
    name: 'Liam',
    age: 10,
    gender: 'male',
    icon: '👦',
    personality: 'Curious and scientific',
    description: 'Liam is fascinated by how things work. He loves experiments, asking questions, and exploring nature.',
    interests: ['Science', 'Geography', 'Animals', 'Weather'],
    favoriteActivity: 'Doing science experiments and exploring outdoors',
    traits: ['Curious', 'Smart', 'Adventurous', 'Thoughtful']
  },
  {
    id: 'sophia',
    name: 'Sophia',
    age: 7,
    gender: 'female',
    icon: '👧',
    personality: 'Energetic and sporty',
    description: 'Sophia loves to play, run, and stay active. She is always ready for a game and enjoys teaching others new sports.',
    interests: ['Daily Activities', 'Body Parts', 'Numbers', 'School'],
    favoriteActivity: 'Playing soccer and jumping rope',
    traits: ['Energetic', 'Athletic', 'Confident', 'Leader']
  },
  {
    id: 'noah',
    name: 'Noah',
    age: 9,
    gender: 'male',
    icon: '👦',
    personality: 'Caring and helpful',
    description: 'Noah is kind and always ready to help his friends. He loves taking care of pets and helping around the house.',
    interests: ['Family', 'Animals', 'Daily Activities', 'Food'],
    favoriteActivity: 'Taking care of his puppy and helping cook with mom',
    traits: ['Kind', 'Helpful', 'Responsible', 'Gentle']
  },
  {
    id: 'mia',
    name: 'Mia',
    age: 6,
    gender: 'female',
    icon: '👧',
    personality: 'Musical and cheerful',
    description: 'Mia loves singing, dancing, and making music. Her positive energy brightens everyone\'s day.',
    interests: ['General Speaking', 'Colors', 'Toys', 'Weather'],
    favoriteActivity: 'Singing songs and dancing to music',
    traits: ['Cheerful', 'Musical', 'Expressive', 'Happy']
  },
  {
    id: 'oliver',
    name: 'Oliver',
    age: 11,
    gender: 'male',
    icon: '👦',
    personality: 'Smart and studious',
    description: 'Oliver loves reading books and learning new things. He enjoys sharing interesting facts and helping classmates with homework.',
    interests: ['History', 'Geography', 'Numbers', 'School'],
    favoriteActivity: 'Reading adventure books and solving math puzzles',
    traits: ['Intelligent', 'Patient', 'Organized', 'Helpful']
  },
  {
    id: 'ava',
    name: 'Ava',
    age: 5,
    gender: 'female',
    icon: '👧',
    personality: 'Sweet and shy',
    description: 'Ava is gentle and loves quiet activities. She enjoys coloring, playing with dolls, and spending time with family.',
    interests: ['Family', 'Colors', 'Toys', 'Clothes'],
    favoriteActivity: 'Playing with dolls and dressing them up',
    traits: ['Gentle', 'Sweet', 'Thoughtful', 'Careful']
  },
  {
    id: 'ethan',
    name: 'Ethan',
    age: 8,
    gender: 'male',
    icon: '👦',
    personality: 'Funny and outgoing',
    description: 'Ethan loves making people laugh. He is great at telling jokes and making new friends wherever he goes.',
    interests: ['General Speaking', 'School', 'Food', 'Daily Activities'],
    favoriteActivity: 'Telling jokes and playing with friends at recess',
    traits: ['Funny', 'Outgoing', 'Social', 'Entertaining']
  },
  {
    id: 'isabella',
    name: 'Isabella',
    age: 9,
    gender: 'female',
    icon: '👧',
    personality: 'Fashionable and confident',
    description: 'Isabella loves fashion and expressing herself through clothes. She enjoys helping friends pick outfits and organizing her wardrobe.',
    interests: ['Clothes', 'Colors', 'Weather', 'School'],
    favoriteActivity: 'Designing outfits and creating fashion shows',
    traits: ['Stylish', 'Confident', 'Creative', 'Organized']
  },
  {
    id: 'lucas',
    name: 'Lucas',
    age: 7,
    gender: 'male',
    icon: '👦',
    personality: 'Adventurous and brave',
    description: 'Lucas loves exploring and trying new things. He is always ready for an adventure and never afraid of challenges.',
    interests: ['Geography', 'Weather', 'Animals', 'Science'],
    favoriteActivity: 'Exploring nature and discovering new places',
    traits: ['Brave', 'Adventurous', 'Bold', 'Excited']
  }
];

const TOPICS = [
  {
    id: 'general-speaking',
    title: 'General Speaking',
    icon: '🗣️',
    description: 'Practice everyday conversations and general speaking skills. Focus on polite expressions, greetings, and basic social interactions.',
    vocabulary: ['hello', 'thank you', 'please', 'sorry', 'goodbye', 'how are you', 'nice to meet you', 'excuse me'],
    ageRange: '5-11'
  },
  {
    id: 'daily-activities',
    title: 'Daily Activities',
    icon: '🌅',
    description: 'Talk about what you do every day from morning to night. Learn about daily routines, time expressions, and everyday activities like eating, playing, and sleeping.',
    vocabulary: ['wake up', 'breakfast', 'lunch', 'dinner', 'sleep', 'play', 'study', 'brush teeth'],
    ageRange: '5-11'
  },
  {
    id: 'animals',
    title: 'Animals',
    icon: '🐶',
    description: 'Learn about pets, farm animals, and wild animals. Talk about animal sounds, habitats, and characteristics. Use fun animal activities and games.',
    vocabulary: ['dog', 'cat', 'bird', 'fish', 'cow', 'pig', 'lion', 'elephant'],
    ageRange: '5-11'
  },
  {
    id: 'colors',
    title: 'Colors',
    icon: '🌈',
    description: 'Discover all the beautiful colors around us. Practice identifying colors of objects, mixing colors, and describing things by their colors.',
    vocabulary: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black'],
    ageRange: '5-11'
  },
  {
    id: 'family',
    title: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Meet your family members and relatives. Talk about family relationships, family activities, and introduce family members.',
    vocabulary: ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby'],
    ageRange: '5-11'
  },
  {
    id: 'food',
    title: 'Food',
    icon: '🍎',
    description: 'Explore delicious foods and drinks. Discuss favorite foods, healthy eating, meal times, and food preferences.',
    vocabulary: ['apple', 'banana', 'bread', 'milk', 'water', 'cake', 'pizza', 'rice'],
    ageRange: '5-11'
  },
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    description: 'Count from 1 to 20 and learn basic math. Practice counting, simple addition, and number recognition through games and activities.',
    vocabulary: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    ageRange: '5-11'
  },
  {
    id: 'body',
    title: 'Body Parts',
    icon: '👤',
    description: 'Learn about your body and how to take care of it. Identify body parts, discuss body functions, and learn about hygiene and health.',
    vocabulary: ['head', 'eyes', 'nose', 'mouth', 'hands', 'feet', 'ears', 'legs'],
    ageRange: '5-11'
  },
  {
    id: 'clothes',
    title: 'Clothes',
    icon: '👕',
    description: 'Dress up and learn about different clothes. Talk about what to wear for different occasions, weather, and personal style.',
    vocabulary: ['shirt', 'pants', 'dress', 'shoes', 'hat', 'socks', 'jacket', 'skirt'],
    ageRange: '5-11'
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: '☀️',
    description: 'Talk about sunny, rainy, and snowy days. Describe weather conditions, seasons, and appropriate activities for different weather.',
    vocabulary: ['sunny', 'rainy', 'cloudy', 'windy', 'hot', 'cold', 'warm', 'cool'],
    ageRange: '5-11'
  },
  {
    id: 'school',
    title: 'School',
    icon: '🎒',
    description: 'Learn about school, teachers, and friends. Discuss school activities, subjects, classroom objects, and school life.',
    vocabulary: ['teacher', 'student', 'book', 'pencil', 'desk', 'chair', 'classroom', 'playground'],
    ageRange: '5-11'
  },
  {
    id: 'toys',
    title: 'Toys',
    icon: '🧸',
    description: 'Play with your favorite toys and games. Talk about favorite toys, how to play with them, and sharing toys with friends.',
    vocabulary: ['doll', 'ball', 'car', 'toy', 'game', 'puzzle', 'blocks', 'teddy bear'],
    ageRange: '5-11'
  },
  {
    id: 'history',
    title: 'History',
    icon: '📜',
    description: 'Travel back in time to learn about important people and events. Explore simple timelines, inventions, and how life used to be.',
    vocabulary: ['past', 'king', 'queen', 'timeline', 'invention', 'village', 'empire', 'museum'],
    ageRange: '5-11'
  },
  {
    id: 'geography',
    title: 'Geography',
    icon: '🌍',
    description: 'Discover countries, maps, and landforms. Learn about continents, oceans, and places around the world.',
    vocabulary: ['map', 'country', 'city', 'mountain', 'river', 'ocean', 'continent', 'island'],
    ageRange: '5-11'
  },
  {
    id: 'science',
    title: 'Science',
    icon: '🔬',
    description: 'Explore experiments, energy, and living things. Learn how the world works through fun discoveries.',
    vocabulary: ['experiment', 'energy', 'plant', 'animal', 'gravity', 'matter', 'solid', 'liquid'],
    ageRange: '5-11'
  }
];

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

  // Map friend to topic format for chat
  const mapFriendToTopic = (friend) => {
    return {
      id: `friend_${friend.id}`, // Prefix with 'friend_' for backend identification
      title: `Chat with ${friend.name}`,
      icon: friend.icon,
      description: `${friend.description} ${friend.name} is ${friend.personality.toLowerCase()} and loves talking about ${friend.interests.join(', ')}.`,
      vocabulary: friend.interests, // Use interests as vocabulary topics
      ageRange: `${Math.max(5, friend.age - 2)}-${Math.min(11, friend.age + 2)}`
    };
  };

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
export { FRIENDS, TOPICS };
