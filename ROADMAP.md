# Claudex Roadmap

This document outlines the planned features and improvements for Claudex.

## ✅ Completed (v1.0.0)

- [x] Universal V3 template supporting all Claude Code versions (v1.x, v2-mixed, v2.0+)
- [x] SQLite FTS5 full-text search with highlighting
- [x] Search filters (project, session, role, date range)
- [x] Export to JSON/HTML/TXT formats
- [x] Markdown and code rendering with syntax highlighting
- [x] Diff visualization for file changes
- [x] Tool use and thinking block display
- [x] Portable path configuration (`~/.claude/projects`)
- [x] Hot reload for development
- [x] GitHub Pages documentation site
- [x] Custom Claudex logo and branding
- [x] Comprehensive UI guide documentation

## 🚀 Planned Features

### Search Enhancements
- [ ] Advanced search operators (AND, OR, NOT, phrase matching)
- [ ] Search within specific date ranges
- [ ] Save and reuse search queries
- [ ] Search result export
- [ ] Fuzzy search support
- [ ] Search suggestions/autocomplete

### UI/UX Improvements
- [ ] Dark mode toggle
- [ ] Customizable themes
- [ ] Keyboard shortcuts overlay/help
- [ ] Session bookmarking/favorites
- [ ] Tag/label system for sessions
- [ ] Session notes/annotations
- [ ] Collapsible sidebar
- [ ] Split view (compare two sessions side-by-side)
- [ ] Message threading visualization

### Export & Sharing
- [ ] Markdown export format
- [ ] PDF export with formatting
- [ ] Share session via URL (read-only mode)
- [ ] Export to Notion/Obsidian format
- [ ] Selective export (export specific messages only)

### Analytics & Insights
- [ ] Session statistics (message count, token usage estimates)
- [ ] Project activity timeline
- [ ] Most used tools visualization
- [ ] Conversation length trends
- [ ] Tag cloud of common topics

### Backup & Data Retention
- [ ] **Full conversation backup in SQLite** (store complete message JSON, not just text)
- [ ] **Export conversations from SQLite to .jsonl** (restore deleted conversations)
- [ ] **Batch backup all indexed conversations**
- [ ] **Conversation restore tool** (recover from SQLite after Claude's 30-day deletion)
- [ ] **Auto-backup scheduler** (automatically backup new conversations)
- [ ] **Backup health dashboard** (show coverage, missing files, last backup time)
- [ ] **Selective backup** (choose which projects/sessions to backup)

### Performance
- [ ] Lazy loading for long conversations
- [ ] Virtual scrolling for message lists
- [ ] Index optimization for faster search
- [ ] Pagination for search results
- [ ] Caching layer for frequently accessed sessions

### Integration
- [ ] CLI tool for quick search from terminal
- [ ] VS Code extension
- [ ] Browser extension for quick access
- [ ] Webhook support for real-time updates
- [ ] Import from other conversation formats

### Developer Features
- [ ] Plugin/extension system for custom templates
- [ ] Custom parser hooks
- [ ] GraphQL API alongside REST
- [ ] WebSocket support for real-time updates
- [ ] Docker containerization
- [ ] API authentication/authorization

### Content Features
- [ ] Code extraction tool (extract all code blocks to files)
- [ ] Conversation summarization
- [ ] Auto-tagging using AI
- [ ] Duplicate detection
- [ ] Conversation merging/splitting tools

## 🐛 Known Issues

- None currently reported

## 💡 Ideas for Future Consideration

- Mobile app (React Native)
- Electron desktop app
- Multi-user support with permissions
- Conversation templates/starters
- Integration with Claude API for re-running prompts
- Version control integration (link commits to sessions)
- Collaboration features (shared workspaces)

## 🤝 Contributing

Have a feature idea? Please open an issue on [GitHub](https://github.com/kunwar-shah/claudex/issues) to discuss it!

---

**Last Updated**: 2025-10-03
