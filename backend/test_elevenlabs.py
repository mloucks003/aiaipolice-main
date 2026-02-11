#!/usr/bin/env python3
"""Test script to verify ElevenLabs integration"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Load environment
from dotenv import load_dotenv
load_dotenv()

print("=" * 60)
print("ElevenLabs Integration Test")
print("=" * 60)

# Check API key
api_key = os.environ.get('ELEVENLABS_API_KEY')
print(f"\n1. API Key Check:")
if api_key:
    print(f"   ✓ API Key found: {api_key[:20]}...")
else:
    print(f"   ✗ API Key NOT found")
    sys.exit(1)

# Test client initialization
print(f"\n2. Client Initialization:")
try:
    from elevenlabs.client import ElevenLabs
    client = ElevenLabs(api_key=api_key)
    print(f"   ✓ ElevenLabs client initialized successfully")
except Exception as e:
    print(f"   ✗ Failed to initialize client: {e}")
    sys.exit(1)

# Test voice generation
print(f"\n3. Voice Generation Test:")
try:
    from elevenlabs import VoiceSettings
    test_text = "This is a test of the ElevenLabs voice system for emergency dispatch."
    
    print(f"   Generating audio for: '{test_text[:50]}...'")
    
    audio_generator = client.text_to_speech.convert(
        text=test_text,
        voice_id="EXAVITQu4vr4xnSDxMaL",  # Sarah voice
        model_id="eleven_turbo_v2_5",
        voice_settings=VoiceSettings(
            stability=0.45,
            similarity_boost=0.8,
            style=0.6,
            use_speaker_boost=True
        )
    )
    
    # Collect audio data
    audio_data = b''
    for chunk in audio_generator:
        if chunk:
            audio_data += chunk
    
    print(f"   ✓ Generated {len(audio_data)} bytes of audio")
    
    # Save test file
    test_file = Path(__file__).parent / "audio_cache" / "test_audio.mp3"
    test_file.parent.mkdir(exist_ok=True)
    with open(test_file, 'wb') as f:
        f.write(audio_data)
    
    print(f"   ✓ Saved to: {test_file}")
    print(f"\n✅ All tests passed!")
    
except Exception as e:
    print(f"   ✗ Voice generation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("=" * 60)
