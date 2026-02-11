# 🎯 Step-by-Step Setup & Deployment Guide

Based on your system scan, here's exactly what you need to do.

## ✅ What's Already Working

- ✅ Python virtual environment created
- ✅ Python dependencies installed
- ✅ `.env` file exists with your keys
- ✅ **ElevenLabs API**: Connected! (1,726 / 90,000 characters used)
- ✅ Node.js v25.5.0 installed

## ⚠️ What Needs Attention

- ❌ **OpenAI API Key**: Need to replace Emergent key
- ❌ **Twilio**: Authentication failed (may need to check credentials)
- ❌ **MongoDB**: Not installed
- ⚠️ **Yarn**: Not installed (needed for frontend)

---

## PHASE 1: Fix Local Setup (15 minutes)

### Step 1: Install MongoDB

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.version()"
```

### Step 2: Install Yarn

```bash
npm install -g yarn

# Verify installation
yarn --version
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend
yarn install
cd ..
```

### Step 4: Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Name it "Law Enforcement RMS"
5. Copy the key (starts with `sk-proj-` or `sk-`)

### Step 5: Update Your .env File

Open `backend/.env` and replace this line:
```env
OPENAI_API_KEY=sk-emergent-66520CdE42bBc9d908
```

With your new key:
```env
OPENAI_API_KEY=sk-proj-YOUR-NEW-KEY-HERE
```

### Step 6: Verify Twilio Credentials

Your Twilio authentication failed. Let's check:

1. Go to https://www.twilio.com/console
2. Verify your Account SID: `YOUR_TWILIO_SID_HERE`
3. Verify your Auth Token: `13e38b9b1fb586bc3e841bdc5796407c`
4. If they're different, update `backend/.env`

### Step 7: Test Everything Again

```bash
source backend/venv/bin/activate
python3 backend/test_api_keys.py
```

You should see all ✅ now!

---

## PHASE 2: Start Locally (5 minutes)

### Terminal 1: Start Backend

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Go to backend directory
cd backend

# Start the server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Start Frontend

```bash
cd frontend
yarn start
```

Browser should open to http://localhost:3000

### Step 8: Create Admin User

Open a new terminal:

```bash
mongosh
```

Then paste this:

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

### Step 9: Login and Test

1. Go to http://localhost:3000
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. You should see the dashboard!

### Step 10: Test Features

1. **Admin Panel**: Create a test officer user
2. **Active Calls**: Should show empty list
3. **AI Tools**: Try "Generate Report" (tests OpenAI)
4. **Database Search**: Try searching for a person

---

## PHASE 3: Deploy to Production

Now that it works locally, let's deploy! Where do you want to deploy?

### Option A: Deploy to Railway (Easiest)

Railway is perfect for this app - it handles everything automatically.

#### Step 1: Sign up for Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

#### Step 2: Deploy Backend

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY_HERE
railway variables set TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID_HERE
railway variables set TWILIO_AUTH_TOKEN=13e38b9b1fb586bc3e841bdc5796407c
railway variables set TWILIO_PHONE_NUMBER=+18704992134
railway variables set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
railway up
```

#### Step 3: Add MongoDB

In Railway dashboard:
1. Click "New" → "Database" → "MongoDB"
2. Copy the connection string
3. Add it: `railway variables set MONGO_URL=your-mongo-url`

#### Step 4: Deploy Frontend

```bash
cd frontend

# Build for production
yarn build

# Deploy to Vercel (free)
npm install -g vercel
vercel
```

### Option B: Deploy to Heroku

```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create your-app-name

# Add MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set OPENAI_API_KEY=your-key
heroku config:set ELEVENLABS_API_KEY=YOUR_ELEVENLABS_KEY_HERE
heroku config:set TWILIO_ACCOUNT_SID=YOUR_TWILIO_SID_HERE
heroku config:set TWILIO_AUTH_TOKEN=13e38b9b1fb586bc3e841bdc5796407c
heroku config:set TWILIO_PHONE_NUMBER=+18704992134
heroku config:set JWT_SECRET=$(openssl rand -hex 32)

# Deploy
git push heroku main
```

### Option C: Deploy to Your Own Server (VPS)

If you have a VPS (DigitalOcean, AWS, etc.):

```bash
# SSH into your server
ssh user@your-server-ip

# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv nginx mongodb nodejs npm

# Clone your repo
git clone your-repo-url
cd your-app

# Setup backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup frontend
cd ../frontend
npm install -g yarn
yarn install
yarn build

# Setup Nginx reverse proxy
sudo nano /etc/nginx/sites-available/rms
```

---

## PHASE 4: Configure Twilio Webhooks

Once deployed, configure Twilio to use your app:

1. Go to https://www.twilio.com/console/phone-numbers
2. Click your phone number: `+18704992134`
3. Under "Voice & Fax":
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://your-domain.com/api/webhooks/voice`
   - **HTTP**: POST
4. Click "Save"

### Test the Phone System

1. Call your Twilio number: `+18704992134`
2. You should hear the AI dispatcher!
3. Check your app's Active Calls page
4. The call should appear there

---

## 📊 Current Status

Based on the test results:

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Python Environment | ✅ Ready | None |
| Python Dependencies | ✅ Installed | None |
| ElevenLabs API | ✅ Working | None - 88,274 characters remaining |
| OpenAI API | ❌ Failed | Get new key |
| Twilio API | ❌ Failed | Verify credentials |
| MongoDB | ❌ Not running | Install & start |
| Node.js | ✅ Installed | None |
| Yarn | ❌ Not installed | Install |
| Frontend Dependencies | ⏭️ Skipped | Install after Yarn |

---

## 🎯 Your Immediate Next Steps

### Right Now (5 minutes):

1. **Install MongoDB**:
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```

2. **Install Yarn**:
   ```bash
   npm install -g yarn
   ```

3. **Install Frontend**:
   ```bash
   cd frontend && yarn install
   ```

### Then (10 minutes):

4. **Get OpenAI Key**: https://platform.openai.com/api-keys

5. **Update .env**: Replace `OPENAI_API_KEY` line

6. **Verify Twilio**: Check credentials at https://www.twilio.com/console

7. **Test Again**:
   ```bash
   source backend/venv/bin/activate
   python3 backend/test_api_keys.py
   ```

### Finally (5 minutes):

8. **Start Everything**:
   ```bash
   # Terminal 1
   source backend/venv/bin/activate
   cd backend
   uvicorn server:app --reload
   
   # Terminal 2
   cd frontend
   yarn start
   ```

9. **Create Admin User** (see Step 8 above)

10. **Login**: http://localhost:3000 (admin/admin123)

---

## 🆘 Quick Troubleshooting

### MongoDB won't start
```bash
brew services restart mongodb-community
brew services list
```

### Backend won't start
```bash
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules
yarn install
```

### OpenAI errors
- Get new key from https://platform.openai.com/api-keys
- Update `backend/.env`
- Restart backend

---

## 💰 Cost Tracking

Your current usage:
- **ElevenLabs**: 1,726 / 90,000 characters used (1.9%)
- **Twilio**: Check at https://www.twilio.com/console
- **OpenAI**: Check at https://platform.openai.com/usage (once you get a key)

---

## ✅ Success Checklist

- [ ] MongoDB installed and running
- [ ] Yarn installed
- [ ] Frontend dependencies installed
- [ ] OpenAI API key obtained and added to .env
- [ ] Twilio credentials verified
- [ ] All API tests passing (python3 backend/test_api_keys.py)
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Admin user created
- [ ] Can login to application
- [ ] AI features working
- [ ] Ready to deploy!

---

**You're at**: Phase 1, Step 1 (Install MongoDB)
**Next**: Follow the steps above in order
**Time to complete**: ~30 minutes total
