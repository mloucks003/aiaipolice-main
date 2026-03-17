import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity} from 'react-native';
import {RadioProvider} from './src/contexts/RadioContext';
import RadioScreen from './src/screens/RadioScreen';

// Default to Heroku deployment - change to local IP for development
const DEFAULT_BACKEND = 'law-enforcement-rms-b2749bfd89b0.herokuapp.com';
const DEFAULT_USE_SSL = true; // true for Heroku, false for local dev

function App(): React.JSX.Element {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendHost, setBackendHost] = useState(DEFAULT_BACKEND);
  const [useSSL, setUseSSL] = useState(DEFAULT_USE_SSL);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(true);

  const httpProtocol = useSSL ? 'https' : 'http';
  const wsProtocol = useSSL ? 'wss' : 'ws';
  const apiUrl = `${httpProtocol}://${backendHost}`;
  const wsUrl = `${wsProtocol}://${backendHost}/ws/officer-radio`;

  const connectToBackend = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Logging in to:', `${apiUrl}/api/auth/login`);
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: 'admin', password: 'admin123'}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Got JWT token');
        setToken(data.access_token);
        setShowConfig(false);
      } else {
        const errorText = await response.text();
        setError(`Login failed: ${response.status} ${errorText}`);
      }
    } catch (err: any) {
      setError(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Config/login screen
  if (showConfig || !token) {
    return (
      <View style={styles.configContainer}>
        <Text style={styles.configTitle}>Officer Radio</Text>
        <Text style={styles.configSubtitle}>Connect to Dispatch Server</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Server Address</Text>
          <TextInput
            style={styles.input}
            value={backendHost}
            onChangeText={setBackendHost}
            placeholder="hostname or IP:port"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.sslToggle}
          onPress={() => setUseSSL(!useSSL)}>
          <View style={[styles.checkbox, useSSL && styles.checkboxChecked]} />
          <Text style={styles.sslText}>Use SSL (HTTPS/WSS)</Text>
        </TouchableOpacity>

        <Text style={styles.urlPreview}>
          API: {apiUrl}{'\n'}
          WS: {wsUrl}
        </Text>

        <TouchableOpacity
          style={[styles.connectButton, loading && styles.connectButtonDisabled]}
          onPress={connectToBackend}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.connectButtonText}>Connect</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.hint}>
          For local dev: use your computer's IP (e.g., 192.168.1.122:8000) with SSL off
        </Text>
      </View>
    );
  }

  return (
    <RadioProvider wsUrl={wsUrl}>
      <RadioScreenWrapper token={token} />
    </RadioProvider>
  );
}

// Wrapper to connect WebSocket after RadioProvider mounts
const RadioScreenWrapper: React.FC<{token: string}> = ({token}) => {
  const {useRadio} = require('./src/contexts/RadioContext');
  const {connect} = useRadio();

  useEffect(() => {
    const doConnect = async () => {
      try {
        console.log('Connecting WebSocket...');
        await connect(token);
      } catch (err) {
        console.error('WebSocket connect failed:', err);
      }
    };
    doConnect();
  }, []);

  return <RadioScreen />;
};

const styles = StyleSheet.create({
  configContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#1a1a2e',
  },
  configTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  configSubtitle: {
    fontSize: 16,
    color: '#8888aa',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2a2a4a',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#3a3a5a',
  },
  sslToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#555',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sslText: {
    color: '#ccc',
    fontSize: 14,
  },
  urlPreview: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  hint: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default App;
