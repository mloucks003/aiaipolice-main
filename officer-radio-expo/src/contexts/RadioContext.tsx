/**
 * RadioContext - Manages radio state and integrates audio/WebSocket
 * 
 * Audio flow:
 * 1. Officer presses PTT -> starts recording PCM16 WAV (24kHz mono)
 * 2. Officer releases PTT -> sends WAV base64 to backend
 * 3. Backend strips WAV header -> sends PCM16 to OpenAI
 * 4. OpenAI streams PCM16 audio chunks back -> we buffer them
 * 5. When response is done -> combine chunks into WAV -> play
 */

import React, {createContext, useContext, useState, useEffect, useRef, useCallback} from 'react';
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
  const isReceivingAudio = useRef(false);

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

  // Play buffered audio response
  const playBufferedResponse = useCallback(async () => {
    try {
      isReceivingAudio.current = false;
      await audioManager.playBufferedAudio();
      setRadioState(prev => ({...prev, isReceiving: false, dispatcherSpeaking: false}));
    } catch (error) {
      console.error('Failed to play buffered audio:', error);
      setRadioState(prev => ({...prev, isReceiving: false, dispatcherSpeaking: false}));
    }
  }, [audioManager]);

  // Handle WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Handling message:', message.type);

    switch (message.type) {
      case 'connection':
        if (message.payload.status === 'connected') {
          setConnectionState(prev => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            reconnectAttempts: 0,
            lastError: null,
          }));
        } else if (message.payload.status === 'disconnected') {
          setConnectionState(prev => ({
            ...prev,
            isConnected: false,
          }));
        }
        break;

      case 'audio_response':
        // Buffer PCM16 audio chunks from OpenAI
        if (message.payload?.audio) {
          if (!isReceivingAudio.current) {
            isReceivingAudio.current = true;
            audioManager.clearAudioBuffer();
            setRadioState(prev => ({...prev, isReceiving: true, dispatcherSpeaking: true}));
          }
          audioManager.addAudioChunk(message.payload.audio);
        }
        break;

      case 'audio_done':
        // All audio chunks received - play the buffered audio
        playBufferedResponse();
        break;

      case 'transcript': {
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
          
          if (isReceivingAudio.current) {
            playBufferedResponse();
          }
        }
        break;
      }

      case 'function_result':
        // Display search result
        if (message.payload?.result) {
          setCurrentResult(message.payload.result);
        }
        break;

      case 'error':
        console.error('Server error:', message.payload);
        setConnectionState(prev => ({
          ...prev,
          lastError: message.payload?.message || message.payload?.error || 'Unknown error',
        }));
        break;

      case 'dispatch_alert': {
        // New call dispatch — play alert tone then TTS the dispatch text
        console.log('DISPATCH ALERT:', message.payload);
        const payload = message.payload;
        
        // Add dispatch to transcripts
        const dispatchTranscript: TranscriptItem = {
          speaker: 'dispatcher',
          text: `🚨 DISPATCH: ${payload.dispatch_text || payload.incident_type}`,
          timestamp: payload.timestamp || Date.now(),
        };
        setTranscripts(prev => [...prev, dispatchTranscript]);
        
        // Play alert tone (priority tone for high-priority, dispatch tone otherwise)
        const alertEffect = (payload.priority && payload.priority <= 2) ? 'priority_tone' : 'dispatch_tone';
        audioManager.playRadioEffect(alertEffect).then(() => {
          if (wsManager.current) {
            console.log('Sending speak_dispatch to backend:', payload.dispatch_text);
            wsManager.current.sendMessage({
              type: 'speak_dispatch',
              text: payload.dispatch_text,
              timestamp: Date.now(),
            });
          } else {
            console.warn('wsManager not available for speak_dispatch');
          }
        });
        
        // Don't set isReceiving here — let the audio_response/audio_done pipeline handle it
        break;
      }
    }
  }, [audioManager, playBufferedResponse]);

  // Connect to WebSocket
  const connect = useCallback(async (token: string) => {
    try {
      setConnectionState(prev => ({...prev, isConnecting: true}));
      
      wsManager.current = new WebSocketManager({
        url: wsUrl,
        token,
        reconnectInterval: 1000,
        maxReconnectAttempts: 10,
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
        lastError: 'Failed to connect to server',
      }));
    }
  }, [wsUrl, handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
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
  }, []);

  // Press PTT button
  const pressPTT = useCallback(async () => {
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
  }, [connectionState.isConnected]);

  // Release PTT button
  const releasePTT = useCallback(async () => {
    try {
      setRadioState(prev => ({...prev, isPTTPressed: false, isRecording: false, isTransmitting: true}));
      
      // Stop recording and get audio chunks
      const chunks = await audioManager.stopRecording();
      
      if (chunks.length > 0) {
        // Send audio chunks to server
        for (const chunk of chunks) {
          wsManager.current?.sendAudio(chunk);
        }
      }
      
      // Send end transmission message
      wsManager.current?.sendMessage({
        type: 'end_transmission',
        timestamp: Date.now(),
      });
      
      setRadioState(prev => ({...prev, isTransmitting: false}));
    } catch (error) {
      console.error('Failed to send audio:', error);
      setRadioState(prev => ({...prev, isPTTPressed: false, isRecording: false, isTransmitting: false}));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioManager.cleanup();
      if (wsManager.current) {
        wsManager.current.disconnect();
      }
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
