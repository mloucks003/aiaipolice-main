#!/bin/bash

echo "🚀 Deploying audio fix to Heroku..."
echo ""

# Push to Heroku
git push heroku main

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📞 Test by calling: +18704992134"
echo ""
echo "📊 Watch logs with:"
echo "   heroku logs --tail --app law-enforcement-rms"
echo ""
echo "🔍 Look for these key log messages:"
echo "   - 'Initial greeting triggered for call'"
echo "   - 'OpenAI event: response.audio.delta'"
echo "   - 'Sending audio chunk to Twilio'"
echo ""
echo "📖 See AUDIO_DEBUG_GUIDE.md for detailed debugging info"
