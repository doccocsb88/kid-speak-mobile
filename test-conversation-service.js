// Test script for conversation service
import ConversationService from './src/services/conversationService';

// Test conversation service functionality
const testConversationService = async () => {
  console.log('Testing Conversation Service...');
  
  try {
    // Test saving a conversation
    const testConversation = {
      topic: {
        id: 'test-topic',
        title: 'Animals',
        icon: '🐶',
        description: 'Learn about different animals'
      },
      messages: [
        { sender: 'ai', text: 'Hello! Let\'s learn about animals!' },
        { sender: 'user', text: 'I like dogs!' },
        { sender: 'ai', text: 'Great! Dogs are wonderful pets.' }
      ],
      lastMessage: 'Great! Dogs are wonderful pets.',
      messageCount: 3
    };

    const savedConversation = await ConversationService.saveConversation(testConversation);
    console.log('✅ Conversation saved:', savedConversation.id);

    // Test retrieving conversations
    const conversations = await ConversationService.getConversations();
    console.log('✅ Conversations retrieved:', conversations.length);

    // Test getting stats
    const stats = await ConversationService.getConversationStats();
    console.log('✅ Stats:', stats);

    console.log('All tests passed! 🎉');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run test if this file is executed directly
if (require.main === module) {
  testConversationService();
}

export default testConversationService;
