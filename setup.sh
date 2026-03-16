#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Juan Carlos Event Management - Setup Script            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo "Please download and install Node.js from: https://nodejs.org/"
    echo "Make sure to install version 18 or higher."
    exit 1
fi

echo -e "${GREEN}✅ Node.js is installed${NC}"
node --version
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
echo "This may take a few minutes..."
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit the .env file and add your MongoDB connection string!${NC}"
    echo ""
    echo "To get a free MongoDB database:"
    echo "1. Go to https://www.mongodb.com/cloud/atlas"
    echo "2. Sign up for a free account"
    echo "3. Create a cluster and get your connection string"
    echo "4. Replace MONGODB_URI in the .env file"
    echo ""
    
    # Try to open with default editor
    if command -v nano &> /dev/null; then
        nano .env
    elif command -v vim &> /dev/null; then
        vim .env
    else
        echo "Please open .env in your preferred editor"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                      Setup Complete!                          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "To start the application:"
echo ""
echo "  npm run dev"
echo ""
echo "This will start both the backend and frontend."
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Default login: sales@juancarlos.com / password123"
echo ""
