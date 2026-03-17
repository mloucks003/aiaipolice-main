import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {RadioProvider} from './src/contexts/RadioContext';
import RadioScreen from './src/screens/RadioScreen';

// Hardcoded test token for MVP - will be replaced with proper auth later
const TEST_TOKEN = 'test_token_placeholder';
const WS_URL = 'ws://localhost:8000/ws/officer-radio';

function App(): React.JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For MVP, get a test token by calling the backend login endpoint
    const getTestToken = async () => {
      try {
        const response = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'username=admin&password=admin123',
        });

        if (response.ok) {
          const data = await response.json();
          setToken(data.access_token);
          console.log('Got test token:', data.access_token);
        } else {
          console.error('Failed to get test token:', response.status);
          // Fallback to placeholder token
          setToken(TEST_TOKEN);
        }
      } catch (error) {
        console.error('Error getting test token:', error);
        // Fallback to placeholder token
        setToken(TEST_TOKEN);
      } finally {
        setLoading(false);
      }
    };

    getTestToken();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  if (!token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to authenticate</Text>
        <Text style={styles.errorSubtext}>Please check backend connection</Text>
      </View>
    );
  }

  return (
    <RadioProvider wsUrl={WS_URL}>
      <RadioScreenWrapper token={token} />
    </RadioProvider>
  );
}

// Wrapper component to connect after provider is ready
const RadioScreenWrapper: React.FC<{token: string}> = ({token}) => {
  const [connected, setConnected] = useState(false);

  // Import useRadio hook here to use it after provider is mounted
  const RadioContext = require('./src/contexts/RadioContext');
  const {connect} = RadioContext.useRadio();

  useEffect(() => {
    const connectToServer = async () => {
      try {
        await connect(token);
        setConnected(true);
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    connectToServer();
  }, [token, connect]);

  return <RadioScreen />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default App;
