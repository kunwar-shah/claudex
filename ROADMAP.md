# Claudex Roadmap

**Current Version**: v1.3.0 (MCP release)
**Last Updated**: 2026-04-30
**License**: MIT (intentional — broader adoption than competitors locked behind PolyForm/Commercial)

---

## 🎯 The Vision: One Tool, Right Tool

**Claudex is the single tool every Claude Code user installs to make AI agents reliably remember everything across projects, sessions, and time.**

The problem: Claude Code conversations vanish after 30 days. Every project is a fresh memory — your past decisions, conventions, debugged patterns, and architectural choices disappear. Today devs duct-tape this with screenshots, manual notes, scattered MCP servers, and copy-paste rituals. None of it composes.

**Claudex solves the entire stack with one install:**

| Concern | Other tools (today) | Claudex |
|---------|---------------------|---------|
| View past conversations | scroll JSONL manually, custom scripts | ✅ Web UI + FTS5 search |
| Persistent memory for AI agents | piecemeal MCP servers, vector DBs | ✅ Built-in MCP server (v1.3.0) |
| Code structure context | GitNexus, repomix, code2prompt | 🚀 v2.0 (tree-sitter integration) |
| Cross-project knowledge | none | 🚀 v2.0 (cross-project search) |
| Team knowledge sharing | Notion / Confluence / Slack threads | ☁️ v3.0 (Claudex Cloud) |
| Decision archaeology | git blame + memory | 🚀 v2.0 (timeline UI) |

We don't try to be GitNexus. **GitNexus = current code structure (graph). Claudex = the temporal/decision layer.** Both can run side-by-side; Claudex is the one with the conversation history nobody else can replicate.

---

## ✅ Shipped (v1.0 → v1.3.0)

### v1.0.0 — Oct 3, 2025 — Initial Release
- Universal V3 Parser (auto-detects v1.x, v2-mixed, v2.0+ Claude Code formats)
- SQLite FTS5 search with project/session/role/date filters
- Markdown + code rendering with syntax highlighting
- Diff visualization for tool-edited files
- Tool use and thinking block display
- Export to JSON / HTML / TXT
- Portable path config (`~/.claude/projects`)
- GitHub Pages docs site
- MIT license

### v1.1.0 — Oct 27, 2025 — Performance + Tremor
- Smart titles (auto-extract from first user message)
- Tremor analytics dashboard (charts, project activity, message counts)
- Docker multi-platform images (~200 MB amd64/arm64)
- 121× faster search index rebuild
- Hot reload for development

### v1.1.1 — Oct 31, 2025
- Fixed duplicate message ID bug in V3 parser
- MIT license confirmed

### v1.2.0 — Nov 11, 2025 — Theming + Settings
- 10 color themes (Default, Emerald, Green, Blue, Purple, Orange, Red, Rose, Yellow, Classic)
- 29 font families with visual preview (Inter, Geist, Roboto, Poppins, …)
- Font size scale (5 levels)
- Configurable border radius
- 6-tab Settings modal (Appearance, Search, Sessions, Display, Data, Advanced)

### v1.2.4 — Current production
- Auto-index with configurable age threshold
- Theme-aware toast notification system
- All settings tabs functional
- Title XML tag stripping fix (PR #26)
- User filter tool results fix (PR #27)
- Session bookmarking + favorites full-stack (PR #28)
- Project loading state polish (PR #29)
- Disabled aggressive auto-index on page load (PR #30)

### v1.3.0 — MCP Release (current)
- **Claudex MCP Server** (stdio transport, JSON-RPC) — turns Claudex into a memory backend for Claude Code, Cursor, Codex, Windsurf
- Project-scoped MCP tools by default (PR #32)
- Memory MCP tools, instructions, prompts (PR #33 — MCP v2)
- npm package: `@kunwarshah/claudex`
- README + docs updated with MCP user guide
- 86 GitHub stars, 9 forks (and growing)

---

## 🛠 In Progress — v1.4.0

### Token & Cost Awareness (Pro feature)
- [ ] Token cost calculator: per-session, per-project, per-month rollups
- [ ] Cost-by-model breakdown (Sonnet vs Opus vs Haiku)
- [ ] Burn-rate alerts (configurable per-project monthly budget)
- [ ] Cost timeline chart in Tremor dashboard

### License Key System (foundation for Pro/Enterprise)
- [ ] Local license validation (no phone-home)
- [ ] Pro feature gating (cost calculator, advanced analytics, AI summaries)
- [ ] License purchase flow on docs site
- [ ] Free tier remains MIT, fully usable forever

### Search Quality
- [ ] Advanced operators: `AND` / `OR` / `NOT` / phrase / `project:` / `session:` / `role:` filters
- [ ] Saved searches (Pro)
- [ ] Search-result export
- [ ] Fuzzy match for typo-tolerant queries

### MCP Polish
- [ ] More tools: `claudex_search_memories`, `claudex_get_decisions`, `claudex_link_files`
- [ ] Streaming responses for long results
- [ ] MCP resource browser in web UI

---

## 🚀 v2.0 — Cross-Project Intelligence

This is where Claudex becomes **irreplaceable**, not just useful.

### Cross-Project Search & Memory
- [ ] **Global search across ALL projects** in `~/.claude/projects/`
- [ ] Cross-project memory cards (a decision once, used everywhere)
- [ ] "Have I solved this before?" — automatic similar-issue detection
- [ ] Per-project + global memory scopes (like CSS specificity)

### Code Awareness (the GitNexus-adjacent piece, done differently)
- [ ] **Tree-sitter integration** — parse code files referenced in conversations
- [ ] Link memory cards to actual code entities (function, class, file, line range)
- [ ] "What did we discuss about `parseSession()`?" — query memories by symbol
- [ ] Auto-detect when referenced code has changed since the memory was created (staleness flag)
- [ ] Multi-language support: TS/JS, Python, Go, Rust, Java (Wave 1); add per demand

### Decision Archaeology
- [ ] **Timeline view** — visualize project evolution through conversations
- [ ] Decision provenance ("when did we choose Vite over Webpack? here's the convo")
- [ ] Mistake database (failed attempts auto-tagged → don't repeat)
- [ ] Pattern detection ("you've debugged this exact error 3 times")
- [ ] Conversation graph: which sessions reference which files / each other

### Auto-Extraction Pipeline
- [ ] Detect conventions, decisions, patterns automatically from conversations
- [ ] Domain templates (Software Dev, Healthcare, Legal, Finance) — different extraction rules per domain
- [ ] Confidence-scored memories (high-confidence auto-stored, low-confidence flagged for review)
- [ ] Memory aging policies (decay unused memories, promote frequently accessed)

### Performance for Large Histories
- [ ] Lazy loading + virtual scrolling for long conversations
- [ ] Pagination for search results
- [ ] Caching layer for frequently accessed sessions
- [ ] Index optimization (incremental updates, not full rebuild)

### Backup & Recovery (already partially in v1.x backlog)
- [ ] Full conversation backup in SQLite (complete message JSON, not just text)
- [ ] Export SQLite → JSONL (restore deleted conversations)
- [ ] Auto-backup scheduler (run before Claude's 30-day deletion)
- [ ] Backup health dashboard (coverage %, missing files, last backup)
- [ ] Selective backup per project/session

---

## ☁️ v3.0 — Claudex Cloud (the hosted advantage)

GitNexus's PolyForm Noncommercial license **blocks them from offering hosted commercial competition**. Claudex's MIT license + cloud strategy is a structural moat.

### Optional Cloud Sync (privacy-first)
- [ ] End-to-end encrypted sync of memory cards (server can't read content)
- [ ] Local SQLite stays the source of truth — cloud is replication
- [ ] Multi-device: same memories on laptop, desktop, server
- [ ] Selective sync (per project, per memory type)
- [ ] Free tier: 1 device + read-only web access

### Web App (claudex.cloud)
- [ ] Browser access to your memories from anywhere
- [ ] Mobile-responsive layout (no separate native app needed)
- [ ] Public share links for select sessions/memories (read-only, expirable)
- [ ] Embed widget for blogs / wikis ("here's the decision that led to this")

### Team Workspaces
- [ ] Shared organization memory (team-wide knowledge base)
- [ ] Member roles (admin, editor, viewer)
- [ ] Memory promotion/demotion (personal → team → org)
- [ ] Team activity dashboard (who's contributing what knowledge)
- [ ] SSO (Google / GitHub / Microsoft)

### Pricing Model (planned)
| Tier | Price | Devices | Cloud sync | Team | Cost analytics | AI summaries |
|------|-------|---------|------------|------|----------------|--------------|
| **Free (MIT)** | $0 | unlimited local | ❌ | ❌ | ❌ | ❌ |
| **Pro** | $X/mo | 3 devices | ✅ | ❌ | ✅ | ✅ |
| **Team** | $Y/seat/mo | unlimited | ✅ | up to 50 | ✅ | ✅ |
| **Enterprise** | custom | unlimited | self-hosted option | unlimited | ✅ | ✅ + SSO + audit + SLA |

---

## 🔌 v4.0 — Ecosystem

Make Claudex the connective tissue across every dev surface.

### Editor Integrations
- [ ] **VS Code extension** — sidebar showing relevant memories for current file/symbol
- [ ] Cursor / Windsurf / Zed — same panel, MCP-driven
- [ ] JetBrains plugin (IntelliJ / WebStorm / PyCharm)

### CLI / Terminal
- [ ] `claudex search "<query>"` — instant terminal search
- [ ] `claudex remember "<note>"` — quick capture
- [ ] `claudex digest` — daily/weekly summary of what you did
- [ ] Shell integrations (zsh / fish autocomplete with prior commands from memory)

### Notification Channels
- [ ] Slack: weekly team digest, on-demand queries via slash command
- [ ] Discord: same as Slack
- [ ] Email: weekly project summary

### Plugin System
- [ ] Custom parsers (extend V3 to other LLM tool formats — Aider, OpenCode, etc.)
- [ ] Custom MCP tools (third-party packages add tools)
- [ ] Custom extraction rules per domain
- [ ] Marketplace for community plugins (revenue-share with creators)

### GitHub Integration
- [ ] PR-aware memories (link memory cards to PRs they came from)
- [ ] GitHub Action: auto-extract decisions from PR descriptions/reviews
- [ ] Issue templates that pre-populate from past similar issues

### API
- [ ] REST API with API key auth
- [ ] WebSocket for real-time updates (memory created/updated)
- [ ] GraphQL for complex queries (Pro+)
- [ ] Webhooks for external integrations

---

## 💡 Idea Backlog (no commitment, open to community input)

- AI auto-tagging of sessions
- Conversation summarization
- Code extraction tool (extract all code blocks from a session into files)
- Conversation merging / splitting
- Duplicate detection
- Mobile native app (probably unnecessary if PWA is good enough)
- Electron desktop app (probably unnecessary if local web UI is good enough)
- Offline-first PWA
- Voice search
- Self-host Claudex Cloud on your own infrastructure
- Browser extension (quick capture of any text into Claudex memory)
- Conversation templates / starters for common workflows

---

## 🆚 Why Claudex (Competitive Landscape)

| Tool | What it does | Where Claudex differs |
|------|-------------|----------------------|
| **GitNexus** | Code structure knowledge graph | We provide decision/memory layer (different problem, complementary) |
| **Mem0** | Generic LLM memory API | We're Claude-Code-native; we own the JSONL format |
| **Repomix / code2prompt** | Pack repo as LLM context | We persist *interactions over time*, not just current state |
| **Notion / Obsidian** | Manual notes | We auto-capture + auto-extract; not yet-another-thing-to-maintain |
| **Vector DBs (Pinecone, Weaviate)** | Embedding search | We're zero-infra (SQLite FTS5) for free tier; cloud is opt-in |

**Claudex's unique moat**: your conversation history is **unrepeatable training data**. No other tool has it. We expose it as a memory layer for any agent.

---

## 🐛 Known Issues / Tech Debt

- [ ] Working tree shows file mode bit flips (WSL artifact) — recommend `git config core.filemode false`
- [ ] zod v3 vs v4 compatibility for MCP SDK (active blocker)
- [ ] Auto-index sometimes stale on first load — tracked
- [ ] Some font previews don't load on slow connections — add fallback

---

## 🤝 Contributing

Have a feature idea? Open a [GitHub issue](https://github.com/kunwar-shah/claudex/issues) or join the [Discussions](https://github.com/kunwar-shah/claudex/discussions).

For external contributors: PRs are welcome but go through the security audit checklist in [`/.claude/security`](https://github.com/kunwar-shah/claudex) before merging — we've been targeted by Lazarus-style supply-chain attacks before.

---

## 📜 Version History Index

| Version | Date | Theme |
|---------|------|-------|
| v1.0.0 | 2025-10-03 | Initial release — search + parse |
| v1.1.0 | 2025-10-27 | Tremor dashboard + Docker |
| v1.2.0 | 2025-11-11 | Themes + Settings |
| v1.2.4 | 2026-02 | Auto-index + bookmarks + toast |
| **v1.3.0** | **2026-03** | **MCP server** (current) |
| v1.4.0 | Q2 2026 | Token costs + License system |
| v2.0.0 | Q3 2026 | Cross-project intelligence + tree-sitter |
| v3.0.0 | Q4 2026 | Claudex Cloud (hosted) |
| v4.0.0 | 2027 | Ecosystem + editor integrations |

---

*Roadmap is directional, not contractual. Priorities adjust based on user feedback, security incidents, and what makes Claudex more useful as the single tool.*
