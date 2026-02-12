#!/usr/bin/env node

/**
 * Claudex MCP Server — CLI entry point
 *
 * Launches the MCP server over stdio transport for Claude Code integration.
 *
 * Usage:
 *   claudex-mcp                   Start MCP server
 *   claudex mcp                   Same (via main CLI)
 *   claude mcp add claudex -- claudex-mcp   Register with Claude Code
 */

const { spawn } = require('child_process')
const path = require('path')

const args = process.argv.slice(2)

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Claudex MCP Server — Model Context Protocol for Claude Code

Usage:
  claudex-mcp              Start the MCP server (stdio transport)
  claudex mcp              Same, via main CLI

Register with Claude Code:
  claude mcp add --transport stdio claudex -- claudex-mcp

Or with npx (zero-install):
  claude mcp add --transport stdio claudex -- npx @kunwarshah/claudex mcp

Available Tools:
  get_project_context      Get condensed project snapshot (call this first!)
  list_projects            List all Claude Code projects
  list_sessions            List sessions for a project
  search_conversations     Full-text search across conversations
  get_session              Get full conversation from a session
  get_session_summary      Get session metadata and stats
  store_memory             Store structured coding knowledge (maps, conventions, decisions)
  recall_memory            Recall stored memories by namespace/type
  list_memories            List all stored memories with stats
  delete_memory            Delete outdated or incorrect memories

Available Prompts:
  /mcp__claudex__recall    Search conversation history for a topic
  /mcp__claudex__catchup   Get summary of recent project work
  /mcp__claudex__history   Browse recent sessions with titles

Available Resources:
  claudex://projects                          All projects
  claudex://projects/{projectId}/recent       Recent sessions

Environment Variables:
  PROJECT_ROOT    Path to Claude projects (default: ~/.claude/projects)
`)
  process.exit(0)
}

// Launch the ES module MCP server directly
// stdio: 'inherit' passes stdin/stdout through for JSON-RPC
const mcpEntry = path.join(__dirname, '..', 'server', 'src', 'mcp', 'index.js')

const child = spawn('node', [mcpEntry], {
  stdio: 'inherit',
  env: { ...process.env },
})

child.on('exit', (code) => process.exit(code || 0))

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
