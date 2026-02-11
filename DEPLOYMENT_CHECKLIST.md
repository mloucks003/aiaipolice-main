# Deployment Checklist

Use this checklist to ensure your application is properly configured and ready to run.

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] MongoDB installed and running
- [ ] Python 3.8+ installed
- [ ] Node.js 14+ installed
- [ ] Git repository initialized (if needed)

### 2. API Keys Obtained
- [ ] OpenAI API key created
- [ ] ElevenLabs API key created
- [ ] Twilio account created
- [ ] Twilio phone number purchased
- [ ] Twilio Account SID and Auth Token copied

### 3. Backend Configuration
- [ ] Copied `backend/.env.example` to `backend/.env`
- [ ] Added `OPENAI_API_KEY` to `.env`
- [ ] Added `ELEVENLABS_API_KEY` to `.env`
- [ ] Added `TWILIO_ACCOUNT_SID` to `.env`
- [ ] Added `TWILIO_AUTH_TOKEN` to `.env`
- [ ] Added `TWILIO_PHONE_NUMBER` to `.env`
- [ ] Updated `MONGO_URL` if not using localhost
- [ ] Changed `JWT_SECRET` to a secure random value
- [ ] Updated `BACKEND_URL` for production (if deploying)
- [ ] Updated `CORS_ORIGINS` for production (if deploying)

### 4. Dependencies Installed
- [ ] Backend: `pip install -r backend/requirements.txt`
- [ ] Frontend: `cd frontend && yarn install`

### 5. Database Setup
- [ ] MongoDB is accessible
- [ ] Database name matches `DB_NAME` in `.env`
- [ ] Admin user created (see SETUP_GUIDE.md)

### 6. Testing Locally
- [ ] Backend starts without errors: `uvicorn server:app --reload`
- [ ] Frontend starts without errors: `yarn start`
- [ ] Can login with admin credentials
- [ ] Can create a test user
- [ ] Can view active calls page
- [ ] AI features respond (requires OpenAI key)

### 7. Twilio Webhook Configuration
- [ ] Twilio webhook URL configured
- [ ] Webhook points to: `https://your-domain.com/api/webhooks/voice`
- [ ] Webhook method set to POST
- [ ] Test call successfully triggers webhook

### 8. Production Deployment (if applicable)
- [ ] HTTPS enabled
- [ ] Environment variables set on server
- [ ] MongoDB secured with authentication
- [ ] Firewall rules configured
- [ ] CORS origins restricted to your domain
- [ ] API keys secured (not in git)
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

## 🔍 Verification Tests

### Backend Health Check
```bash
curl http://localhost:8000/api/calls/active
# Should return 401 (unauthorized) or empty array
```

### OpenAI Integration Test
```bash
# Login and get token, then:
curl -X POST http://localhost:8000/api/ai/generate-report \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"incident_type":"Test","date_time":"2024-01-01","location":"Test","details":"Test incident"}'
# Should return generated narrative
```

### ElevenLabs Test
```bash
# Check if audio files are being generated
ls -la backend/audio_cache/
# Should see .mp3 files after making a test call
```

### Twilio Test
```bash
# Call your Twilio number
# Should hear AI dispatcher greeting
# Check backend logs for webhook activity
```

## 🚨 Common Issues

### "OpenAI API key not found"
- Verify `OPENAI_API_KEY` is set in `.env`
- Restart backend after changing `.env`

### "ElevenLabs client not initialized"
- Verify `ELEVENLABS_API_KEY` is set in `.env`
- Check ElevenLabs account is active
- Restart backend after changing `.env`

### "Twilio webhook not receiving calls"
- Verify webhook URL is publicly accessible
- Check webhook URL in Twilio console
- Ensure URL uses HTTPS (required by Twilio)
- Check firewall allows incoming connections

### "MongoDB connection failed"
- Verify MongoDB is running: `mongosh`
- Check `MONGO_URL` in `.env`
- Ensure database name exists

### "CORS errors in browser"
- Add frontend URL to `CORS_ORIGINS` in `.env`
- Restart backend after changing `.env`

## 📊 Cost Monitoring

### Set up billing alerts for:
- [ ] OpenAI usage (set at $10/month)
- [ ] ElevenLabs usage (set at $30/month)
- [ ] Twilio usage (set at $20/month)

### Monitor usage:
- [ ] OpenAI dashboard: https://platform.openai.com/usage
- [ ] ElevenLabs dashboard: https://elevenlabs.io/usage
- [ ] Twilio console: https://www.twilio.com/console

## 🎉 Ready to Launch

Once all items are checked:
1. ✅ All environment variables configured
2. ✅ All dependencies installed
3. ✅ Database accessible
4. ✅ API keys valid and working
5. ✅ Local testing successful
6. ✅ Twilio webhooks configured
7. ✅ Production deployment complete (if applicable)

**Your Law Enforcement RMS is ready to use!**

---

For detailed setup instructions, see `SETUP_GUIDE.md`
For migration details, see `MIGRATION_NOTES.md`
For a summary of changes, see `CHANGES_SUMMARY.md`
