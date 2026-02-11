# Audio Debugging Guide - OpenAI Realtime API

## Changes Made

### 1. Enhanced Logging
Added comprehensive logging to track audio flow:
- Log all OpenAI events received
- Log when audio chunks are sent to Twilio
- Log stream_sid capture from Twilio start event
- Log initial greeting trigger

### 2. Initial Greeting Trigger
- Moved initial greeting to trigger AFTER session.updated event
- This ensures the session is fully configured before AI speaks
- Should result in immediate "911, what's your emergency?" when call connects

### 3. Audio Data Field Handling
- Added fallback checks for audio data field names
- Tries: `delta`, `audio`, `response.audio`
- Logs warning if no audio data found with event details

### 4. Stream SID Logging
- Added detailed logging of Twilio start event
- Logs the complete start event data structure
- Helps verify stream_sid is captured correctly

## What to Look For in Logs

### Successful Flow Should Show:

```
1. WebSocket connection accepted
2. Received WebSocket message: connected
3. Received WebSocket message: start
4. Media stream started for call CAxxxx
5. Start event data: {...}
6. Connecting to OpenAI Realtime API for call CAxxxx
7. WebSocket connected for call CAxxxx
8. Session config sent for call CAxxxx
9. Call CAxxxx - OpenAI event: session.created
10. OpenAI session created for call CAxxxx
11. Call CAxxxx - OpenAI event: session.updated
12. OpenAI session updated for call CAxxxx
13. Initial greeting triggered for call CAxxxx
14. Call CAxxxx - OpenAI event: response.audio.delta
15. Call CAxxxx - Sending audio chunk to Twilio (length: XXX)
16. Call CAxxxx - OpenAI event: response.audio.delta
17. Call CAxxxx - Sending audio chunk to Twilio (length: XXX)
... (multiple audio chunks)
```

### If Audio Not Playing, Check For:

1. **Missing stream_sid**:
   - Look for: "No stream_sid available, cannot send audio"
   - Fix: Check Twilio start event structure

2. **No audio data in events**:
   - Look for: "No audio data in delta event"
   - Fix: Check OpenAI event structure (logged in warning)

3. **Wrong event type**:
   - Look for: "Unhandled event type: response.audio_transcript.delta"
   - Fix: Update event type name in code

4. **No audio events at all**:
   - Look for: Only see session.created/updated, no response.audio.delta
   - Fix: Initial greeting might not be triggering

5. **Session not ready**:
   - Look for: Initial greeting sent before session.updated
   - Fix: Already fixed - now waits for session.updated

## Testing Steps

1. **Deploy to Heroku**:
   ```bash
   git add backend/realtime_dispatcher.py
   git commit -m "Add audio debugging and fix initial greeting timing"
   git push heroku main
   ```

2. **Call the number**: +18704992134

3. **Watch logs in real-time**:
   ```bash
   heroku logs --tail --app law-enforcement-rms
   ```

4. **Look for the sequence above**

5. **If audio still not playing**:
   - Copy the full log output
   - Look for any warnings or errors
   - Check if response.audio.delta events are received
   - Check if audio chunks are being sent to Twilio
   - Verify stream_sid is captured

## Common Issues and Fixes

### Issue: No response.audio.delta events
**Cause**: Initial greeting not triggering or wrong format
**Fix**: Check response.create event format

### Issue: Audio events received but not sent to Twilio
**Cause**: stream_sid not captured or wrong format
**Fix**: Check Twilio start event structure in logs

### Issue: Audio sent but caller doesn't hear
**Cause**: Wrong audio format or Twilio media event structure
**Fix**: Verify g711_ulaw format and Twilio media event format

### Issue: Session never updates
**Cause**: Session config invalid
**Fix**: Check OpenAI API version and config format

## Next Steps if Still Not Working

1. Check if OpenAI is sending audio in a different event type
2. Verify Twilio Media Streams format for sending audio back
3. Test with a simple audio file to verify Twilio playback works
4. Check OpenAI Realtime API documentation for any format changes
5. Consider adding audio buffer/queue if timing is an issue
