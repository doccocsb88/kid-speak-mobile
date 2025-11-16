// src/components/ChatBubble.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

function ChatBubble({ sender, message, onSpeak, isSpeaking }) {
  const isUser = sender === 'user';
  const isAI = sender === 'ai';
  
  return (
    <View style={[styles.chatBubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {/* Profile Picture */}
      <View style={[styles.profileContainer, isUser && styles.userProfileContainer]}>
        <View style={[styles.profilePicture, isUser ? styles.userProfile : styles.aiProfile]}>
          <Text style={styles.profileEmoji}>
            {isUser ? '👦' : '🤖'}
          </Text>
        </View>
      </View>
      
      {/* Chat Bubble */}
      <View style={[styles.chatBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {message}
        </Text>
        {isAI && onSpeak && (
          <TouchableOpacity 
            style={[styles.speakButton, isSpeaking && styles.speakingButton]}
            onPress={onSpeak}
            disabled={isSpeaking}
          >
            <Text style={styles.speakButtonText}>
              {isSpeaking ? '🔊' : '🔈'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chatBubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userWrapper: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-end',
  },
  userProfileContainer: {
    marginRight: 0,
    marginLeft: 10,
  },
  aiWrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  profileContainer: {
    width: 32,
    height: 32,
    marginBottom: 2,
    marginRight: 10,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userProfile: {
    backgroundColor: 'transparent',
  },
  aiProfile: {
    backgroundColor: 'transparent',
  },
  profileEmoji: {
    fontSize: 20,
  },
  chatBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#4A4A4A',
  },
  speakButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakingButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  speakButtonText: {
    fontSize: 16,
  },
});

export default ChatBubble;