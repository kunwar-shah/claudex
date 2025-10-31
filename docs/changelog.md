# Changelog

All notable changes to Claudex.

## [1.1.1] - 2025-10-31

### Fixed
- 🐛 Fixed duplicate message IDs causing intermittent empty session display ([PR #7](https://github.com/kunwar-shah/claudex/pull/7))
- 🔑 Implemented line-based unique ID generation for multi-part messages
- ⚛️ Resolved React duplicate key warnings in console
- 💬 Ensured all 78 messages render correctly without ID conflicts

### Technical Details
- Added `makeUniqueId()` helper combining source ID with line number
- Updated all 14 parsing methods to accept `lineNumber` parameter
- New ID format: `{sourceId}-L{lineNumber}` guarantees uniqueness
- Handles Claude Code's .jsonl format with multiple lines per conversation turn

### Community Improvements
- 📄 Added MIT LICENSE file for GitHub API discoverability ([PR #8](https://github.com/kunwar-shah/claudex/pull/8))
- 🚀 Created `quick-start.sh` leveraging existing system checker
- 📚 Updated documentation to reflect recent developments

---

## [1.1.0] - 2025-10-27

### Added
- 🎯 Smart title extraction from session content ([PR #2](https://github.com/kunwar-shah/claudex/pull/2))
- 📊 Re-enabled Tremor analytics dashboard with proper color system
- 🐳 Docker multi-platform support (amd64, arm64) with optimized images
- 🔧 System checker with auto-fix capabilities (`npm run check:fix`)
- ⚡ 121x performance optimization for async search index rebuild

### Improved
- 🎨 Fixed Tremor chart color system (Tailwind-based, not hex)
- 📈 Multi-scale data visualization for sessions vs messages
- 🏗️ Docker health checks and non-root user security
- 📝 Comprehensive branch protection and PR workflow

### Docker Features
- Multi-stage build for optimized image size (~200MB)
- Read-only volume mounts for Claude projects directory
- Persistent volumes for search index and logs
- Automatic health monitoring
- Log rotation (10MB max, 3 file rotation)

### Documentation
- Added Docker deployment guide
- Updated system checker documentation
- Improved troubleshooting guide

---

## [1.0.0] - 2025-10-03

### Added
- ✨ V3 universal template support (all Claude Code versions)
- 🔍 SQLite FTS5 full-text search
- 📸 Automated screenshot capture
- 📚 Complete Docsify documentation site
- 🎨 Custom Claudex logo
- 📋 Export in JSON/HTML/TXT formats
- 🌐 GitHub Pages documentation
- 📖 Comprehensive UI guide
- ⚡ Hot reload development mode
- 🏠 Path portability with ~/expansion

### Features
- Universal template detection (v1/v2/v3)
- Real-time search with filters
- Session analytics
- Message distribution stats
- File operations tracking
- Markdown rendering
- Code syntax highlighting
- Copy to clipboard
- Expand/collapse messages
- Tool usage visualization

### Documentation
- Getting started guide
- Feature documentation
- Search system guide
- UI guide with micro-level details
- API reference
- Contributing guide
- Troubleshooting guide

## Project Links

- [Repository](https://github.com/kunwar-shah/claudex)
- [Documentation](https://kunwar-shah.github.io/claudex/)
- [Issues](https://github.com/kunwar-shah/claudex/issues)
