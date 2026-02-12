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
import { getProjectRoot } from '../utils/pathHelper.js'
import { registerTools } from './tools.js'
import { registerResources } from './resources.js'

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

  const fileScanner = new FileScanner(projectRoot)
  const sessionParser = new SessionParser()

  services = { searchDb, metadataService, fileScanner, sessionParser, currentProjectId }
  console.error(`[claudex-mcp] Services initialized (project: ${currentProjectId}, projects: ${projectRoot})`)
  return services
}

// ─── Create MCP server ─────────────────────────────────────────────
const server = new McpServer({
  name: 'claudex',
  version: pkg.version,
})

// Register tools and resources
registerTools(server, getServices)
registerResources(server, getServices)

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
