#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Setting up Social Stockfish development environment...${NC}"

# Create necessary directories
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p frontend/components/visualizations
mkdir -p frontend/lib
mkdir -p frontend/types
mkdir -p server/api
mkdir -p server/core
mkdir -p server/models
mkdir -p server/services

# Set up frontend environment
echo -e "${GREEN}Setting up frontend environment...${NC}"
cd frontend
cp .env.example .env.local
yarn install

# Set up backend environment
echo -e "${GREEN}Setting up backend environment...${NC}"
cd ../server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up git hooks
echo -e "${GREEN}Setting up git hooks...${NC}"
cd ..
git config core.hooksPath .githooks

echo -e "${BLUE}Setup complete! You can now run the following commands:${NC}"
echo -e "${GREEN}Frontend development:${NC}"
echo "cd frontend && yarn dev"
echo -e "${GREEN}Backend development:${NC}"
echo "cd server && python run.py"
echo -e "${GREEN}Run tests:${NC}"
echo "Frontend: cd frontend && yarn test"
echo "Backend: cd server && python -m pytest"
echo -e "${GREEN}Run with Docker:${NC}"
echo "docker-compose up" 