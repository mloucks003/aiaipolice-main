# Call Recordings Feature

## Overview

The 911 dispatcher system now automatically records all incoming calls using Twilio's built-in recording feature. Recordings are stored with call metadata and can be accessed through a web interface.

## Features

- ✅ Automatic recording of all 911 calls
- ✅ Recordings stored in MongoDB with call metadata
- ✅ Web interface to browse and play recordings
- ✅ Transcriptions displayed alongside audio
- ✅ Secure access with authentication
- ✅ Real-time updates (refreshes every 30 seconds)

## Accessing Recordings

### Web Interface

Visit: `https://your-heroku-domain.herokuapp.com/recordings`

For example: `https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/recordings`

### Login

Use your existing system credentials:
- Username: Your dispatcher/admin username
- Password: Your password

### Features

1. **Browse Recordings**: See all recorded calls in a grid layout
2. **Play Audio**: Click play on any recording to listen
3. **View Transcriptions**: Click "Show Transcription" to see the full conversation
4. **Call Details**: Each recording shows:
   - Date and time
   - Caller phone number
   - Incident type (Medical, Fire, Police, Traffic)
   - Location
   - Duration

## API Endpoints

### Get All Recordings

```bash
GET /api/calls/recordings
Authorization: Bearer <token>
```

Returns all calls that have recordings.

### Get Specific Recording

```bash
GET /api/calls/{call_id}/recording
Authorization: Bearer <token>
```

Returns recording details and URL for a specific call.

## How It Works

1. **Call Initiated**: When a 911 call comes in, Twilio starts recording
2. **Call Processed**: The OpenAI Realtime API handles the conversation
3. **Recording Completed**: When the call ends, Twilio sends the recording URL to our webhook
4. **Database Updated**: The recording URL is stored in MongoDB with the call record
5. **Access**: Users can view and play recordings through the web interface

## Recording Storage

- **Provider**: Twilio (recordings stored on Twilio's servers)
- **Format**: MP3 audio
- **Duration**: Up to 1 hour per call
- **Retention**: Follows Twilio's retention policy (typically 30 days by default)

## Database Schema

The `active_calls` collection now includes:

```javascript
{
  "call_sid": "CA...",
  "caller_phone": "+1234567890",
  "incident_type": "Medical",
  "location": "123 Main St",
  "transcription": "Full conversation text...",
  "recording_url": "https://api.twilio.com/...",
  "recording_duration": 180,  // seconds
  "recording_sid": "RE...",
  "created_at": "2026-02-11T...",
  "updated_at": "2026-02-11T..."
}
```

## Security

- ✅ Authentication required to access recordings
- ✅ Role-based access control (admin, dispatcher, officer)
- ✅ Recordings stored securely on Twilio's infrastructure
- ✅ HTTPS encryption for all API calls

## Future Enhancements

Potential improvements for the recording system:

1. **Download Recordings**: Add ability to download recordings as MP3 files
2. **Long-term Archival**: Move recordings to S3 or similar for permanent storage
3. **Search & Filter**: Add search by date, incident type, location, etc.
4. **Playback Speed**: Add controls for 1.5x, 2x playback speed
5. **Annotations**: Allow dispatchers to add notes to recordings
6. **Export**: Export recordings with transcriptions as PDF reports
7. **Retention Policy**: Implement automatic archival/deletion based on policy

## Troubleshooting

### Recording Not Available

If a recording shows "No recording available":
- The call may still be in progress
- The recording may not have been completed yet (wait a few minutes)
- There may have been an error during recording

### Can't Play Recording

If you can't play a recording:
- Check your internet connection
- Ensure your browser supports MP3 audio
- Try refreshing the page
- Check that the recording URL is valid

### Authentication Issues

If you can't log in:
- Verify your username and password
- Ensure your account is active
- Contact an administrator to reset your password

## Technical Details

### Recording Webhook

When a recording is completed, Twilio sends a POST request to:

```
POST /api/webhooks/recording-status
```

With parameters:
- `CallSid`: Unique call identifier
- `RecordingUrl`: URL to access the recording
- `RecordingDuration`: Length of recording in seconds
- `RecordingSid`: Unique recording identifier

### TwiML Configuration

The recording is initiated in the voice webhook with:

```xml
<Response>
  <Record 
    recordingStatusCallback="/api/webhooks/recording-status"
    recordingStatusCallbackMethod="POST"
    recordingStatusCallbackEvent="completed"
    maxLength="3600"
    transcribe="false"
  />
  <Connect>
    <Stream url="wss://your-domain/ws/media" />
  </Connect>
</Response>
```

## Support

For issues or questions about call recordings:
1. Check the Heroku logs: `heroku logs --tail`
2. Review the TODO.md file for known issues
3. Check the spec files in `.kiro/specs/openai-realtime-911-dispatcher/`

---

**Last Updated**: February 11, 2026  
**Version**: v44 (with call recording)
