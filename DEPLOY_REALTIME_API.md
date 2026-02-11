# Deploy OpenAI Realtime API to Heroku

## Quick Deployment Steps

### 1. Commit Changes
```bash
git add backend/server.py backend/realtime_dispatcher.py
git commit -m "Implement OpenAI Realtime API for voice-to-voice 911 dispatcher"
```

### 2. Push to Heroku
```bash
git push heroku main
```

### 3. Verify Deployment
```bash
heroku logs --tail --app law-enforcement-rms
```

### 4. Test the System
Call your Twilio number: **+18704992134**

## What to Expect

### Successful Deployment Logs
```
remote: -----> Building on the Heroku-22 stack
remote: -----> Using buildpack: heroku/python
remote: -----> Python app detected
remote: -----> Installing requirements with pip
remote: -----> Discovering process types
remote:        Procfile declares types -> web
remote: -----> Compressing...
remote: -----> Launching...
remote:        Released v16
remote:        https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/ deployed to Heroku
```

### Test Call Logs (Success)
```
WebSocket connection accepted
Received initial WebSocket message: start
WebSocket connection established for call CAxxxx
Connecting to OpenAI Realtime API for call CAxxxx
WebSocket connected for call CAxxxx
Session config sent for call CAxxxx
OpenAI session created for call CAxxxx
Media stream started for call CAxxxx, stream MZxxxx
Call CAxxxx - Caller said: There's a fire at 123 Main Street
Call CAxxxx - Location detected
Call CAxxxx - Incident type detected: Fire
Call CAxxxx - Question count: 1
Call CAxxxx - Caller said: Yes, I can see flames
Call CAxxxx - Question count: 2
Call CAxxxx - Initiating dispatch
Call CAxxxx - Dispatch completed: Fire at 123 Main Street
```

### Fallback to ElevenLabs (If Realtime API Fails)
```
Failed to initiate Realtime API for call CAxxxx: [error]
Using ElevenLabs fallback for call CAxxxx
ElevenLabs client initialized
Generating ElevenLabs audio for: 911, what's your emergency?
```

## Troubleshooting

### Issue: Calls ring once and disconnect
**Solution:**
1. Check OpenAI API credits: https://platform.openai.com/account/billing
2. Verify OPENAI_API_KEY is set: `heroku config:get OPENAI_API_KEY --app law-enforcement-rms`
3. Check logs for specific error: `heroku logs --tail --app law-enforcement-rms`

### Issue: WebSocket connection fails
**Solution:**
1. Verify Heroku dyno type supports WebSockets (Standard or Performance)
2. Check dyno status: `heroku ps --app law-enforcement-rms`
3. Restart dynos: `heroku restart --app law-enforcement-rms`

### Issue: Audio not streaming
**Solution:**
1. Check Twilio webhook configuration points to: `https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/webhooks/voice`
2. Verify webhook is using POST method
3. Check Twilio debugger: https://www.twilio.com/console/debugger

### Issue: No transcription in database
**Solution:**
1. Verify MongoDB connection: `heroku config:get MONGO_URL --app law-enforcement-rms`
2. Check database name: `heroku config:get DB_NAME --app law-enforcement-rms`
3. Test MongoDB connection from Heroku: `heroku run python -c "from motor.motor_asyncio import AsyncIOMotorClient; import os; print('Connected')" --app law-enforcement-rms`

## Rollback Plan

If issues occur, rollback to previous version:

```bash
# View recent releases
heroku releases --app law-enforcement-rms

# Rollback to previous release (e.g., v15)
heroku rollback v15 --app law-enforcement-rms
```

The system will automatically fall back to ElevenLabs if Realtime API is unavailable.

## Environment Variables

**Already configured (no changes needed):**
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key (fallback)
- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: +18704992134
- `MONGO_URL`: MongoDB Atlas connection string
- `DB_NAME`: law_enforcement_rms
- `BACKEND_URL`: https://law-enforcement-rms-b2749bfd89b0.herokuapp.com

## Testing Checklist

After deployment, test these scenarios:

- [ ] Call connects and AI responds immediately
- [ ] Caller can interrupt AI mid-sentence
- [ ] Location is detected from speech ("123 Main Street")
- [ ] Incident type is detected ("fire", "medical", "police")
- [ ] Dispatch triggers after 2-3 questions
- [ ] Transcription is saved to MongoDB
- [ ] Officer dashboard shows active call
- [ ] Fallback to ElevenLabs works (test by temporarily removing OPENAI_API_KEY)
- [ ] Multiple concurrent calls work
- [ ] Audio quality is clear and natural

## Performance Monitoring

Monitor these metrics:

```bash
# Watch logs in real-time
heroku logs --tail --app law-enforcement-rms

# Check dyno metrics
heroku ps --app law-enforcement-rms

# View recent errors
heroku logs --tail --app law-enforcement-rms | grep ERROR

# Check WebSocket connections
heroku logs --tail --app law-enforcement-rms | grep WebSocket
```

## Success Criteria

✅ Calls connect instantly
✅ AI responds in < 500ms
✅ Natural interruptions work
✅ Transcripts saved to database
✅ Dispatch triggers correctly
✅ Fallback system works
✅ No dropped calls

---

**Ready to deploy!** Run the commands above to push your changes to production.
