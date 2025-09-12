# Claude Code Conversations Viewer - Installation Guide

## Quick Start

### Method 1: Local Development
```bash
# Clone or download the project
git clone <repo-url>
cd claude-viewer

# Install and run
npm install
npm start
```

### Method 2: Global Installation
```bash
# Install globally from the project directory
npm install -g .

# Or from npm registry (when published)
npm install -g claude-viewer

# Run from anywhere
claude-viewer
```

### Method 3: NPX (Recommended)
```bash
# Run without installation (when published)
npx claude-viewer
```

## Usage

The `claude-viewer` command will:

1. **Auto-install dependencies** if not found (runs `npm install` for both server and client)
2. **Start both servers concurrently**:
   - Backend API server on port 3001
   - Frontend React dev server on port 3000
3. **Open your browser** to http://localhost:3000

## Configuration

### Environment Variables

- `PROJECT_ROOT`: Path to Claude projects directory (default: `~/.claude/projects`)
- `PORT`: Backend server port (default: 3001)
- `CLIENT_PORT`: Frontend server port (default: 3000)

### Examples

```bash
# Use custom Claude projects directory
PROJECT_ROOT=/custom/path/to/projects claude-viewer

# Use different ports
PORT=4000 CLIENT_PORT=4001 claude-viewer
```

## Commands

```bash
claude-viewer --help     # Show help
claude-viewer --version  # Show version
claude-viewer            # Start the application
```

## Dependencies

The CLI will automatically install dependencies for both server and client if they're not found.

Manual installation:
```bash
npm run install-deps
```

## Development Commands

```bash
npm run dev          # Start both servers in development mode
npm run build        # Build client for production
npm run test         # Run tests for both server and client
npm run install-deps # Install dependencies for both server and client
```

## Troubleshooting

### Port Already in Use
If ports 3000 or 3001 are already in use, you'll see an error. Use custom ports:
```bash
PORT=3002 CLIENT_PORT=3003 claude-viewer
```

### Dependencies Installation Issues
If automatic dependency installation fails:
```bash
# Install manually
cd server && npm install
cd ../client && npm install
cd .. && npm start
```

### Permission Issues
If you get permission errors during global installation:
```bash
# Use npx instead
npx claude-viewer

# Or install with sudo (Linux/Mac)
sudo npm install -g .
```

## System Requirements

- Node.js 16+ 
- NPM 7+
- Access to `~/.claude/projects` directory
- Available ports 3000 and 3001 (or custom ports)

## Features

✅ **Auto-dependency management** - Installs missing dependencies automatically
✅ **Concurrent server startup** - Runs both backend and frontend simultaneously  
✅ **Graceful shutdown** - Handles Ctrl+C properly
✅ **Cross-platform** - Works on Windows, Mac, and Linux
✅ **Colorized output** - Beautiful terminal messages with colors
✅ **Help and version commands** - Standard CLI interface