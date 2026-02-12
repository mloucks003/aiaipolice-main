# Requirements Document

## Introduction

This specification defines the requirements for implementing OpenAI's Realtime API (gpt-4o-realtime-preview) to enable true voice-to-voice conversation for the 911 emergency dispatcher system. The current system uses Twilio + ElevenLabs TTS + GPT-4o-mini with noticeable delays between caller speech and AI response. The Realtime API will provide instant, natural voice-to-voice interaction with support for interruptions and ultra-realistic voice quality, enabling the system to compete with major players like Prepared911.

## Glossary

- **Realtime_API**: OpenAI's gpt-4o-realtime-preview WebSocket API for bidirectional voice streaming
- **Media_Streams**: Twilio's WebSocket protocol for streaming audio to/from phone calls
- **VAD**: Voice Activity Detection - automatic detection of when someone starts/stops speaking
- **Dispatcher_System**: The AI-powered 911 emergency call handling system
- **ElevenLabs_Fallback**: The existing TTS system used when Realtime API is unavailable
- **Call_Record**: MongoDB document storing call metadata, transcription, and status
- **Audio_Format**: g711_ulaw - the audio codec used by both Twilio and OpenAI Realtime API
- **Session_Config**: OpenAI Realtime API configuration including instructions, voice, and VAD settings
- **Bidirectional_Streaming**: Simultaneous audio flow from caller to OpenAI and OpenAI to caller

## Requirements

### Requirement 1: WebSocket Infrastructure

**User Story:** As a system architect, I want WebSocket endpoints for Twilio Media Streams and OpenAI Realtime API, so that bidirectional audio streaming can occur between the caller and AI.

#### Acceptance Criteria

1. WHEN a 911 call is received, THE Dispatcher_System SHALL establish a WebSocket connection at /ws/media for Twilio Media Streams
2. WHEN the Media Streams WebSocket connects, THE Dispatcher_System SHALL establish a WebSocket connection to wss://api.openai.com/v1/realtime
3. WHEN establishing the OpenAI connection, THE Dispatcher_System SHALL include Authorization header with Bearer token
4. WHEN establishing the OpenAI connection, THE Dispatcher_System SHALL include OpenAI-Beta: realtime=v1 header
5. IF the OpenAI WebSocket connection fails, THEN THE Dispatcher_System SHALL fall back to the ElevenLabs_Fallback system
6. WHEN either WebSocket connection closes, THE Dispatcher_System SHALL gracefully close the other connection

### Requirement 2: Audio Streaming and Format Handling

**User Story:** As a system engineer, I want proper audio format handling between Twilio and OpenAI, so that voice data flows correctly in both directions without quality loss.

#### Acceptance Criteria

1. WHEN Twilio sends audio data, THE Dispatcher_System SHALL receive it in g711_ulaw format as base64-encoded payload
2. WHEN forwarding audio to OpenAI, THE Dispatcher_System SHALL send input_audio_buffer.append events with the base64 audio payload
3. WHEN OpenAI sends audio responses, THE Dispatcher_System SHALL receive response.audio.delta events with base64-encoded g711_ulaw audio
4. WHEN receiving audio from OpenAI, THE Dispatcher_System SHALL forward it to Twilio as media events with the audio payload
5. THE Dispatcher_System SHALL configure both input_audio_format and output_audio_format as g711_ulaw in the Session_Config
6. THE Dispatcher_System SHALL maintain audio streaming without buffering delays exceeding 100ms

### Requirement 3: Session Configuration and Dispatcher Instructions

**User Story:** As a 911 system administrator, I want the AI to behave like a professional emergency dispatcher, so that callers receive appropriate, efficient emergency response.

#### Acceptance Criteria

1. WHEN initializing the OpenAI session, THE Dispatcher_System SHALL send a session.update event with complete Session_Config
2. THE Session_Config SHALL include instructions defining professional 911 dispatcher behavior
3. THE Session_Config SHALL specify gathering location and incident type within 2-3 questions
4. THE Session_Config SHALL configure the voice parameter to "alloy" for professional female voice
5. THE Session_Config SHALL set modalities to ["text", "audio"] for voice and transcription
6. THE Session_Config SHALL enable input_audio_transcription with model "whisper-1"
7. THE Session_Config SHALL configure temperature to 0.7 for natural but consistent responses
8. THE Session_Config SHALL set max_response_output_tokens to 150 to keep responses concise

### Requirement 4: Voice Activity Detection and Turn-Taking

**User Story:** As a caller, I want natural conversation flow where I can speak without being cut off, and the AI can complete its responses without interruption from background noise.

#### Acceptance Criteria

1. THE Session_Config SHALL enable server_vad (server-side Voice Activity Detection)
2. THE VAD configuration SHALL set threshold to 0.5 for balanced sensitivity that detects intentional speech but ignores background noise
3. THE VAD configuration SHALL set prefix_padding_ms to 300 to capture speech start
4. THE VAD configuration SHALL set silence_duration_ms to 1200 to allow natural pauses without cutting off either party
5. WHEN the caller starts speaking, THE Dispatcher_System SHALL allow interruption of AI speech
6. WHEN VAD detects silence for the configured duration, THE Dispatcher_System SHALL trigger AI response generation
7. THE VAD settings SHALL balance between allowing complete responses and enabling natural interruptions

### Requirement 5: Transcription and Call Logging

**User Story:** As a 911 supervisor, I want complete transcriptions of all calls stored in the database, so that I can review call handling and maintain records.

#### Acceptance Criteria

1. WHEN OpenAI sends conversation.item.input_audio_transcription.completed events, THE Dispatcher_System SHALL extract the transcript text
2. WHEN a transcript is received, THE Dispatcher_System SHALL append it to the Call_Record transcription field
3. WHEN updating transcription, THE Dispatcher_System SHALL update the Call_Record updated_at timestamp
4. THE Dispatcher_System SHALL store transcriptions in the format "Caller: {text}" for caller speech
5. THE Dispatcher_System SHALL store transcriptions in the format "Dispatcher: {text}" for AI responses
6. WHEN the call ends, THE Call_Record SHALL contain the complete conversation history

### Requirement 6: Incident Information Extraction

**User Story:** As a dispatcher system, I want to extract location and incident type from the conversation, so that I can dispatch appropriate emergency services.

#### Acceptance Criteria

1. WHEN analyzing transcripts, THE Dispatcher_System SHALL detect location keywords (street, avenue, road, address, at)
2. WHEN analyzing transcripts, THE Dispatcher_System SHALL detect incident type keywords (fire, medical, police, accident, emergency)
3. WHEN location is detected, THE Dispatcher_System SHALL update the Call_Record location field
4. WHEN incident type is detected, THE Dispatcher_System SHALL update the Call_Record incident_type field
5. WHEN both location and incident_type are detected, THE Dispatcher_System SHALL set has_critical_info flag to true
6. THE Dispatcher_System SHALL extract priority level (1-5) based on incident severity

### Requirement 7: Dispatch Logic and Call Completion

**User Story:** As a 911 dispatcher, I want the AI to dispatch help after gathering critical information, so that emergency services are sent promptly.

#### Acceptance Criteria

1. WHEN 3 questions have been asked, THE Dispatcher_System SHALL initiate dispatch sequence
2. WHEN has_critical_info is true (location + incident type), THE Dispatcher_System SHALL initiate dispatch sequence
3. WHEN initiating dispatch, THE Dispatcher_System SHALL send a response.create event instructing AI to say "Okay, help is on the way. Stay on the line."
4. WHEN dispatch is initiated, THE Dispatcher_System SHALL update Call_Record status to "Active"
5. WHEN dispatch is initiated, THE Dispatcher_System SHALL generate a dispatch_audio_url for officer notification
6. THE dispatch message SHALL include incident_type, location, and description in radio-style format

### Requirement 8: Error Handling and Fallback System

**User Story:** As a system administrator, I want graceful error handling with fallback to ElevenLabs, so that 911 calls are never dropped due to API failures.

#### Acceptance Criteria

1. IF OpenAI WebSocket connection fails, THEN THE Dispatcher_System SHALL log the error and fall back to ElevenLabs_Fallback
2. IF OpenAI sends an error event, THEN THE Dispatcher_System SHALL log the error details
3. IF the OpenAI connection drops mid-call, THEN THE Dispatcher_System SHALL attempt to continue with ElevenLabs_Fallback
4. WHEN falling back to ElevenLabs, THE Dispatcher_System SHALL redirect the Twilio call to /api/webhooks/voice
5. THE Dispatcher_System SHALL log all WebSocket errors with call_sid for debugging
6. THE Dispatcher_System SHALL maintain Call_Record integrity even during fallback transitions

### Requirement 9: Twilio Webhook Integration

**User Story:** As a system integrator, I want the Twilio voice webhook to initiate Media Streams, so that calls are routed to the Realtime API instead of the old system.

#### Acceptance Criteria

1. WHEN a call is received at /api/webhooks/voice, THE Dispatcher_System SHALL create a Call_Record with status "Processing"
2. WHEN responding to the voice webhook, THE Dispatcher_System SHALL return TwiML with a Connect verb
3. THE Connect verb SHALL include a Stream element with url pointing to wss://{domain}/ws/media
4. THE Stream element SHALL have bidirectional="true" to enable two-way audio
5. IF Realtime API is unavailable, THEN THE Dispatcher_System SHALL return the existing ElevenLabs TwiML response
6. THE Dispatcher_System SHALL pass call_sid and caller_phone to the Media Streams WebSocket

### Requirement 10: Performance and Latency Requirements

**User Story:** As a caller, I want instant AI responses with no noticeable delay, so that the conversation feels natural and urgent information is communicated quickly.

#### Acceptance Criteria

1. THE Dispatcher_System SHALL maintain end-to-end latency below 500ms from caller speech end to AI response start
2. THE Dispatcher_System SHALL stream audio without buffering delays exceeding 100ms
3. THE Dispatcher_System SHALL process WebSocket messages asynchronously without blocking
4. THE Dispatcher_System SHALL handle concurrent calls without performance degradation
5. WHEN audio is received from OpenAI, THE Dispatcher_System SHALL forward it to Twilio immediately
6. THE Dispatcher_System SHALL use asyncio.gather for concurrent WebSocket handling

### Requirement 11: Database Schema Compatibility

**User Story:** As a database administrator, I want the Realtime API integration to use existing database schemas, so that no migration is required and existing features continue working.

#### Acceptance Criteria

1. THE Dispatcher_System SHALL store Call_Records in the active_calls collection with existing schema
2. THE Call_Record SHALL include fields: call_sid, caller_phone, incident_type, location, description, priority, status, transcription
3. THE Dispatcher_System SHALL maintain compatibility with existing officer attachment endpoints
4. THE Dispatcher_System SHALL maintain compatibility with existing dispatch audio generation
5. THE Dispatcher_System SHALL not modify existing ElevenLabs_Fallback code paths
6. THE Dispatcher_System SHALL support existing /api/calls/active endpoint for officer dashboard

### Requirement 12: Deployment and Environment Configuration

**User Story:** As a DevOps engineer, I want the Realtime API to work with existing Heroku deployment, so that no infrastructure changes are required.

#### Acceptance Criteria

1. THE Dispatcher_System SHALL use the existing OPENAI_API_KEY environment variable
2. THE Dispatcher_System SHALL work with existing Heroku WebSocket support
3. THE Dispatcher_System SHALL maintain compatibility with existing Twilio webhook configuration
4. THE Dispatcher_System SHALL not require additional environment variables beyond OPENAI_API_KEY
5. THE Dispatcher_System SHALL work with existing FastAPI and uvicorn configuration
6. THE Dispatcher_System SHALL support WebSocket connections through Heroku's routing layer
