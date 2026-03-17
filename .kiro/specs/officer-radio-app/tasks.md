# Implementation Plan: Officer Radio App

## Overview

This implementation plan creates a React Native mobile application for law enforcement officers to communicate with an AI dispatcher using push-to-talk voice commands. The app connects to the existing backend via WebSocket, integrates with OpenAI Realtime API for voice processing, and provides visual display of person and vehicle search results with authentic radio sound effects.

The implementation is divided into three main tracks: backend infrastructure (WebSocket endpoint and dispatcher), mobile app core functionality (authentication, PTT, audio, WebSocket), and mobile app UI/results display. Tasks are ordered to enable incremental testing and validation at each step.

## Tasks

- [x] 1. Set up React Native project structure
  - Initialize React Native project with TypeScript support
  - Configure project for iOS and Android platforms
  - Set up folder structure: src/components, src/screens, src/services, src/contexts, src/types, src/utils
  - Install core dependencies: @react-native-async-storage/async-storage, react-native-keychain, react-native-audio-recorder-player
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement backend WebSocket endpoint for officer radio
  - [x] 2.1 Create WebSocket endpoint `/ws/officer-radio` in backend/server.py
    - Add WebSocket route with token authentication parameter
    - Implement JWT token validation for WebSocket connections
    - Accept WebSocket connection after successful authentication
    - Close connection with code 1008 if authentication fails
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 2.2 Write property test for WebSocket authentication
    - **Property 23: WebSocket Authentication Rejection**
    - **Validates: Requirements 8.2**
  
  - [x] 2.3 Create OfficerRadioDispatcher class in backend/officer_radio_dispatcher.py
    - Initialize with officer_id, database connection, and WebSocket reference
    - Implement connection to OpenAI Realtime API
    - Configure session with function definitions for search_person and search_vehicle
    - Implement bidirectional audio streaming loop
    - Handle incoming audio from mobile app and forward to OpenAI
    - Handle outgoing audio from OpenAI and forward to mobile app
    - _Requirements: 7.1, 8.4, 8.5_
  
  - [ ]* 2.4 Write property test for bidirectional WebSocket communication
    - **Property 6: WebSocket Bidirectional Communication**
    - **Validates: Requirements 2.7, 8.3, 8.4, 8.5**
  
  - [x] 2.5 Implement function call handlers in OfficerRadioDispatcher
    - Create search_person function handler that queries MongoDB person collection
    - Create search_vehicle function handler that queries MongoDB vehicle collection
    - Extract parameters from function call events
    - Execute database queries with error handling
    - Return structured results to OpenAI Realtime API
    - Send function results to mobile app via WebSocket
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 2.6 Write property tests for function call execution
    - **Property 8: Person Search Function Invocation**
    - **Validates: Requirements 3.1, 3.2**
    - **Property 11: Vehicle Search Function Invocation**
    - **Validates: Requirements 4.1**
    - **Property 19: Function Call Execution**
    - **Validates: Requirements 7.2**
  
  - [ ]* 2.7 Write unit tests for function call error handling
    - Test database connection failures
    - Test invalid query parameters
    - Test empty result sets
    - _Requirements: 7.4, 9.3_

- [x] 3. Checkpoint - Test backend WebSocket endpoint
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement authentication module in mobile app
  - [ ] 4.1 Create TypeScript interfaces in src/types/auth.ts
    - Define AuthCredentials, AuthToken, OfficerProfile interfaces
    - Define AuthState interface
    - _Requirements: 5.1_
  
  - [ ] 4.2 Create AuthContext in src/contexts/AuthContext.tsx
    - Implement React Context for global authentication state
    - Create login function that calls backend /auth/login endpoint
    - Create logout function that clears stored tokens
    - Create getStoredToken function using react-native-keychain
    - Implement token storage using platform-specific secure storage
    - _Requirements: 5.2, 5.3, 5.5_
  
  - [ ]* 4.3 Write property test for token secure storage
    - **Property 15: Token Secure Storage Round Trip**
    - **Validates: Requirements 5.5**
  
  - [ ] 4.4 Create LoginScreen component in src/screens/LoginScreen.tsx
    - Build UI with username and password input fields
    - Add login button with loading state
    - Display authentication errors
    - Navigate to main screen on successful login
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 4.5 Write unit tests for authentication flow
    - Test successful login
    - Test failed login with invalid credentials
    - Test token storage and retrieval
    - Test logout functionality
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 5. Implement audio management system
  - [x] 5.1 Create audio configuration types in src/types/audio.ts
    - Define AudioConfig, AudioChunk, RadioSounds interfaces
    - Set sample rate to 24000 Hz (OpenAI requirement)
    - Set channels to 1 (mono), bits per sample to 16 (PCM16)
    - _Requirements: 2.2_
  
  - [x] 5.2 Create AudioManager service in src/services/AudioManager.ts
    - Initialize react-native-audio-recorder-player
    - Implement startRecording method with PCM16 format at 24kHz
    - Implement stopRecording method that returns audio chunks
    - Implement playAudio method for dispatcher responses
    - Add audio chunk buffering and base64 encoding
    - _Requirements: 1.1, 1.3, 2.3_
  
  - [ ]* 5.3 Write property test for audio streaming during PTT
    - **Property 2: Audio Streaming During PTT**
    - **Validates: Requirements 1.2**
  
  - [x] 5.4 Load and prepare radio sound effects
    - Add squelch sound effect audio files to assets
    - Add beep sound effect audio file to assets
    - Add static noise audio file to assets
    - Implement playRadioEffect method in AudioManager
    - Implement applyStaticFilter method for audio processing
    - _Requirements: 2.1, 2.4, 2.5, 2.6_
  
  - [ ]* 5.5 Write property test for radio sound effects sequence
    - **Property 4: Radio Sound Effects Sequence**
    - **Validates: Requirements 2.1, 2.4, 2.5, 2.6**
  
  - [ ]* 5.6 Write unit tests for audio manager
    - Test recording start and stop
    - Test audio playback
    - Test sound effect loading
    - Test audio format validation
    - _Requirements: 1.1, 1.3, 2.1_

- [x] 6. Implement WebSocket communication manager
  - [x] 6.1 Create WebSocket types in src/types/websocket.ts
    - Define WebSocketConfig, WebSocketMessage interfaces
    - Define AudioStreamMessage, TranscriptMessage, FunctionResultMessage interfaces
    - Define ConnectionState interface
    - _Requirements: 8.3_
  
  - [x] 6.2 Create WebSocketManager service in src/services/WebSocketManager.ts
    - Implement connect method with token authentication
    - Implement disconnect method with cleanup
    - Implement sendAudio method for streaming audio chunks
    - Implement sendMessage method for control messages
    - Add message event handlers (onMessage callback)
    - Implement automatic reconnection with exponential backoff
    - _Requirements: 2.7, 2.8, 8.3_
  
  - [ ]* 6.3 Write property test for connection error handling
    - **Property 7: Connection Error Handling**
    - **Validates: Requirements 2.8**
  
  - [x] 6.4 Implement message parsing and routing
    - Parse incoming WebSocket messages by type
    - Route audio_response messages to AudioManager
    - Route transcript messages to state management
    - Route function_result messages to results display
    - Route error messages to error handler
    - _Requirements: 8.5_
  
  - [ ]* 6.4 Write unit tests for WebSocket manager
    - Test connection establishment
    - Test message sending and receiving
    - Test reconnection logic
    - Test error handling
    - _Requirements: 2.7, 2.8, 8.3_

- [ ] 7. Checkpoint - Test audio and WebSocket integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement push-to-talk UI component
  - [x] 8.1 Create PTT types in src/types/ptt.ts
    - Define PTTState and PTTCallbacks interfaces
    - Define RadioState interface
    - _Requirements: 1.1_
  
  - [x] 8.2 Create PTTButton component in src/components/PTTButton.tsx
    - Build large circular button with press-and-hold interaction
    - Implement onPressIn handler to start recording
    - Implement onPressOut handler to stop recording
    - Add visual feedback (color change, scale animation)
    - Add haptic feedback on press and release
    - Disable button when WebSocket disconnected
    - _Requirements: 1.1, 1.3_
  
  - [ ]* 8.3 Write property test for PTT state transitions
    - **Property 1: PTT State Transitions**
    - **Validates: Requirements 1.1, 1.3**
  
  - [x] 8.4 Create RecordingIndicator component in src/components/RecordingIndicator.tsx
    - Display animated recording indicator when audio is being captured
    - Show pulsing red circle or waveform animation
    - Hide indicator when not recording
    - _Requirements: 1.4_
  
  - [ ]* 8.5 Write property test for recording visual indicator
    - **Property 3: Recording Visual Indicator**
    - **Validates: Requirements 1.4**
  
  - [x] 8.6 Create ConnectionStatus component in src/components/ConnectionStatus.tsx
    - Display WebSocket connection status (connected/disconnected/connecting)
    - Use color indicators (green/red/yellow)
    - Show reconnection attempts
    - _Requirements: 2.8_
  
  - [ ]* 8.7 Write unit tests for PTT components
    - Test button press and release interactions
    - Test recording indicator visibility
    - Test connection status display
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 9. Implement main radio screen
  - [x] 9.1 Create RadioContext in src/contexts/RadioContext.tsx
    - Manage RadioState (isPTTPressed, isRecording, isTransmitting, isReceiving)
    - Integrate AudioManager and WebSocketManager
    - Implement PTT press handler that starts recording and plays squelch
    - Implement PTT release handler that stops recording, sends audio, and signals end
    - Handle incoming audio responses with beep and static filter
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.4, 2.5, 2.6_
  
  - [ ]* 9.2 Write property test for AI response streaming
    - **Property 5: AI Response Streaming**
    - **Validates: Requirements 2.3**
  
  - [x] 9.3 Create RadioScreen component in src/screens/RadioScreen.tsx
    - Build main screen layout with PTT button, recording indicator, connection status
    - Integrate PTTButton, RecordingIndicator, ConnectionStatus components
    - Add transcript display area
    - Add results display area
    - Handle platform-specific audio permissions
    - _Requirements: 1.4, 2.8, 10.4_
  
  - [ ]* 9.4 Write property test for audio permission handling
    - **Property 27: Audio Permission Handling**
    - **Validates: Requirements 10.4**
  
  - [ ]* 9.5 Write unit tests for radio screen
    - Test component rendering
    - Test PTT interaction flow
    - Test permission requests
    - _Requirements: 1.1, 1.4, 10.4_

- [ ] 10. Implement search results display
  - [ ] 10.1 Create result types in src/types/results.ts
    - Define PersonRecord, VehicleRecord interfaces
    - Define SearchHistoryItem interface
    - Define ResultsState interface
    - _Requirements: 6.1, 6.2_
  
  - [ ] 10.2 Create PersonCard component in src/components/PersonCard.tsx
    - Display person name, date of birth, driver's license
    - Display warrants list with details
    - Display priors list with details
    - Display address and phone if available
    - Use clear, readable formatting
    - _Requirements: 3.4, 6.1_
  
  - [ ]* 10.3 Write property tests for person record display
    - **Property 9: Person Search Response Content**
    - **Validates: Requirements 3.3**
    - **Property 10: Person Record Display**
    - **Validates: Requirements 3.4, 6.1**
  
  - [ ] 10.4 Create VehicleCard component in src/components/VehicleCard.tsx
    - Display license plate, state, year, make, model
    - Display registered owner
    - Display registration status
    - Display flags with visual indicators
    - Use clear, readable formatting
    - _Requirements: 4.3, 6.2_
  
  - [ ]* 10.5 Write property tests for vehicle record display
    - **Property 12: Vehicle Search Response Content**
    - **Validates: Requirements 4.2**
    - **Property 13: Vehicle Record Display**
    - **Validates: Requirements 4.3, 6.2**
  
  - [ ] 10.6 Create SearchHistory component in src/components/SearchHistory.tsx
    - Display list of recent searches with timestamps
    - Show search type (person/vehicle) and query
    - Allow tapping to view full result details
    - Implement scrollable list for multiple results
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ]* 10.7 Write property tests for search history
    - **Property 16: Search History Accumulation**
    - **Validates: Requirements 6.3**
    - **Property 17: Multiple Results Display**
    - **Validates: Requirements 6.4**
    - **Property 18: Search Result Timestamps**
    - **Validates: Requirements 6.5**
  
  - [ ]* 10.8 Write unit tests for result components
    - Test PersonCard rendering with various data
    - Test VehicleCard rendering with various data
    - Test SearchHistory list rendering
    - Test empty states
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. Implement results state management
  - [ ] 11.1 Create ResultsContext in src/contexts/ResultsContext.tsx
    - Manage ResultsState (currentResult, searchHistory, conversationHistory)
    - Handle function_result messages from WebSocket
    - Add results to search history with timestamps
    - Update current result display
    - Persist search history to AsyncStorage
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [ ] 11.2 Integrate results display into RadioScreen
    - Add conditional rendering for PersonCard or VehicleCard based on result type
    - Add SearchHistory component to screen
    - Handle multiple results display
    - Add scroll view for long result lists
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [ ]* 11.3 Write unit tests for results state management
    - Test result state updates
    - Test search history accumulation
    - Test persistence to AsyncStorage
    - _Requirements: 6.3, 6.5_

- [ ] 12. Checkpoint - Test complete radio flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement error handling and recovery
  - [ ] 13.1 Create error handling utilities in src/utils/errorHandler.ts
    - Implement error logging function
    - Create user-friendly error message mapping
    - Add error recovery strategies
    - _Requirements: 9.1, 9.5_
  
  - [ ] 13.2 Add network error handling to WebSocketManager
    - Display connection error messages
    - Implement reconnection with exponential backoff
    - Show reconnection status in UI
    - Queue audio transmissions during disconnection
    - _Requirements: 2.8, 9.1_
  
  - [ ]* 13.3 Write property test for error logging
    - **Property 26: Error Logging**
    - **Validates: Requirements 9.5**
  
  - [ ] 13.4 Add audio error handling to AudioManager
    - Handle microphone permission denied
    - Handle recording failures with retry
    - Handle playback failures with text fallback
    - Display clear error messages
    - _Requirements: 9.4, 10.4_
  
  - [ ]* 13.5 Write property test for audio playback fallback
    - **Property 25: Audio Playback Fallback**
    - **Validates: Requirements 9.4**
  
  - [ ] 13.6 Add database error handling to backend dispatcher
    - Catch database query exceptions
    - Return error messages to AI dispatcher
    - Generate verbal error responses
    - Log error details
    - _Requirements: 7.4, 9.3_
  
  - [ ]* 13.7 Write property tests for function call error handling
    - **Property 21: Function Call Error Handling**
    - **Validates: Requirements 7.4**
    - **Property 24: Database Query Error Response**
    - **Validates: Requirements 9.3**
  
  - [ ]* 13.8 Write unit tests for error handling
    - Test network error display
    - Test audio error handling
    - Test database error responses
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 14. Implement authentication token management
  - [ ] 14.1 Add token refresh logic to AuthContext
    - Detect 401 responses from backend
    - Attempt automatic token refresh
    - Redirect to login on refresh failure
    - Preserve app state during re-authentication
    - _Requirements: 5.3_
  
  - [ ]* 14.2 Write property test for authentication token WebSocket connection
    - **Property 14: Authentication Token WebSocket Connection**
    - **Validates: Requirements 5.3**
  
  - [ ] 14.3 Add session timeout handling
    - Show warning before timeout
    - Allow session extension
    - Auto-logout on timeout
    - Clear sensitive data on logout
    - _Requirements: 5.4_
  
  - [ ]* 14.4 Write unit tests for token management
    - Test token refresh flow
    - Test session timeout
    - Test logout cleanup
    - _Requirements: 5.3, 5.4_

- [ ] 15. Implement multiple function call support
  - [ ] 15.1 Add function call chaining to OfficerRadioDispatcher
    - Handle multiple function call events in sequence
    - Maintain function call order
    - Aggregate results for AI response
    - _Requirements: 7.5_
  
  - [ ]* 15.2 Write property test for multiple function call chaining
    - **Property 22: Multiple Function Call Chaining**
    - **Validates: Requirements 7.5**
  
  - [ ]* 15.3 Write unit tests for function call chaining
    - Test multiple person searches
    - Test multiple vehicle searches
    - Test mixed search types
    - _Requirements: 7.5_

- [ ] 16. Implement AI response content validation
  - [ ] 16.1 Add response validation to backend dispatcher
    - Validate person search responses include required fields
    - Validate vehicle search responses include required fields
    - Handle missing or incomplete data gracefully
    - _Requirements: 3.3, 4.2_
  
  - [ ]* 16.2 Write property tests for AI response content
    - **Property 20: Function Result Return Flow**
    - **Validates: Requirements 7.3**
  
  - [ ]* 16.3 Write unit tests for response validation
    - Test person response completeness
    - Test vehicle response completeness
    - Test handling of missing fields
    - _Requirements: 3.3, 4.2_

- [ ] 17. Add platform-specific configurations
  - [ ] 17.1 Configure iOS-specific settings
    - Set minimum iOS version to 13.0 in project settings
    - Configure microphone usage description in Info.plist
    - Set up Keychain sharing for secure storage
    - Configure background audio capabilities
    - _Requirements: 10.2, 10.4, 5.5_
  
  - [ ] 17.2 Configure Android-specific settings
    - Set minimum SDK version to 26 (Android 8.0) in build.gradle
    - Add microphone permission to AndroidManifest.xml
    - Configure Keystore for secure storage
    - Configure audio focus handling
    - _Requirements: 10.3, 10.4, 5.5_
  
  - [ ]* 17.3 Write unit tests for platform-specific functionality
    - Test iOS Keychain storage
    - Test Android Keystore storage
    - Test permission handling on both platforms
    - _Requirements: 5.5, 10.4_

- [ ] 18. Implement transcript display
  - [ ] 18.1 Create TranscriptView component in src/components/TranscriptView.tsx
    - Display conversation history with speaker labels
    - Show officer messages and dispatcher responses
    - Auto-scroll to latest message
    - Format timestamps
    - _Requirements: 6.3_
  
  - [ ] 18.2 Add transcript handling to RadioContext
    - Capture transcript messages from WebSocket
    - Store in conversation history
    - Update UI on new messages
    - _Requirements: 6.3_
  
  - [ ]* 18.3 Write unit tests for transcript display
    - Test message rendering
    - Test auto-scroll behavior
    - Test timestamp formatting
    - _Requirements: 6.3_

- [ ] 19. Add no results handling
  - [ ] 19.1 Implement no results display in result components
    - Show "No records found" message for empty person searches
    - Show "Plate not found" message for empty vehicle searches
    - Display search query that returned no results
    - _Requirements: 3.5, 4.4_
  
  - [ ] 19.2 Add no results verbal responses to backend dispatcher
    - Generate appropriate verbal responses for empty results
    - Include search parameters in response
    - _Requirements: 3.5, 4.4_
  
  - [ ]* 19.3 Write unit tests for no results handling
    - Test empty person search display
    - Test empty vehicle search display
    - Test verbal responses
    - _Requirements: 3.5, 4.4_

- [ ] 20. Implement license plate voice recognition handling
  - [ ] 20.1 Add license plate parsing to backend dispatcher
    - Handle alphanumeric plate numbers from voice input
    - Implement phonetic alphabet recognition (Alpha, Bravo, Charlie, etc.)
    - Handle common voice recognition errors
    - Validate plate format before search
    - _Requirements: 4.5_
  
  - [ ]* 20.2 Write unit tests for license plate parsing
    - Test alphanumeric plate recognition
    - Test phonetic alphabet conversion
    - Test plate format validation
    - _Requirements: 4.5_

- [ ] 21. Final integration and wiring
  - [ ] 21.1 Wire all components together in App.tsx
    - Set up navigation between LoginScreen and RadioScreen
    - Wrap app with AuthContext, RadioContext, ResultsContext providers
    - Configure app entry point
    - Add splash screen
    - _Requirements: 5.1, 10.1_
  
  - [ ] 21.2 Add app-level error boundary
    - Catch unhandled errors
    - Display error screen
    - Log errors for debugging
    - Provide recovery options
    - _Requirements: 9.5_
  
  - [ ]* 21.3 Write integration tests for complete flows
    - Test full authentication flow
    - Test complete person search cycle
    - Test complete vehicle search cycle
    - Test error recovery scenarios
    - _Requirements: 1.1, 3.1, 4.1, 5.1_

- [ ] 22. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples and edge cases
- Backend tasks (2.x) can be developed in parallel with mobile app setup (1, 4)
- Audio and WebSocket tasks (5, 6) should be completed before PTT UI (8, 9)
- Results display (10, 11) can be developed in parallel with radio screen (9)
- Error handling (13) and advanced features (14-20) build on core functionality
- Final integration (21) brings all components together
