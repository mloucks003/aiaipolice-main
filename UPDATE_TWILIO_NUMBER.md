# How to Fix SMS Issue - A2P 10DLC Error 30034

## Problem
Your current number (+18704992134) is unregistered for A2P 10DLC messaging, which is required for business SMS in the US.

## Quick Solution: Use a Toll-Free Number

### Step 1: Buy a Toll-Free Number
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Select "United States" as country
3. Check "SMS" capability
4. Select "Toll-Free" number type
5. Buy a number (starts with +1-800, +1-888, +1-877, etc.)
6. Cost: ~$2/month

### Step 2: Update Local Environment
Edit `backend/.env`:
```
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX  # Your new toll-free number
```

### Step 3: Update Heroku
Run this command (replace with your new number):
```bash
heroku config:set TWILIO_PHONE_NUMBER=+1XXXXXXXXXX --app law-enforcement-rms
```

### Step 4: Update Twilio Webhooks
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Click on your NEW toll-free number
3. Under "Messaging Configuration":
   - Webhook URL: https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/webhooks/sms
   - HTTP Method: POST
4. Under "Voice Configuration":
   - Webhook URL: https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/webhooks/voice
   - HTTP Method: POST
5. Save

### Step 5: Test
Send "Hello" to your new toll-free number and you should get a response!

## Alternative: Register for A2P 10DLC (Production)
If you want to keep your current number for production use:
1. Go to: https://console.twilio.com/us1/develop/sms/regulatory-compliance
2. Complete business registration
3. Create messaging campaign
4. Register your number
5. Wait 1-2 weeks for approval
6. Cost: ~$4/month

## Why This Happened
US carriers now require all business SMS to be registered under A2P 10DLC regulations to prevent spam. Toll-free numbers are exempt from this requirement.
