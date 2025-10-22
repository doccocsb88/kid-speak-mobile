// src/services/offlineService.js
// Offline mode service with fallback responses for when backend is unavailable

class OfflineService {
  constructor() {
    this.isOfflineMode = false;
    this.offlineResponses = this.initializeOfflineResponses();
  }

  initializeOfflineResponses() {
    return {
      // General greetings and responses
      greetings: [
        "Hello! I'm Professor Wise-Owl! Let's learn English together!",
        "Hi there! Ready for some fun English learning?",
        "Welcome! I'm here to help you practice English!",
        "Hello! Let's start our English adventure!"
      ],
      
      // Topic-specific responses
      animals: [
        "Great! Animals are so interesting! Can you tell me about your favorite animal?",
        "Animals are wonderful! What sound does a cow make?",
        "Let's learn about animals! Do you have a pet at home?",
        "Animals can be big or small! Can you name three big animals?"
      ],
      
      colors: [
        "Colors are everywhere around us! What's your favorite color?",
        "Let's learn about colors! Can you see something red in the room?",
        "Colors make our world beautiful! Can you name five colors?",
        "What color is the sky? What color is grass?"
      ],
      
      family: [
        "Family is so important! Tell me about your family!",
        "Who is in your family? Do you have brothers or sisters?",
        "Family members love each other! Can you name your family members?",
        "Let's learn family words! Who is your mom's mom?"
      ],
      
      food: [
        "Food is delicious! What's your favorite food?",
        "Let's learn about food! What do you eat for breakfast?",
        "Healthy food helps us grow strong! What vegetables do you like?",
        "Can you name three fruits? What about three vegetables?"
      ],
      
      numbers: [
        "Numbers are everywhere! Can you count from 1 to 10?",
        "Let's practice numbers! How many fingers do you have?",
        "Numbers help us count things! Can you count backwards from 5?",
        "What comes after 7? What comes before 3?"
      ],
      
      // Encouragement responses
      encouragement: [
        "Excellent! You're doing great!",
        "Wonderful! Keep up the good work!",
        "Amazing! You're learning so well!",
        "Fantastic! I'm proud of you!",
        "Great job! You're getting better every day!",
        "Super! You're such a smart student!"
      ],
      
      // Question responses
      questions: [
        "That's a great question! Let me think about that...",
        "Interesting! What do you think about that?",
        "Good question! Can you tell me more?",
        "I like your thinking! What else can you tell me?"
      ],
      
      // Help responses
      help: [
        "I'm here to help you learn English! What would you like to practice?",
        "Don't worry! We can learn together! What topic interests you?",
        "I'm your English teacher! Let's practice speaking!",
        "I'm here to help! What would you like to learn today?"
      ]
    };
  }

  // Generate offline response based on user input and topic
  generateOfflineResponse(userMessage, topic, userInfo) {
    const message = userMessage.toLowerCase();
    const topicName = topic?.title?.toLowerCase() || '';
    const studentName = userInfo?.name || 'there';
    
    // Check for specific keywords and generate appropriate responses
    if (this.containsKeywords(message, ['hello', 'hi', 'hey'])) {
      return this.getRandomResponse('greetings').replace('there', studentName);
    }
    
    if (this.containsKeywords(message, ['help', 'don\'t know', 'don\'t understand'])) {
      return this.getRandomResponse('help');
    }
    
    if (this.containsKeywords(message, ['yes', 'yeah', 'ok', 'okay', 'good', 'great'])) {
      return this.getRandomResponse('encouragement');
    }
    
    if (this.containsKeywords(message, ['what', 'how', 'why', 'when', 'where'])) {
      return this.getRandomResponse('questions');
    }
    
    // Topic-specific responses
    if (topicName && this.offlineResponses[topicName]) {
      return this.getRandomResponse(topicName);
    }
    
    // Default responses based on message length and content
    if (message.length < 5) {
      return "Can you tell me more about that? I'd love to hear more!";
    }
    
    if (this.containsKeywords(message, ['thank', 'thanks'])) {
      return "You're welcome! I'm happy to help you learn!";
    }
    
    // Generic positive response
    const responses = [
      `That's interesting, ${studentName}! Can you tell me more about that?`,
      `Great answer, ${studentName}! What else can you tell me?`,
      `I like what you said, ${studentName}! Let's learn more together!`,
      `Wonderful, ${studentName}! You're learning so well!`,
      `Excellent, ${studentName}! Can you give me another example?`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Check if message contains any of the keywords
  containsKeywords(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  // Get random response from a category
  getRandomResponse(category) {
    const responses = this.offlineResponses[category];
    if (!responses || responses.length === 0) {
      return "That's interesting! Tell me more!";
    }
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Generate topic greeting for offline mode
  generateTopicGreeting(topic, userInfo) {
    const studentName = userInfo?.name || 'there';
    const topicId = topic?.id?.toLowerCase() || '';
    const topicName = topic?.title || 'English';
    
    // Topic-specific greetings based on backend TOPIC_PROMPTS (excluding Key vocabulary)
    const topicGreetings = {
      'general-speaking': [
        `Hello ${studentName}! I'm Professor Wise-Owl, your English teacher! Today we're going to practice everyday conversations and general speaking skills. Let's focus on polite expressions, greetings, and basic social interactions. What would you like to talk about today?`,
        `Hi ${studentName}! Welcome to our General Speaking lesson! We'll practice everyday conversations together. How are you feeling today?`,
        `Hello there, ${studentName}! Let's practice everyday conversations and general speaking skills. We'll work on polite expressions and greetings. Can you tell me about your day?`,
      ],
      'animals': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to learn about pets, farm animals, and wild animals. We'll talk about animal sounds, habitats, and characteristics. What's your favorite animal?`,
        `Hi ${studentName}! Welcome to our Animals lesson! Let's learn about pets, farm animals, and wild animals. Tell me, do you have a pet at home?`,
        `Hello there, ${studentName}! Today we'll explore the amazing world of animals! We'll use fun animal activities and games. Can you make an animal sound for me?`,
      ],
      'colors': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to discover all the beautiful colors around us. We'll practice identifying colors of objects, mixing colors, and describing things by their colors. What's your favorite color?`,
        `Hi ${studentName}! Welcome to our Colors lesson! Let's discover all the beautiful colors around us. Can you see something colorful in the room?`,
        `Hello there, ${studentName}! Today we'll learn about all the beautiful colors! Can you name some colors you see around you?`,
      ],
      'family': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to meet your family members and relatives. We'll talk about family relationships, family activities, and introduce family members. Can you tell me about your family?`,
        `Hi ${studentName}! Welcome to our Family lesson! Let's talk about family members and relatives. Who is in your family?`,
        `Hello there, ${studentName}! Today we'll learn about family! Tell me, do you have brothers or sisters?`,
      ],
      'food': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to explore delicious foods and drinks. We'll discuss favorite foods, healthy eating, meal times, and food preferences. What's your favorite food?`,
        `Hi ${studentName}! Welcome to our Food lesson! Let's explore delicious foods and drinks together. What did you eat for breakfast today?`,
        `Hello there, ${studentName}! Today we'll talk about yummy foods and drinks! Tell me about a food you really love!`,
      ],
      'numbers': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to count from 1 to 20 and learn basic math. We'll practice counting, simple addition, and number recognition through games and activities. Can you count to 10 for me?`,
        `Hi ${studentName}! Welcome to our Numbers lesson! Let's count and learn basic math together. How high can you count?`,
        `Hello there, ${studentName}! Today we'll have fun with numbers! Let's practice counting through games and activities. Ready to count?`,
      ],
      'body': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to learn about your body and how to take care of it. We'll identify body parts, discuss body functions, and learn about hygiene and health. Can you touch your nose?`,
        `Hi ${studentName}! Welcome to our Body Parts lesson! Let's learn about your body and how to take care of it. Can you show me your hands?`,
        `Hello there, ${studentName}! Today we'll learn about our amazing bodies! Let's talk about body parts and how to stay healthy. Can you point to your eyes?`,
      ],
      'clothes': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to dress up and learn about different clothes. We'll talk about what to wear for different occasions, weather, and personal style. What are you wearing today?`,
        `Hi ${studentName}! Welcome to our Clothes lesson! Let's dress up and learn about different clothes together. Tell me about your favorite outfit!`,
        `Hello there, ${studentName}! Today we'll learn about clothes and fashion! What do you like to wear when it's sunny outside?`,
      ],
      'weather': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to talk about sunny, rainy, and snowy days. We'll describe weather conditions, seasons, and appropriate activities for different weather. What's the weather like today?`,
        `Hi ${studentName}! Welcome to our Weather lesson! Let's talk about sunny, rainy, and snowy days. Can you look outside and tell me about the weather?`,
        `Hello there, ${studentName}! Today we'll learn about weather and seasons! Is it sunny or cloudy where you are?`,
      ],
      'school': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to learn about school, teachers, and friends. We'll discuss school activities, subjects, classroom objects, and school life. Tell me about your school!`,
        `Hi ${studentName}! Welcome to our School lesson! Let's learn about school, teachers, and friends together. What's your favorite subject?`,
        `Hello there, ${studentName}! Today we'll talk about school and learning! Do you like going to school? What do you like most about it?`,
      ],
      'toys': [
        `Hello ${studentName}! I'm Professor Wise-Owl! Today we're going to play with your favorite toys and games. We'll talk about favorite toys, how to play with them, and sharing toys with friends. What's your favorite toy?`,
        `Hi ${studentName}! Welcome to our Toys lesson! Let's play and learn about toys and games together. Tell me about a toy you love to play with!`,
        `Hello there, ${studentName}! Today we'll have fun learning about toys and games! What do you like to play with?`,
      ],
    };
    
    // Get topic-specific greeting or fallback to generic
    const greetings = topicGreetings[topicId] || [
      `Hello ${studentName}! I'm Professor Wise-Owl, your English teacher! Today we're going to learn about ${topicName}! Let's start our lesson. What do you know about ${topicName}, ${studentName}?`,
      `Hi ${studentName}! Welcome to our English lesson! Today's topic is ${topicName}! This is going to be so much fun! Can you tell me what you already know about ${topicName}?`,
      `Hello there, ${studentName}! I'm Professor Wise-Owl! We're going to explore ${topicName} together today! Are you ready to learn?`,
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Check if we should use offline mode
  shouldUseOfflineMode(error) {
    // Check for network errors, timeouts, or 404/500 errors
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code || '';
    
    return (
      errorMessage.includes('network error') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch failed') ||
      errorCode === 'NETWORK_ERROR' ||
      errorCode === 'TIMEOUT' ||
      error.response?.status >= 500 ||
      error.response?.status === 404
    );
  }

  // Set offline mode status
  setOfflineMode(isOffline) {
    this.isOfflineMode = isOffline;
  }

  // Get offline mode status
  getOfflineMode() {
    return this.isOfflineMode;
  }
}

export default new OfflineService();
