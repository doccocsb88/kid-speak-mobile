import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import friend avatar images
const friendAvatars = {
  cat: require('../assets/images/friend_avatar/ic_friend_cat.png'),
  owl: require('../assets/images/friend_avatar/ic_friend_owl.png'),
  dolphin: require('../assets/images/friend_avatar/ic_friend_dolphin.png'),
  dog: require('../assets/images/friend_avatar/ic_friend_dog.png'),
  parrot: require('../assets/images/friend_avatar/ic_friend_parrot.png'),
  bunny: require('../assets/images/friend_avatar/ic_friend_bunny.png'),
  monkey: require('../assets/images/friend_avatar/ic_friend_monkey.png'),
  peacook: require('../assets/images/friend_avatar/ic_friend_peacook.png'),
  lion: require('../assets/images/friend_avatar/ic_friend_lion.png'),
};

// Helper function to get friend avatar image
const getFriendAvatar = (friendId) => {
  const avatarMap = {
    'emma': friendAvatars.cat,        // Luna the Cat
    'liam': friendAvatars.owl,         // Professor Owl
    'sophia': friendAvatars.dolphin,   // Daisy the Dolphin
    'noah': friendAvatars.dog,         // Buddy the Dog
    'mia': friendAvatars.parrot,       // Coco the Parrot
    'oliver': friendAvatars.owl,       // Wise the Owl
    'ava': friendAvatars.bunny,        // Bella the Bunny
    'ethan': friendAvatars.monkey,     // Sparky the Monkey
    'isabella': friendAvatars.peacook, // Pepper the Peacock
    'lucas': friendAvatars.lion,       // Leo the Lion
  };
  return avatarMap[friendId] || friendAvatars.cat; // Default fallback
};

// FRIENDS data moved from TopicSelection.js
const FRIENDS = [
  {
    id: 'emma',
    name: 'Luna the Cat',
    age: 8,
    gender: 'female',
    icon: '🐱',
    personality: 'Creative and imaginative',
    description: 'Luna the Cat loves to draw, paint, and create stories. She is always coming up with new ideas and loves to share her artwork with friends.',
    interests: ['Animals', 'Colors', 'Toys', 'Food'],
    favoriteActivity: 'Drawing animals and making up stories about them',
    traits: ['Creative', 'Friendly', 'Imaginative', 'Artistic']
  },
  {
    id: 'liam',
    name: 'Professor Owl',
    age: 10,
    gender: 'male',
    icon: '🦉',
    personality: 'Curious and scientific',
    description: 'Professor Owl is fascinated by how things work. He loves experiments, asking questions, and exploring nature.',
    interests: ['Science', 'Geography', 'Animals', 'Weather'],
    favoriteActivity: 'Doing science experiments and exploring outdoors',
    traits: ['Curious', 'Smart', 'Adventurous', 'Thoughtful']
  },
  {
    id: 'sophia',
    name: 'Daisy the Dolphin',
    age: 7,
    gender: 'female',
    icon: '🐬',
    personality: 'Energetic and sporty',
    description: 'Daisy the Dolphin loves to play, run, and stay active. She is always ready for a game and enjoys teaching others new sports.',
    interests: ['Daily Activities', 'Body Parts', 'Numbers', 'School'],
    favoriteActivity: 'Playing soccer and jumping rope',
    traits: ['Energetic', 'Athletic', 'Confident', 'Leader']
  },
  {
    id: 'noah',
    name: 'Buddy the Dog',
    age: 9,
    gender: 'male',
    icon: '🐶',
    personality: 'Caring and helpful',
    description: 'Buddy the Dog is kind and always ready to help his friends. He loves taking care of pets and helping around the house.',
    interests: ['Family', 'Animals', 'Daily Activities', 'Food'],
    favoriteActivity: 'Taking care of his puppy and helping cook with mom',
    traits: ['Kind', 'Helpful', 'Responsible', 'Gentle']
  },
  {
    id: 'mia',
    name: 'Coco the Parrot',
    age: 6,
    gender: 'female',
    icon: '🦜',
    personality: 'Musical and cheerful',
    description: 'Coco the Parrot loves singing, dancing, and making music. Her positive energy brightens everyone\'s day.',
    interests: ['General Speaking', 'Colors', 'Toys', 'Weather'],
    favoriteActivity: 'Singing songs and dancing to music',
    traits: ['Cheerful', 'Musical', 'Expressive', 'Happy']
  },
  {
    id: 'oliver',
    name: 'Wise the Owl',
    age: 11,
    gender: 'male',
    icon: '🦉',
    personality: 'Smart and studious',
    description: 'Wise the Owl loves reading books and learning new things. He enjoys sharing interesting facts and helping classmates with homework.',
    interests: ['History', 'Geography', 'Numbers', 'School'],
    favoriteActivity: 'Reading adventure books and solving math puzzles',
    traits: ['Intelligent', 'Patient', 'Organized', 'Helpful']
  },
  {
    id: 'ava',
    name: 'Bella the Bunny',
    age: 5,
    gender: 'female',
    icon: '🐰',
    personality: 'Sweet and shy',
    description: 'Bella the Bunny is gentle and loves quiet activities. She enjoys coloring, playing with dolls, and spending time with family.',
    interests: ['Family', 'Colors', 'Toys', 'Clothes'],
    favoriteActivity: 'Playing with dolls and dressing them up',
    traits: ['Gentle', 'Sweet', 'Thoughtful', 'Careful']
  },
  {
    id: 'ethan',
    name: 'Sparky the Monkey',
    age: 8,
    gender: 'male',
    icon: '🐵',
    personality: 'Funny and outgoing',
    description: 'Sparky the Monkey loves making people laugh. He is great at telling jokes and making new friends wherever he goes.',
    interests: ['General Speaking', 'School', 'Food', 'Daily Activities'],
    favoriteActivity: 'Telling jokes and playing with friends at recess',
    traits: ['Funny', 'Outgoing', 'Social', 'Entertaining']
  },
  {
    id: 'isabella',
    name: 'Pepper the Peacock',
    age: 9,
    gender: 'female',
    icon: '🦚',
    personality: 'Fashionable and confident',
    description: 'Pepper the Peacock loves fashion and expressing herself through clothes. She enjoys helping friends pick outfits and organizing her wardrobe.',
    interests: ['Clothes', 'Colors', 'Weather', 'School'],
    favoriteActivity: 'Designing outfits and creating fashion shows',
    traits: ['Stylish', 'Confident', 'Creative', 'Organized']
  },
  {
    id: 'lucas',
    name: 'Leo the Lion',
    age: 7,
    gender: 'male',
    icon: '🦁',
    personality: 'Adventurous and brave',
    description: 'Leo the Lion loves exploring and trying new things. He is always ready for an adventure and never afraid of challenges.',
    interests: ['Geography', 'Weather', 'Animals', 'Science'],
    favoriteActivity: 'Exploring nature and discovering new places',
    traits: ['Brave', 'Adventurous', 'Bold', 'Excited']
  }
];

// Map friend to topic format for chat (moved from TopicSelection.js)
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

function FriendList({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSelectFriend = (friend) => {
    // Navigate to friend detail page
    navigation.navigate('FriendDetail', { friend });
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Your Friend</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.gridContent}>
        <View style={styles.grid}>
          {FRIENDS.map((friend, idx) => (
            <TouchableOpacity
              key={friend.id}
              style={[styles.card, idx === 0 && styles.cardActive]}
              onPress={() => handleSelectFriend(friend)}
            >
              <View style={styles.cardImage}>
                <Image
                  source={getFriendAvatar(friend.id)}
                  style={styles.cardAvatar}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.cardTitle}>{friend.name}</Text>
              <Text style={styles.cardSubtitle}>{friend.personality}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Colors based on provided HTML reference
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // background-light
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2540', // text-light
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF', // card-light
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardActive: {
    borderWidth: 2,
    borderColor: '#F5A623', // primary-accent
  },
  cardImage: {
    aspectRatio: 1,
    backgroundColor: '#E8E8E8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardAvatar: {
    width: '100%',
    height: '100%',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A2540',
    textAlign: 'center',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#6c7a89', // secondary-text-light
    textAlign: 'center',
  },
});

export default FriendList;
export { FRIENDS, mapFriendToTopic, getFriendAvatar };


