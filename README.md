# Claude Code Conversations Viewer

A web application for viewing and browsing Claude Code conversation histories stored in `~/.claude/projects`. This tool provides a clean, searchable interface to explore your Claude Code sessions with support for multiple JSONL templates, markdown rendering, and conversation analysis.

## Features

- 📁 **Project Discovery**: Automatically scans and lists all projects from your Claude Code directory
- 🔍 **Full-Text Search**: Search across all conversations with filtering by project, role, and date
- 📝 **Smart Rendering**: Template-aware parsing with support for markdown, code, diffs, and JSON
- 🛠️ **Tool Visualization**: Display tool usage and file operations performed by Claude
- 📊 **Session Summaries**: Automatic extraction of actions, file operations, and conversation metrics  
- 📋 **Copy & Export**: Copy individual messages or export entire sessions
- 🎨 **Responsive UI**: Fixed header/footer with scrollable content area and intuitive navigation
- 🐳 **Docker Ready**: One-command deployment with Docker Compose

## Quick Start

### Local Development

1. **Clone and setup**:
```bash
git clone <repository>
cd claude-viewer
```

2. **Start the backend**:
```bash
cd server
npm install
cp .env.example .env
# Edit .env to set PROJECT_ROOT to your Claude projects directory
npm run dev
```

3. **Start the frontend** (in another terminal):
```bash
cd client
npm install
npm run dev
```

4. **Open your browser**: http://localhost:3000

### Docker Deployment

1. **Using Docker Compose** (recommended):
```bash
# Edit docker-compose.yml to set the correct path to your Claude projects
docker-compose up -d
```

2. **Using Docker directly**:
```bash
docker build -t claude-viewer .
docker run -p 3400:3400 -v ~/.claude/projects:/app/data:ro claude-viewer
```

Access the application at http://localhost:3400

## Configuration

### Environment Variables

**Server** (`.env` file):
```bash
PROJECT_ROOT=/home/user/.claude/projects  # Path to Claude projects directory
PORT=3400                                 # Server port
NODE_ENV=development                      # Environment mode
```

**Docker** (`docker-compose.yml`):
```yaml
volumes:
  - ~/.claude/projects:/app/data:ro  # Mount your Claude projects (read-only)
```

## Architecture

### Backend (Node.js + Fastify)
- **File Scanner**: Discovers projects and sessions from the filesystem
- **Template Detection**: Automatically identifies JSONL format variants
- **Message Parser**: Converts raw JSONL to canonical message format
- **Search Engine**: Full-text search across conversations
- **REST API**: Serves data to the frontend

### Frontend (React + Vite)
- **Project Selector**: Dropdown to choose active project
- **Session Browser**: Left sidebar listing conversation sessions
- **Message Thread**: Main conversation view with rich rendering
- **Summary Panel**: Right sidebar with session metadata and actions
- **Search Interface**: Global search with filtering options

## Supported JSONL Templates

The parser automatically detects and supports multiple Claude Code conversation formats:

- **Claude V1**: Standard `role`/`content`/`timestamp` format
- **Claude V2**: Enhanced format with `tool_use`/`tool_result` fields  
- **Tool Heavy**: System-focused format with embedded tool results
- **Embedded**: Nested message structures
- **Generic**: Fallback parser for unknown formats

## API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects/:id/sessions` | GET | Get sessions for project |  
| `/api/projects/:id/sessions/:sessionId` | GET | Get full session with messages |
| `/api/projects/:id/sessions/:sessionId/messages/:msgId` | GET | Get individual message |
| `/api/search` | POST | Search conversations |
| `/api/health` | GET | Health check |

## Development

### Project Structure
```
claude-viewer/
├── server/          # Node.js backend
│   ├── src/
│   │   ├── parsers/    # JSONL template parsers
│   │   ├── services/   # File scanning & session parsing
│   │   ├── routes/     # API endpoints
│   │   └── server.js   # Main server
│   └── tests/       # Backend tests
├── client/          # React frontend  
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── services/   # API client
│   │   └── App.jsx     # Main app
│   └── public/      # Static assets
└── docker-compose.yml
```

### Adding New Templates

1. **Update Template Detector** (`server/src/parsers/templateDetector.js`):
```javascript
'my-template': {
  name: 'My Template',
  detect: (samples) => samples.some(s => s.myField),
  parser: 'my-template'
}
```

2. **Add Parser Method** (`server/src/parsers/messageParser.js`):
```javascript
parseMyTemplate(rawMessage) {
  return {
    id: rawMessage.id,
    role: rawMessage.myRole,
    content: rawMessage.myContent,
    // ... map other fields
  };
}
```

### Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests  
cd client && npm test

# E2E tests (TODO)
npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **No projects found**: Verify `PROJECT_ROOT` points to the correct Claude projects directory
2. **Parse errors**: Check server logs for malformed JSONL files - they are logged but skipped
3. **Port conflicts**: Change `PORT` in `.env` or docker-compose ports mapping
4. **Permission denied**: Ensure the application has read access to the Claude projects directory

### Logs

```bash
# Docker logs
docker-compose logs -f claude-viewer

# Development logs
cd server && npm run dev  # Server logs printed to console
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`  
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] SQLite FTS5 indexing for faster search
- [ ] WebSocket live updates for file changes
- [ ] Export to multiple formats (PDF, HTML, CSV)
- [ ] Authentication for multi-user deployments
- [ ] Plugin system for custom parsers
- [ ] Conversation analytics and insights