# Claude Code Conversations Viewer

A powerful web application for viewing, searching, and analyzing Claude Code conversation histories. Features universal template support (V1.x, V2-mixed, V2.0+), full-text search with SQLite FTS5, and a modern React UI.

## ✨ Features

- 📁 **Auto Project Discovery**: Scans `~/.claude/projects` for all conversations
- 🔍 **Full-Text Search**: SQLite FTS5-powered search across all messages with filters
- 📝 **Universal Template Support**: Works with all Claude Code versions (V1.x, V2-mixed, V2.0+)
- 🎯 **Smart Rendering**: Markdown, code blocks, diffs, JSON, tool usage visualization
- 📊 **Session Analytics**: Message distribution, file operations, conversation stats
- 📋 **Export Options**: JSON, HTML, and TXT formats for conversations
- 🎨 **Modern UI**: Responsive design with fixed header/footer and smooth navigation
- 🚀 **Hot Reload**: Development mode with auto-restart on code changes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Claude Code installed with conversation history in `~/.claude/projects`

### Installation

1. **Clone the repository**:
```bash
git clone <your-repo-url>
cd claude-viewer
```

2. **Install dependencies**:
```bash
# Install CLI dependencies (for global command)
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

3. **Configure environment**:
```bash
cd server
cp .env.example .env
# Edit .env if needed (default: PROJECT_ROOT=~/.claude/projects)
cd ..
```

4. **Start the application**:
```bash
# Option 1: Using npm script (runs both frontend + backend)
cd claude-viewer
npm run dev

# Option 2: Or use the helper script from root
./run-claude-viewer.sh
```

5. **Open your browser**: http://localhost:3000

The backend API runs on `http://localhost:3400`

### Global CLI Installation (Optional)

Install globally to use `claude-viewer` command anywhere:

```bash
cd claude-viewer
./install.sh

# Then run from anywhere:
claude-viewer
```

## 🔧 Configuration

### Server Configuration (`.env`)

```env
# Path to Claude Code projects directory
# Supports ~ expansion (e.g., ~/.claude/projects)
PROJECT_ROOT=~/.claude/projects

# Server port
PORT=3400

# Environment
NODE_ENV=development
```

### Default Ports

- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:3400 (Fastify API)
- **Frontend build**: Uses port 3400 (served by backend in production)

## 📂 Project Structure

```
claude-viewer/
├── server/                    # Backend (Node.js + Fastify)
│   ├── src/
│   │   ├── parsers/          # Template detection & message parsing
│   │   │   ├── templateDetector.js    # V1/V2/V3 template detection
│   │   │   └── messageParser.js       # Universal message parser
│   │   ├── services/         # Core business logic
│   │   │   ├── fileScanner.js        # Project/session discovery
│   │   │   ├── sessionParser.js      # Full session parsing
│   │   │   ├── searchDatabase.js     # SQLite FTS5 search
│   │   │   └── searchIndexer.js      # Search index builder
│   │   ├── routes/           # API endpoints
│   │   │   ├── projects.js           # Project/session routes
│   │   │   ├── search.js             # Search routes
│   │   │   └── export.js             # Export routes
│   │   ├── utils/            # Helper utilities
│   │   │   └── pathHelper.js         # Path expansion (~/ support)
│   │   └── server.js         # Main server
│   ├── data/                 # SQLite database (auto-created)
│   ├── .env.example          # Environment template
│   └── package.json
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ProjectSelector.jsx
│   │   │   ├── SessionList.jsx
│   │   │   ├── ConversationThread.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── ClaudeMessageRenderer.jsx
│   │   │   └── SearchPage.jsx
│   │   ├── services/         # API client
│   │   │   └── api.js
│   │   └── App.jsx           # Main app
│   └── package.json
├── bin/                      # CLI entry point
├── test-search.sh           # Search API testing script
├── install.sh               # Global CLI installer
├── SETUP.md                 # Detailed setup guide
├── README.md                # This file
└── package.json             # Root package (CLI + concurrently)
```

## 🎯 Supported Claude Code Formats

The viewer automatically detects and parses all Claude Code conversation formats:

### V3 Template (Universal - Recommended)
- **Claude Code v2.0+**: New format with `role` field directly
- **Claude Code v1.x**: Original format with `type` field
- **Edge cases**: Mixed formats and migration states
- **New message types**: `file-history-snapshot` support
- **Role mapping**: All system messages → assistant (binary user/assistant classification)

### Legacy Templates (Auto-detected)
- **V2-Mixed**: Transition format between V1 and V2
- **V1**: Original Claude Code format

The template detector uses a waterfall detection strategy, automatically selecting the best parser for your conversation files.

## 🔍 Search System

### Building the Search Index

The search index needs to be built before searching:

```bash
# Option 1: Via API
curl -X POST http://localhost:3400/api/search/index/build

# Option 2: Via test script
./test-search.sh

# Option 3: Via UI (Search page → "Rebuild Index" button)
```

### When to Rebuild Index

Rebuild the search index when:
- First time setup
- After template changes
- When new conversations are added
- If search results seem outdated

### Search API Examples

```bash
# Basic search
curl -X POST http://localhost:3400/api/search \
  -H "Content-Type: application/json" \
  -d '{"q": "migration", "limit": 10}'

# Search with filters
curl -X POST http://localhost:3400/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "q": "database",
    "projectId": "my-project",
    "role": "user",
    "limit": 20,
    "offset": 0
  }'

# Check index status
curl http://localhost:3400/api/search/index/status
```

## 📡 API Endpoints

### Projects & Sessions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects/:id/sessions` | GET | Get sessions for project |
| `/api/projects/:id/sessions/:sessionId` | GET | Get full session with messages |

### Search
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | POST | Search conversations (FTS5) |
| `/api/search/index/build` | POST | Build/rebuild search index |
| `/api/search/index/status` | GET | Get index statistics |
| `/api/search/index/clear` | POST | Clear search index |

### Export
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/export/session/:projectId/:sessionId?format=json` | GET | Export as JSON |
| `/api/export/session/:projectId/:sessionId?format=html` | GET | Export as HTML |
| `/api/export/session/:projectId/:sessionId?format=txt` | GET | Export as TXT |

### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check + system info |

## 🛠️ Development

### Development Mode

```bash
# Run both frontend + backend with hot reload
npm run dev

# Or run separately:
# Terminal 1 - Backend (auto-restarts on changes)
cd server && npm run dev

# Terminal 2 - Frontend (hot module replacement)
cd client && npm run dev
```

### Testing the Search System

```bash
# Run comprehensive search tests
./test-search.sh
```

This script will:
1. Check server health
2. Get index status
3. Build/rebuild index
4. Run test searches with various filters
5. Display results

### Adding New Templates

1. **Update Template Detector** (`server/src/parsers/templateDetector.js`):
```javascript
'my-template': {
  name: 'My Template Name',
  detect: (samples) => {
    return samples.some(s => s.myUniqueField !== undefined);
  },
  parser: 'my-template'
}
```

2. **Add Parser Method** (`server/src/parsers/messageParser.js`):
```javascript
parseMyTemplate(rawMessage) {
  return {
    id: rawMessage.id || this.generateId(),
    role: rawMessage.myRole === 'user' ? 'user' : 'assistant',
    content: rawMessage.myContent || '',
    timestamp: rawMessage.myTimestamp,
    // ... other fields
  };
}
```

3. **Rebuild Search Index**: The new template will be automatically detected and used.

## 📝 Scripts Reference

### Root Directory (`/home/boss/claude-chats/`)
- `./run-claude-viewer.sh` - Quick start script (runs from claude-viewer/)

### Claude Viewer Directory
- `npm run dev` - Run frontend + backend concurrently
- `npm start` - Run frontend + backend (production mode)
- `./install.sh` - Install as global CLI command
- `./test-search.sh` - Test search API endpoints

### Server Directory
- `npm run dev` - Run with nodemon (auto-restart)
- `npm start` - Run in production mode

### Client Directory
- `npm run dev` - Vite dev server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🐛 Troubleshooting

### No Projects Found
- Verify `PROJECT_ROOT` in `.env` points to `~/.claude/projects`
- Check that Claude Code has created conversation files
- Ensure read permissions on the directory

### Search Not Working
- Build the search index: `curl -X POST http://localhost:3400/api/search/index/build`
- Check index status: `curl http://localhost:3400/api/search/index/status`
- Look for errors in server logs

### Port Conflicts
- Change `PORT=3400` in `server/.env`
- Update `client/vite.config.js` proxy target if needed
- Update `test-search.sh` SERVER_URL if needed

### Template Not Detected
- Check server logs for template detection results
- Verify JSONL file format matches expected structure
- Add new template support if format is unknown

### Path Expansion Issues
- `~/` is automatically expanded to your home directory
- Use absolute paths if `~/` expansion fails
- Check `server/src/utils/pathHelper.js` for path resolution logic

## 🚢 Production Deployment

### Using Docker (Coming Soon)

```bash
docker-compose up -d
```

### Manual Production Build

```bash
# Build client
cd client && npm run build

# Start server (serves built client)
cd ../server && NODE_ENV=production npm start
```

Access at: http://localhost:3400

## 📋 Roadmap

- [x] SQLite FTS5 full-text search
- [x] Universal template support (V1/V2/V3)
- [x] Export to JSON/HTML/TXT
- [x] Path portability with `~/` support
- [x] Hot reload development mode
- [ ] Docker deployment
- [ ] WebSocket live updates
- [ ] Authentication for multi-user
- [ ] Conversation analytics dashboard
- [ ] Plugin system for custom parsers
- [ ] Diff viewer for file changes

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📚 Additional Documentation

- [SETUP.md](SETUP.md) - Detailed setup and configuration guide
- [INSTALL.md](INSTALL.md) - Legacy installation instructions

## 💡 Tips

- Use the search page to find conversations across all projects
- Export conversations to share with team members
- Rebuild search index after adding new conversations
- Check `/api/health` endpoint to verify system status
- Use `npm run dev` for the best development experience with hot reload
