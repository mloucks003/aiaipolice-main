/**
 * WebSocket types for Officer Radio App
 */

export interface WebSocketConfig {
  url: string; // ws://localhost:8000/ws/officer-radio
  token: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface WebSocketMessage {
  type: 'audio' | 'audio_response' | 'audio_done' | 'transcript' | 'function_result' | 'error' | 'connection';
  payload: any;
  timestamp: number;
}

export interface AudioStreamMessage {
  type: 'audio_stream';
  audio: string; // base64 encoded
  format: 'pcm16' | 'g711_ulaw';
  timestamp: number;
}

export interface AudioResponseMessage {
  type: 'audio_response';
  audio: string; // base64 encoded
  format: 'pcm16' | 'g711_ulaw';
  timestamp: number;
}

export interface TranscriptMessage {
  type: 'transcript';
  speaker: 'officer' | 'dispatcher';
  text: string;
  timestamp: number;
}

export interface FunctionResultMessage {
  type: 'function_result';
  function: 'person_search' | 'vehicle_search';
  result: any;
  query: Record<string, any>;
  timestamp: number;
}

export interface ErrorMessage {
  type: 'error';
  code: string;
  message: string;
  timestamp: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}

export const DEFAULT_WEBSOCKET_CONFIG: Partial<WebSocketConfig> = {
  reconnectInterval: 1000,
  maxReconnectAttempts: 5,
};
