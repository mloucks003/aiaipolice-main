# 🚀 Quick Start Guide

## Your API Keys Are Ready!

I've recovered your original API keys and created a `.env` file for you.

### ⚠️ Important: OpenAI Key Issue

Your original key was an **Emergent-specific key** that won't work with OpenAI directly:
- Original: `sk-emergent-66520CdE42bBc9d908`
- **You need to get a real OpenAI key**: https://platform.openai.com/api-keys

See `IMPORTANT_API_KEY_NOTE.md` for details.

### ✅ These Keys Should Work

- **ElevenLabs**: Already configured
- **Twilio**: Already configured
- **MongoDB**: Already configured

## Step-by-Step Setup

### 1. Test Your API Keys

```bash
cd backend
python3 test_api_keys.py
```

This will show you which keys are working and which need attention.

### 2. Get OpenAI Key (Required for AI Features)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key
5. Edit `backend/.env` and replace the `OPENAI_API_KEY` line:
   ```
   OPENAI_API_KEY=sk-proj-your-new-key-here
   ```

### 3. Install Dependencies

```bash
# Backend
cd backend
pip3 install -r requirements.txt

# Frontend (in new terminal)
cd frontend
yarn install
```

### 4. Start MongoDB

```bash
# In a new terminal
mongod
```

Or if you have MongoDB as a service:
```bash
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### 5. Start the Backend

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 6. Start the Frontend

```bash
# In a new terminal
cd frontend
yarn start
```

Browser should open automatically to http://localhost:3000

### 7. Create Admin User

You'll need to create an admin user in MongoDB:

```bash
mongosh
```

Then run:
```javascript
use test_database

db.users.insertOne({
  id: "admin-001",
  badge_number: "ADMIN001",
  username: "admin",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkG6.",
  full_name: "System Administrator",
  role: "admin",
  department: "Administration",
  rank: "Administrator",
  active: true,
  created_at: new Date().toISOString()
})
```

Default login:
- Username: `admin`
- Password: `admin123`

## What Works Right Now

### ✅ Without OpenAI Key
- User authentication
- Database operations
- Citation management
- Person/vehicle search
- Basic call handling
- ElevenLabs voice (if key valid)
- Twilio integration (if keys valid)

### ❌ Requires OpenAI Key
- AI emergency detection
- AI conversation with callers
- AI report generation
- License plate analysis
- Suspect matching
- Predictive crime analysis

## Troubleshooting

### "Module not found" errors
```bash
cd backend
pip3 install -r requirements.txt
```

### "MongoDB connection failed"
```bash
# Check if MongoDB is running
mongosh

# If not, start it
mongod
```

### "OpenAI API error"
- Get a real OpenAI key from https://platform.openai.com/api-keys
- Update `backend/.env` with the new key
- Restart the backend

### "ElevenLabs error"
- Check your key at https://elevenlabs.io/
- Verify you have available character quota
- Update `backend/.env` if needed

### "Twilio webhook not working"
- For local testing, use ngrok: `ngrok http 8000`
- Update Twilio webhook URL to your ngrok URL
- Format: `https://your-ngrok-url.ngrok.io/api/webhooks/voice`

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017

## Your Configuration

```
Database: test_database
Twilio Phone: +18704992134
Backend URL: http://localhost:8000
```

## Next Steps

1. ✅ Test your API keys: `python3 backend/test_api_keys.py`
2. ⚠️  Get OpenAI key: https://platform.openai.com/api-keys
3. ✅ Start services (MongoDB, Backend, Frontend)
4. ✅ Login with admin/admin123
5. ✅ Create test users in Admin Panel
6. ✅ Test features

## Need Help?

- **Setup Issues**: See `SETUP_GUIDE.md`
- **API Key Issues**: See `IMPORTANT_API_KEY_NOTE.md`
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md`
- **Migration Info**: See `MIGRATION_NOTES.md`

---

**Your keys are in**: `backend/.env`
**Test your setup**: `python3 backend/test_api_keys.py`
