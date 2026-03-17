/**
 * TranscriptView - Display conversation transcript
 */

import React, {useRef, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {TranscriptItem} from '../types/results';

interface TranscriptViewProps {
  transcripts: TranscriptItem[];
}

const TranscriptView: React.FC<TranscriptViewProps> = ({transcripts}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcript arrives
    if (scrollViewRef.current && transcripts.length > 0) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [transcripts]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (transcripts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No conversation yet</Text>
        <Text style={styles.emptySubtext}>Press and hold PTT to speak</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}>
      {transcripts.map((transcript, index) => (
        <View
          key={index}
          style={[
            styles.messageContainer,
            transcript.speaker === 'officer'
              ? styles.officerMessage
              : styles.dispatcherMessage,
          ]}>
          <View style={styles.messageHeader}>
            <Text style={styles.speaker}>
              {transcript.speaker === 'officer' ? '👮 Officer' : '📻 Dispatcher'}
            </Text>
            <Text style={styles.timestamp}>{formatTime(transcript.timestamp)}</Text>
          </View>
          <Text style={styles.messageText}>{transcript.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
  },
  messageContainer: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    maxWidth: '85%',
  },
  officerMessage: {
    backgroundColor: '#E3F2FD',
    alignSelf: 'flex-end',
  },
  dispatcherMessage: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  speaker: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default TranscriptView;
