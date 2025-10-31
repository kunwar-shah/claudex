#!/bin/bash
# Quick npm package testing script
# Run this multiple times to test changes

set -e

echo "🧪 Claudex npm Package Test Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Clean previous install
echo -e "${BLUE}1. Cleaning previous installation...${NC}"
npm uninstall -g claudex 2>/dev/null || true
rm -f claudex-*.tgz
echo -e "${GREEN}✓ Cleaned${NC}"
echo ""

# Step 2: Build tarball
echo -e "${BLUE}2. Building package tarball...${NC}"
npm pack
TARBALL=$(ls claudex-*.tgz)
SIZE=$(ls -lh $TARBALL | awk '{print $5}')
echo -e "${GREEN}✓ Built: $TARBALL ($SIZE)${NC}"
echo ""

# Step 3: Show package contents
echo -e "${BLUE}3. Package contents:${NC}"
npm pack --dry-run 2>&1 | grep "Tarball Details" -A 5
echo ""

# Step 4: Install from tarball
echo -e "${BLUE}4. Installing from tarball...${NC}"
npm install -g ./$TARBALL
echo -e "${GREEN}✓ Installed${NC}"
echo ""

# Step 5: Check command availability
echo -e "${BLUE}5. Checking command availability...${NC}"
if command -v claudex &> /dev/null; then
    echo -e "${GREEN}✓ claudex command available${NC}"
    INSTALL_PATH=$(which claudex)
    echo -e "   Location: $INSTALL_PATH"
else
    echo -e "${RED}✗ claudex command not found${NC}"
    exit 1
fi
echo ""

# Step 6: Test version
echo -e "${BLUE}6. Testing version command...${NC}"
claudex --version
echo -e "${GREEN}✓ Version command works${NC}"
echo ""

# Step 7: Test help
echo -e "${BLUE}7. Testing help command...${NC}"
claudex --help | head -15
echo -e "${GREEN}✓ Help command works${NC}"
echo ""

# Step 8: Check dependencies installed
echo -e "${BLUE}8. Checking dependencies...${NC}"
NPM_ROOT=$(npm root -g)
if [ -d "$NPM_ROOT/claudex/server/node_modules" ]; then
    echo -e "${GREEN}✓ Server dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Server dependencies missing (postinstall may have failed)${NC}"
fi

if [ -d "$NPM_ROOT/claudex/client/node_modules" ]; then
    echo -e "${GREEN}✓ Client dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠ Client dependencies missing${NC}"
fi
echo ""

# Step 9: Check for sensitive files
echo -e "${BLUE}9. Checking for sensitive files in package...${NC}"
SENSITIVE=$(tar -tzf $TARBALL | grep -E "\.env$|\.log$|data/search\.db|node_modules/" | head -5)
if [ -z "$SENSITIVE" ]; then
    echo -e "${GREEN}✓ No sensitive files found${NC}"
else
    echo -e "${RED}✗ Sensitive files detected:${NC}"
    echo "$SENSITIVE"
fi
echo ""

# Summary
echo "===================================="
echo -e "${GREEN}✅ Test completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "  - Run 'claudex' to start the app (Ctrl+C to stop)"
echo "  - Run 'npm uninstall -g claudex' to clean up"
echo "  - Make changes and run this script again"
echo ""
echo "To test on Windows:"
echo "  1. Copy $TARBALL to Windows"
echo "  2. Run: npm install -g $TARBALL"
echo "  3. Test: claudex --help"
echo ""
