# Implementation Plan: OpenAI Realtime API for 911 Dispatcher

## Overview

This implementation plan breaks down the OpenAI Realtime API integration into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The plan focuses on modifying two key files (`server.py` and `realtime_dispatcher.py`) while maintaining backward compatibility with the existing ElevenLabs fallback system.

## Tasks

- [ ] 1. Implement RealtimeDispatcher core class structure
  - Create the RealtimeDispatcher class with initialization, connection management, and cleanup methods
  - Implement `__init__`, `connect_to_openai`, and connection cleanup logic
  - Add proper error handling for connection failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.1_

- [ ] 1.1 Write property test for WebSocket connection establishment
  - **Property 1: WebSocket Connection Establishment**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [ ] 2. Implement session configuration
  - [ ] 2.1 Create `build_session_config` method that returns complete session configuration
    - Include all required fields: modalities, instructions, voice, audio formats, VAD settings
    - Set dispatcher instructions for professional 911 behavior
    - Configure temperature and max_tokens
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4_

  - [ ] 2.2 Write unit tests for session configuration
    - Test that all required fields are present
    - Test that values match specifications (voice="alloy", temperature=0.7, etc.)
    - _Requirements: 3.1-3.8, 4.1-4.4_

  - [ ] 2.3 Implement `send_session_config` method
    - Send session.update event to OpenAI after connection
    - Handle potential errors during configuration
    - _Requirements: 3.1_

- [ ] 2.4 Write property test for session configuration completeness
  - **Property 3: Session Configuration Completeness**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**

- [ ] 3. Implement bidirectional audio streaming
  - [ ] 3.1 Create `handle_twilio_audio` method
    - Receive audio from Twilio WebSocket
    - Parse media events and extract base64 audio payload
    - Forward audio to OpenAI using input_audio_buffer.append events
    - Handle start/stop events
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Create `handle_openai_responses` method
    - Listen for OpenAI WebSocket events
    - Handle response.audio.delta events
    - Forward audio to Twilio as media events
    - Process other event types (transcription, errors, etc.)
    - _Requirements: 2.3, 2.4_

  - [ ] 3.3 Write property test for bidirectional audio streaming
    - **Property 2: Bidirectional Audio Streaming**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [ ] 3.4 Implement `run` method to orchestrate concurrent streaming
    - Use asyncio.gather to run both audio handlers concurrently
    - Handle WebSocket disconnections gracefully
    - Ensure cleanup on errors
    - _Requirements: 1.6, 10.5, 10.6_

- [ ] 4. Checkpoint - Test audio streaming
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement transcription handling and logging
  - [ ] 5.1 Create `handle_transcription` method
    - Extract transcript from conversation.item.input_audio_transcription.completed events
    - Format transcript as "Caller: {text}" or "Dispatcher: {text}"
    - Append to conversation_history list
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ] 5.2 Create `update_call_record` method
    - Update MongoDB active_calls collection
    - Set transcription field with formatted conversation history
    - Update updated_at timestamp
    - Handle database errors gracefully
    - _Requirements: 5.2, 5.3, 5.6_

  - [ ] 5.3 Write property test for transcription persistence
    - **Property 4: Transcription Persistence**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ] 6. Implement incident information extraction
  - [ ] 6.1 Create `extract_incident_info` method
    - Detect location keywords (street, avenue, road, address, at)
    - Detect incident type keywords (fire, medical, police, accident, emergency)
    - Set has_location and has_incident_type flags
    - Update Call_Record with extracted information
    - Calculate priority level based on incident type
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 6.2 Write property test for incident information extraction
    - **Property 5: Incident Information Extraction**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 7. Implement dispatch logic
  - [ ] 7.1 Create `check_dispatch_conditions` method
    - Return true if question_count >= 3
    - Return true if has_location AND has_incident_type
    - _Requirements: 7.1, 7.2_

  - [ ] 7.2 Create `initiate_dispatch` method
    - Send response.create event with dispatch message
    - Update Call_Record status to "Active"
    - Generate dispatch_audio_url for officer notification
    - Format dispatch message in radio-style with incident_type, location, description
    - _Requirements: 7.3, 7.4, 7.5, 7.6_

  - [ ] 7.3 Write property test for dispatch trigger conditions
    - **Property 6: Dispatch Trigger Conditions**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ] 7.4 Integrate dispatch checking into `handle_openai_responses`
    - Check dispatch conditions after each response.done event
    - Increment question_count
    - Call initiate_dispatch when conditions met
    - _Requirements: 7.1, 7.2_

- [ ] 8. Checkpoint - Test dispatch logic
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement error handling and fallback system
  - [ ] 9.1 Add error handling to `connect_to_openai`
    - Catch connection failures
    - Log errors with call_sid
    - Raise exception to trigger fallback
    - _Requirements: 8.1, 8.5_

  - [ ] 9.2 Add error event handling to `handle_openai_responses`
    - Detect error events from OpenAI
    - Log error details with call_sid
    - Trigger fallback mechanism
    - _Requirements: 8.2, 8.5_

  - [ ] 9.3 Create `fallback_to_elevenlabs` method
    - Send redirect message to Twilio WebSocket
    - Close OpenAI WebSocket if open
    - Ensure Call_Record integrity
    - _Requirements: 8.3, 8.4, 8.6_

  - [ ] 9.4 Write property test for error handling and fallback
    - **Property 7: Error Handling and Fallback**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

- [ ] 10. Modify voice webhook endpoint in server.py
  - [ ] 10.1 Update `/api/webhooks/voice` endpoint
    - Create Call_Record with status "Processing"
    - Determine if Realtime API should be used (check OPENAI_API_KEY)
    - Return TwiML with `<Connect><Stream>` for Realtime API
    - Return existing ElevenLabs TwiML as fallback
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 10.2 Write property test for TwiML response format
    - **Property 8: TwiML Response Format**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 11. Create Media Streams WebSocket endpoint in server.py
  - [ ] 11.1 Implement `/ws/media` WebSocket endpoint
    - Accept WebSocket connection
    - Receive 'start' event and extract call_sid
    - Instantiate RealtimeDispatcher
    - Call dispatcher.run() with Twilio WebSocket
    - Handle WebSocketDisconnect exception
    - Ensure cleanup on errors
    - _Requirements: 1.1, 9.6_

  - [ ] 11.2 Write integration test for WebSocket endpoint
    - Test connection acceptance
    - Test call_sid extraction
    - Test dispatcher instantiation
    - _Requirements: 1.1, 9.6_

- [ ] 12. Checkpoint - Test end-to-end flow
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Verify database schema compatibility
  - [ ] 13.1 Write property test for database schema compatibility
    - **Property 10: Database Schema Compatibility**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.6**

  - [ ] 13.2 Test existing officer endpoints with Realtime API calls
    - Test `/api/calls/active` endpoint
    - Test `/api/calls/{call_id}/attach` endpoint
    - Test `/api/calls/{call_id}/on-scene` endpoint
    - Verify all endpoints work with new call records
    - _Requirements: 11.3, 11.6_

- [ ] 13.3 Write unit tests for backward compatibility
  - Test ElevenLabs fallback still works
  - Test dispatch audio generation
  - Test existing database queries
  - _Requirements: 11.4, 11.5_

- [ ] 14. Add logging and monitoring
  - [ ] 14.1 Add comprehensive logging throughout RealtimeDispatcher
    - Log WebSocket connection events
    - Log session initialization
    - Log transcription events
    - Log dispatch events
    - Log all errors with call_sid
    - _Requirements: 8.5_

  - [ ] 14.2 Add logging to voice webhook and WebSocket endpoint
    - Log incoming calls
    - Log Realtime API vs fallback decisions
    - Log WebSocket connections and disconnections
    - _Requirements: 8.5_

- [ ] 15. Final integration testing and validation
  - [ ] 15.1 Write end-to-end integration test
    - Simulate complete call flow
    - Verify audio streaming works
    - Verify transcription logging
    - Verify dispatch triggering
    - Verify database updates
    - _Requirements: All_

  - [ ] 15.2 Manual testing checklist
    - Test with real Twilio phone call
    - Verify audio quality and latency
    - Test interruption capability
    - Test fallback mechanism
    - Test concurrent calls
    - Verify officer dashboard displays calls correctly

- [ ] 16. Final checkpoint - Deployment readiness
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Tune VAD settings to prevent caller cutoff
  - Update VAD threshold to 0.9 for maximum noise tolerance
  - Update silence_duration_ms to 2500ms to allow 2.5 seconds for caller to speak
  - Update prefix_padding_ms to 800ms to capture full speech start
  - Test with real phone calls to verify settings prevent cutoff
  - Document final working settings in TODO.md
  - _Requirements: 4.2, 4.3, 4.4, 4.7_

## Notes

- All tasks are required for comprehensive implementation with full test coverage
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility with existing ElevenLabs system
- No database schema changes required
- No new environment variables required beyond existing OPENAI_API_KEY
- Fallback system ensures calls are never dropped due to API failures
