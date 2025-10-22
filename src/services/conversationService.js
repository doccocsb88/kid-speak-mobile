// src/services/conversationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSATION_STORAGE_KEY = 'conversationHistory';
const MAX_CONVERSATIONS = 50; // Limit to prevent storage bloat

class ConversationService {
  // Save a conversation to storage
  static async saveConversation(conversationData) {
    try {
      const existingConversations = await this.getConversations();
      
      // Create conversation object
      const conversation = {
        id: conversationData.id || this.generateId(),
        topic: conversationData.topic,
        messages: conversationData.messages || [],
        lastMessage: conversationData.lastMessage || '',
        lastMessageTime: conversationData.lastMessageTime || new Date().toISOString(),
        messageCount: conversationData.messageCount || 0,
        createdAt: conversationData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Check if conversation already exists
      const existingIndex = existingConversations.findIndex(conv => conv.id === conversation.id);
      
      if (existingIndex >= 0) {
        // Update existing conversation
        existingConversations[existingIndex] = conversation;
      } else {
        // Add new conversation
        existingConversations.unshift(conversation);
      }

      // Limit the number of stored conversations
      const limitedConversations = existingConversations.slice(0, MAX_CONVERSATIONS);
      
      await AsyncStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(limitedConversations));
      
      return conversation;
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  // Get all conversations from storage
  static async getConversations() {
    try {
      const conversations = await AsyncStorage.getItem(CONVERSATION_STORAGE_KEY);
      return conversations ? JSON.parse(conversations) : [];
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Get a specific conversation by ID
  static async getConversation(conversationId) {
    try {
      const conversations = await this.getConversations();
      return conversations.find(conv => conv.id === conversationId);
    } catch (error) {
      console.error('Error getting conversation:', error);
      return null;
    }
  }

  // Update conversation messages
  static async updateConversationMessages(conversationId, messages) {
    try {
      const conversations = await this.getConversations();
      const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
      
      if (conversationIndex >= 0) {
        conversations[conversationIndex].messages = messages;
        conversations[conversationIndex].messageCount = messages.length;
        conversations[conversationIndex].lastMessage = messages.length > 0 ? messages[messages.length - 1].text : '';
        conversations[conversationIndex].lastMessageTime = new Date().toISOString();
        conversations[conversationIndex].updatedAt = new Date().toISOString();
        
        await AsyncStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(conversations));
        return conversations[conversationIndex];
      }
      
      return null;
    } catch (error) {
      console.error('Error updating conversation messages:', error);
      throw error;
    }
  }

  // Delete a conversation
  static async deleteConversation(conversationId) {
    try {
      const conversations = await this.getConversations();
      const filteredConversations = conversations.filter(conv => conv.id !== conversationId);
      
      await AsyncStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(filteredConversations));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  // Clear all conversations
  static async clearAllConversations() {
    try {
      await AsyncStorage.removeItem(CONVERSATION_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing conversations:', error);
      throw error;
    }
  }

  // Get conversation statistics
  static async getConversationStats() {
    try {
      const conversations = await this.getConversations();
      
      const stats = {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((sum, conv) => sum + conv.messageCount, 0),
        lastActivity: conversations.length > 0 ? conversations[0].lastMessageTime : null,
        topicsUsed: [...new Set(conversations.map(conv => conv.topic?.title).filter(Boolean))],
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        lastActivity: null,
        topicsUsed: [],
      };
    }
  }

  // Generate a unique ID for conversations
  static generateId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export conversations (for backup)
  static async exportConversations() {
    try {
      const conversations = await this.getConversations();
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        conversations: conversations,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting conversations:', error);
      throw error;
    }
  }

  // Import conversations (for restore)
  static async importConversations(importData) {
    try {
      const parsedData = typeof importData === 'string' ? JSON.parse(importData) : importData;
      
      if (!parsedData.conversations || !Array.isArray(parsedData.conversations)) {
        throw new Error('Invalid import data format');
      }
      
      // Validate and clean imported conversations
      const validConversations = parsedData.conversations.filter(conv => 
        conv.id && conv.messages && Array.isArray(conv.messages)
      );
      
      // Merge with existing conversations (avoid duplicates)
      const existingConversations = await this.getConversations();
      const existingIds = new Set(existingConversations.map(conv => conv.id));
      const newConversations = validConversations.filter(conv => !existingIds.has(conv.id));
      
      const mergedConversations = [...existingConversations, ...newConversations];
      const limitedConversations = mergedConversations.slice(0, MAX_CONVERSATIONS);
      
      await AsyncStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(limitedConversations));
      
      return {
        imported: newConversations.length,
        skipped: validConversations.length - newConversations.length,
        total: limitedConversations.length,
      };
    } catch (error) {
      console.error('Error importing conversations:', error);
      throw error;
    }
  }
}

export default ConversationService;
