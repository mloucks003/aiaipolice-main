#!/bin/bash
# Clear all calls from the database

echo "Clearing all calls from database..."

# First login to get token
TOKEN=$(curl -s -X POST https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login. Make sure admin account exists."
  exit 1
fi

echo "✅ Logged in successfully"

# Clear all calls
RESULT=$(curl -s -X DELETE https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/admin/calls \
  -H "Authorization: Bearer $TOKEN")

echo "✅ $RESULT"
