#!/bin/bash

echo "🔧 Installing Claude Viewer CLI..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📂 Installing from: $SCRIPT_DIR"

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "📦 Installing CLI dependencies..."
    cd "$SCRIPT_DIR" && npm install
fi

# Install the CLI globally
echo "🌍 Installing claude-viewer globally..."
cd "$SCRIPT_DIR" && npm install -g .

if [ $? -eq 0 ]; then
    echo "✅ Installation complete!"
    echo ""
    echo "You can now use:"
    echo "  claude-viewer --help"
    echo "  claude-viewer --version"
    echo "  claude-viewer"
    echo ""
    echo "Note: You may need to restart your terminal or run 'source ~/.bashrc'"
else
    echo "❌ Installation failed. You can still run locally with:"
    echo "  cd $SCRIPT_DIR && npm start"
fi