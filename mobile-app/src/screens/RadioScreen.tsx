/**
 * RadioScreen - Main radio interface screen
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useRadio} from '../contexts/RadioContext';
import PTTButton from '../components/PTTButton';
import RecordingIndicator from '../components/RecordingIndicator';
import ConnectionStatus from '../components/ConnectionStatus';
import PersonCard from '../components/PersonCard';
import VehicleCard from '../components/VehicleCard';
import TranscriptView from '../components/TranscriptView';
import {PersonRecord, VehicleRecord} from '../types/results';

const RadioScreen: React.FC = () => {
  const {
    radioState,
    connectionState,
    currentResult,
    transcripts,
    pressPTT,
    releasePTT,
  } = useRadio();

  const [showTranscript, setShowTranscript] = useState(true);

  const isPersonRecord = (result: any): result is PersonRecord => {
    return result && 'first_name' in result;
  };

  const isVehicleRecord = (result: any): result is VehicleRecord => {
    return result && 'plate_number' in result;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Officer Radio</Text>
        <ConnectionStatus connectionState={connectionState} />
      </View>

      {/* Recording Indicator */}
      <RecordingIndicator isRecording={radioState.isRecording} />

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Toggle between transcript and results */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, showTranscript && styles.toggleButtonActive]}
            onPress={() => setShowTranscript(true)}>
            <Text style={[styles.toggleText, showTranscript && styles.toggleTextActive]}>
              Transcript
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !showTranscript && styles.toggleButtonActive]}
            onPress={() => setShowTranscript(false)}>
            <Text style={[styles.toggleText, !showTranscript && styles.toggleTextActive]}>
              Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Display */}
        <View style={styles.displayArea}>
          {showTranscript ? (
            <TranscriptView transcripts={transcripts} />
          ) : (
            <ScrollView style={styles.resultsContainer}>
              {currentResult ? (
                <>
                  {isPersonRecord(currentResult) && (
                    <PersonCard person={currentResult} />
                  )}
                  {isVehicleRecord(currentResult) && (
                    <VehicleCard vehicle={currentResult} />
                  )}
                </>
              ) : (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No search results yet</Text>
                  <Text style={styles.noResultsSubtext}>
                    Ask the dispatcher to search for a person or vehicle
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* PTT Button */}
      <View style={styles.pttContainer}>
        <PTTButton
          isRecording={radioState.isRecording}
          isDisabled={!connectionState.isConnected}
          onPressIn={pressPTT}
          onPressOut={releasePTT}
        />
      </View>

      {/* Status Text */}
      {radioState.isTransmitting && (
        <Text style={styles.statusText}>Sending transmission...</Text>
      )}
      {radioState.isReceiving && (
        <Text style={styles.statusText}>Receiving response...</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  displayArea: {
    flex: 1,
    marginBottom: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#BBB',
    textAlign: 'center',
  },
  pttContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});

export default RadioScreen;
