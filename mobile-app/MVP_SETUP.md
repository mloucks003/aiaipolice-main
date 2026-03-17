# Officer Radio App - MVP Setup Guide

This is a minimal working MVP of the Officer Radio App that can communicate with the dispatch backend.

## What's Implemented

✅ **Task 5: Audio Management**
- Audio types and configuration (PCM16, 24kHz, mono)
- AudioManager service for recording and playback
- Radio sound effects placeholders (squelch, beep)
- Static filter placeholder

✅ **Task 6: WebSocket Communication**
- WebSocket types and configuration
- WebSocketManager service with auto-reconnection
- Message handling for audio, transcripts, and function results
- Connection state management

✅ **Task 8: PTT UI Components**
- PTTButton component (large circular button with press-and-hold)
- RecordingIndicator component (pulsing animation)
- ConnectionStatus component (connection state display)

✅ **Task 9: Main Radio Screen**
- RadioScreen with integrated PTT button
- RadioContext for state management
- Audio and WebSocket integration
- Transcript and results display
- PersonCard and VehicleCard components

## Setup Instructions

### 1. Backend Setup

Make sure the backend is running:

```bash
cd backend
python server.py
```

The backend should be accessible at `http://localhost:8000`

### 2. Install Dependencies

```bash
cd mobile-app
npm install
```

### 3. iOS Setup (if testing on iOS)

```bash
cd ios
pod install
cd ..
```

### 4. Run the App

**For iOS:**
```bash
npm run ios
```

**For Android:**
```bash
npm run android
```

## How to Use

1. **Launch the App**: The app will automatically attempt to authenticate with the backend using admin/admin123 credentials and get a test token.

2. **Wait for Connection**: The connection status indicator at the top will show:
   - 🟢 Green: Connected to dispatch
   - 🟡 Yellow: Connecting...
   - 🔴 Red: Disconnected

3. **Press and Hold PTT**: 
   - Press and hold the blue "PUSH TO TALK" button
   - The button will turn red and show "TRANSMITTING"
   - Speak your request (e.g., "Run a plate for California ABC123")
   - Release the button to send

4. **View Results**:
   - Toggle between "Transcript" and "Results" tabs
   - Transcript shows the conversation history
   - Results shows person/vehicle search results

## Current Limitations (MVP)

- **Authentication**: Uses hardcoded admin credentials (will be replaced with proper login screen)
- **Audio Format**: Audio recording works but base64 conversion is simplified for MVP
- **Radio Effects**: Sound effects are placeholders (squelch/beep not yet loaded)
- **Static Filter**: Audio filter is a placeholder (no actual processing yet)
- **File System**: Not using react-native-fs yet (simplified for MVP)

## Testing the Flow

1. Start the backend
2. Launch the mobile app
3. Wait for green connection indicator
4. Press and hold PTT button
5. Say: "Search for John Doe" or "Run plate ABC123"
6. Release button
7. Wait for dispatcher response
8. Check Results tab for search results

## Next Steps

To complete the full implementation:

- [ ] Add proper authentication screen (Task 4)
- [ ] Load actual radio sound effects
- [ ] Implement proper audio base64 encoding
- [ ] Add react-native-fs for file handling
- [ ] Implement static audio filter
- [ ] Add error handling and recovery
- [ ] Add search history persistence
- [ ] Platform-specific configurations

## Troubleshooting

**Connection Failed:**
- Check that backend is running on localhost:8000
- Check that WebSocket endpoint is accessible
- For Android emulator, use 10.0.2.2:8000 instead of localhost:8000

**Audio Not Recording:**
- Check microphone permissions
- iOS: Automatically requested
- Android: Check AndroidManifest.xml has RECORD_AUDIO permission

**App Crashes:**
- Check Metro bundler logs
- Check native logs (Xcode console or adb logcat)
- Ensure all dependencies are installed

## Architecture

```
App.tsx
  └─ RadioProvider (WebSocket + Audio management)
      └─ RadioScreen
          ├─ ConnectionStatus
          ├─ RecordingIndicator
          ├─ PTTButton
          ├─ TranscriptView
          └─ Results (PersonCard / VehicleCard)
```

## Files Created

- `src/types/audio.ts` - Audio configuration types
- `src/types/websocket.ts` - WebSocket message types
- `src/types/ptt.ts` - PTT state types
- `src/types/results.ts` - Search result types
- `src/services/AudioManager.ts` - Audio recording/playback
- `src/services/WebSocketManager.ts` - WebSocket communication
- `src/contexts/RadioContext.tsx` - Radio state management
- `src/components/PTTButton.tsx` - Push-to-talk button
- `src/components/RecordingIndicator.tsx` - Recording animation
- `src/components/ConnectionStatus.tsx` - Connection indicator
- `src/components/PersonCard.tsx` - Person search results
- `src/components/VehicleCard.tsx` - Vehicle search results
- `src/components/TranscriptView.tsx` - Conversation transcript
- `src/screens/RadioScreen.tsx` - Main radio interface

## Contact

For issues or questions, check the main project README.
