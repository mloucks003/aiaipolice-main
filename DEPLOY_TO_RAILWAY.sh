#!/bin/bash

echo "🚀 Deploying to Railway - Step by Step"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Step 1: Installing Railway CLI...${NC}"
npm install -g @railway/cli
echo ""

echo -e "${BLUE}Step 2: Login to Railway${NC}"
echo "This will open your browser. Sign up with GitHub."
echo "Press Enter when ready..."
read
railway login
echo ""

echo -e "${BLUE}Step 3: Initialize Railway Project${NC}"
railway init
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Go to your Railway dashboard now${NC}"
echo "1. Open: https://railway.app/dashboard"
echo "2. Click on your project"
echo "3. Click 'New' → 'Database' → 'Add MongoDB'"
echo "4. Wait 30 seconds for it to provision"
echo "5. Click on MongoDB → 'Variables' tab"
echo "6. Copy the MONGO_URL value"
echo ""
echo "Press Enter when you have the MongoDB URL..."
read

echo ""
echo -e "${BLUE}Step 4: Enter your MongoDB URL${NC}"
echo "Paste the MongoDB URL from Railway:"
read MONGO_URL

echo ""
echo -e "${BLUE}Step 5: Setting environment variables...${NC}"

railway variables set OPENAI_API_KEY="YOUR_OPENAI_KEY_HERE"

railway variables set ELEVENLABS_API_KEY="YOUR_ELEVENLABS_KEY_HERE"

railway variables set TWILIO_ACCOUNT_SID="YOUR_TWILIO_SID_HERE"

railway variables set TWILIO_AUTH_TOKEN="YOUR_TWILIO_TOKEN_HERE"

railway variables set TWILIO_PHONE_NUMBER="+18704992134"

railway variables set MONGO_URL="$MONGO_URL"

railway variables set DB_NAME="law_enforcement_rms"

railway variables set JWT_SECRET="$(openssl rand -hex 32)"

railway variables set CORS_ORIGINS="*"

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

echo -e "${BLUE}Step 6: Deploying backend...${NC}"
railway up
echo ""

echo -e "${GREEN}✓ Backend deployed!${NC}"
echo ""

echo -e "${BLUE}Step 7: Generating public URL...${NC}"
railway domain
echo ""

echo "Copy the URL that was generated above."
echo "It should look like: https://something.up.railway.app"
echo ""
echo "Paste your Railway URL here:"
read RAILWAY_URL

railway variables set BACKEND_URL="$RAILWAY_URL"

echo ""
echo -e "${GREEN}✓ Backend URL configured${NC}"
echo ""

echo "========================================"
echo -e "${GREEN}✅ Backend Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "Your backend is live at:"
echo -e "${BLUE}$RAILWAY_URL${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Twilio webhook (I'll help you)"
echo "2. Deploy frontend to Vercel"
echo "3. Create admin user"
echo "4. Test phone calls!"
echo ""
