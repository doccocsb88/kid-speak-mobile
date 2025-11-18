import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TOPICS } from '../pages/NewTopicSelection';

const BG_COLORS = ['#F2F7FF', '#FFF7F2', '#F6F6FF', '#F7FFF2', '#FFF2F7', '#F2FFF6'];

function makeSubtitle(description) {
  if (!description) return '';
  // Use first sentence or truncate to ~48 chars for card subtitle
  const firstSentence = description.split('. ')[0];
  const short = firstSentence.length > 48 ? `${firstSentence.slice(0, 48)}…` : firstSentence;
  return short;
}

function HomeTopicGrid({ onPressTopic }) {
  const topicsToShow = TOPICS.slice(0, 4); // show top 4 topics on Home
  return (
    <View style={styles.grid}>
      {topicsToShow.map((t, idx) => (
        <TouchableOpacity
          key={t.id}
          style={[styles.card, { backgroundColor: '#FFFFFF' }]}
          onPress={() => onPressTopic?.(t)}
        >
          <View style={[styles.image, { backgroundColor: BG_COLORS[idx % BG_COLORS.length] }]}>
            <Text style={styles.emoji}>{t.icon}</Text>
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{makeSubtitle(t.description)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    height: 120,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 54,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2647',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7A90',
    fontWeight: '500',
  },
});

export default HomeTopicGrid;


