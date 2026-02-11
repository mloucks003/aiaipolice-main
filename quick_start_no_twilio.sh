#!/bin/bash

echo "=========================================="
echo "Quick Start - Without Twilio"
echo "=========================================="
echo ""
echo "This will get your app running locally"
echo "You can add Twilio phone features later"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MongoDB is installed
echo "Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo -e "${YELLOW}MongoDB not found. Installing...${NC}"
    brew tap mongodb/brew
    brew install mongodb-community
fi

# Start MongoDB
echo "Starting MongoDB..."
brew services start mongodb-community
sleep 2

# Check if MongoDB is running
if mongosh --eval "db.version()" --quiet &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB failed to start${NC}"
    echo "Try manually: brew services restart mongodb-community"
    exit 1
fi

# Check if Yarn is installed
echo ""
echo "Checking Yarn..."
if ! command -v yarn &> /dev/null; then
    echo -e "${YELLOW}Yarn not found. Installing...${NC}"
    npm install -g yarn
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
yarn install --silent
cd ..
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Create admin user
echo ""
echo "Creating admin user..."
mongosh --quiet --eval '
use test_database
db.users.deleteMany({username: "admin"})
db.users.insertOne({
  id: "admin-001",
  badge_number: "ADMIN001",
  username: "admin",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIr.oXkG6.",
  full_name: "System Administrator",
  role: "admin",
  department: "Administration",
  rank: "Administrator",
  active: true,
  created_at: new Date().toISOString()
})
' > /dev/null 2>&1

echo -e "${GREEN}✓ Admin user created${NC}"

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo -e "${BLUE}Your app is ready to start!${NC}"
echo ""
echo "Open 3 terminals and run these commands:"
echo ""
echo -e "${YELLOW}Terminal 1 - Backend:${NC}"
echo "  cd $(pwd)"
echo "  source backend/venv/bin/activate"
echo "  cd backend"
echo "  uvicorn server:app --reload"
echo ""
echo -e "${YELLOW}Terminal 2 - Frontend:${NC}"
echo "  cd $(pwd)/frontend"
echo "  yarn start"
echo ""
echo -e "${YELLOW}Terminal 3 - This terminal:${NC}"
echo "  Wait for both to start, then open:"
echo "  http://localhost:3000"
echo ""
echo "Login with:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${GREEN}Note: Phone features disabled (no Twilio)${NC}"
echo "All other features will work!"
echo ""
