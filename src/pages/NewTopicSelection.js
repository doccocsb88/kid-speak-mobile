import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// TOPICS data moved from TopicSelection.js
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

function NewTopicSelection({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectTopic = (topic) => {
    // Navigate to AuthWrapper (which renders ChatPage)
    navigation.navigate('AuthWrapper', { topic });
  };

  const headerContent = (
    <View style={[
      styles.header,
      Platform.OS === 'android' && { paddingTop: Math.max(insets.top, 12) }
    ]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>All Topics</Text>
      <View style={{ width: 28 }} />
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.card}
              onPress={() => handleSelectTopic(topic)}
              activeOpacity={0.9}
            >
              <View style={styles.cardImage}>
                <Text style={styles.cardEmoji}>{topic.icon}</Text>
              </View>
              <Text style={styles.cardTitle}>{topic.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  backIcon: {
    fontSize: 24,
    color: '#4A4A4A',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F2647',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    height: 150,
    borderRadius: 16,
    backgroundColor: '#F3F0E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardEmoji: {
    fontSize: 56,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2647',
  },
});

export default NewTopicSelection;
export { TOPICS };


