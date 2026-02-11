#!/usr/bin/env python3
"""
Test script to verify which API keys are working.
Run this before starting the application to check your setup.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

print("=" * 60)
print("API Key Verification Test")
print("=" * 60)
print()

# Test 1: Check if .env file exists
env_file = Path(__file__).parent / '.env'
if env_file.exists():
    print("✅ .env file found")
else:
    print("❌ .env file NOT found - copy .env.example to .env")
    exit(1)

print()

# Test 2: Check environment variables are loaded
print("Environment Variables:")
print("-" * 60)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
MONGO_URL = os.environ.get('MONGO_URL')

if OPENAI_API_KEY:
    print(f"✅ OPENAI_API_KEY: {OPENAI_API_KEY[:20]}...")
else:
    print("❌ OPENAI_API_KEY: Not set")

if ELEVENLABS_API_KEY:
    print(f"✅ ELEVENLABS_API_KEY: {ELEVENLABS_API_KEY[:20]}...")
else:
    print("❌ ELEVENLABS_API_KEY: Not set")

if TWILIO_ACCOUNT_SID:
    print(f"✅ TWILIO_ACCOUNT_SID: {TWILIO_ACCOUNT_SID[:20]}...")
else:
    print("❌ TWILIO_ACCOUNT_SID: Not set")

if TWILIO_AUTH_TOKEN:
    print(f"✅ TWILIO_AUTH_TOKEN: {TWILIO_AUTH_TOKEN[:20]}...")
else:
    print("❌ TWILIO_AUTH_TOKEN: Not set")

if TWILIO_PHONE_NUMBER:
    print(f"✅ TWILIO_PHONE_NUMBER: {TWILIO_PHONE_NUMBER}")
else:
    print("❌ TWILIO_PHONE_NUMBER: Not set")

if MONGO_URL:
    print(f"✅ MONGO_URL: {MONGO_URL}")
else:
    print("❌ MONGO_URL: Not set")

print()
print("=" * 60)
print("API Connection Tests")
print("=" * 60)
print()

# Test 3: Test OpenAI connection
print("Testing OpenAI API...")
if OPENAI_API_KEY:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        # Try to list models
        models = client.models.list()
        print("✅ OpenAI API: Connected successfully")
        print(f"   Available models: {len(list(models.data))} models found")
    except Exception as e:
        print(f"❌ OpenAI API: Failed to connect")
        print(f"   Error: {str(e)}")
        if "sk-emergent" in OPENAI_API_KEY:
            print("   ⚠️  Your key looks like an Emergent key!")
            print("   You need a real OpenAI key from: https://platform.openai.com/api-keys")
else:
    print("⏭️  OpenAI API: Skipped (no key provided)")

print()

# Test 4: Test ElevenLabs connection
print("Testing ElevenLabs API...")
if ELEVENLABS_API_KEY:
    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        # Try to get user info
        user = client.user.get()
        print("✅ ElevenLabs API: Connected successfully")
        print(f"   Character count: {user.subscription.character_count}")
        print(f"   Character limit: {user.subscription.character_limit}")
    except Exception as e:
        print(f"❌ ElevenLabs API: Failed to connect")
        print(f"   Error: {str(e)}")
else:
    print("⏭️  ElevenLabs API: Skipped (no key provided)")

print()

# Test 5: Test Twilio connection
print("Testing Twilio API...")
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        from twilio.rest import Client
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        # Try to get account info
        account = client.api.accounts(TWILIO_ACCOUNT_SID).fetch()
        print("✅ Twilio API: Connected successfully")
        print(f"   Account status: {account.status}")
        print(f"   Account type: {account.type}")
    except Exception as e:
        print(f"❌ Twilio API: Failed to connect")
        print(f"   Error: {str(e)}")
else:
    print("⏭️  Twilio API: Skipped (no credentials provided)")

print()

# Test 6: Test MongoDB connection
print("Testing MongoDB connection...")
if MONGO_URL:
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio
        
        async def test_mongo():
            client = AsyncIOMotorClient(MONGO_URL)
            # Try to list databases
            await client.server_info()
            return True
        
        if asyncio.run(test_mongo()):
            print("✅ MongoDB: Connected successfully")
    except Exception as e:
        print(f"❌ MongoDB: Failed to connect")
        print(f"   Error: {str(e)}")
        print("   Make sure MongoDB is running: mongod")
else:
    print("⏭️  MongoDB: Skipped (no URL provided)")

print()
print("=" * 60)
print("Summary")
print("=" * 60)
print()
print("✅ = Working")
print("❌ = Not working (needs attention)")
print("⏭️  = Skipped (not configured)")
print()
print("If you see any ❌, check the error messages above.")
print("For OpenAI issues, see IMPORTANT_API_KEY_NOTE.md")
print()
