/**
 * AudioManager - Handles audio recording, playback, and radio effects using expo-av
 * 
 * Key audio flow:
 * - Recording: Expo records PCM16 WAV (24kHz mono on iOS) -> sent as base64 to backend -> backend strips WAV header -> OpenAI
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

      // Record as uncompressed PCM-like WAV (LinearPCM) so backend can easily convert
      // or send directly to OpenAI without ffmpeg
      const recordingOptions: Audio.RecordingOptions = {
        isMeteringEnabled: false,
        android: {
          extension: '.wav',
          outputFormat: 2, // THREE_GPP as fallback, Android doesn't support raw PCM easily
          audioEncoder: 1, // DEFAULT
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
        },
        ios: {
          extension: '.wav',
          outputFormat: 'lpcm', // Linear PCM - uncompressed
          audioQuality: 127, // max
          sampleRate: 24000,
          numberOfChannels: 1,
          bitRate: 384000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 384000,
        },
      };

      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      
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
   * Applies radio distortion effect for realism
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

      // Decode base64 to get raw PCM bytes
      const pcmBytes = this.base64ToBytes(combinedBase64);
      
      // Apply radio distortion to the PCM data
      const distortedPcm = this.applyRadioDistortion(pcmBytes);
      
      // Create WAV header for PCM16, 24kHz, mono
      const wavHeader = this.createWavHeader(distortedPcm.length, 24000, 1, 16);
      
      // Combine header + PCM data
      const wavBytes = new Uint8Array(wavHeader.length + distortedPcm.length);
      wavBytes.set(wavHeader, 0);
      wavBytes.set(distortedPcm, wavHeader.length);
      
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
   * Play a radio sound effect — generates tones programmatically
   */
    async playRadioEffect(effect: 'squelch' | 'beep' | 'dispatch_tone' | 'priority_tone'): Promise<void> {
      try {
        console.log(`Radio effect: ${effect}`);
        const sampleRate = 24000;
        let pcmSamples: Int16Array;

        switch (effect) {
          case 'squelch': {
            // Short white noise burst + sine sweep, ~150ms
            const duration = 0.15;
            const numSamples = Math.floor(sampleRate * duration);
            pcmSamples = new Int16Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const t = i / sampleRate;
              // White noise fading out + rising sine sweep
              const noise = (Math.random() * 2 - 1) * (1 - t / duration) * 0.4;
              const sweepFreq = 800 + (t / duration) * 2000;
              const sine = Math.sin(2 * Math.PI * sweepFreq * t) * 0.3 * (1 - t / duration);
              pcmSamples[i] = Math.max(-32768, Math.min(32767, Math.round((noise + sine) * 32767)));
            }
            break;
          }
          case 'beep': {
            // Simple 1kHz sine tone, ~100ms
            const duration = 0.1;
            const numSamples = Math.floor(sampleRate * duration);
            pcmSamples = new Int16Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const t = i / sampleRate;
              const envelope = Math.min(1, Math.min(t * 20, (duration - t) * 20)); // fade in/out
              pcmSamples[i] = Math.round(Math.sin(2 * Math.PI * 1000 * t) * 0.5 * envelope * 32767);
            }
            break;
          }
          case 'dispatch_tone': {
            // Two-tone alert (like real dispatch): 1000Hz then 1500Hz, ~400ms total
            const toneDuration = 0.2;
            const numSamples = Math.floor(sampleRate * toneDuration * 2);
            pcmSamples = new Int16Array(numSamples);
            const half = Math.floor(sampleRate * toneDuration);
            for (let i = 0; i < numSamples; i++) {
              const t = i / sampleRate;
              const freq = i < half ? 1000 : 1500;
              const localT = i < half ? t : t - toneDuration;
              const envelope = Math.min(1, Math.min(localT * 20, (toneDuration - localT) * 20));
              pcmSamples[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * 0.6 * envelope * 32767);
            }
            break;
          }
          case 'priority_tone': {
            // Urgent repeating beep: 3 fast beeps at 1800Hz, ~500ms total
            const beepLen = 0.08;
            const gapLen = 0.06;
            const totalDuration = (beepLen + gapLen) * 3;
            const numSamples = Math.floor(sampleRate * totalDuration);
            pcmSamples = new Int16Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const t = i / sampleRate;
              const cyclePos = t % (beepLen + gapLen);
              if (cyclePos < beepLen) {
                const env = Math.min(1, Math.min(cyclePos * 30, (beepLen - cyclePos) * 30));
                pcmSamples[i] = Math.round(Math.sin(2 * Math.PI * 1800 * t) * 0.7 * env * 32767);
              } else {
                pcmSamples[i] = 0;
              }
            }
            break;
          }
          default:
            return;
        }

        // Convert Int16Array to Uint8Array (little-endian PCM16)
        const pcmBytes = new Uint8Array(pcmSamples.length * 2);
        for (let i = 0; i < pcmSamples.length; i++) {
          pcmBytes[i * 2] = pcmSamples[i] & 0xFF;
          pcmBytes[i * 2 + 1] = (pcmSamples[i] >> 8) & 0xFF;
        }

        // Create WAV
        const wavHeader = this.createWavHeader(pcmBytes.length, sampleRate, 1, 16);
        const wavBytes = new Uint8Array(wavHeader.length + pcmBytes.length);
        wavBytes.set(wavHeader, 0);
        wavBytes.set(pcmBytes, wavHeader.length);

        const wavBase64 = this.bytesToBase64(wavBytes);
        const tempPath = `${FileSystem.cacheDirectory}radio_effect_${effect}_${Date.now()}.wav`;
        await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Play it — wait for completion before resolving
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: tempPath },
          { shouldPlay: true, volume: 1.0 }
        );

        await new Promise<void>((resolve) => {
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync();
              FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
              resolve();
            }
          });
          // Safety timeout
          setTimeout(() => resolve(), 2000);
        });
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

  // --- Radio distortion effect ---

  /**
   * Apply radio-style distortion to PCM16 audio data.
   * Simulates a police radio: bandpass filter (300-3000Hz), slight compression,
   * subtle noise floor, and mild clipping.
   */
  private applyRadioDistortion(pcmBytes: Uint8Array): Uint8Array {
    const sampleRate = 24000;
    const numSamples = pcmBytes.length / 2;
    const samples = new Int16Array(numSamples);
    
    // Read PCM16 LE samples
    for (let i = 0; i < numSamples; i++) {
      samples[i] = pcmBytes[i * 2] | (pcmBytes[i * 2 + 1] << 8);
      // Sign extend
      if (samples[i] > 32767) samples[i] -= 65536;
    }
    
    // Simple IIR bandpass filter coefficients (300Hz - 3000Hz at 24kHz)
    // High-pass at ~300Hz
    const hpAlpha = 0.96; // ~300Hz cutoff
    // Low-pass at ~3000Hz  
    const lpAlpha = 0.55; // ~3000Hz cutoff
    
    let hpPrev = 0;
    let hpPrevIn = 0;
    let lpPrev = 0;
    
    const output = new Int16Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      const sample = samples[i] / 32768.0;
      
      // High-pass filter (remove bass)
      const hpOut = hpAlpha * (hpPrev + sample - hpPrevIn);
      hpPrevIn = sample;
      hpPrev = hpOut;
      
      // Low-pass filter (remove treble)
      lpPrev = lpPrev + lpAlpha * (hpOut - lpPrev);
      
      let filtered = lpPrev;
      
      // Soft clipping / compression (radio compressor effect)
      if (filtered > 0.4) {
        filtered = 0.4 + (filtered - 0.4) * 0.3;
      } else if (filtered < -0.4) {
        filtered = -0.4 + (filtered + 0.4) * 0.3;
      }
      
      // Add subtle noise floor
      const noise = (Math.random() * 2 - 1) * 0.008;
      filtered += noise;
      
      // Boost volume slightly to compensate for filtering
      filtered *= 1.8;
      
      // Hard clip
      filtered = Math.max(-0.95, Math.min(0.95, filtered));
      
      output[i] = Math.round(filtered * 32767);
    }
    
    // Convert back to Uint8Array (LE)
    const result = new Uint8Array(numSamples * 2);
    for (let i = 0; i < numSamples; i++) {
      result[i * 2] = output[i] & 0xFF;
      result[i * 2 + 1] = (output[i] >> 8) & 0xFF;
    }
    
    return result;
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
