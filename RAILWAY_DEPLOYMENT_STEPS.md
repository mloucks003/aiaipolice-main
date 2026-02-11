# 🚀 Railway Deployment - Copy & Paste Commands

Follow these steps exactly. Each command is ready to copy and paste.

---

## Step 1: Install Railway CLI (1 minute)

```bash
npm install -g @railway/cli
```

Wait for it to finish, then continue.

---

## Step 2: Login to Railway (2 minutes)

```bash
railway login
```

- This will open your browser
- Click "Login with GitHub"
- Authorize Railway
- Come back to terminal

---

## Step 3: Initialize Project (1 minute)

```bash
railway init
```

When prompted:
- Choose: "Create a new project"
- Name: `law-enforcement-rms`
- Press Enter

---

## Step 4: Add MongoDB (2 minutes)

**In your browser:**

1. Go to https://railway.app/dashboard
2. Click on your `law-enforcement-rms` project
3. Click "New" button → "Database" → "Add MongoDB"
4. Wait 30 seconds for it to provision
5. Click on the MongoDB service
6. Click "Variables" tab
7. Find `MONGO_URL` and copy the entire value

**Keep this URL - you'll need it in the next step!**

---

## Step 5: Set Environment Variables (3 minutes)

Copy and paste these commands ONE AT A TIME:

```bash
railway variables set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"
```

```bash
railway variables set ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY_HERE"
```

```bash
railway variables set TWILIO_ACCOUNT_SID="YOUR_TWILIO_SID_HERE"
```

```bash
railway variables set TWILIO_AUTH_TOKEN="YOUR_TWILIO_TOKEN_HERE"
```

```bash
railway variables set TWILIO_PHONE_NUMBER="+18704992134"
```

```bash
railway variables set DB_NAME="law_enforcement_rms"
```

```bash
railway variables set JWT_SECRET="$(openssl rand -hex 32)"
```

```bash
railway variables set CORS_ORIGINS="*"
```

**Now set the MongoDB URL** (replace with YOUR URL from Step 4):

```bash
railway variables set MONGO_URL="mongodb://mongo:YOUR_PASSWORD_HERE@monorail.proxy.rlwy.net:12345"
```

---

## Step 6: Deploy Backend (5 minutes)

```bash
railway up
```

This will:
- Upload your code
- Install dependencies
- Start your backend

Wait for it to say "Deployment successful" or "Build completed"

---

## Step 7: Generate Public URL (1 minute)

```bash
railway domain
```

This will generate a public URL like:
`https://law-enforcement-rms-production.up.railway.app`

**Copy this URL!**

---

## Step 8: Set Backend URL (1 minute)

Replace `YOUR_RAILWAY_URL` with the URL from Step 7:

```bash
railway variables set BACKEND_URL="https://YOUR_RAILWAY_URL.up.railway.app"
```

---

## Step 9: Configure Twilio Webhook (2 minutes)

1. Go to https://www.twilio.com/console/phone-numbers/incoming
2. Click your phone number: `+18704992134`
3. Scroll to "Voice & Fax" section
4. Under "A CALL COMES IN":
   - Select: **Webhook**
   - URL: `https://YOUR_RAILWAY_URL.up.railway.app/api/webhooks/voice`
   - HTTP: **POST**
5. Click "Save"

---

## Step 10: Create Admin User (2 minutes)

Connect to your Railway MongoDB:

```bash
railway run mongosh $MONGO_URL
```

Then paste this:

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

---

## Step 11: Test Backend (1 minute)

Open your Railway URL in a browser:
`https://YOUR_RAILWAY_URL.up.railway.app/docs`

You should see the API documentation!

---

## Step 12: Deploy Frontend to Vercel (5 minutes)

```bash
cd frontend
```

```bash
yarn build
```

```bash
npm install -g vercel
```

```bash
vercel
```

Follow the prompts:
- Set up and deploy: **Yes**
- Which scope: **Your account**
- Link to existing project: **No**
- Project name: `law-enforcement-rms-frontend`
- Directory: `./`
- Override settings: **No**

Vercel will give you a URL like: `https://law-enforcement-rms-frontend.vercel.app`

---

## Step 13: Update Frontend API URL (2 minutes)

In Vercel dashboard:
1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Add:
   - Name: `REACT_APP_API_URL`
   - Value: `https://YOUR_RAILWAY_URL.up.railway.app`
4. Click "Save"
5. Go to "Deployments" → Click "..." → "Redeploy"

---

## Step 14: Update CORS (1 minute)

```bash
railway variables set CORS_ORIGINS="https://YOUR_VERCEL_URL.vercel.app,https://YOUR_RAILWAY_URL.up.railway.app"
```

---

## Step 15: TEST EVERYTHING! 🎉

1. **Test Web App**:
   - Go to your Vercel URL
   - Login: `admin` / `admin123`
   - You should see the dashboard!

2. **Test Phone Calls**:
   - Call: `+18704992134`
   - You should hear the AI dispatcher!
   - Check the "Active Calls" page in your app

---

## 🎉 SUCCESS!

Your app is now live and deployed!

**Your URLs:**
- Backend: `https://YOUR_RAILWAY_URL.up.railway.app`
- Frontend: `https://YOUR_VERCEL_URL.vercel.app`
- Phone: `+18704992134`

---

## 🆘 Troubleshooting

### Backend not starting
```bash
railway logs
```

### MongoDB connection failed
- Make sure you copied the full MONGO_URL
- Check Railway dashboard → MongoDB → Variables

### Twilio webhook not working
- Make sure URL ends with `/api/webhooks/voice`
- Make sure it's set to POST
- Check Railway logs: `railway logs`

### Frontend can't connect
- Make sure REACT_APP_API_URL is set in Vercel
- Make sure CORS_ORIGINS includes your Vercel URL
- Redeploy frontend after changing env vars

---

## 📊 Monitor Your Deployment

**Railway Dashboard**: https://railway.app/dashboard
- View logs
- Check resource usage
- Monitor deployments

**Vercel Dashboard**: https://vercel.com/dashboard
- View deployments
- Check analytics
- Monitor performance

---

**Total Time**: ~25 minutes
**Cost**: Free tier (Railway + Vercel)
**Status**: Production ready! 🚀
