# 🚀 Deploy to Production RIGHT NOW

Let's get your app live so you can make phone calls!

## Prerequisites Checklist

Before we start, make sure you have:
- [ ] Twilio Account SID (starts with "AC")
- [ ] Twilio Auth Token
- [ ] Your OpenAI key (already have: sk-proj-XpbGZF...)
- [ ] Your ElevenLabs key (already have: sk_3f28...)
- [ ] GitHub account
- [ ] Credit card (for Railway - free tier available)

---

## OPTION 1: Railway (Recommended - Easiest)

Railway is perfect for this app. Free tier includes everything you need.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser. Sign up with GitHub.

### Step 3: Create New Project

```bash
railway init
```

Choose:
- "Create a new project"
- Name it: "law-enforcement-rms"

### Step 4: Add MongoDB Database

In your browser, go to your Railway project:
1. Click "New" → "Database" → "Add MongoDB"
2. Wait for it to provision (30 seconds)
3. Click on MongoDB → "Variables" → Copy the `MONGO_URL`

### Step 5: Set Environment Variables

```bash
# Set all your environment variables
railway variables set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

railway variables set ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY_HERE"

railway variables set TWILIO_PHONE_NUMBER="+18704992134"

# You need to provide these:
railway variables set TWILIO_ACCOUNT_SID="YOUR_ACCOUNT_SID_HERE"
railway variables set TWILIO_AUTH_TOKEN="YOUR_AUTH_TOKEN_HERE"

# Generate a secure JWT secret
railway variables set JWT_SECRET="$(openssl rand -hex 32)"

# Set the MongoDB URL (paste the one you copied)
railway variables set MONGO_URL="YOUR_MONGODB_URL_FROM_RAILWAY"

# Set database name
railway variables set DB_NAME="law_enforcement_rms"

# Set CORS (we'll update this after deployment)
railway variables set CORS_ORIGINS="*"
```

### Step 6: Deploy Backend

```bash
railway up
```

This will deploy your backend! Wait for it to finish (2-3 minutes).

### Step 7: Get Your Backend URL

```bash
railway domain
```

Or go to your Railway dashboard → Your service → "Settings" → "Generate Domain"

Your backend URL will be something like: `https://law-enforcement-rms-production.up.railway.app`

### Step 8: Update Backend URL

```bash
railway variables set BACKEND_URL="https://your-railway-url.up.railway.app"
```

### Step 9: Configure Twilio Webhook

1. Go to https://www.twilio.com/console/phone-numbers
2. Click your phone number: `+18704992134`
3. Under "Voice & Fax":
   - **A CALL COMES IN**: Webhook
   - **URL**: `https://your-railway-url.up.railway.app/api/webhooks/voice`
   - **HTTP**: POST
4. Click "Save"

### Step 10: Deploy Frontend to Vercel

```bash
cd frontend

# Build the frontend
yarn build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Follow the prompts:
- Set up and deploy: Yes
- Which scope: Your account
- Link to existing project: No
- Project name: law-enforcement-rms-frontend
- Directory: ./
- Override settings: No

### Step 11: Update CORS

Once frontend is deployed, update CORS:

```bash
railway variables set CORS_ORIGINS="https://your-vercel-url.vercel.app,https://your-railway-url.up.railway.app"
```

### Step 12: Create Admin User

```bash
# Connect to your Railway MongoDB
railway run mongosh $MONGO_URL
```

Then paste:
```javascript
use law_enforcement_rms

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

### Step 13: Test Everything!

1. Go to your Vercel URL
2. Login: admin / admin123
3. Call your Twilio number: `+18704992134`
4. You should hear the AI dispatcher!

---

## OPTION 2: Render (Alternative)

If Railway doesn't work, try Render:

### Step 1: Create Render Account

Go to https://render.com and sign up with GitHub

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name**: law-enforcement-rms
   - **Environment**: Python 3
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT`

### Step 3: Add Environment Variables

In Render dashboard, add all your environment variables (same as Railway)

### Step 4: Add MongoDB

1. Click "New +" → "MongoDB"
2. Copy the connection string
3. Add it to your environment variables

### Step 5: Deploy

Click "Create Web Service" - it will deploy automatically!

---

## OPTION 3: Heroku (Classic)

### Step 1: Install Heroku CLI

```bash
brew tap heroku/brew && brew install heroku
```

### Step 2: Login

```bash
heroku login
```

### Step 3: Create App

```bash
heroku create law-enforcement-rms
```

### Step 4: Add MongoDB

```bash
heroku addons:create mongolab:sandbox
```

### Step 5: Set Environment Variables

```bash
heroku config:set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

heroku config:set ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY_HERE"

heroku config:set TWILIO_PHONE_NUMBER="+18704992134"

heroku config:set TWILIO_ACCOUNT_SID="YOUR_ACCOUNT_SID"
heroku config:set TWILIO_AUTH_TOKEN="YOUR_AUTH_TOKEN"

heroku config:set JWT_SECRET="$(openssl rand -hex 32)"
heroku config:set CORS_ORIGINS="*"
```

### Step 6: Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

## 🎯 Quick Decision Guide

**Choose Railway if:**
- ✅ You want the easiest setup
- ✅ You want automatic deployments
- ✅ You're okay with credit card (free tier available)

**Choose Render if:**
- ✅ Railway doesn't work
- ✅ You want a simpler interface
- ✅ You prefer free tier without credit card

**Choose Heroku if:**
- ✅ You're familiar with Heroku
- ✅ You want the most established platform
- ✅ You need enterprise features later

---

## 📋 What You Need Right Now

1. **Get your Twilio credentials**:
   - Go to https://www.twilio.com/console
   - Copy Account SID (starts with "AC")
   - Copy Auth Token (click "Show")

2. **Choose a platform**: Railway (recommended)

3. **Follow the steps above**

---

## 🆘 Troubleshooting

### "Railway command not found"
```bash
npm install -g @railway/cli
```

### "MongoDB connection failed"
- Make sure you copied the full MongoDB URL from Railway
- Include the username and password in the URL

### "Twilio webhook not working"
- Make sure the URL is: `https://your-domain.com/api/webhooks/voice`
- Make sure it's set to POST
- Check Railway logs: `railway logs`

### "Frontend can't connect to backend"
- Update CORS_ORIGINS with your frontend URL
- Make sure BACKEND_URL is set correctly

---

## ✅ Success Checklist

- [ ] Railway/Render/Heroku account created
- [ ] Backend deployed
- [ ] MongoDB added and connected
- [ ] All environment variables set
- [ ] Frontend deployed to Vercel
- [ ] Twilio webhook configured
- [ ] Admin user created
- [ ] Can login to app
- [ ] Can make test call
- [ ] AI dispatcher answers

---

**Ready to start? Tell me:**
1. Your Twilio Account SID
2. Your Twilio Auth Token
3. Which platform you want to use (Railway recommended)

And I'll walk you through it step by step!
