#!/usr/bin/env python3
"""Check Twilio SMS message status"""
import os
from dotenv import load_dotenv
from twilio.rest import Client

load_dotenv()

TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Get the last 5 messages
messages = client.messages.list(limit=5)

print("\n=== Last 5 SMS Messages ===\n")
for msg in messages:
    print(f"SID: {msg.sid}")
    print(f"From: {msg.from_}")
    print(f"To: {msg.to}")
    print(f"Status: {msg.status}")
    print(f"Error Code: {msg.error_code}")
    print(f"Error Message: {msg.error_message}")
    print(f"Body: {msg.body[:100]}...")
    print(f"Date: {msg.date_created}")
    print("-" * 50)
