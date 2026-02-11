# 🚀 Commands Cheatsheet

Quick reference for all commands you'll need.

## 📦 Installation Commands

### Install MongoDB
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Install Yarn
```bash
npm install -g yarn
```

### Install Frontend Dependencies
```bash
cd frontend
yarn install
```

## 🧪 Testing Commands

### Test All API Keys
```bash
source backend/venv/bin/activate
python3 backend/test_api_keys.py
```

### Test MongoDB Connection
```bash
mongosh --eval "db.version()"
```

### Check MongoDB Status
```bash
brew services list | grep mongodb
```

## 🏃 Running Locally

### Start Backend (Terminal 1)
```bash
source backend/venv/bin/activate
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Terminal 2)
```bash
cd frontend
yarn start
```

### Start MongoDB (if not running)
```bash
brew services start mongodb-community
```

## 👤 Create Admin User

```bash
mongosh
```

Then paste:
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

exit
```

## 🔧 Troubleshooting Commands

### Restart MongoDB
```bash
brew services restart mongodb-community
```

### Reinstall Python Dependencies
```bash
source backend/venv/bin/activate
pip install -r backend/requirements.txt --force-reinstall
```

### Reinstall Frontend Dependencies
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Check Backend Logs
```bash
# Backend will show logs in the terminal where it's running
# Look for errors in red
```

### Check MongoDB Logs
```bash
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

## 🚀 Deployment Commands

### Deploy to Railway
```bash
# Install CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init

# Set variables
railway variables set OPENAI_API_KEY=your-key
railway variables set ELEVENLABS_API_KEY=your-key
railway variables set TWILIO_ACCOUNT_SID=your-sid
railway variables set TWILIO_AUTH_TOKEN=your-token
railway variables set TWILIO_PHONE_NUMBER=your-number
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
railway up
```

### Deploy Frontend to Vercel
```bash
cd frontend
yarn build
npm install -g vercel
vercel
```

### Deploy to Heroku
```bash
# Install CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add MongoDB
heroku addons:create mongolab:sandbox

# Set variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set ELEVENLABS_API_KEY=your-key
heroku config:set TWILIO_ACCOUNT_SID=your-sid
heroku config:set TWILIO_AUTH_TOKEN=your-token
heroku config:set TWILIO_PHONE_NUMBER=your-number
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
git push heroku main
```

## 📝 Database Commands

### Connect to MongoDB
```bash
mongosh
```

### List Databases
```javascript
show dbs
```

### Use Database
```javascript
use test_database
```

### List Collections
```javascript
show collections
```

### View Users
```javascript
db.users.find().pretty()
```

### View Active Calls
```javascript
db.active_calls.find().pretty()
```

### Delete All Calls (for testing)
```javascript
db.active_calls.deleteMany({})
```

### Create Test Data
```javascript
// In your browser, login as admin
// Go to Admin Panel
// Click "Generate Sample Data"
```

## 🔑 Environment Variables

### View Current Variables
```bash
cat backend/.env
```

### Edit Variables
```bash
nano backend/.env
```

### Generate Secure JWT Secret
```bash
openssl rand -hex 32
```

## 🌐 Access URLs

### Local Development
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MongoDB: mongodb://localhost:27017

### API Endpoints
- Login: POST http://localhost:8000/api/auth/login
- Active Calls: GET http://localhost:8000/api/calls/active
- Create User: POST http://localhost:8000/api/admin/users
- Twilio Webhook: POST http://localhost:8000/api/webhooks/voice

## 🧹 Cleanup Commands

### Stop All Services
```bash
# Stop MongoDB
brew services stop mongodb-community

# Stop backend: Ctrl+C in terminal
# Stop frontend: Ctrl+C in terminal
```

### Remove Virtual Environment
```bash
rm -rf backend/venv
```

### Clean Frontend Build
```bash
cd frontend
rm -rf build node_modules
```

### Reset Database (CAUTION!)
```bash
mongosh
```
```javascript
use test_database
db.dropDatabase()
```

## 📊 Monitoring Commands

### Check API Usage

**OpenAI**:
```bash
# Visit: https://platform.openai.com/usage
```

**ElevenLabs**:
```bash
# Visit: https://elevenlabs.io/usage
# Or run: python3 backend/test_api_keys.py
```

**Twilio**:
```bash
# Visit: https://www.twilio.com/console
```

### Check System Resources
```bash
# CPU and Memory
top

# Disk space
df -h

# MongoDB status
brew services list | grep mongodb
```

## 🔐 Security Commands

### Change Admin Password
```bash
mongosh
```
```javascript
use test_database

// Generate new hash with Python first:
// python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('new_password'))"

db.users.updateOne(
  {username: "admin"},
  {$set: {password_hash: "new_hash_here"}}
)
```

### Rotate JWT Secret
```bash
# Generate new secret
openssl rand -hex 32

# Update backend/.env
nano backend/.env

# Restart backend
```

## 📱 Twilio Testing

### Test Call Flow
```bash
# Call your number
# +18704992134

# Watch backend logs for webhook activity
# Check Active Calls page in app
```

### Configure Webhook
```bash
# Go to: https://www.twilio.com/console/phone-numbers
# Click your number
# Set webhook to: https://your-domain.com/api/webhooks/voice
```

## 🎯 Quick Start (All-in-One)

```bash
# Start everything
brew services start mongodb-community
source backend/venv/bin/activate
cd backend && uvicorn server:app --reload &
cd ../frontend && yarn start
```

## 🛑 Quick Stop (All-in-One)

```bash
# Stop everything
pkill -f uvicorn
pkill -f "yarn start"
brew services stop mongodb-community
```

---

## 💡 Pro Tips

### Create Aliases (add to ~/.zshrc)
```bash
alias rms-start='cd ~/path/to/project && brew services start mongodb-community && source backend/venv/bin/activate'
alias rms-backend='cd ~/path/to/project/backend && uvicorn server:app --reload'
alias rms-frontend='cd ~/path/to/project/frontend && yarn start'
alias rms-test='cd ~/path/to/project && source backend/venv/bin/activate && python3 backend/test_api_keys.py'
```

### Use tmux for Multiple Terminals
```bash
# Install tmux
brew install tmux

# Start session
tmux new -s rms

# Split panes
Ctrl+b then "  (horizontal split)
Ctrl+b then %  (vertical split)

# Navigate panes
Ctrl+b then arrow keys

# Detach
Ctrl+b then d

# Reattach
tmux attach -t rms
```

---

**Most Used Commands:**
1. `source backend/venv/bin/activate` - Activate Python environment
2. `uvicorn server:app --reload` - Start backend
3. `yarn start` - Start frontend
4. `python3 backend/test_api_keys.py` - Test API keys
5. `mongosh` - Access database
