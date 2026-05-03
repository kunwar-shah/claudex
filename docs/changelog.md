# Changelog

All notable changes to Claudex.

## [1.3.4] - 2026-05-03

### Fixed
- **sqlite3 native bindings on Node 22** — bumped `sqlite3` from `^5.1.6` to `^6.0.1`. The 5.x line lacks prebuilts for Node 22's ABI (NODE_MODULE_VERSION 127); v6.0.1 ships them. Fixes Glama validation failure and any `npm install -g @kunwarshah/claudex` on Node 22+.

---

## [1.3.3] - 2026-05-01

### Added
- **Official MCP Registry submission** — Claudex is now publishable to `registry.modelcontextprotocol.io` (Anthropic's official MCP registry). MCP clients (Claude Code, Cursor, Codex, Windsurf) can discover Claudex via the registry.
- **`mcpName: io.github.kunwar-shah/claudex`** in package.json — required by the registry verification.
- **`server.json` manifest** at the repo root — describes the package, transport (stdio), and optional env vars.

### UI/UX (large polish pass)
- **Auto-apply visual settings** — theme, font, font size, density, border radius, animations now apply instantly on click. No more "Save & Apply" button for visual changes.
- **Theme preview block** in Settings — each card shows a mini mockup with the theme's primary color, surface, button, and badge. No more global CSS swap on hover.
- **🎲 Surprise Me button** — randomizes ALL visual settings at once (theme, font, size, density, radius, view).
- **Mobile-responsive Settings modal** — full-height bottom sheet on mobile, dialog on desktop. Tabs scroll horizontally on narrow screens.

### Infrastructure
- **Unified `<ToastProvider>` context** — replaces three different toast patterns (Footer DOM hacks, App.jsx prop drilling, SearchPage local state). Stacking, dismissable, ARIA-correct (`role="alert"` for errors, `role="status"` for info).
- **`<ErrorBoundary>` at root** — catches all JS errors with a recovery UI (Try Again / Reload / Go Home / Report Issue with pre-filled GitHub link). Replaces white screen of death.
- **Keyboard shortcuts** — `?` opens help overlay, `/` focuses search, `Esc` closes modals, `g s|m|a` jumps to Search/Manage/Analytics, `Cmd/Ctrl+K` reserved for command palette, `Cmd/Ctrl+,` opens settings.
- **Bundle code-splitting** — initial JS bundle 10× smaller (442 KB → 46 KB gzipped). Routes lazy-loaded. Tremor (1 MB) only loads on Analytics page.
- **ARIA labels** added to icon-only buttons in Settings, Header, SessionSummary, Export, ProjectExport.

### Real Data
- **Real role distribution chart** — Analytics dashboard now uses actual SQL `GROUP BY role` from FTS5 index instead of hardcoded 44/47/9% percentages. New `/api/stats/message-roles` endpoint.
- **Honest "X indexed" badge** — replaces misleading "Live" tag.
- **Custom polished bar chart** — replaces Tremor BarList. Rank numbers, share-of-total %, gradient fills, hover lift, formatted numbers.

### Loading States
- **`<TopProgressBar>`** — global indeterminate progress bar at top of viewport. Activates on any TanStack Query fetch or mutation. 150ms delay to avoid flicker.
- **Skeleton placeholders** for: Manage Sessions table, ConversationThread, SessionList sidebar, SearchPage results, Tremor stat cards, All Projects list, donut chart.
- New shared `<LoadingScreen>`, `<TableLoadingRows>`, `<CardLoadingGrid>`, `<ListLoadingItems>`, `<ModalLoadingContent>` components.

### Fixed
- **Export button 500 error** — session titles with em-dashes (—), quotes, or emoji corrupted the `Content-Disposition` HTTP header. Filename now sanitized to ASCII alphanumeric + dash + underscore.
- **Per-page dropdown value cut off** — wider select with proper right padding for the dropdown arrow.
- **Tags input "Add" button overflowing card** — added `min-w-0` on flex children so input can shrink below browser default min-width.
- **Footer version label** — was stuck at "Claudex v1.2", now shows current version.
- **Copy Context popup behind header** — z-index `z-50` → `z-[10000]`, position moved to clear sticky header.

---

## [1.3.2] - 2026-04-30

### Changed
- **Honest package description** — clarified that Claudex specifically indexes `~/.claude/projects/` (Claude Code JSONL format). The MCP server is consumable by any MCP-compatible client, but the data layer is Claude-Code-only. Previous wording could imply broader scope than is accurate.

### Notes
- v1.3.1 was tagged but not published to npm; v1.3.2 is the first refreshed publish. No functional changes since v1.3.0.

---

## [1.3.1] - 2026-04-30

### Added
- **Hero GIF in README** — animated 18-second walkthrough showing browse, search, and MCP memory tools (PR #39, contributed by @livlign via [Anthropic repo-visuals](https://github.com/anthropics/skills/tree/main/repo-visuals))
- **GitHub Sponsors** enabled — `Sponsor` button now visible on the repo
- **Expanded npm keywords** — added `mcp`, `mcp-server`, `model-context-protocol`, `ai-memory`, `agent-memory`, `persistent-memory`, and more for better discoverability
- **Updated package description** — emphasizes MCP-powered persistent memory

### Changed
- Refreshed `ROADMAP.md` with v1.4.0 / v2.0 / v3.0 milestones (Pro tier, cross-project intelligence, Claudex Cloud)
- Updated package metadata to reflect MCP-first positioning

### Notes
- This was a metadata + documentation release. No functional changes from v1.3.0.
- Tagged in git but **not published to npm** — superseded by v1.3.2 with clearer description.
- Pinned `v2.0 Roadmap — Cross-Project Intelligence` discussion for community feedback.

---

## [1.3.0] - 2026-02-12

### Added
- **MCP Server** - Model Context Protocol server for Claude Code integration
- **10 MCP Tools** - `get_project_context`, `list_projects`, `list_sessions`, `search_conversations`, `get_session`, `get_session_summary`, `store_memory`, `recall_memory`, `list_memories`, `delete_memory`
- **Structured Memory System** - Store coding knowledge (conventions, architecture, decisions, error patterns) in SQLite with priority, confidence, and TTL
- **3 MCP Prompts** - `/recall`, `/catchup`, `/history` for quick access to past sessions
- **MCP Resources** - `claudex://projects` and `claudex://projects/{id}/recent`
- **Token Budgeting** - Three detail levels (minimal/standard/full) for context management
- **Server Instructions** - Proactive tool usage guidance for Claude

### How to Use
```bash
npm install -g @kunwarshah/claudex
claude mcp add --transport stdio claudex -- claudex-mcp
```

See [MCP Server Guide](mcp.md) for full documentation.

---

## [1.2.2] - 2025-11-12 (Coming Soon)

### Added
- 🚀 **npm Package Distribution** - Available on npm as `@kunwarshah/claudex`
- 🎛️ **CLI Flags** - `--port` and `--project-root` for flexible configuration
- 🔧 **Better Error Messages** - Helpful troubleshooting for port conflicts
- 📝 **Comprehensive Help** - Enhanced `--help` with examples and tips

### Improved
- ⚙️ **Production Mode Detection** - Auto-detects built files vs dev mode
- 🐳 **Port Flexibility** - No need to kill processes, just use different port
- 📚 **Documentation** - Complete npm package management guide
- 🛠️ **Developer Experience** - Clear CLI interface with multiple config options

### Features
- Install globally: `npm install -g @kunwarshah/claudex`
- Run anywhere: `claudex` or `claudex --port 3500`
- Zero configuration with sensible defaults
- On-demand dependency installation
- Cross-platform support (Linux, macOS, WSL2)

---

## [1.2.1] - 2025-11-12

### Fixed
- 🐛 Fixed production mode detection in bin script
- 🔧 Server now correctly serves pre-built files from client/dist
- ✅ Eliminated Vite dev server errors in global installations

---

## [1.2.0] - 2025-11-12

### Added
- 🎨 **Theming System** - Complete dark/light mode support (Phase 2)
- 💾 **Session Favorites** - Bookmark important conversations
- 🎭 **Theme Toggle** - User preference persistence
- 🌓 **Dark Mode Variants** - All UI components support theming

### Technical
- Initial npm package structure (workspaces, no postinstall)
- Scoped package: `@kunwarshah/claudex`

---

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
