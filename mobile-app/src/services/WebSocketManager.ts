/**
 * WebSocketManager - Handles WebSocket connection and messaging
 */

import {
  WebSocketConfig,
  WebSocketMessage,
  AudioStreamMessage,
  ConnectionState,
  DEFAULT_WEBSOCKET_CONFIG,
} from '../types/websocket';
import {AudioChunk} from '../types/audio';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private connectionState: ConnectionState;
  private messageHandlers: MessageHandler[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<WebSocketConfig>) {
    this.config = {
      ...DEFAULT_WEBSOCKET_CONFIG,
      ...config,
    } as WebSocketConfig;

    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      lastError: null,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && this.connectionState.isConnected) {
      console.log('Already connected');
      return;
    }

    this.connectionState.isConnecting = true;
    this.connectionState.lastError = null;

    try {
      // Add token as query parameter
      const url = `${this.config.url}?token=${encodeURIComponent(this.config.token)}`;
      
      console.log('Connecting to WebSocket:', url);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionState.isConnected = true;
        this.connectionState.isConnecting = false;
        this.connectionState.reconnectAttempts = 0;
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Notify handlers of connection
        this.notifyHandlers({
          type: 'connection',
          payload: {status: 'connected'},
          timestamp: Date.now(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('Received message:', message.type);
          this.notifyHandlers(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionState.lastError = 'Connection error';
        
        this.notifyHandlers({
          type: 'error',
          payload: {message: 'Connection error'},
          timestamp: Date.now(),
        });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connectionState.isConnected = false;
        this.connectionState.isConnecting = false;
        
        this.stopPingInterval();
        
        // Notify handlers of disconnection
        this.notifyHandlers({
          type: 'connection',
          payload: {status: 'disconnected', code: event.code, reason: event.reason},
          timestamp: Date.now(),
        });
        
        // Attempt reconnection
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.connectionState.isConnecting = false;
      this.connectionState.lastError = 'Failed to connect';
      throw error;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPingInterval();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.connectionState.reconnectAttempts = 0;
  }

  /**
   * Send audio chunk to server
   */
  sendAudio(chunk: AudioChunk): void {
    if (!this.connectionState.isConnected || !this.ws) {
      console.warn('Cannot send audio: not connected');
      return;
    }

    const message: AudioStreamMessage = {
      type: 'audio_stream',
      audio: chunk.data,
      format: 'pcm16',
      timestamp: chunk.timestamp,
    };

    this.sendMessage(message);
  }

  /**
   * Send a message to the server
   */
  sendMessage(message: any): void {
    if (!this.connectionState.isConnected || !this.ws) {
      console.warn('Cannot send message: not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
      console.log('Sent message:', message.type);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  /**
   * Register a message handler
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return {...this.connectionState};
  }

  /**
   * Notify all message handlers
   */
  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      this.connectionState.lastError = 'Max reconnect attempts reached';
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.connectionState.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.connectionState.reconnectAttempts++;
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.connectionState.isConnected && this.ws) {
        this.sendMessage({type: 'ping', timestamp: Date.now()});
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export default WebSocketManager;
