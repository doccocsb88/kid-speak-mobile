// src/components/TopicSelection.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

const TOPICS = [
  {
    id: 'general-speaking',
    title: 'General Speaking',
    icon: '🗣️',
    description: 'Practice everyday conversations and general speaking skills. Focus on polite expressions, greetings, and basic social interactions.',
    vocabulary: ['hello', 'thank you', 'please', 'sorry', 'goodbye', 'how are you', 'nice to meet you', 'excuse me'],
    ageRange: '6-11'
  },
  {
    id: 'daily-activities',
    title: 'Daily Activities',
    icon: '🌅',
    description: 'Talk about what you do every day from morning to night. Learn about daily routines, time expressions, and everyday activities like eating, playing, and sleeping.',
    vocabulary: ['wake up', 'breakfast', 'lunch', 'dinner', 'sleep', 'play', 'study', 'brush teeth'],
    ageRange: '6-11'
  },
  {
    id: 'animals',
    title: 'Animals',
    icon: '🐶',
    description: 'Learn about pets, farm animals, and wild animals. Talk about animal sounds, habitats, and characteristics. Use fun animal activities and games.',
    vocabulary: ['dog', 'cat', 'bird', 'fish', 'cow', 'pig', 'lion', 'elephant'],
    ageRange: '6-11'
  },
  {
    id: 'colors',
    title: 'Colors',
    icon: '🌈',
    description: 'Discover all the beautiful colors around us. Practice identifying colors of objects, mixing colors, and describing things by their colors.',
    vocabulary: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black'],
    ageRange: '6-8'
  },
  {
    id: 'family',
    title: 'Family',
    icon: '👨‍👩‍👧‍👦',
    description: 'Meet your family members and relatives. Talk about family relationships, family activities, and introduce family members.',
    vocabulary: ['mother', 'father', 'sister', 'brother', 'grandmother', 'grandfather', 'baby'],
    ageRange: '6-9'
  },
  {
    id: 'food',
    title: 'Food',
    icon: '🍎',
    description: 'Explore delicious foods and drinks. Discuss favorite foods, healthy eating, meal times, and food preferences.',
    vocabulary: ['apple', 'banana', 'bread', 'milk', 'water', 'cake', 'pizza', 'rice'],
    ageRange: '6-11'
  },
  {
    id: 'numbers',
    title: 'Numbers',
    icon: '🔢',
    description: 'Count from 1 to 20 and learn basic math. Practice counting, simple addition, and number recognition through games and activities.',
    vocabulary: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
    ageRange: '6-8'
  },
  {
    id: 'body',
    title: 'Body Parts',
    icon: '👤',
    description: 'Learn about your body and how to take care of it. Identify body parts, discuss body functions, and learn about hygiene and health.',
    vocabulary: ['head', 'eyes', 'nose', 'mouth', 'hands', 'feet', 'ears', 'legs'],
    ageRange: '7-10'
  },
  {
    id: 'clothes',
    title: 'Clothes',
    icon: '👕',
    description: 'Dress up and learn about different clothes. Talk about what to wear for different occasions, weather, and personal style.',
    vocabulary: ['shirt', 'pants', 'dress', 'shoes', 'hat', 'socks', 'jacket', 'skirt'],
    ageRange: '7-11'
  },
  {
    id: 'weather',
    title: 'Weather',
    icon: '☀️',
    description: 'Talk about sunny, rainy, and snowy days. Describe weather conditions, seasons, and appropriate activities for different weather.',
    vocabulary: ['sunny', 'rainy', 'cloudy', 'windy', 'hot', 'cold', 'warm', 'cool'],
    ageRange: '8-11'
  },
  {
    id: 'school',
    title: 'School',
    icon: '🎒',
    description: 'Learn about school, teachers, and friends. Discuss school activities, subjects, classroom objects, and school life.',
    vocabulary: ['teacher', 'student', 'book', 'pencil', 'desk', 'chair', 'classroom', 'playground'],
    ageRange: '6-11'
  },
  {
    id: 'toys',
    title: 'Toys',
    icon: '🧸',
    description: 'Play with your favorite toys and games. Talk about favorite toys, how to play with them, and sharing toys with friends.',
    vocabulary: ['doll', 'ball', 'car', 'toy', 'game', 'puzzle', 'blocks', 'teddy bear'],
    ageRange: '6-9'
  },
  {
    id: 'history',
    title: 'History',
    icon: '📜',
    description: 'Travel back in time to learn about important people and events. Explore simple timelines, inventions, and how life used to be.',
    vocabulary: ['past', 'king', 'queen', 'timeline', 'invention', 'village', 'empire', 'museum'],
    ageRange: '8-11'
  },
  {
    id: 'geography',
    title: 'Geography',
    icon: '🌍',
    description: 'Discover countries, maps, and landforms. Learn about continents, oceans, and places around the world.',
    vocabulary: ['map', 'country', 'city', 'mountain', 'river', 'ocean', 'continent', 'island'],
    ageRange: '8-11'
  },
  {
    id: 'science',
    title: 'Science',
    icon: '🔬',
    description: 'Explore experiments, energy, and living things. Learn how the world works through fun discoveries.',
    vocabulary: ['experiment', 'energy', 'plant', 'animal', 'gravity', 'matter', 'solid', 'liquid'],
    ageRange: '8-11'
  }
];

function TopicSelection({ onTopicSelect, selectedAge = 7 }) {
  // Filter topics based on age appropriateness
  const filteredTopics = TOPICS.filter(topic => {
    const [minAge, maxAge] = topic.ageRange.split('-').map(Number);
    return selectedAge >= minAge && selectedAge <= maxAge;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TopicSelection;
