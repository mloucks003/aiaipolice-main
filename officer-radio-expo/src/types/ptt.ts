/**
 * Push-to-Talk types
 */

export interface PTTState {
  isPressed: boolean;
  isRecording: boolean;
  isTransmitting: boolean;
  isReceiving: boolean;
}

export interface PTTCallbacks {
  onPressIn: () => void;
  onPressOut: () => void;
  onLongPress?: () => void;
}

export interface RadioState {
  isPTTPressed: boolean;
  isRecording: boolean;
  isTransmitting: boolean;
  isReceiving: boolean;
  currentTranscript: string;
  dispatcherSpeaking: boolean;
}
