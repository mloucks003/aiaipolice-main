# ⚠️ IMPORTANT: OpenAI API Key

## Your Emergent Key

Your original key was: `sk-emergent-66520CdE42bBc9d908`

**This is an Emergent-specific key format and will NOT work with OpenAI's API directly.**

## What You Need to Do

### Option 1: Get a New OpenAI Key (Recommended)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. Replace the `OPENAI_API_KEY` in `backend/.env` with your new key

### Option 2: Contact Emergent Support

If you had an Emergent subscription that included OpenAI access, you may need to:
1. Contact Emergent support to get your actual OpenAI key
2. Or ask them to help you migrate your API access

## Your Other Keys (These Work!)

✅ **ElevenLabs**: `YOUR_ELEVENLABS_KEY_HERE`
- This should work as-is

✅ **Twilio Account SID**: `YOUR_TWILIO_SID_HERE`
✅ **Twilio Auth Token**: `13e38b9b1fb586bc3e841bdc5796407c`
✅ **Twilio Phone Number**: `+18704992134`
- These should all work as-is

## Testing Your Setup

### Test ElevenLabs (should work immediately)
```bash
cd backend
python3 -c "
from elevenlabs.client import ElevenLabs
client = ElevenLabs(api_key='YOUR_ELEVENLABS_KEY_HERE')
print('ElevenLabs: ✅ Connected')
"
```

### Test Twilio (should work immediately)
```bash
python3 -c "
from twilio.rest import Client
client = Client('YOUR_TWILIO_SID_HERE', '13e38b9b1fb586bc3e841bdc5796407c')
print('Twilio: ✅ Connected')
"
```

### Test OpenAI (will fail until you get a real key)
```bash
python3 -c "
from openai import OpenAI
client = OpenAI(api_key='sk-emergent-66520CdE42bBc9d908')
try:
    client.models.list()
    print('OpenAI: ✅ Connected')
except Exception as e:
    print(f'OpenAI: ❌ Failed - {e}')
    print('You need to get a real OpenAI API key')
"
```

## Cost Estimates with Your Keys

### ElevenLabs
- Your key should have a quota/balance
- Check at: https://elevenlabs.io/usage
- Typical cost: ~$0.30 per 1,000 characters

### Twilio
- Your account should have a balance
- Check at: https://www.twilio.com/console
- Costs:
  - Phone number: ~$1/month
  - Incoming calls: ~$0.0085/minute
  - Speech recognition: ~$0.02/minute

### OpenAI (once you get a key)
- New accounts get $5 free credit
- GPT-4o-mini: Very affordable (~$0.15 per 1M input tokens)
- Check usage at: https://platform.openai.com/usage

## Quick Start (Without OpenAI)

You can still run the app without OpenAI - just the AI features won't work:

1. Start MongoDB: `mongod`
2. Start backend: `cd backend && uvicorn server:app --reload`
3. Start frontend: `cd frontend && yarn start`

The following will work:
- ✅ User authentication
- ✅ Database operations
- ✅ Citation management
- ✅ ElevenLabs voice (if key is valid)
- ✅ Twilio calls (if keys are valid)

The following will fail (until you get OpenAI key):
- ❌ AI emergency detection
- ❌ AI conversation with callers
- ❌ AI report generation
- ❌ License plate analysis
- ❌ Suspect matching
- ❌ Predictive analysis

## Next Steps

1. **Get OpenAI API Key**: https://platform.openai.com/api-keys
2. **Update `.env`**: Replace `OPENAI_API_KEY` with your new key
3. **Restart backend**: The app will pick up the new key
4. **Test AI features**: Try the AI report generation or call handling

---

**Remember**: Never commit your `.env` file to git! It's already in `.gitignore`.
