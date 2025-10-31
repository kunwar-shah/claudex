#!/bin/bash

# Claudex Quick Start - Truly One-Click Installation
# Uses existing system checker (npm run check:fix) + starts app
#
# Usage:
#   ./quick-start.sh              # Install + start
#   ./quick-start.sh --check-only # Just run system check

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   Claudex Quick Start v1.0.0          ║"
echo "║   No documentation needed!            ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}✗ Error: package.json not found${NC}"
    echo "Please run this script from the claudex directory"
    exit 1
fi

# Step 1: Run system checker with auto-fix
echo -e "\n${BLUE}📋 Step 1/2: Running system check with auto-fix...${NC}"
npm run check:fix

# If --check-only flag, stop here
if [ "$1" = "--check-only" ]; then
    echo -e "\n${GREEN}✓ System check complete!${NC}"
    echo "Run './quick-start.sh' to start the app"
    exit 0
fi

# Step 2: Start the application
echo -e "\n${BLUE}🚀 Step 2/2: Starting Claudex...${NC}"
echo -e "${YELLOW}Opening browser at http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

# Start the app
npm run dev
