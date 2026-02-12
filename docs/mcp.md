# MCP Server

Give Claude Code persistent memory across sessions with the Claudex MCP server.

> **New in v1.3.0** - The MCP server adds 10 tools, 3 prompts, and structured memory to Claude Code.

## What is MCP?

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) lets Claude Code connect to external tools and data sources. Claudex MCP gives Claude access to your conversation history, session metadata, and a structured memory system — so it remembers your project across sessions.

**What Claude gets with Claudex MCP:**
- Your recent session titles and activity
- Full-text search across all past conversations
- Structured memory: conventions, architecture, decisions, error patterns
- Session favorites, tags, and notes

## Quick Install

### One-Command Setup

If you already have Claudex installed globally:

```bash
claude mcp add --transport stdio claudex -- claudex-mcp
```

That's it. Claude Code now has access to Claudex tools.

### Install + Register (New Users)

```bash
# Install Claudex globally
npm install -g @kunwarshah/claudex

# Register the MCP server with Claude Code
claude mcp add --transport stdio claudex -- claudex-mcp
```

### Zero-Install (npx)

No global install needed — use npx to run directly:

```bash
claude mcp add --transport stdio claudex -- npx @kunwarshah/claudex mcp
```

> **Note**: The npx approach downloads on first use. Subsequent runs use the cached package.

## Verify Installation

After registering, restart Claude Code and check:

```bash
# List registered MCP servers
claude mcp list
```

You should see `claudex` in the list. Start a new Claude Code session — Claude will automatically have access to all Claudex tools.

## Available Tools

Claudex provides 10 MCP tools that Claude can call:

### Context & Sessions

| Tool | Description |
|------|-------------|
| `get_project_context` | Condensed project snapshot — recent sessions, favorites, memories, stats. **Claude calls this first at session start.** |
| `list_projects` | List all Claude Code projects on your machine |
| `list_sessions` | List sessions for a project with metadata |
| `search_conversations` | Full-text search across all conversations (FTS5) |
| `get_session` | Get full conversation messages from a session |
| `get_session_summary` | Quick session metadata — title, message count, dates, tags |

### Structured Memory

| Tool | Description |
|------|-------------|
| `store_memory` | Save coding knowledge — conventions, architecture, decisions |
| `recall_memory` | Retrieve stored memories by namespace and type |
| `list_memories` | List all stored memories with stats |
| `delete_memory` | Remove outdated or incorrect memories |

## Memory System

The memory system stores structured coding knowledge in SQLite. Memories survive across sessions and restarts.

### Memory Types

| Type | Use For | Example |
|------|---------|---------|
| `map` | File tree, architecture, entry points | "client/ is React, server/ is Fastify" |
| `convention` | Naming rules, coding patterns, style | "Files: kebab-case.js, Components: PascalCase.jsx" |
| `decision` | Technical choices with rationale | "Chose SQLite over Postgres for zero-infra local-first" |
| `snapshot` | Current focus, blockers (use with TTL) | "Working on auth system, blocked on OAuth config" |
| `dependency` | Key packages, versions, why chosen | "Using Tremor React for charts — Tailwind-native" |
| `error_pattern` | Recurring errors and their fixes | "db.run doesn't return changes — use db.get first" |

### How Memory Works

Memories are stored as structured JSON with:
- **Priority** (1-10): Higher priority memories are injected first
- **Confidence** (0.0-1.0): How certain the memory is
- **TTL** (hours): Auto-expire stale memories (useful for snapshots)
- **Namespace**: Group memories by domain (default: `codebase`)

Claude automatically stores memories when it discovers important patterns, and recalls them when it needs context.

### Token Budgeting

The `get_project_context` tool supports three detail levels to manage token usage:

| Level | Tokens | What's Included |
|-------|--------|-----------------|
| `minimal` | ~500 | Project stats, session titles, memory count |
| `standard` | ~1500 | Recent sessions with metadata, high-priority memories (7+) |
| `full` | ~3000+ | 10 sessions with topic hints, all memories |

Claude picks the appropriate level based on available context.

## Available Prompts

Claudex registers 3 prompts you can use as slash commands:

| Prompt | Usage | Description |
|--------|-------|-------------|
| `/mcp__claudex__recall` | `/mcp__claudex__recall topic:auth` | Search conversation history for a topic |
| `/mcp__claudex__catchup` | `/mcp__claudex__catchup` | Summary of recent project work |
| `/mcp__claudex__history` | `/mcp__claudex__history count:20` | Browse recent sessions with titles |

## Available Resources

MCP resources provide data Claude can read on-demand:

| Resource | URI | Description |
|----------|-----|-------------|
| Projects | `claudex://projects` | All projects with session counts |
| Recent Sessions | `claudex://projects/{id}/recent` | Recent sessions for a project |

## CLAUDE.md Integration

For the best experience, add these instructions to your project's `CLAUDE.md` file. This tells Claude to use Claudex tools proactively:

```markdown
## Claudex MCP — Persistent Memory

You have access to Claudex MCP tools for persistent memory.

**On session start:**
1. Call `get_project_context` to load project memory
2. Review stored conventions and decisions before writing code

**During work:**
- When you discover important patterns or make decisions, call `store_memory`
- When you need context about past work, call `recall_memory` or `search_conversations`

**Memory types:** map, convention, decision, snapshot, dependency, error_pattern
```

## How It Works

```
Claude Code                    Claudex MCP
    │                              │
    │  (stdio JSON-RPC)            │
    ├──────────────────────────────►│
    │  get_project_context         │──► SQLite (sessions + memories)
    │◄──────────────────────────────│
    │  {recent sessions, memories} │
    │                              │
    │  store_memory                │
    ├──────────────────────────────►│──► SQLite INSERT/UPSERT
    │  "Memory stored"             │
    │◄──────────────────────────────│
    │                              │
    │  search_conversations        │
    ├──────────────────────────────►│──► FTS5 full-text search
    │  {matching sessions}         │
    │◄──────────────────────────────│
```

- **Transport**: stdio (stdin/stdout JSON-RPC) — zero network, no ports, no auth
- **Database**: Shared SQLite with the Claudex web app (WAL mode for concurrent access)
- **Auto-detection**: Project ID derived from CWD — tools default to the current project

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PROJECT_ROOT` | `~/.claude/projects` | Path to Claude Code projects directory |

### Custom Projects Path

If your Claude projects are in a non-standard location:

```bash
claude mcp add --transport stdio claudex -- env PROJECT_ROOT=/custom/path claudex-mcp
```

## Troubleshooting

### MCP server not showing in Claude Code

```bash
# Check if registered
claude mcp list

# Re-register
claude mcp remove claudex
claude mcp add --transport stdio claudex -- claudex-mcp
```

### "claudex-mcp: command not found"

Make sure Claudex is installed globally:

```bash
npm install -g @kunwarshah/claudex

# Verify
which claudex-mcp
```

### Tools not returning data

The MCP server auto-detects your project from CWD. Make sure Claude Code is running from a directory that has matching conversations in `~/.claude/projects/`.

### Checking MCP server logs

The MCP server writes diagnostic logs to stderr. To see them:

```bash
# Test manually
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | claudex-mcp
```

### Database locked errors

If you see "database is locked", the web server and MCP server are competing for the SQLite file. This is handled automatically with WAL mode and busy timeout, but if it persists:

```bash
# Restart Claude Code to reset the MCP server connection
```

## Uninstall

```bash
# Remove from Claude Code
claude mcp remove claudex

# Uninstall globally (optional)
npm uninstall -g @kunwarshah/claudex
```

## Platform Support

| Platform | Status |
|----------|--------|
| Linux | Supported |
| macOS | Supported |
| Windows (WSL2) | Supported |
| Windows (native) | Not tested |

## Next Steps

- [Getting Started](getting-started.md) — Install the full Claudex web viewer
- [Features](features.md) — All Claudex features
- [Search System](search.md) — Full-text search documentation
- [API Reference](api.md) — REST API endpoints
