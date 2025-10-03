# Claudex

A powerful web application for viewing, searching, and analyzing Claude Code conversation histories. Features universal template support (V1.x, V2-mixed, V2.0+), full-text search with SQLite FTS5, and a modern React UI.

## ✨ Key Features

### 🔍 Full-Text Search
- **SQLite FTS5 Engine**: Lightning-fast full-text search across all conversations
- **Advanced Filtering**: Filter by project, role, date range, and template
- **Relevance Scoring**: Results ranked by relevance
- **Persistent Index**: Built once, searches instantly

### 📝 Universal Template Support
- **Claude Code v3 (Universal)**: Handles ALL Claude Code formats
- **Claude Code v2.0+**: New format with direct role field
- **Claude Code v1.x**: Original format support
- **Edge Cases**: Graceful handling of mixed formats
- **Auto-Detection**: Automatically identifies the correct parser

### 🎯 Smart Rendering
- **Markdown Support**: Full CommonMark specification
- **Code Highlighting**: Syntax highlighting for 100+ languages
- **Diff Viewer**: Side-by-side diff visualization
- **Tool Visualization**: Display tool usage and results
- **JSON Formatting**: Pretty-printed JSON with collapsible trees

### 📊 Session Analytics
- **Message Distribution**: Breakdown by role (user/assistant)
- **File Operations**: Track all file changes
- **Conversation Stats**: Total messages, time range, template used
- **Session Summary**: AI-generated conversation overview

### 📋 Export Options
- **JSON Export**: Full conversation data
- **HTML Export**: Standalone, readable HTML
- **TXT Export**: Plain text transcript
- **Copy Messages**: Quick clipboard copy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Claude Code installed with conversations in `~/.claude/projects`

### Installation

```bash
# Clone the repository
git clone https://github.com/kunwar-shah/claudex.git
cd claudex

# Install dependencies
npm install
cd server && npm install && cd ../client && npm install && cd ..

# Configure environment
cd server && cp .env.example .env && cd ..

# Start the application
npm run dev
```

Open http://localhost:3000 in your browser.

## 📚 Documentation

- [Getting Started](getting-started.md) - Installation and setup
- [Search System](search.md) - Using full-text search
- [Templates](templates.md) - Understanding message formats
- [API Reference](api.md) - REST API documentation
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

## 🎯 Use Cases

### For Developers
- **Debug Conversations**: Quickly find specific interactions
- **Code Review**: Search for code snippets across all sessions
- **Documentation**: Export conversations for reference
- **Analysis**: Understand conversation patterns

### For Teams
- **Knowledge Base**: Search team conversations
- **Best Practices**: Find successful prompt patterns
- **Onboarding**: Share conversation examples
- **Reporting**: Generate conversation analytics

## 🔧 Technology Stack

### Backend
- **Fastify**: High-performance Node.js web framework
- **SQLite**: Embedded database with FTS5 full-text search
- **Node.js**: Server-side JavaScript runtime

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool with HMR
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first styling

## 📈 Roadmap

- [x] SQLite FTS5 full-text search
- [x] Universal template support (V1/V2/V3)
- [x] Export to JSON/HTML/TXT
- [x] Path portability with `~/` support
- [x] Hot reload development mode
- [ ] GitHub Pages documentation
- [ ] Docker deployment
- [ ] WebSocket live updates
- [ ] Authentication for multi-user
- [ ] Conversation analytics dashboard
- [ ] Plugin system for custom parsers

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guide](contributing.md) for details.

## 📄 License

MIT License - see [LICENSE](https://github.com/kunwar-shah/claudex/blob/main/LICENSE) for details.

## 🔗 Links

- [GitHub Repository](https://github.com/kunwar-shah/claudex)
- [Issue Tracker](https://github.com/kunwar-shah/claudex/issues)
- [Changelog](changelog.md)

---

Made with ❤️ by [Kunwar Shah](https://github.com/kunwar-shah)
