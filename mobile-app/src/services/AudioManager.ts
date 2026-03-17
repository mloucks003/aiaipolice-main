/**
 * AudioManager - Handles audio recording, playback, and radio effects
 */

import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import {Platform, PermissionsAndroid} from 'react-native';
import {AudioChunk, AudioConfig, DEFAULT_AUDIO_CONFIG} from '../types/audio';

class AudioManager {
  private audioRecorderPlayer: AudioRecorderPlayer;
  private config: AudioConfig;
  private isRecording: boolean = false;
  private audioChunks: AudioChunk[] = [];
  private sequenceNumber: number = 0;
  private recordingPath: string = '';

  constructor(config: AudioConfig = DEFAULT_AUDIO_CONFIG) {
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.config = config;
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Officer Radio App needs access to your microphone for radio communication',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions automatically
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

      this.isRecording = true;
      this.audioChunks = [];
      this.sequenceNumber = 0;

      // Configure recording settings for PCM16 at 24kHz
      const path = Platform.select({
        ios: 'officer_radio_recording.m4a',
        android: 'sdcard/officer_radio_recording.wav',
      });

      this.recordingPath = path || '';

      const audioSet = {
        AudioEncoderAndroid: 'aac',
        AudioSourceAndroid: 'MIC',
        AVEncoderAudioQualityKeyIOS: 'high',
        AVNumberOfChannelsKeyIOS: this.config.channels,
        AVFormatIDKeyIOS: 'lpcm', // Linear PCM
        AVSampleRateKeyIOS: this.config.sampleRate,
      };

      await this.audioRecorderPlayer.startRecorder(this.recordingPath, audioSet);
      
      // Set up recording listener for chunks
      this.audioRecorderPlayer.addRecordBackListener((e) => {
        // This will be called periodically during recording
        // We'll collect the full recording and chunk it on stop
        return;
      });

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
      if (!this.isRecording) {
        return [];
      }

      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.isRecording = false;

      console.log('Recording stopped:', result);

      // For MVP, we'll create a placeholder chunk
      // In production, read the actual audio file and convert to base64
      const chunk: AudioChunk = {
        data: result || '', // The result contains the file path
        timestamp: Date.now(),
        sequenceNumber: this.sequenceNumber++,
      };

      this.audioChunks = [chunk];
      return this.audioChunks;
    } catch (error) {
      this.isRecording = false;
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Play audio from base64 data or file path
   */
  async playAudio(audioData: string): Promise<void> {
    try {
      // For MVP, assume audioData is a file path or URL
      // In production, handle base64 data properly
      console.log('Playing audio from:', audioData);
      
      // If it's a base64 string, we'd need to write it to a temp file first
      // For now, just log it
      if (audioData.startsWith('data:') || audioData.length > 1000) {
        console.log('Received base64 audio data (playback not fully implemented in MVP)');
        return;
      }
      
      // Play the audio file
      await this.audioRecorderPlayer.startPlayer(audioData);
      
      this.audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          this.audioRecorderPlayer.stopPlayer();
          this.audioRecorderPlayer.removePlayBackListener();
        }
      });

      console.log('Playing audio');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Play a radio sound effect
   */
  async playRadioEffect(effect: 'squelch' | 'beep'): Promise<void> {
    try {
      // For MVP, we'll use placeholder sounds
      // In production, load actual sound files from assets
      console.log(`Playing radio effect: ${effect}`);
      
      // TODO: Load and play actual sound files
      // const soundPath = require(`../assets/sounds/${effect}.wav`);
      // await this.audioRecorderPlayer.startPlayer(soundPath);
    } catch (error) {
      console.error(`Failed to play radio effect ${effect}:`, error);
    }
  }

  /**
   * Apply static filter to audio data (radio effect)
   */
  applyStaticFilter(audioData: string): string {
    // For MVP, return audio as-is
    // In production, apply audio processing to add radio static effect
    console.log('Applying static filter to audio');
    return audioData;
  }

  /**
   * Stop all audio playback
   */
  async stopPlayback(): Promise<void> {
    try {
      await this.audioRecorderPlayer.stopPlayer();
      this.audioRecorderPlayer.removePlayBackListener();
    } catch (error) {
      console.error('Failed to stop playback:', error);
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }
      await this.stopPlayback();
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
}

export default AudioManager;
