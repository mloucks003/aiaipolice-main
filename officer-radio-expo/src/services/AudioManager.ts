/**
 * AudioManager - Handles audio recording, playback, and radio effects using expo-av
 * 
 * Key audio flow:
 * - Recording: Expo records M4A -> sent as base64 to backend -> backend converts to PCM16 via ffmpeg -> OpenAI
 * - Playback: OpenAI sends PCM16 base64 chunks -> we buffer them -> write WAV file -> play with expo-av
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AudioChunk, AudioConfig, DEFAULT_AUDIO_CONFIG } from '../types/audio';

class AudioManager {
  private config: AudioConfig;
  private isRecording: boolean = false;
  private audioChunks: AudioChunk[] = [];
  private sequenceNumber: number = 0;
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private audioBuffer: string[] = []; // Buffer for incoming PCM16 chunks
  private isPlaying: boolean = false;
  private playbackQueue: string[] = []; // Queue of WAV file URIs to play

  constructor(config: AudioConfig = DEFAULT_AUDIO_CONFIG) {
    this.config = config;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.isRecording = true;
      this.audioChunks = [];
      this.sequenceNumber = 0;

      // Create new recording with M4A format (backend will convert to PCM16)
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      this.recording = recording;
      console.log('Recording started');
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio chunks
   */
  async stopRecording(): Promise<AudioChunk[]> {
    try {
      if (!this.isRecording || !this.recording) {
        return [];
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.isRecording = false;

      console.log('Recording stopped, URI:', uri);

      if (!uri) {
        console.error('No recording URI available');
        return [];
      }

      // Read the audio file and convert to base64
      try {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        console.log('Audio file read, base64 length:', base64Audio.length);

        const chunk: AudioChunk = {
          data: base64Audio,
          timestamp: Date.now(),
          sequenceNumber: this.sequenceNumber++,
        };

        this.audioChunks = [chunk];
        this.recording = null;

        return this.audioChunks;
      } catch (readError) {
        console.error('Failed to read audio file:', readError);
        this.recording = null;
        return [];
      }
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Add a PCM16 audio chunk to the buffer (called for each audio_response from OpenAI)
   */
  addAudioChunk(base64Pcm16: string): void {
    this.audioBuffer.push(base64Pcm16);
  }

  /**
   * Clear the audio buffer
   */
  clearAudioBuffer(): void {
    this.audioBuffer = [];
  }

  /**
   * Flush buffered PCM16 chunks into a WAV file and play it
   */
  async playBufferedAudio(): Promise<void> {
    if (this.audioBuffer.length === 0) {
      console.log('No audio chunks to play');
      return;
    }

    try {
      // Combine all PCM16 base64 chunks into one
      const combinedBase64 = this.audioBuffer.join('');
      this.audioBuffer = [];

      // Decode base64 to get raw PCM bytes length
      const pcmBytes = this.base64ToBytes(combinedBase64);
      
      // Create WAV header for PCM16, 24kHz, mono
      const wavHeader = this.createWavHeader(pcmBytes.length, 24000, 1, 16);
      
      // Combine header + PCM data
      const wavBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(pcmBytes, wavHeader.length);
      
      // Convert to base64
      const wavBase64 = this.bytesToBase64(wavBytes);
      
      // Write to temp file
      const tempPath = `${FileSystem.cacheDirectory}dispatcher_response_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log(`WAV file written: ${tempPath} (${wavBytes.length} bytes)`);

      // Play the WAV file
      await this.playAudioFile(tempPath);

      // Clean up temp file after a delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempPath, { idempotent: true });
        } catch (e) {
          // ignore cleanup errors
        }
      }, 10000);

    } catch (error) {
      console.error('Failed to play buffered audio:', error);
    }
  }

  /**
   * Play audio from a file URI
   */
  async playAudioFile(uri: string): Promise<void> {
    try {
      // Stop any existing playback
      await this.stopPlayback();

      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0 }
      );
      this.sound = sound;
      this.isPlaying = true;

      // Clean up when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          this.isPlaying = false;
          sound.unloadAsync();
          this.sound = null;
        }
      });

      console.log('Playing audio file:', uri);
    } catch (error) {
      this.isPlaying = false;
      console.error('Failed to play audio file:', error);
      throw error;
    }
  }

  /**
   * Play a radio sound effect (placeholder for MVP)
   */
  async playRadioEffect(effect: 'squelch' | 'beep'): Promise<void> {
    try {
      console.log(`Radio effect: ${effect}`);
      // Sound effects can be added later with actual audio files
    } catch (error) {
      console.error(`Failed to play radio effect ${effect}:`, error);
    }
  }

  /**
   * Stop all audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording && this.recording) {
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      await this.stopPlayback();
      this.audioBuffer = [];
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Get recording status
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get playing status
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- Helper methods for WAV creation ---

  /**
   * Create a WAV file header
   */
  private createWavHeader(dataLength: number, sampleRate: number, channels: number, bitsPerSample: number): Uint8Array {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    const byteRate = sampleRate * channels * (bitsPerSample / 8);
    const blockAlign = channels * (bitsPerSample / 8);

    // RIFF header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); // file size - 8
    this.writeString(view, 8, 'WAVE');

    // fmt chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    return new Uint8Array(header);
  }

  private writeString(view: DataView, offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Decode base64 string to Uint8Array
   */
  private base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Encode Uint8Array to base64 string
   */
  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export default AudioManager;
