/**
 * ConnectionStatus - WebSocket connection status indicator
 */

import React from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {ConnectionState} from '../types/websocket';

interface ConnectionStatusProps {
  connectionState: ConnectionState;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({connectionState}) => {
  const getStatusColor = () => {
    if (connectionState.isConnected) return '#4CAF50'; // Green
    if (connectionState.isConnecting) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const getStatusText = () => {
    if (connectionState.isConnected) return 'Connected';
    if (connectionState.isConnecting) return 'Connecting...';
    if (connectionState.reconnectAttempts > 0) {
      return `Reconnecting (${connectionState.reconnectAttempts})...`;
    }
    return 'Disconnected';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, {backgroundColor: getStatusColor()}]} />
      <Text style={styles.text}>{getStatusText()}</Text>
      {connectionState.lastError && (
        <Text style={styles.errorText}>{connectionState.lastError}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
  },
});

export default ConnectionStatus;
