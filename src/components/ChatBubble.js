// src/components/ChatBubble.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

function ChatBubble({ sender, message, onSpeak, isSpeaking }) {
  const isUser = sender === 'user';
  const isAI = sender === 'ai';
  
  return (
    <View style={[styles.chatBubbleWrapper, isUser ? styles.userWrapper : styles.aiWrapper]}>
      {/* Profile Picture */}
      <View style={styles.profileContainer}>
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
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingLeft: 0,
    paddingRight: 16,
  },
  userWrapper: {
    flexDirection: 'row-reverse',
  },
  aiWrapper: {
    flexDirection: 'row',
  },
  profileContainer: {
    marginHorizontal: 8,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userProfile: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff5252',
  },
  aiProfile: {
    backgroundColor: '#4ecdc4',
    borderColor: '#26a69a',
  },
  profileEmoji: {
    fontSize: 20,
  },
  chatBubble: {
    maxWidth: '88%',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#87CEEB',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#98FB98',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: '#333333',
  },
  aiText: {
    color: '#333333',
  },
  speakButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  speakingButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
  },
  speakButtonText: {
    fontSize: 16,
  },
});

export default ChatBubble;