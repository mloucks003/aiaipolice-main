# Law Enforcement Records Management System (RMS)

A comprehensive Law Enforcement Records Management System with AI-powered features, built with FastAPI, React, MongoDB, and advanced AI integrations.

> **Note**: This project has been converted from to a standalone application. See `MIGRATION_NOTES.md` for details.

## 🚀 Quick Start

```bash
# 1. Setup backend
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# 2. Start backend
uvicorn server:app --reload

# 3. Setup frontend (in new terminal)
cd frontend
yarn install
yarn start
```

📖 **For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md)**

## ✨ Features

### 🎯 Core Capabilities
- **User Management**: Role-based access control (Admin, Officer)
- **Active Call Management**: Real-time emergency call tracking
- **Citation System**: Automated fine calculation and person linking
- **Database Search**: Person and vehicle record lookup
- **Incident Reports**: Comprehensive report management
- **Officer MDT**: Mobile data terminal interface
- **Admin Panel**: User and system management

### 🤖 AI-Powered Features
- **Emergency Detection**: Intelligent triage of incoming calls
- **AI Dispatcher**: Natural conversation with callers
- **Report Generation**: AI-powered incident report writing
- **License Plate Analysis**: Automated vehicle assessment
- **Suspect Matching**: AI-based person identification
- **Predictive Analysis**: Crime trend and hotspot prediction

### 🎙️ Voice & Phone Integration
- **ElevenLabs Voice**: Ultra-realistic AI dispatcher voice
- **Twilio Integration**: Incoming call handling
- **Speech-to-Text**: Real-time transcription
- **Natural Conversation**: Context-aware responses

## 🛠️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MongoDB**: NoSQL database with Motor async driver
- **OpenAI**: GPT-4 for AI features
- **ElevenLabs**: Realistic voice generation
- **Twilio**: Phone call handling
- **JWT Authentication**: Secure token-based auth

### Frontend
- **React**: Modern UI library
- **Shadcn/UI**: Beautiful component library
- **TailwindCSS**: Utility-first styling
- **React Router**: Client-side routing

## 📋 Requirements

- Python 3.8+
- Node.js 14+
- MongoDB
- OpenAI API Key
- ElevenLabs API Key
- Twilio Account (for phone features)

## 🔑 API Keys Needed

1. **OpenAI** - https://platform.openai.com/api-keys
2. **ElevenLabs** - https://elevenlabs.io/
3. **Twilio** - https://www.twilio.com/console

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions on obtaining and configuring API keys.

## 📁 Project Structure

```
.
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── elevenlabs_helper.py   # Voice generation helper
│   ├── fine_codes.py          # Citation fine calculator
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── audio_cache/          # Generated audio files
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # React components
│   │   └── App.js           # Main app component
│   └── public/
└── docs/
    ├── SETUP_GUIDE.md        # Detailed setup instructions
    ├── MIGRATION_NOTES.md    # Emergent migration details
    ├── CHANGES_SUMMARY.md    # Summary of changes
    └── DEPLOYMENT_CHECKLIST.md # Pre-deployment checklist
```

## 🚦 Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd law-enforcement-rms

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
yarn install
```

### 2. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit .env and add your API keys
nano backend/.env
```

Required variables:
```env
OPENAI_API_KEY=sk-your-key
ELEVENLABS_API_KEY=your-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
MONGO_URL=mongodb://localhost:27017
DB_NAME=law_enforcement_rms
JWT_SECRET=your-secret-key
```

### 3. Start Services

```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend
cd frontend
yarn start
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Complete setup and configuration guide
- **[MIGRATION_NOTES.md](MIGRATION_NOTES.md)** - Details on Emergent to standalone migration
- **[CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)** - Summary of all changes made
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment verification checklist

## 💰 Cost Estimates

For moderate usage (~100 calls/month):
- OpenAI: ~$1-5/month
- ElevenLabs: ~$15-30/month
- Twilio: ~$13/month
- **Total: ~$30-50/month**

## 🔒 Security

- JWT-based authentication
- Bcrypt password hashing
- Role-based access control
- CORS protection
- Environment variable configuration
- MongoDB authentication support

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB is running
mongosh

# Verify environment variables
cat backend/.env

# Check Python dependencies
pip install -r backend/requirements.txt
```

### AI features not working
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account has available credits
- Review backend logs for API errors

### Voice generation failing
- Verify `ELEVENLABS_API_KEY` is set correctly
- Check ElevenLabs account has available characters
- Ensure `audio_cache` directory exists

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for more troubleshooting tips.

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

For issues or questions:
1. Check the documentation in the `docs/` folder
2. Review API documentation at http://localhost:8000/docs
3. Verify all environment variables are set correctly
4. Check that all API keys are valid and have sufficient quota

---

**Status**: ✅ Standalone - All Emergent dependencies removed
**Last Updated**: February 11, 2026
