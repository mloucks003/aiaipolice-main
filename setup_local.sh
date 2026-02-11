#!/bin/bash

echo "=========================================="
echo "Law Enforcement RMS - Local Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if we're in the right directory
if [ ! -f "backend/server.py" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found project files"
echo ""

# Step 2: Setup Python virtual environment
echo "Step 1: Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    cd backend
    python3 -m venv venv
    cd ..
    echo -e "${GREEN}✓${NC} Virtual environment created"
else
    echo -e "${YELLOW}⚠${NC}  Virtual environment already exists"
fi
echo ""

# Step 3: Install Python dependencies
echo "Step 2: Installing Python dependencies..."
source backend/venv/bin/activate
pip install --upgrade pip --quiet
pip install -r backend/requirements.txt --quiet
echo -e "${GREEN}✓${NC} Python dependencies installed"
echo ""

# Step 4: Check if .env exists
echo "Step 3: Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo "Creating from .env.example..."
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}⚠${NC}  Please edit backend/.env with your API keys"
else
    echo -e "${GREEN}✓${NC} backend/.env exists"
fi
echo ""

# Step 5: Test API keys
echo "Step 4: Testing API keys..."
python3 backend/test_api_keys.py
echo ""

# Step 6: Check if MongoDB is running
echo "Step 5: Checking MongoDB..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.version()" --quiet &> /dev/null; then
        echo -e "${GREEN}✓${NC} MongoDB is running"
    else
        echo -e "${YELLOW}⚠${NC}  MongoDB is not running"
        echo "Start it with: mongod"
    fi
else
    echo -e "${YELLOW}⚠${NC}  MongoDB not found"
    echo "Install it with: brew install mongodb-community"
fi
echo ""

# Step 7: Check Node.js and Yarn
echo "Step 6: Checking Node.js and Yarn..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js $(node --version)"
else
    echo -e "${RED}❌ Node.js not found${NC}"
    echo "Install it with: brew install node"
fi

if command -v yarn &> /dev/null; then
    echo -e "${GREEN}✓${NC} Yarn $(yarn --version)"
else
    echo -e "${YELLOW}⚠${NC}  Yarn not found"
    echo "Install it with: npm install -g yarn"
fi
echo ""

# Step 8: Install frontend dependencies
echo "Step 7: Installing frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    if command -v yarn &> /dev/null; then
        yarn install --silent
        echo -e "${GREEN}✓${NC} Frontend dependencies installed"
    else
        echo -e "${YELLOW}⚠${NC}  Yarn not found, skipping frontend setup"
    fi
    cd ..
fi
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Edit backend/.env with your API keys"
echo "   - Get OpenAI key: https://platform.openai.com/api-keys"
echo ""
echo "2. Start MongoDB:"
echo "   mongod"
echo ""
echo "3. Start the backend (in new terminal):"
echo "   source backend/venv/bin/activate"
echo "   cd backend"
echo "   uvicorn server:app --reload"
echo ""
echo "4. Start the frontend (in new terminal):"
echo "   cd frontend"
echo "   yarn start"
echo ""
echo "5. Open http://localhost:3000"
echo ""
