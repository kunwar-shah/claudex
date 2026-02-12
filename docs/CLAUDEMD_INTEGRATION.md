# Claudex MCP — CLAUDE.md Integration Guide

Add the following snippet to your project's `CLAUDE.md` to make Claude Code proactively use Claudex for session memory.

## Quick Setup

### 1. Register Claudex MCP (one-time)

```bash
# If installed globally
claude mcp add --transport stdio claudex -- claudex-mcp

# Or with npx (zero-install)
claude mcp add --transport stdio claudex -- npx @kunwarshah/claudex mcp
```

### 2. Add to your CLAUDE.md

Copy this block into your project's `CLAUDE.md`:

```markdown
## Session Memory (Claudex)

This project uses Claudex MCP for persistent session memory.

**At session start**: Call `get_project_context` to load recent work, favorited sessions, and project stats.

**When referencing past work**: Use `search_conversations` to find previous discussions, decisions, or implementations.

**Available prompts**:
- `/mcp__claudex__recall <topic>` — Search past conversations for a topic
- `/mcp__claudex__catchup` — Summarize recent project activity
- `/mcp__claudex__history` — List recent sessions with titles

**Rules**:
- All tools default to the current project (no projectId needed)
- Use `allProjects=true` in search_conversations only when explicitly needed
- Prefer `get_session_summary` over `get_session` when you only need metadata
- Never dump full session contents into responses unless the user asks
```

## What This Does

By adding these instructions to CLAUDE.md, Claude Code will:

1. **Automatically load context** at the start of each session
2. **Search past conversations** when you reference previous work
3. **Know about your favorited sessions** (pinned important context)
4. **Understand prompt shortcuts** for quick memory access

## Verification

After setup, start a new Claude Code session in your project. You should see Claude call `get_project_context` as one of its first actions. If it doesn't, check:

```bash
# Verify MCP is registered
claude mcp list

# Check MCP server works
claude mcp get claudex
```

## Advanced: Hook-Based Auto-Injection

For automatic context injection on every session start (without relying on CLAUDE.md), you can use Claude Code hooks. See the [hooks documentation](https://docs.anthropic.com/en/docs/claude-code/hooks) for setup.

Example `.claude/settings.json` hook:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "echo '💡 Use /mcp__claudex__catchup to load project context from previous sessions'"
          }
        ]
      }
    ]
  }
}
```
