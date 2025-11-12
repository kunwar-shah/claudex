# Getting Started

Get Claudex up and running in less than 2 minutes.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Claude Code** - With conversation history in `~/.claude/projects`

## Quick Install (Recommended) ⭐

Install and run Claudex globally via npm:

```bash
# Install from npm
npm install -g @kunwarshah/claudex

# Run it
claudex
```

That's it! 🎉 Open **http://localhost:3400** in your browser.

The application will:
- ✅ Auto-install dependencies on first run
- ✅ Detect your Claude projects at `~/.claude/projects`
- ✅ Build search index automatically
- ✅ Start in production mode (optimized)

### Custom Configuration

```bash
# Use different port
claudex --port 3500

# Use custom projects directory
claudex --project-root ~/my-claude-projects

# Both
claudex --port 8080 --project-root ~/my-chats
```

## Alternative: Install from Source

For development or contributing:

### 1. Clone the Repository

```bash
git clone https://github.com/kunwar-shah/claudex.git
cd claudex
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy environment template
cd server
cp .env.example .env
```

The default configuration works for most users:

```env
PROJECT_ROOT=~/.claude/projects
PORT=3400
NODE_ENV=development
```

> **Note**: The `~/` path automatically expands to your home directory

### 4. Start the Application

```bash
# From claudex directory
npm run dev
```

This starts:
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:3400 (Fastify API)

### 5. Build Search Index

For the first time, build the search index:

```bash
# Option 1: Via test script
./test-search.sh

# Option 2: Via API
curl -X POST http://localhost:3400/api/search/index/build

# Option 3: Via UI
# Navigate to Search page → Click "Rebuild Index"
```

## Verification

After setup, verify everything works:

- [ ] Frontend accessible at http://localhost:3000
- [ ] Projects list loads
- [ ] Can view a conversation session
- [ ] Search index builds successfully
- [ ] Search returns results

## Next Steps

- [Learn about Search](search.md)
- [Understand Templates](templates.md)
- [Explore the API](api.md)
- [Read Troubleshooting](troubleshooting.md)

## Quick Tips

💡 **Hot Reload**: Both frontend and backend auto-reload on code changes

💡 **Port Change**: Edit `PORT` in `server/.env` if 3400 is in use

💡 **Path Issues**: Use absolute paths if `~/` doesn't work

💡 **Index Rebuild**: Rebuild search index after template changes
