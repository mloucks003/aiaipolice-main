# Design Document: OpenAI Realtime API for 911 Dispatcher

## Overview

This design implements OpenAI's Realtime API (gpt-4o-realtime-preview) to enable true voice-to-voice conversation for the 911 emergency dispatcher system. The implementation replaces the current Twilio → Speech Recognition → GPT-4o-mini → ElevenLabs TTS pipeline with a direct bidirectional audio streaming architecture that achieves sub-500ms latency and supports natural interruptions.

The system maintains backward compatibility with the existing ElevenLabs fallback system and database schema while introducing WebSocket-based real-time audio streaming between Twilio Media Streams and OpenAI's Realtime API.

### Key Design Decisions

1. **WebSocket Architecture**: Use FastAPI WebSocket endpoint at `/ws/media` to receive Twilio Media Streams and establish a separate WebSocket connection to OpenAI Realtime API
2. **Audio Format**: Use g711_ulaw (μ-law) format natively supported by both Twilio and OpenAI, eliminating transcoding overhead
3. **Bidirectional Streaming**: Implement concurrent asyncio tasks for handling audio in both directions (caller → OpenAI and OpenAI → caller)
4. **Graceful Fallback**: Maintain existing ElevenLabs system as fallback when Realtime API is unavailable
5. **Session Configuration**: Configure OpenAI session with professional 911 dispatcher instructions, VAD settings, and voice parameters
6. **Minimal Changes**: Modify only `/api/webhooks/voice` endpoint and `realtime_dispatcher.py` to minimize risk

## Architecture

### High-Level Flow

```
Caller → Twilio Phone System → Twilio Media Streams (WebSocket)
                                        ↓
                                  /ws/media endpoint
                                        ↓
                              RealtimeDispatcher class
                                   ↙         ↘
                    OpenAI Realtime API    MongoDB
                    (WebSocket)            (Call logging)
                         ↓
                    AI Response Audio
                         ↓
                  Twilio Media Streams
                         ↓
                      Caller
```

### Component Interaction

1. **Twilio Voice Webhook** (`/api/webhooks/voice`):
   - Receives incoming 911 call
   - Creates Call_Record in MongoDB
   - Returns TwiML with `<Connect><Stream>` pointing to `/ws/media`

2. **Media Streams WebSocket** (`/ws/media`):
   - Accepts WebSocket connection from Twilio
   - Extracts call_sid from initial message
   - Instantiates RealtimeDispatcher
   - Manages WebSocket lifecycle

3. **RealtimeDispatcher Class**:
   - Connects to OpenAI Realtime API
   - Sends session configuration
   - Handles bidirectional audio streaming
   - Extracts transcriptions and updates database
   - Implements dispatch logic

4. **Fallback System**:
   - Catches WebSocket connection failures
   - Redirects to existing ElevenLabs system
   - Logs errors for monitoring

## Components and Interfaces

### 1. Modified Voice Webhook Endpoint

**File**: `backend/server.py`

**Function**: `handle_incoming_call()`

**Changes**:
- Add logic to attempt Realtime API first
- Return TwiML with `<Connect><Stream>` for Media Streams
- Fall back to existing ElevenLabs TwiML on error

**Interface**:
```python
@api_router.post("/webhooks/voice")
async def handle_incoming_call(
    request: Request,
    From: str = Form(...),
    CallSid: str = Form(...),
    To: str = Form(...)
) -> Response:
    """
    Returns: TwiML Response with either:
    - <Connect><Stream> for Realtime API
    - <Gather> for ElevenLabs fallback
    """
```

**TwiML Structure for Realtime API**:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="wss://{domain}/ws/media" />
    </Connect>
</Response>
```

### 2. Media Streams WebSocket Endpoint

**File**: `backend/server.py`

**Function**: `websocket_media_stream()`

**Purpose**: Accept Twilio Media Streams WebSocket connections

**Interface**:
```python
@app.websocket("/ws/media")
async def websocket_media_stream(websocket: WebSocket):
    """
    Handles Twilio Media Streams WebSocket connection
    
    Flow:
    1. Accept WebSocket connection
    2. Receive 'start' event with call_sid
    3. Create RealtimeDispatcher instance
    4. Run bidirectional audio streaming
    5. Handle disconnection and cleanup
    """
```

**Twilio Media Streams Events**:
- `start`: Contains call_sid, streamSid, and call metadata
- `media`: Contains base64-encoded audio payload
- `stop`: Indicates stream has ended

### 3. RealtimeDispatcher Class

**File**: `backend/realtime_dispatcher.py`

**Purpose**: Manage bidirectional audio streaming between Twilio and OpenAI

**Class Structure**:
```python
class RealtimeDispatcher:
    def __init__(self, call_sid: str, db):
        self.call_sid = call_sid
        self.db = db
        self.openai_ws = None
        self.stream_sid = None
        self.conversation_history = []
        self.question_count = 0
        self.has_location = False
        self.has_incident_type = False
        self.should_dispatch = False
        
    async def connect_to_openai(self) -> None:
        """Establish WebSocket connection to OpenAI Realtime API"""
        
    async def send_session_config(self) -> None:
        """Send session.update event with dispatcher instructions"""
        
    async def handle_twilio_audio(self, twilio_ws: WebSocket) -> None:
        """Forward audio from Twilio to OpenAI"""
        
    async def handle_openai_responses(self, twilio_ws: WebSocket) -> None:
        """Process OpenAI events and forward audio to Twilio"""
        
    async def extract_incident_info(self, transcript: str) -> None:
        """Extract location and incident type from transcripts"""
        
    async def check_dispatch_conditions(self) -> bool:
        """Determine if dispatch should be initiated"""
        
    async def initiate_dispatch(self) -> None:
        """Send dispatch message and update call status"""
        
    async def run(self, twilio_ws: WebSocket) -> None:
        """Main entry point - orchestrates bidirectional streaming"""
```

### 4. OpenAI Realtime API Integration

**WebSocket URL**: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`

**Headers**:
```python
{
    "Authorization": f"Bearer {OPENAI_API_KEY}",
    "OpenAI-Beta": "realtime=v1"
}
```

**Session Configuration Event**:
```python
{
    "type": "session.update",
    "session": {
        "modalities": ["text", "audio"],
        "instructions": """You are a professional 911 emergency dispatcher...""",
        "voice": "alloy",
        "input_audio_format": "g711_ulaw",
        "output_audio_format": "g711_ulaw",
        "input_audio_transcription": {
            "model": "whisper-1"
        },
        "turn_detection": {
            "type": "server_vad",
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 500
        },
        "temperature": 0.7,
        "max_response_output_tokens": 150
    }
}
```

**Key Events**:

*Client → OpenAI*:
- `session.update`: Configure session parameters
- `input_audio_buffer.append`: Send audio chunks
- `response.create`: Trigger AI response (for dispatch message)

*OpenAI → Client*:
- `session.created`: Confirms session initialization
- `response.audio.delta`: Streaming audio response chunks
- `response.audio.done`: Audio response complete
- `conversation.item.input_audio_transcription.completed`: Transcription of caller speech
- `response.done`: Response generation complete
- `error`: Error occurred

### 5. Audio Format Handling

**Twilio Media Streams Format**:
- Codec: g711_ulaw (μ-law)
- Sample Rate: 8kHz
- Encoding: base64
- Chunk Size: 20ms (160 bytes)

**OpenAI Realtime API Format**:
- Input: g711_ulaw
- Output: g711_ulaw
- Encoding: base64

**No Transcoding Required**: Both systems use g711_ulaw, eliminating conversion overhead and latency.

**Audio Flow**:
```
Twilio → base64 g711_ulaw → RealtimeDispatcher → base64 g711_ulaw → OpenAI
OpenAI → base64 g711_ulaw → RealtimeDispatcher → base64 g711_ulaw → Twilio
```

## Data Models

### Call Record Schema (Existing)

**Collection**: `active_calls`

**Fields**:
```python
{
    "id": str,                    # UUID
    "call_sid": str,              # Twilio call identifier
    "caller_phone": str,          # Caller's phone number
    "incident_type": str,         # Medical, Fire, Police, Traffic, Other
    "location": str,              # Address or location description
    "description": str,           # Incident details
    "priority": int,              # 1-5 (1=Critical, 5=Low)
    "status": str,                # Processing, Active, Dispatched, Closed
    "assigned_officer": str,      # Badge number (optional)
    "transcription": str,         # Full conversation transcript
    "dispatch_audio_url": str,    # URL for officer notification audio
    "created_at": str,            # ISO timestamp
    "updated_at": str             # ISO timestamp
}
```

**No Schema Changes Required**: Existing schema supports all Realtime API needs.

### Transcription Format

**Structure**:
```
Caller: [transcribed speech]
Dispatcher: [AI response text]
Caller: [transcribed speech]
...
```

**Storage**: Stored in `transcription` field as newline-separated conversation.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WebSocket Connection Establishment

*For any* incoming 911 call, when the voice webhook is triggered, the system should successfully establish a WebSocket connection to `/ws/media` and subsequently to OpenAI Realtime API, or fall back to ElevenLabs system.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Bidirectional Audio Streaming

*For any* audio chunk received from Twilio, the system should forward it to OpenAI without modification, and for any audio chunk received from OpenAI, the system should forward it to Twilio without modification.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Session Configuration Completeness

*For any* OpenAI Realtime API connection, the system should send a complete session.update event containing all required fields (modalities, instructions, voice, audio formats, VAD settings, temperature, max_tokens) before processing audio.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

### Property 4: Transcription Persistence

*For any* conversation.item.input_audio_transcription.completed event received from OpenAI, the system should append the transcript to the Call_Record and update the updated_at timestamp.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 5: Incident Information Extraction

*For any* transcript containing location keywords (street, avenue, road, address) or incident keywords (fire, medical, police, accident), the system should update the corresponding Call_Record fields (location, incident_type).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

### Property 6: Dispatch Trigger Conditions

*For any* call where either (question_count >= 3) OR (has_location AND has_incident_type), the system should initiate the dispatch sequence by sending a response.create event and updating Call_Record status to "Active".

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 7: Error Handling and Fallback

*For any* WebSocket connection failure or error event from OpenAI, the system should log the error and redirect the call to the ElevenLabs fallback system without dropping the call.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 8: TwiML Response Format

*For any* incoming call at `/api/webhooks/voice`, the system should return valid TwiML containing either a `<Connect><Stream>` element (for Realtime API) or a `<Gather>` element (for ElevenLabs fallback).

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 9: Audio Streaming Latency

*For any* audio chunk received from OpenAI (response.audio.delta event), the system should forward it to Twilio within 100ms to maintain overall end-to-end latency below 500ms.

**Validates: Requirements 10.1, 10.2, 10.3, 10.5**

### Property 10: Database Schema Compatibility

*For any* Call_Record created or updated by the Realtime API system, it should conform to the existing active_calls schema and be readable by existing officer dashboard endpoints.

**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6**

## Error Handling

### Error Categories

1. **Connection Errors**:
   - OpenAI WebSocket connection failure
   - Twilio WebSocket disconnection
   - Network timeouts

2. **Protocol Errors**:
   - Invalid event format from OpenAI
   - Missing required fields in events
   - Unexpected event types

3. **Audio Errors**:
   - Invalid base64 encoding
   - Audio format mismatch
   - Buffer overflow

4. **Database Errors**:
   - MongoDB connection failure
   - Update operation failure
   - Query timeout

### Error Handling Strategies

**1. OpenAI Connection Failure**:
```python
try:
    self.openai_ws = await websockets.connect(
        OPENAI_REALTIME_URL,
        extra_headers=headers
    )
except Exception as e:
    logger.error(f"Failed to connect to OpenAI: {e}")
    # Fall back to ElevenLabs
    await self.fallback_to_elevenlabs(twilio_ws)
    return
```

**2. Mid-Call Error Recovery**:
```python
async def handle_openai_responses(self, twilio_ws: WebSocket):
    try:
        async for message in self.openai_ws:
            # Process message
            pass
    except websockets.exceptions.ConnectionClosed:
        logger.error(f"OpenAI connection closed for call {self.call_sid}")
        # Attempt graceful transition to fallback
        await self.transition_to_fallback(twilio_ws)
    except Exception as e:
        logger.error(f"Error processing OpenAI response: {e}")
        # Continue processing if possible
```

**3. Audio Processing Errors**:
```python
try:
    audio_data = data['media']['payload']
    # Validate base64
    base64.b64decode(audio_data)
    # Forward to OpenAI
    await self.openai_ws.send(json.dumps({
        "type": "input_audio_buffer.append",
        "audio": audio_data
    }))
except (KeyError, ValueError) as e:
    logger.warning(f"Invalid audio data: {e}")
    # Skip this chunk, continue with next
```

**4. Database Errors**:
```python
try:
    await self.db.active_calls.update_one(
        {"call_sid": self.call_sid},
        {"$set": update_data}
    )
except Exception as e:
    logger.error(f"Database update failed: {e}")
    # Log but don't interrupt call
```

### Fallback Mechanism

**Trigger Conditions**:
- OpenAI WebSocket connection fails
- OpenAI returns error event
- Connection drops mid-call

**Fallback Process**:
1. Log error with call_sid and error details
2. Close OpenAI WebSocket if open
3. Send TwiML redirect to Twilio:
```python
redirect_message = {
    "event": "redirect",
    "redirect": {
        "url": f"https://{domain}/api/webhooks/voice"
    }
}
await twilio_ws.send_text(json.dumps(redirect_message))
```
4. Existing ElevenLabs system takes over

## Testing Strategy

### Unit Testing

**Test Files**:
- `tests/test_realtime_dispatcher.py`: Test RealtimeDispatcher class methods
- `tests/test_voice_webhook.py`: Test modified voice webhook endpoint
- `tests/test_audio_handling.py`: Test audio format conversion and validation

**Unit Test Examples**:

1. **Test Session Configuration**:
```python
def test_session_config_format():
    """Verify session config contains all required fields"""
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    config = dispatcher.build_session_config()
    
    assert config["type"] == "session.update"
    assert "modalities" in config["session"]
    assert config["session"]["voice"] == "alloy"
    assert config["session"]["input_audio_format"] == "g711_ulaw"
    assert config["session"]["output_audio_format"] == "g711_ulaw"
```

2. **Test Incident Extraction**:
```python
def test_extract_location():
    """Verify location extraction from transcripts"""
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    
    transcript = "There's a fire at 123 Main Street"
    dispatcher.extract_incident_info(transcript)
    
    assert dispatcher.has_location == True
    assert dispatcher.has_incident_type == True
```

3. **Test Dispatch Conditions**:
```python
def test_dispatch_after_three_questions():
    """Verify dispatch triggers after 3 questions"""
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    dispatcher.question_count = 3
    
    should_dispatch = dispatcher.check_dispatch_conditions()
    assert should_dispatch == True
```

### Property-Based Testing

**Library**: Use `hypothesis` for Python property-based testing

**Configuration**: Minimum 100 iterations per property test

**Property Test Examples**:

1. **Property Test: Audio Forwarding**:
```python
from hypothesis import given, strategies as st

@given(st.binary(min_size=160, max_size=160))
async def test_audio_forwarding_preserves_data(audio_chunk):
    """
    Feature: openai-realtime-911-dispatcher, Property 2: Bidirectional Audio Streaming
    
    For any audio chunk, forwarding through the system should preserve the data
    """
    # Encode as base64 (Twilio format)
    encoded = base64.b64encode(audio_chunk).decode('utf-8')
    
    # Simulate forwarding
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    forwarded = await dispatcher.forward_audio_to_openai(encoded)
    
    # Verify data preserved
    assert forwarded == encoded
```

2. **Property Test: Transcription Persistence**:
```python
@given(st.text(min_size=1, max_size=500))
async def test_transcription_always_persisted(transcript_text):
    """
    Feature: openai-realtime-911-dispatcher, Property 4: Transcription Persistence
    
    For any transcript received, it should be persisted to database
    """
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    
    await dispatcher.handle_transcription(transcript_text)
    
    # Verify database was updated
    call_record = await mock_db.active_calls.find_one({"call_sid": "test_call_sid"})
    assert transcript_text in call_record["transcription"]
```

3. **Property Test: Dispatch Trigger Logic**:
```python
@given(
    st.integers(min_value=0, max_value=5),
    st.booleans(),
    st.booleans()
)
def test_dispatch_trigger_conditions(question_count, has_location, has_incident):
    """
    Feature: openai-realtime-911-dispatcher, Property 6: Dispatch Trigger Conditions
    
    For any combination of question_count and info flags, dispatch should trigger
    when conditions are met
    """
    dispatcher = RealtimeDispatcher("test_call_sid", mock_db)
    dispatcher.question_count = question_count
    dispatcher.has_location = has_location
    dispatcher.has_incident_type = has_incident
    
    should_dispatch = dispatcher.check_dispatch_conditions()
    
    expected = (question_count >= 3) or (has_location and has_incident)
    assert should_dispatch == expected
```

### Integration Testing

**Test Scenarios**:

1. **End-to-End Call Flow**:
   - Simulate incoming call
   - Verify WebSocket connections established
   - Send mock audio chunks
   - Verify responses forwarded
   - Verify database updates
   - Verify dispatch triggered

2. **Fallback Scenario**:
   - Simulate OpenAI connection failure
   - Verify fallback to ElevenLabs
   - Verify call continues without interruption

3. **Concurrent Calls**:
   - Simulate multiple simultaneous calls
   - Verify no cross-talk between calls
   - Verify all calls handled correctly

### Manual Testing Checklist

- [ ] Call connects and AI responds immediately
- [ ] Caller can interrupt AI mid-sentence
- [ ] Location and incident type extracted correctly
- [ ] Dispatch triggered after 2-3 questions
- [ ] Transcription logged to database
- [ ] Officer dashboard shows call correctly
- [ ] Fallback works when OpenAI unavailable
- [ ] Audio quality is clear and natural
- [ ] Latency is under 500ms
- [ ] Multiple concurrent calls work

## Deployment Considerations

### Environment Variables

**Required**:
- `OPENAI_API_KEY`: OpenAI API key (already configured)

**No New Variables**: System uses existing environment configuration.

### Heroku Configuration

**WebSocket Support**: Heroku supports WebSockets natively, no configuration changes needed.

**Timeout Settings**: Heroku has 55-second timeout for HTTP requests, but WebSocket connections can remain open indefinitely.

**Dyno Type**: Ensure using Standard or Performance dynos for WebSocket support (Hobby dynos support WebSockets but with limitations).

### Twilio Configuration

**Webhook URL**: Update Twilio phone number webhook to point to:
```
https://{your-heroku-domain}/api/webhooks/voice
```

**HTTP Method**: POST

**No Additional Configuration**: Media Streams initiated via TwiML, no Twilio dashboard changes needed.

### Monitoring and Logging

**Key Metrics to Monitor**:
- WebSocket connection success rate
- Average call latency
- Fallback trigger frequency
- Transcription accuracy
- Dispatch timing

**Logging Strategy**:
```python
logger.info(f"Call {call_sid}: WebSocket connected")
logger.info(f"Call {call_sid}: OpenAI session established")
logger.info(f"Call {call_sid}: Transcript received: {transcript}")
logger.info(f"Call {call_sid}: Dispatch initiated")
logger.error(f"Call {call_sid}: OpenAI connection failed: {error}")
```

### Rollback Plan

**If Issues Occur**:
1. Revert `/api/webhooks/voice` to return ElevenLabs TwiML
2. Remove `/ws/media` endpoint
3. System falls back to existing working implementation
4. No data loss or schema changes to revert

### Performance Optimization

**Asyncio Best Practices**:
- Use `asyncio.gather()` for concurrent tasks
- Avoid blocking operations in async functions
- Use connection pooling for database

**Audio Buffering**:
- Minimize buffering to reduce latency
- Stream audio chunks immediately upon receipt
- Use appropriate chunk sizes (20ms)

**Database Optimization**:
- Use indexed queries on call_sid
- Batch updates where possible
- Use async MongoDB driver (motor)

## Implementation Notes

### Critical Implementation Details

1. **WebSocket Message Format**:
   - Twilio sends JSON with `event` field
   - OpenAI sends JSON with `type` field
   - Must handle both formats correctly

2. **Audio Encoding**:
   - Both systems use base64-encoded g711_ulaw
   - No decoding/encoding needed
   - Simply forward base64 strings

3. **Concurrent Task Management**:
   - Use `asyncio.gather()` to run both audio handlers
   - Handle cancellation gracefully
   - Ensure cleanup on error

4. **Session Initialization**:
   - Must send session.update before audio
   - Wait for session.created confirmation
   - Then start audio streaming

5. **Dispatch Timing**:
   - Check conditions after each response.done event
   - Don't dispatch too early (need critical info)
   - Don't wait too long (3 questions max)

### Code Organization

**Modified Files**:
- `backend/server.py`: Add `/ws/media` endpoint, modify `/api/webhooks/voice`
- `backend/realtime_dispatcher.py`: Complete rewrite of RealtimeDispatcher class

**New Files**:
- None (use existing files)

**Unchanged Files**:
- `backend/elevenlabs_helper.py`: Fallback system remains unchanged
- `backend/fine_codes.py`: Unrelated to voice system
- All frontend files: No frontend changes needed

### Dependencies

**Existing Dependencies** (already in requirements.txt):
- `fastapi`: Web framework
- `websockets`: WebSocket client library
- `motor`: Async MongoDB driver
- `python-dotenv`: Environment variables

**No New Dependencies Required**: All necessary libraries already installed.

## References

Research findings informed this design:

1. **OpenAI Realtime API Documentation** ([GitHub](https://raw.githubusercontent.com/openai/openai-node/master/realtime.md)): The Realtime API uses WebSocket connections with client-sent and server-sent events for bidirectional communication. Content was rephrased for compliance with licensing restrictions.

2. **Twilio Media Streams Integration** ([OpenAI Community](https://community.openai.com/t/voice-agent-using-realtime-api/1193682)): Integration pattern uses FastAPI WebSocket endpoints to receive Twilio audio streams and forward to OpenAI Realtime API. Content was rephrased for compliance with licensing restrictions.

3. **Audio Format Handling** ([Scour.ing](https://scour.ing/@nmarshall/p/https:/dev.to/ryancwynar/building-sub-200ms-voice-ai-with-openai-realtime-api-21cd)): Twilio sends audio as base64-encoded μ-law at 8kHz, which matches OpenAI's g711_ulaw format. Content was rephrased for compliance with licensing restrictions.

4. **Bidirectional Streaming Architecture** ([Medium](https://medium.com/@alozie_igbokwe/building-an-ai-caller-with-openai-realtime-api-part-4-voip-to-openai-communication-explained-a2fad4e8245a)): Twilio streams audio to OpenAI via WebSockets, OpenAI processes and returns audio over the same connection, enabling seamless conversation. Content was rephrased for compliance with licensing restrictions.
