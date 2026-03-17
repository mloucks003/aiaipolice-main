# Design Document: Officer Radio App

## Overview

The Officer Radio App is a React Native mobile application that provides law enforcement officers with a voice-activated AI dispatcher interface. The app enables officers to perform database searches for persons and vehicles using natural voice commands through a push-to-talk (PTT) interface, mimicking the experience of a traditional police radio with authentic sound effects.

The application leverages the existing backend infrastructure, connecting via WebSocket to the `/ws/officer-radio` endpoint. It integrates with the OpenAI Realtime API for natural voice-to-voice conversation, allowing officers to speak naturally and receive both verbal and visual responses. The system processes voice commands through function calling to query the backend database for person and vehicle records.

Key features include:
- Push-to-talk voice interface with radio sound effects (squelch, beeps, static)
- Real-time bidirectional audio streaming via WebSocket
- OpenAI Realtime API integration for natural language processing
- Database search capabilities (person and vehicle lookups)
- Visual display of search results with history
- Secure authentication and session management
- Cross-platform support (iOS and Android)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Officer Radio App                         │
│                   (React Native)                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │   PTT UI     │  │   Results    │     │
│  │   Screen     │  │   Component  │  │   Display    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Audio Manager                                 │  │
│  │  - Microphone capture                                 │  │
│  │  - Audio playback                                     │  │
│  │  - Radio effects (squelch, beeps, static)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         WebSocket Manager                             │  │
│  │  - Connection management                              │  │
│  │  - Audio streaming                                    │  │
│  │  - Message handling                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ WSS Connection
                            │ /ws/officer-radio
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                            │
│                   (FastAPI)                                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Officer Radio WebSocket Handler                    │  │
│  │  - Authentication                                     │  │
│  │  - Audio stream forwarding                            │  │
│  │  - Function call execution                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         OpenAI Realtime API Client                    │  │
│  │  - Voice-to-voice conversation                        │  │
│  │  - Function calling                                   │  │
│  │  - Audio transcription                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Database APIs                                 │  │
│  │  - Person search                                      │  │
│  │  - Vehicle search                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    └──────────────┘
```

### Component Architecture

The mobile app follows a modular architecture with clear separation of concerns:

1. **Presentation Layer**: React Native components for UI rendering
2. **Business Logic Layer**: State management, audio processing, WebSocket communication
3. **Platform Layer**: Native modules for audio capture and secure storage

### Technology Stack

- **Frontend Framework**: React Native (0.72+)
- **State Management**: React Context API with hooks
- **Audio Processing**: 
  - `react-native-audio-recorder-player` for recording/playback
  - `expo-av` (if using Expo) or native audio modules
  - Custom audio effects processing
- **WebSocket**: Native WebSocket API or `react-native-websocket`
- **Authentication**: 
  - `@react-native-async-storage/async-storage` for token storage
  - `react-native-keychain` for secure credential storage
- **UI Components**: React Native core components with custom styling
- **Audio Format**: PCM16 or μ-law (G.711) for compatibility with OpenAI Realtime API

## Components and Interfaces

### Mobile App Components

#### 1. Authentication Module

**Purpose**: Handles officer login and session management

**Components**:
- `LoginScreen`: UI for credential input
- `AuthContext`: Global authentication state
- `SecureStorage`: Platform-specific secure storage wrapper

**Interfaces**:
```typescript
interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthToken {
  access_token: string;
  token_type: string;
  user: OfficerProfile;
}

interface OfficerProfile {
  id: string;
  badge_number: string;
  username: string;
  full_name: string;
  role: string;
  department: string;
  rank: string;
}
```

**Key Methods**:
- `login(credentials: AuthCredentials): Promise<AuthToken>`
- `logout(): Promise<void>`
- `getStoredToken(): Promise<string | null>`
- `refreshToken(): Promise<AuthToken>`

#### 2. Push-to-Talk Component

**Purpose**: Provides the radio-style PTT interface

**Components**:
- `PTTButton`: Large, pressable button component
- `RecordingIndicator`: Visual feedback during recording
- `ConnectionStatus`: WebSocket connection indicator

**Interfaces**:
```typescript
interface PTTState {
  isPressed: boolean;
  isRecording: boolean;
  isTransmitting: boolean;
  isReceiving: boolean;
}

interface PTTCallbacks {
  onPressIn: () => void;
  onPressOut: () => void;
  onLongPress: () => void;
}
```

**Behavior**:
- Press and hold to record
- Visual feedback (color change, animation)
- Haptic feedback on press/release
- Disabled state when disconnected

#### 3. Audio Manager

**Purpose**: Handles all audio capture, playback, and effects

**Components**:
- `AudioRecorder`: Microphone capture
- `AudioPlayer`: Playback of dispatcher responses
- `RadioEffects`: Sound effects processor

**Interfaces**:
```typescript
interface AudioConfig {
  sampleRate: 24000; // OpenAI Realtime API requirement
  channels: 1; // Mono
  bitsPerSample: 16; // PCM16
  encoding: 'pcm16' | 'g711_ulaw';
}

interface AudioChunk {
  data: string; // base64 encoded
  timestamp: number;
  sequenceNumber: number;
}

interface RadioSounds {
  squelchStart: AudioBuffer;
  squelchEnd: AudioBuffer;
  beep: AudioBuffer;
  staticNoise: AudioBuffer;
}
```

**Key Methods**:
- `startRecording(): Promise<void>`
- `stopRecording(): Promise<AudioChunk[]>`
- `playAudio(audioData: string): Promise<void>`
- `playRadioEffect(effect: keyof RadioSounds): Promise<void>`
- `applyStaticFilter(audioData: string): string`

#### 4. WebSocket Manager

**Purpose**: Manages WebSocket connection and message handling

**Components**:
- `WebSocketClient`: Connection management
- `MessageHandler`: Protocol message parsing
- `ReconnectionManager`: Auto-reconnect logic

**Interfaces**:
```typescript
interface WebSocketConfig {
  url: string; // wss://backend/ws/officer-radio
  token: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

interface WebSocketMessage {
  type: 'audio' | 'transcript' | 'function_result' | 'error' | 'connection';
  payload: any;
  timestamp: number;
}

interface AudioStreamMessage {
  type: 'audio';
  payload: {
    audio: string; // base64 encoded
    format: 'pcm16' | 'g711_ulaw';
  };
}

interface TranscriptMessage {
  type: 'transcript';
  payload: {
    speaker: 'officer' | 'dispatcher';
    text: string;
    timestamp: number;
  };
}

interface FunctionResultMessage {
  type: 'function_result';
  payload: {
    function: 'person_search' | 'vehicle_search';
    result: PersonRecord | VehicleRecord | null;
    query: Record<string, any>;
  };
}
```

**Key Methods**:
- `connect(config: WebSocketConfig): Promise<void>`
- `disconnect(): void`
- `sendAudio(chunk: AudioChunk): void`
- `sendMessage(message: WebSocketMessage): void`
- `onMessage(handler: (message: WebSocketMessage) => void): void`

#### 5. Results Display Component

**Purpose**: Shows search results and conversation history

**Components**:
- `PersonCard`: Displays person record details
- `VehicleCard`: Displays vehicle record details
- `SearchHistory`: List of recent searches
- `TranscriptView`: Conversation transcript

**Interfaces**:
```typescript
interface PersonRecord {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  drivers_license?: string;
  warrants: Warrant[];
  priors: Prior[];
  address?: string;
  phone?: string;
}

interface VehicleRecord {
  id: string;
  plate_number: string;
  state: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  registered_owner?: string;
  flags: string[];
  registration_status?: string;
}

interface SearchHistoryItem {
  id: string;
  type: 'person' | 'vehicle';
  query: string;
  result: PersonRecord | VehicleRecord | null;
  timestamp: number;
}
```

### Backend Components

#### 1. Officer Radio WebSocket Handler

**Purpose**: New WebSocket endpoint for officer radio communications

**Location**: `backend/server.py`

**Endpoint**: `/ws/officer-radio`

**Responsibilities**:
- Authenticate WebSocket connection using JWT token
- Forward audio streams to OpenAI Realtime API
- Execute function calls for database searches
- Stream responses back to mobile app
- Maintain session state

**Implementation Pattern** (similar to existing `/ws/media` endpoint):
```python
@app.websocket("/ws/officer-radio")
async def websocket_officer_radio(websocket: WebSocket, token: str):
    """WebSocket endpoint for Officer Radio App"""
    # Authenticate
    officer = await authenticate_websocket(token)
    if not officer:
        await websocket.close(code=1008, reason="Authentication failed")
        return
    
    await websocket.accept()
    
    # Create dispatcher instance
    dispatcher = OfficerRadioDispatcher(
        officer_id=officer.id,
        db=db,
        websocket=websocket
    )
    
    # Run bidirectional streaming
    await dispatcher.run()
```

#### 2. Officer Radio Dispatcher

**Purpose**: Manages OpenAI Realtime API session for officer radio

**Location**: New file `backend/officer_radio_dispatcher.py`

**Responsibilities**:
- Connect to OpenAI Realtime API
- Configure session with function definitions
- Handle audio streaming (bidirectional)
- Process function calls
- Return structured results to mobile app

**Function Definitions**:
```python
OFFICER_RADIO_FUNCTIONS = [
    {
        "name": "search_person",
        "description": "Search for a person by name or driver's license",
        "parameters": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "drivers_license": {"type": "string"},
                "dob": {"type": "string"}
            }
        }
    },
    {
        "name": "search_vehicle",
        "description": "Search for a vehicle by license plate",
        "parameters": {
            "type": "object",
            "properties": {
                "plate_number": {"type": "string"},
                "state": {"type": "string"}
            },
            "required": ["plate_number"]
        }
    }
]
```

## Data Models

### Mobile App State Models

#### Application State
```typescript
interface AppState {
  auth: AuthState;
  radio: RadioState;
  results: ResultsState;
  connection: ConnectionState;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  officer: OfficerProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface RadioState {
  isPTTPressed: boolean;
  isRecording: boolean;
  isTransmitting: boolean;
  isReceiving: boolean;
  currentTranscript: string;
  dispatcherSpeaking: boolean;
}

interface ResultsState {
  currentResult: PersonRecord | VehicleRecord | null;
  searchHistory: SearchHistoryItem[];
  conversationHistory: TranscriptMessage[];
}

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastError: string | null;
}
```

### WebSocket Protocol Messages

#### Client to Server Messages

**Audio Stream**:
```json
{
  "type": "audio_stream",
  "audio": "base64_encoded_audio_data",
  "format": "pcm16",
  "timestamp": 1234567890
}
```

**Control Messages**:
```json
{
  "type": "start_transmission",
  "timestamp": 1234567890
}
```

```json
{
  "type": "end_transmission",
  "timestamp": 1234567890
}
```

#### Server to Client Messages

**Audio Response**:
```json
{
  "type": "audio_response",
  "audio": "base64_encoded_audio_data",
  "format": "pcm16",
  "timestamp": 1234567890
}
```

**Transcript Update**:
```json
{
  "type": "transcript",
  "speaker": "officer",
  "text": "Run a plate for California ABC123",
  "timestamp": 1234567890
}
```

**Function Result**:
```json
{
  "type": "function_result",
  "function": "vehicle_search",
  "query": {
    "plate_number": "ABC123",
    "state": "CA"
  },
  "result": {
    "id": "vehicle_123",
    "plate_number": "ABC123",
    "state": "CA",
    "make": "Toyota",
    "model": "Camry",
    "year": 2020,
    "registered_owner": "John Doe",
    "flags": ["None"]
  },
  "timestamp": 1234567890
}
```

**Error Message**:
```json
{
  "type": "error",
  "code": "SEARCH_FAILED",
  "message": "Database query failed",
  "timestamp": 1234567890
}
```

### Database Models

The app uses existing backend database models:
- `PersonRecord`: Person information with warrants and priors
- `VehicleRecord`: Vehicle registration and flags
- `User`: Officer authentication and profile

No new database models are required for the mobile app.


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Redundancy Analysis**:
- Properties 1.1 and 1.3 (PTT press/release) are inverses and can be combined into a single state transition property
- Properties 3.4 and 6.1 both test person record display - these are redundant
- Properties 4.3 and 6.2 both test vehicle record display - these are redundant
- Properties 2.1, 2.4, and 2.6 all test radio sound effects and can be combined into a comprehensive audio sequence property
- Properties 8.3, 8.4, and 8.5 all test WebSocket audio streaming and can be combined

**Consolidated Properties**:
The following properties represent the unique, non-redundant correctness requirements for the system.

### Property 1: PTT State Transitions

For any PTT button interaction, pressing the button should transition the app to recording state and start audio capture, and releasing the button should transition to idle state and stop audio capture.

**Validates: Requirements 1.1, 1.3**

### Property 2: Audio Streaming During PTT

For any duration that the PTT button is held down, audio chunks should be continuously captured and streamed to the WebSocket connection.

**Validates: Requirements 1.2**

### Property 3: Recording Visual Indicator

For any app state where audio is being captured, the UI should display the recording indicator.

**Validates: Requirements 1.4**

### Property 4: Radio Sound Effects Sequence

For any transmission cycle (press PTT, speak, receive response), the audio playback sequence should be: squelch sound on press, beep sound before dispatcher audio, dispatcher audio with static filter applied, squelch sound after dispatcher finishes.

**Validates: Requirements 2.1, 2.4, 2.5, 2.6**

### Property 5: AI Response Streaming

For any AI-generated response, the backend should stream the audio data back to the mobile app.

**Validates: Requirements 2.3**

### Property 6: WebSocket Bidirectional Communication

For any active WebSocket session, the connection should remain open and support both sending audio from the app and receiving audio/data from the server.

**Validates: Requirements 2.7, 8.3, 8.4, 8.5**

### Property 7: Connection Error Handling

For any WebSocket disconnection event, the app should display a connection error and initiate reconnection attempts.

**Validates: Requirements 2.8**

### Property 8: Person Search Function Invocation

For any officer voice request containing a person's name or driver's license number, the AI dispatcher should invoke the person search function with the extracted parameters.

**Validates: Requirements 3.1, 3.2**

### Property 9: Person Search Response Content

For any person search that returns a record, the AI response should include the person's name, date of birth, and active warrants.

**Validates: Requirements 3.3**

### Property 10: Person Record Display

For any person record received from the backend, the app should display all required fields: name, date of birth, driver's license, warrants, and priors.

**Validates: Requirements 3.4, 6.1**

### Property 11: Vehicle Search Function Invocation

For any officer voice request containing a license plate number, the AI dispatcher should invoke the vehicle search function with the plate number and state.

**Validates: Requirements 4.1**

### Property 12: Vehicle Search Response Content

For any vehicle search that returns a record, the AI response should include the vehicle year, make, model, registered owner, and flags.

**Validates: Requirements 4.2**

### Property 13: Vehicle Record Display

For any vehicle record received from the backend, the app should display all required fields: license plate, year, make, model, registered owner, registration status, and flags.

**Validates: Requirements 4.3, 6.2**

### Property 14: Authentication Token WebSocket Connection

For any successful authentication, the app should establish a WebSocket connection using the received session token.

**Validates: Requirements 5.3**

### Property 15: Token Secure Storage Round Trip

For any authentication token, storing it securely and then retrieving it should return the same token value.

**Validates: Requirements 5.5**

### Property 16: Search History Accumulation

For any search performed during a session, the search should be added to the history list with all details preserved.

**Validates: Requirements 6.3**

### Property 17: Multiple Results Display

For any search that returns multiple records, all records should be displayed in the results list.

**Validates: Requirements 6.4**

### Property 18: Search Result Timestamps

For any search result displayed, a timestamp should be present indicating when the search was performed.

**Validates: Requirements 6.5**

### Property 19: Function Call Execution

For any function call identified by the AI dispatcher, the backend should execute the corresponding database query with the extracted parameters.

**Validates: Requirements 7.2**

### Property 20: Function Result Return Flow

For any completed function call, the backend should return the results to the OpenAI Realtime API for response generation.

**Validates: Requirements 7.3**

### Property 21: Function Call Error Handling

For any function call that encounters an error, the backend should catch the error and return an appropriate error message to the AI dispatcher.

**Validates: Requirements 7.4**

### Property 22: Multiple Function Call Chaining

For any officer transmission containing multiple search requests, the AI dispatcher should execute multiple function calls in sequence.

**Validates: Requirements 7.5**

### Property 23: WebSocket Authentication Rejection

For any WebSocket connection attempt with an invalid or missing token, the backend should reject the connection.

**Validates: Requirements 8.2**

### Property 24: Database Query Error Response

For any database query that fails, the AI dispatcher should generate a verbal response informing the officer that the search could not be completed.

**Validates: Requirements 9.3**

### Property 25: Audio Playback Fallback

For any audio playback failure, the app should display the text transcript as a fallback.

**Validates: Requirements 9.4**

### Property 26: Error Logging

For any error that occurs in the app, an error log entry should be created with details about the error.

**Validates: Requirements 9.5**

### Property 27: Audio Permission Handling

For any app launch or audio operation, the app should check for microphone permissions and request them if not granted.

**Validates: Requirements 10.4**

## Error Handling

### Mobile App Error Handling

#### Network Errors

**Connection Failures**:
- Display user-friendly error message: "Unable to connect to dispatch. Check your network connection."
- Attempt automatic reconnection with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Show reconnection status in UI
- Queue audio transmissions during disconnection (up to 30 seconds)
- Flush queue when connection restored

**WebSocket Disconnections**:
- Detect disconnection via WebSocket close event or ping timeout
- Show connection status indicator (red/yellow/green)
- Attempt reconnection automatically
- Preserve session state during reconnection
- Re-authenticate with stored token

**Timeout Errors**:
- If no response received within 10 seconds, show timeout message
- Allow officer to retry transmission
- Log timeout events for diagnostics

#### Audio Errors

**Microphone Access Denied**:
- Show permission request dialog with explanation
- Provide link to app settings if permission permanently denied
- Disable PTT button until permission granted
- Show clear message: "Microphone access required for radio communication"

**Recording Failures**:
- Catch audio recording errors
- Display error: "Unable to record audio. Please try again."
- Log error details for troubleshooting
- Reset audio system and retry

**Playback Failures**:
- If audio playback fails, display text transcript as fallback
- Show message: "Audio unavailable. Displaying text response."
- Log playback error details
- Continue with text-only mode until playback restored

**Audio Format Errors**:
- Validate audio format before sending
- Convert to supported format if possible
- Show error if conversion fails
- Log format mismatch details

#### Authentication Errors

**Invalid Credentials**:
- Display clear error message: "Invalid username or password"
- Clear password field
- Allow retry
- Lock account after 5 failed attempts (backend enforced)

**Token Expiration**:
- Detect 401 responses from backend
- Attempt token refresh automatically
- If refresh fails, redirect to login screen
- Preserve app state for restoration after re-login

**Session Timeout**:
- Show warning 5 minutes before timeout
- Allow officer to extend session
- Auto-logout on timeout with clear message
- Redirect to login screen

#### Data Errors

**Invalid Search Results**:
- Validate received data structure
- Handle missing fields gracefully
- Display available information
- Show warning for incomplete data
- Log data validation errors

**Parsing Errors**:
- Catch JSON parsing errors
- Display generic error message
- Log raw data for debugging
- Request data resend if possible

### Backend Error Handling

#### OpenAI API Errors

**Connection Failures**:
- Retry connection with exponential backoff
- Log connection errors
- Return error to mobile app after 3 failed attempts
- Fallback to text-only mode if available

**Rate Limiting**:
- Implement request queuing
- Return "System busy" message to officer
- Log rate limit events
- Monitor and alert on repeated rate limits

**API Errors**:
- Catch and log all OpenAI API errors
- Return user-friendly error messages
- Implement circuit breaker pattern
- Alert on repeated failures

#### Database Errors

**Query Failures**:
- Catch database exceptions
- Log error details with query parameters
- Return error message to AI dispatcher
- Implement retry logic for transient errors

**Connection Pool Exhaustion**:
- Monitor connection pool usage
- Implement connection timeout
- Log pool exhaustion events
- Return temporary error to client

**Data Validation Errors**:
- Validate search parameters before query
- Return validation errors to AI
- Log invalid parameter attempts
- Sanitize inputs to prevent injection

#### WebSocket Errors

**Authentication Failures**:
- Validate token before accepting connection
- Close connection with appropriate code (1008)
- Log authentication failures
- Rate limit connection attempts

**Message Parsing Errors**:
- Validate message format
- Log malformed messages
- Send error response to client
- Continue processing other messages

**Stream Errors**:
- Handle audio stream interruptions
- Buffer audio data during transient errors
- Resync stream on recovery
- Log stream error details

### Error Recovery Strategies

#### Graceful Degradation

**Audio-Only Failure**:
- Fall back to text display
- Continue with visual-only mode
- Notify officer of degraded mode
- Attempt audio recovery in background

**Partial Feature Failure**:
- Disable failed features
- Continue with working features
- Show clear indication of unavailable features
- Log feature failures for monitoring

#### State Recovery

**Session Restoration**:
- Persist critical state to local storage
- Restore state after reconnection
- Resume interrupted operations
- Clear stale state after timeout

**Transaction Rollback**:
- Track in-flight operations
- Rollback incomplete operations on error
- Retry failed operations when possible
- Notify officer of operation status

#### Monitoring and Alerting

**Error Metrics**:
- Track error rates by type
- Monitor error trends
- Alert on error spikes
- Dashboard for error visibility

**Diagnostic Logging**:
- Log all errors with context
- Include stack traces
- Capture relevant state
- Implement log levels (ERROR, WARN, INFO, DEBUG)

## Testing Strategy

### Dual Testing Approach

The Officer Radio App requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Authentication flows (login success/failure)
- UI component rendering
- Audio effect playback
- WebSocket message handling
- Error display and recovery
- Platform-specific functionality

**Property-Based Tests**: Verify universal properties across all inputs
- PTT state transitions with random timing
- Audio streaming with various chunk sizes
- Search result display with random data
- WebSocket communication with random messages
- Error handling with random failure scenarios

Together, these approaches provide comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Testing Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: officer-radio-app, Property {number}: {property_text}`

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

describe('Feature: officer-radio-app, Property 1: PTT State Transitions', () => {
  it('should transition to recording on press and idle on release', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // initial state
        fc.nat(1000), // press duration
        (initialState, pressDuration) => {
          // Test implementation
          const app = createTestApp(initialState);
          app.pressPTT();
          expect(app.isRecording()).toBe(true);
          
          setTimeout(() => {
            app.releasePTT();
            expect(app.isRecording()).toBe(false);
          }, pressDuration);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Strategy

#### Mobile App Unit Tests

**Component Tests**:
- Test each React Native component in isolation
- Mock dependencies (WebSocket, audio modules)
- Verify rendering with different props
- Test user interactions (button presses, gestures)
- Snapshot testing for UI consistency

**State Management Tests**:
- Test state transitions
- Verify action creators
- Test reducers/context updates
- Mock async operations

**Audio Module Tests**:
- Test audio recording start/stop
- Test audio playback
- Test sound effect loading
- Test audio format conversion
- Mock native audio APIs

**WebSocket Tests**:
- Test connection establishment
- Test message sending/receiving
- Test reconnection logic
- Test error handling
- Mock WebSocket API

**Authentication Tests**:
- Test login flow
- Test token storage/retrieval
- Test token refresh
- Test logout
- Mock secure storage

#### Backend Unit Tests

**WebSocket Handler Tests**:
- Test connection acceptance
- Test authentication
- Test message routing
- Test disconnection handling
- Mock OpenAI API

**Dispatcher Tests**:
- Test OpenAI connection
- Test function call execution
- Test audio forwarding
- Test error handling
- Mock database queries

**Function Call Tests**:
- Test person search function
- Test vehicle search function
- Test parameter extraction
- Test result formatting
- Mock database

### Integration Testing

**End-to-End Flows**:
- Complete authentication flow
- Full search request cycle (voice → AI → database → response)
- Audio streaming round trip
- Error recovery scenarios
- Multi-search requests

**Platform Testing**:
- Test on iOS devices (iPhone 11+)
- Test on Android devices (API 26+)
- Test on different screen sizes
- Test with different network conditions
- Test with different audio hardware

### Performance Testing

**Audio Latency**:
- Measure time from PTT press to recording start (< 100ms)
- Measure time from audio send to response received (< 2s target)
- Measure audio playback latency (< 50ms)

**Network Performance**:
- Test with various network speeds (3G, 4G, 5G, WiFi)
- Test with high latency connections
- Test with packet loss
- Measure WebSocket message throughput

**Resource Usage**:
- Monitor memory usage during extended sessions
- Monitor battery consumption
- Monitor CPU usage during audio processing
- Test with background app scenarios

### Manual Testing Checklist

**Functional Testing**:
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] PTT button press and hold
- [ ] Audio recording and transmission
- [ ] Receive and play dispatcher audio
- [ ] Person search by name
- [ ] Person search by driver's license
- [ ] Vehicle search by plate
- [ ] Display search results
- [ ] View search history
- [ ] Logout

**Audio Testing**:
- [ ] Squelch sound on PTT press
- [ ] Beep sound before dispatcher
- [ ] Static effect on dispatcher voice
- [ ] Squelch sound after dispatcher
- [ ] Audio quality assessment
- [ ] Background noise handling

**Error Scenarios**:
- [ ] Network disconnection during transmission
- [ ] Backend unavailable
- [ ] Invalid search (no results)
- [ ] Microphone permission denied
- [ ] Token expiration
- [ ] Audio playback failure

**Platform-Specific**:
- [ ] iOS: Keychain storage
- [ ] iOS: Background audio
- [ ] iOS: Interruption handling (calls)
- [ ] Android: Keystore storage
- [ ] Android: Background audio
- [ ] Android: Interruption handling (calls)

### Test Data

**Mock Person Records**:
- Records with warrants
- Records with priors
- Records with no warrants/priors
- Records with missing fields
- Multiple records with same name

**Mock Vehicle Records**:
- Records with flags
- Records with no flags
- Records with missing owner
- Records with expired registration
- Multiple records with similar plates

**Mock Audio Data**:
- Various audio formats (PCM16, G.711)
- Different sample rates
- Different durations
- Silence
- Noise
- Speech samples

### Continuous Integration

**Automated Test Execution**:
- Run unit tests on every commit
- Run property tests on every PR
- Run integration tests nightly
- Run performance tests weekly

**Test Coverage Goals**:
- Unit test coverage: > 80%
- Property test coverage: All identified properties
- Integration test coverage: All critical paths
- Platform coverage: iOS and Android

**Quality Gates**:
- All tests must pass before merge
- No decrease in test coverage
- No new linting errors
- Performance benchmarks met
