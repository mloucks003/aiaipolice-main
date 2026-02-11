#!/usr/bin/env python3
"""Test Twilio + ElevenLabs flow"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

from elevenlabs_helper import generate_voice_audio_sync

print("=" * 60)
print("Testing Twilio + ElevenLabs Integration Flow")
print("=" * 60)

# Test the exact text that will be used in Twilio webhook
test_messages = [
    "Nine one one, what's your emergency?",
    "Can you describe what happened?",
    "I'm creating an incident report for you. Officers will be dispatched shortly."
]

for i, msg in enumerate(test_messages, 1):
    print(f"\n{i}. Testing: '{msg[:50]}...'")
    url = generate_voice_audio_sync(msg)
    if url:
        print(f"   ✓ Generated URL: {url}")
    else:
        print(f"   ✗ Failed to generate audio")

print("\n" + "=" * 60)
print("✅ Twilio flow test complete!")
print("=" * 60)
