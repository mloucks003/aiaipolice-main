# Law Enforcement RMS - Setup Guide

## Quick Start

This is a standalone Law Enforcement Records Management System with AI-powered features. All Emergent dependencies have been removed and replaced with direct API integrations.

## Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB
- OpenAI API Key
- ElevenLabs API Key (for voice features)
- Twilio Account (for phone call features)

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

Required environment variables in `.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=law_enforcement_rms
JWT_SECRET=your-secret-key-change-in-production
OPENAI_API_KEY=sk-your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
BACKEND_URL=http://localhost:8000
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
yarn start
```

### 3. Start the Backend

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` as `OPENAI_API_KEY=sk-...`

### ElevenLabs API Key
1. Go to https://elevenlabs.io/
2. Sign up for an account
3. Navigate to Profile → API Keys
4. Create a new API key
5. Add to `.env` as `ELEVENLABS_API_KEY=...`

### Twilio Credentials
1. Go to https://www.twilio.com/console
2. Sign up for an account
3. Get your Account SID and Auth Token
4. Purchase a phone number
5. Add to `.env`:
   - `TWILIO_ACCOUNT_SID=...`
   - `TWILIO_AUTH_TOKEN=...`
   - `TWILIO_PHONE_NUMBER=+1...`

## First Time Setup

### Create Admin User

After starting the backend, you'll need to create an admin user. You can do this by:

1. Using the MongoDB shell:
```javascript
use law_enforcement_rms
db.users.insertOne({
  id: "admin-001",
  badge_number: "ADMIN001",
  username: "admin",
  password_hash: "$2b$12$...", // Use bcrypt to hash "admin123"
  full_name: "System Administrator",
  role: "admin",
  department: "Administration",
  rank: "Administrator",
  active: true,
  created_at: new Date().toISOString()
})
```

2. Or use Python to generate the hash:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
print(pwd_context.hash("admin123"))
```

### Generate Sample Data

Once logged in as admin, you can generate sample data:
- Go to Admin Panel
- Click "Generate Sample Data"

## Features

### Core Features
- User authentication with JWT
- Role-based access control (Admin, Officer)
- Active call management
- Citation creation with auto-fine calculation
- Person and vehicle database
- Incident report management

### AI Features (Requires OpenAI API Key)
- Emergency call detection and triage
- Intelligent conversation with callers
- AI-powered report generation
- License plate analysis
- Suspect matching
- Predictive crime analysis

### Voice Features (Requires ElevenLabs API Key)
- Ultra-realistic AI dispatcher voice
- Natural conversation flow
- Professional dispatcher tone

### Phone Features (Requires Twilio)
- Incoming call handling
- Speech-to-text transcription
- Real-time call processing
- Officer dispatch notifications

## Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod --version`
- Verify all environment variables are set in `.env`
- Check Python dependencies: `pip install -r requirements.txt`

### AI features not working
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota and billing
- Review backend logs for API errors

### Voice generation failing
- Verify `ELEVENLABS_API_KEY` is set correctly
- Check ElevenLabs account has available characters
- Ensure `audio_cache` directory exists and is writable

### Phone calls not working
- Verify all Twilio credentials are correct
- Check Twilio phone number is active
- Configure Twilio webhook URL to point to your backend
- Webhook URL format: `https://your-domain.com/api/webhooks/voice`

## Production Deployment

### Security Checklist
- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Use HTTPS for all connections
- [ ] Set proper CORS origins
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific `.env` files
- [ ] Never commit `.env` files to git
- [ ] Rotate API keys regularly
- [ ] Set up proper logging and monitoring

### Environment Variables for Production
```env
BACKEND_URL=https://your-production-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
JWT_SECRET=use-a-strong-random-secret-here
```

## Cost Estimates

### OpenAI API
- GPT-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Typical emergency call: ~$0.01-0.05
- Monthly estimate (100 calls): ~$1-5

### ElevenLabs
- ~$0.30 per 1,000 characters
- Typical dispatcher message: 100-200 characters
- Monthly estimate (100 calls, 5 messages each): ~$15-30

### Twilio
- Phone number: ~$1/month
- Incoming calls: ~$0.0085/minute
- Speech recognition: ~$0.02/minute
- Monthly estimate (100 calls, 5 min avg): ~$13

**Total estimated monthly cost: ~$30-50 for moderate usage**

## Support

For issues or questions:
1. Check the logs: `tail -f backend/logs/app.log`
2. Review API documentation: http://localhost:8000/docs
3. Check environment variables are set correctly
4. Verify all API keys are valid and have sufficient quota

## License

[Add your license information here]
