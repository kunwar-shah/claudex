# Features

Claudex provides a comprehensive set of features for viewing and analyzing Claude Code conversations.

## 🔍 Full-Text Search

### SQLite FTS5 Engine
- **Lightning Fast**: Sub-millisecond search across thousands of messages
- **Relevance Ranking**: Results sorted by match quality
- **Phrase Matching**: Search for exact phrases with quotes
- **Boolean Operators**: AND, OR, NOT support

### Advanced Filtering
- **By Project**: Limit search to specific projects
- **By Role**: Filter user or assistant messages
- **By Date**: Search within date ranges
- **By Template**: Filter by message format

### Search Interface
- Clean, modern search UI
- Real-time results
- Highlight matching text
- Quick navigation to full conversation

## 📝 Universal Template Support

### Template Detection
Automatically detects and parses:
- **Claude Code v3** (Universal)
- **Claude Code v2.0+** (New format)
- **Claude Code v1.x** (Original)
- **Edge Cases** (Mixed formats)

### Role Mapping
- Converts all system messages to assistant
- Binary classification: user/assistant only
- Consistent experience across all formats

## 🎯 Smart Rendering

### Markdown Support
- Full CommonMark specification
- GFM (GitHub Flavored Markdown)
- Tables, lists, blockquotes
- Inline HTML when needed

### Code Highlighting
- 100+ programming languages
- Automatic language detection
- Copy code button
- Line numbers

### Special Content Types
- **Diffs**: Side-by-side file comparisons
- **JSON**: Pretty-printed with syntax highlighting
- **Tool Usage**: Visual display of tool calls
- **File Operations**: Track all file changes

## 📊 Session Analytics

### Message Statistics
- Total message count
- Distribution by role
- Time range analysis
- Template identification

### File Operations
- Files created
- Files modified
- Files deleted
- Diff summaries

### Conversation Metadata
- Session ID and title
- Creation date
- Last updated
- Message count

## 📋 Export Capabilities

### JSON Export
```json
{
  "session": {...},
  "messages": [...],
  "stats": {...},
  "exportedAt": "2025-10-03T..."
}
```

### HTML Export
- Standalone HTML file
- Embedded CSS styling
- Readable formatting
- Print-friendly

### TXT Export
- Plain text transcript
- Timestamp headers
- Role indicators
- Clean formatting

### Copy to Clipboard
- Individual message copy
- Formatted or plain text
- Quick keyboard shortcuts

## 🚀 Performance Features

### Hot Reload
- Frontend: Vite HMR
- Backend: Nodemon auto-restart
- Instant updates during development

### Persistent Search Index
- Build once, search forever
- Incremental updates
- Background indexing
- Minimal CPU usage

### Lazy Loading
- Paginated message loading
- Virtual scrolling for large sessions
- On-demand content rendering
- Smooth 60fps scrolling

## 🎨 User Interface

### Responsive Design
- Desktop optimized
- Mobile friendly
- Tablet support
- Adaptive layouts

### Dark/Light Themes
- Auto system detection
- Manual toggle
- Persistent preference
- Accessible contrast

### Navigation
- Project selector dropdown
- Session list sidebar
- Message thread view
- Summary panel
- Search page

### Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

## 🔧 Developer Features

### API Endpoints
- RESTful design
- JSON responses
- CORS enabled
- Rate limiting ready

### Extensibility
- Plugin architecture
- Custom template parsers
- Middleware support
- Hook system

### Debugging
- Comprehensive logging
- Error tracking
- Performance monitoring
- Development tools

## 📱 Platform Support

### Operating Systems
- ✅ Linux
- ✅ macOS
- ✅ Windows (WSL recommended)

### Browsers
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Node.js
- ✅ Node 18.x
- ✅ Node 20.x (recommended)
- ✅ Node 21.x
