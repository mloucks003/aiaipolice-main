/**
 * Audio configuration and types for the Officer Radio App
 */

export interface AudioConfig {
  sampleRate: 24000; // OpenAI Realtime API requirement
  channels: 1; // Mono
  bitsPerSample: 16; // PCM16
  encoding: 'pcm16' | 'g711_ulaw';
}

export interface AudioChunk {
  data: string; // base64 encoded
  timestamp: number;
  sequenceNumber: number;
}

export interface RadioSounds {
  squelchStart: any; // Audio buffer/source
  squelchEnd: any;
  beep: any;
  staticNoise: any;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  sampleRate: 24000,
  channels: 1,
  bitsPerSample: 16,
  encoding: 'pcm16',
};
