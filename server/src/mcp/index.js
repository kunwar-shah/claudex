#!/usr/bin/env node

// CRITICAL: Redirect all console.log to stderr to protect the JSON-RPC stdout stream.
// Services like SearchDatabase use console.log which would corrupt MCP communication.
const _origLog = console.log
console.log = (...args) => console.error(...args)

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

import { SearchDatabase } from '../services/searchDatabase.js'
import { SessionMetadataService } from '../services/sessionMetadataService.js'
import { FileScanner } from '../services/fileScanner.js'
import { SessionParser } from '../services/sessionParser.js'
import { MemoryService } from '../services/memoryService.js'
import { getProjectRoot } from '../utils/pathHelper.js'
import { registerTools } from './tools.js'
import { registerResources } from './resources.js'
import { registerPrompts } from './prompts.js'

// Resolve version from package.json
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const pkg = require(path.resolve(__dirname, '../../../package.json'))

// ─── Auto-detect current project from CWD ─────────────────────────
// Claude Code spawns the MCP server from the project's working directory.
// We derive the project ID from CWD so tools default to the current project.
function detectCurrentProjectId() {
  const cwd = process.cwd()
  // Claude Code stores projects as dirs in ~/.claude/projects/
  // Dir name = CWD with / replaced by - (e.g. /home/boss/claude-chats → -home-boss-claude-chats)
  return cwd.replace(/\//g, '-')
}

const currentProjectId = detectCurrentProjectId()

// ─── Lazy service initialization ───────────────────────────────────
let services = null

async function getServices() {
  if (services) return services

  const projectRoot = getProjectRoot()

  // Resolve DB path: same location as the web server uses
  const serverDir = path.resolve(__dirname, '../..')
  const dbPath = path.join(serverDir, 'data', 'search.db')

  const searchDb = new SearchDatabase(dbPath)
  await searchDb.init()

  // Allow concurrent reads with web server (WAL mode + busy timeout)
  await searchDb.db.run('PRAGMA busy_timeout = 5000')

  const metadataService = new SessionMetadataService(searchDb)
  await metadataService.init()

  const memoryService = new MemoryService(searchDb)
  await memoryService.init()

  const fileScanner = new FileScanner(projectRoot)
  const sessionParser = new SessionParser()

  services = { searchDb, metadataService, memoryService, fileScanner, sessionParser, currentProjectId }
  console.error(`[claudex-mcp] Services initialized (project: ${currentProjectId}, projects: ${projectRoot})`)
  return services
}

// ─── Create MCP server ─────────────────────────────────────────────
const server = new McpServer(
  {
    name: 'claudex',
    version: pkg.version,
  },
  {
    instructions: [
      'Claudex gives you persistent memory across Claude Code sessions.',
      'You have access to conversation history, session summaries, and project context from previous sessions.',
      '',
      'USE THESE TOOLS PROACTIVELY:',
      '- At session start: call get_project_context to load project memory (focus, recent work, conventions)',
      '- When you discover important patterns, decisions, or codebase structure: call store_memory to save it',
      '- When you need context about the project: call recall_memory to retrieve stored knowledge',
      '- When the user references past work: call search_conversations to find relevant sessions',
      '- When you need context about what was done before: call get_session_summary or get_session',
      '',
      'MEMORY TYPES (for store_memory/recall_memory):',
      '- namespace "codebase" + type "map": file tree, key paths, entry points, architecture',
      '- namespace "codebase" + type "convention": naming rules, patterns, coding style, preferences',
      '- namespace "codebase" + type "decision": technical decisions with rationale (ADR-style)',
      '- namespace "codebase" + type "snapshot": current focus, blockers, recent work (use ttlHours=24)',
      '- namespace "codebase" + type "dependency": key packages, versions, why chosen',
      '- namespace "codebase" + type "error_pattern": recurring errors and their fixes',
      '',
      'All tools default to the CURRENT project (auto-detected from CWD). You rarely need to specify projectId.',
      'IMPORTANT: Prefer get_project_context as your first call — it returns a condensed snapshot optimized for context injection.',
    ].join('\n'),
  }
)

// Register tools, resources, and prompts
registerTools(server, getServices)
registerResources(server, getServices)
registerPrompts(server)

// ─── Connect stdio transport ───────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(`[claudex-mcp] Claudex MCP server v${pkg.version} running on stdio`)
}

main().catch((error) => {
  console.error('[claudex-mcp] Fatal error:', error)
  process.exit(1)
})

// ─── Graceful shutdown ─────────────────────────────────────────────
async function cleanup() {
  if (services) {
    await services.searchDb?.close()
    await services.metadataService?.close()
  }
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
