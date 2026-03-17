/**
 * RadioContext - Manages radio state and integrates audio/WebSocket
 */

import React, {createContext, useContext, useState, useEffect, useRef} from 'react';
import AudioManager from '../services/AudioManager';
import WebSocketManager from '../services/WebSocketManager';
import {RadioState} from '../types/ptt';
import {ConnectionState, WebSocketMessage} from '../types/websocket';
import {PersonRecord, VehicleRecord, TranscriptItem} from '../types/results';

interface RadioContextType {
  radioState: RadioState;
  connectionState: ConnectionState;
  currentResult: PersonRecord | VehicleRecord | null;
  transcripts: TranscriptItem[];
  pressPTT: () => void;
  releasePTT: () => void;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within RadioProvider');
  }
  return context;
};

interface RadioProviderProps {
  children: React.ReactNode;
  wsUrl: string;
}

export const RadioProvider: React.FC<RadioProviderProps> = ({children, wsUrl}) => {
  const audioManager = useRef(new AudioManager()).current;
  const wsManager = useRef<WebSocketManager | null>(null);

  const [radioState, setRadioState] = useState<RadioState>({
    isPTTPressed: false,
    isRecording: false,
    isTransmitting: false,
    isReceiving: false,
    currentTranscript: '',
    dispatcherSpeaking: false,
  });

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    lastError: null,
  });

  const [currentResult, setCurrentResult] = useState<PersonRecord | VehicleRecord | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  // Handle WebSocket messages
  const handleMessage = (message: WebSocketMessage) => {
    console.log('Handling message:', message.type);

    switch (message.type) {
      case 'connection':
        if (message.payload.status === 'connected') {
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            reconnectAttempts: 0,
          }));
        } else if (message.payload.status === 'disconnected') {
          setConnectionState(prev => ({
            ...prev,
            isConnected: false,
          }));
        }
        break;

      case 'audio_response':
        // Play dispatcher audio with radio effects
        handleDispatcherAudio(message.payload.audio);
        break;

      case 'transcript':
        // Add transcript to history
        const transcript: TranscriptItem = {
          speaker: message.payload.speaker,
          text: message.payload.text,
          timestamp: message.payload.timestamp,
        };
        setTranscripts(prev => [...prev, transcript]);
        
        if (message.payload.speaker === 'dispatcher') {
          setRadioState(prev => ({
            ...prev,
            currentTranscript: message.payload.text,
          }));
        }
        break;

      case 'function_result':
        // Display search result
        setCurrentResult(message.payload.result);
        break;

      case 'error':
        console.error('WebSocket error:', message.payload);
        setConnectionState(prev => ({
          ...prev,
          lastError: message.payload.message,
        }));
        break;
    }
  };

  // Handle dispatcher audio playback
  const handleDispatcherAudio = async (audioData: string) => {
    try {
      setRadioState(prev => ({...prev, isReceiving: true, dispatcherSpeaking: true}));
      
      // Play beep before dispatcher audio
      await audioManager.playRadioEffect('beep');
      
      // Apply static filter and play audio
      const filteredAudio = audioManager.applyStaticFilter(audioData);
      await audioManager.playAudio(filteredAudio);
      
      // Play squelch after dispatcher finishes
      await audioManager.playRadioEffect('squelch');
      
      setRadioState(prev => ({...prev, isReceiving: false, dispatcherSpeaking: false}));
    } catch (error) {
      console.error('Failed to play dispatcher audio:', error);
      setRadioState(prev => ({...prev, isReceiving: false, dispatcherSpeaking: false}));
    }
  };

  // Connect to WebSocket
  const connect = async (token: string) => {
    try {
      setConnectionState(prev => ({...prev, isConnecting: true}));
      
      wsManager.current = new WebSocketManager({
        url: wsUrl,
        token,
        reconnectInterval: 1000,
        maxReconnectAttempts: 5,
      });

      // Register message handler
      wsManager.current.onMessage(handleMessage);

      // Connect
      await wsManager.current.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionState(prev => ({
        ...prev,
        isConnecting: false,
        lastError: 'Failed to connect',
      }));
    }
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (wsManager.current) {
      wsManager.current.disconnect();
      wsManager.current = null;
    }
    setConnectionState({
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastError: null,
    });
  };

  // Press PTT button
  const pressPTT = async () => {
    if (!connectionState.isConnected) {
      console.warn('Cannot transmit: not connected');
      return;
    }

    try {
      setRadioState(prev => ({...prev, isPTTPressed: true, isRecording: true}));
      
      // Play squelch sound
      await audioManager.playRadioEffect('squelch');
      
      // Start recording
      await audioManager.startRecording();
      
      // Send start transmission message
      wsManager.current?.sendMessage({
        type: 'start_transmission',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setRadioState(prev => ({...prev, isPTTPressed: false, isRecording: false}));
    }
  };

  // Release PTT button
  const releasePTT = async () => {
    try {
      setRadioState(prev => ({...prev, isPTTPressed: false, isRecording: false, isTransmitting: true}));
      
      // Stop recording and get audio chunks
      const chunks = await audioManager.stopRecording();
      
      // Send audio chunks to server
      for (const chunk of chunks) {
        wsManager.current?.sendAudio(chunk);
      }
      
      // Send end transmission message
      wsManager.current?.sendMessage({
        type: 'end_transmission',
        timestamp: Date.now(),
      });
      
      setRadioState(prev => ({...prev, isTransmitting: false}));
    } catch (error) {
      console.error('Failed to send audio:', error);
      setRadioState(prev => ({...prev, isTransmitting: false}));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManager.cleanup();
      disconnect();
    };
  }, []);

  const value: RadioContextType = {
    radioState,
    connectionState,
    currentResult,
    transcripts,
    pressPTT,
    releasePTT,
    connect,
    disconnect,
  };

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
};
