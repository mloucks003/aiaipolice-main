#!/bin/bash
# Seed database with sample people and vehicles via API

echo "Seeding database with sample data..."

# Login to get token
TOKEN=$(curl -s -X POST https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Logged in successfully"
echo ""
echo "Calling seed endpoint..."

# Call the seed endpoint
RESULT=$(curl -s -X POST https://law-enforcement-rms-b2749bfd89b0.herokuapp.com/api/seed/generate \
  -H "Authorization: Bearer $TOKEN")

echo "✅ $RESULT"
echo ""
echo "Database seeded! You can now search for:"
echo "  - People: John Smith (DL: D1234567), Sarah Johnson (DL: J9876543)"
echo "  - Vehicles: ABC123, XYZ789, DEF456"
