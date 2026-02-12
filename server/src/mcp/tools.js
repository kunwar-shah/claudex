import { z } from 'zod'

/**
 * Register all MCP tools on the server instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => Promise<{fileScanner: import('../services/fileScanner.js').FileScanner, searchDb: import('../services/searchDatabase.js').SearchDatabase, metadataService: import('../services/sessionMetadataService.js').SessionMetadataService, sessionParser: import('../services/sessionParser.js').SessionParser}>} getServices
 */
export function registerTools(server, getServices) {

  // ─── list_projects ───────────────────────────────────────────────
  server.tool(
    'list_projects',
    'List all Claude Code projects available on this machine with session counts.',
    {},
    async () => {
      try {
        const { fileScanner } = await getServices()
        const projects = await fileScanner.scanProjects()

        const results = []
        for (const project of projects) {
          const sessions = await fileScanner.scanSessions(project.path)
          results.push({
            id: project.id,
            name: project.name,
            sessionCount: sessions.length,
            lastModified: project.lastModified,
          })
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing projects: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── list_sessions ───────────────────────────────────────────────
  server.tool(
    'list_sessions',
    'List all sessions for a project with titles, message counts, and dates.',
    {
      projectId: z.string().describe('The project ID (directory name)'),
      limit: z.number().min(1).max(100).default(20).optional().describe('Max sessions to return (default 20)'),
      sortBy: z.enum(['updated', 'title', 'messages']).default('updated').optional().describe('Sort order'),
    },
    async ({ projectId, limit = 20, sortBy = 'updated' }) => {
      try {
        const { fileScanner, metadataService } = await getServices()
        const projects = await fileScanner.scanProjects()
        const project = projects.find(p => p.id === projectId)

        if (!project) {
          return {
            content: [{ type: 'text', text: `Project not found: ${projectId}` }],
            isError: true,
          }
        }

        let sessions = await fileScanner.scanSessions(project.path)

        // Enrich with metadata
        const enriched = await Promise.all(
          sessions.map(async (s) => {
            const meta = await metadataService.getMetadata(projectId, s.sessionId)
            return {
              sessionId: s.sessionId,
              title: meta?.customTitle || s.title || s.sessionId,
              messageCount: s.messageCount,
              lastUpdated: s.lastUpdatedAt,
              createdAt: s.createdAt,
              isFavorited: meta?.isFavorited || false,
              isHidden: meta?.isHidden || false,
              tags: meta?.tags || [],
            }
          })
        )

        // Sort
        if (sortBy === 'updated') {
          enriched.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
        } else if (sortBy === 'title') {
          enriched.sort((a, b) => a.title.localeCompare(b.title))
        } else if (sortBy === 'messages') {
          enriched.sort((a, b) => b.messageCount - a.messageCount)
        }

        const result = enriched.slice(0, limit)

        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing sessions: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── search_conversations ────────────────────────────────────────
  server.tool(
    'search_conversations',
    'Search across all Claude Code conversations using full-text search. Returns matching messages with surrounding context. The search index must be built first via the Search page in Claudex web UI.',
    {
      query: z.string().describe('Search query (supports FTS5 syntax: AND, OR, NOT, "exact phrases")'),
      projectId: z.string().optional().describe('Filter to a specific project ID'),
      limit: z.number().min(1).max(50).default(10).optional().describe('Max results to return (default 10)'),
    },
    async ({ query, projectId, limit = 10 }) => {
      try {
        const { searchDb } = await getServices()
        const results = await searchDb.search({ query, projectId, limit, offset: 0 })

        if (!results.hits || results.hits.length === 0) {
          return {
            content: [{ type: 'text', text: `No results found for: "${query}"` }],
          }
        }

        const formatted = results.hits.map(hit => ({
          project: hit.projectName,
          session: hit.sessionTitle || hit.sessionId,
          sessionId: hit.sessionId,
          role: hit.role,
          snippet: hit.snippet,
          timestamp: hit.timestamp,
          score: hit.score,
        }))

        return {
          content: [{
            type: 'text',
            text: `Found ${results.total} results for "${query}" (showing ${formatted.length}):\n\n${JSON.stringify(formatted, null, 2)}`,
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Search error: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── get_session ─────────────────────────────────────────────────
  server.tool(
    'get_session',
    'Get the full conversation from a specific Claude Code session. Returns messages in order.',
    {
      sessionId: z.string().describe('The session UUID'),
      projectId: z.string().describe('The project ID'),
      maxMessages: z.number().min(1).max(200).default(50).optional().describe('Max messages to return, most recent first (default 50)'),
    },
    async ({ sessionId, projectId, maxMessages = 50 }) => {
      try {
        const { fileScanner, sessionParser } = await getServices()
        const projects = await fileScanner.scanProjects()
        const project = projects.find(p => p.id === projectId)

        if (!project) {
          return {
            content: [{ type: 'text', text: `Project not found: ${projectId}` }],
            isError: true,
          }
        }

        const sessions = await fileScanner.scanSessions(project.path)
        const session = sessions.find(s => s.sessionId === sessionId)

        if (!session) {
          return {
            content: [{ type: 'text', text: `Session not found: ${sessionId}` }],
            isError: true,
          }
        }

        const parsed = await sessionParser.parseSession(session.filePath)
        const messages = parsed.messages.slice(-maxMessages).map(m => ({
          role: m.role,
          content: typeof m.content === 'string'
            ? m.content.slice(0, 2000)
            : JSON.stringify(m.content).slice(0, 2000),
          timestamp: m.timestamp,
          toolsUsed: m.toolsUsed?.map(t => t.name).filter(Boolean) || [],
        }))

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              sessionId,
              projectId,
              template: parsed.template,
              totalMessages: parsed.messages.length,
              returned: messages.length,
              messages,
            }, null, 2),
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error reading session: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── get_session_summary ─────────────────────────────────────────
  server.tool(
    'get_session_summary',
    'Get a quick summary of a session — title, message count, dates, tags, favorite status, and token stats.',
    {
      sessionId: z.string().describe('The session UUID'),
      projectId: z.string().describe('The project ID'),
    },
    async ({ sessionId, projectId }) => {
      try {
        const { fileScanner, sessionParser, metadataService } = await getServices()
        const projects = await fileScanner.scanProjects()
        const project = projects.find(p => p.id === projectId)

        if (!project) {
          return {
            content: [{ type: 'text', text: `Project not found: ${projectId}` }],
            isError: true,
          }
        }

        const sessions = await fileScanner.scanSessions(project.path)
        const session = sessions.find(s => s.sessionId === sessionId)

        if (!session) {
          return {
            content: [{ type: 'text', text: `Session not found: ${sessionId}` }],
            isError: true,
          }
        }

        const meta = await metadataService.getMetadata(projectId, sessionId)
        const parsed = await sessionParser.parseSession(session.filePath)

        const userMessages = parsed.messages.filter(m => m.role === 'user').length
        const assistantMessages = parsed.messages.filter(m => m.role === 'assistant').length

        const summary = {
          sessionId,
          projectId,
          projectName: project.name,
          title: meta?.customTitle || session.title || sessionId,
          messageCount: parsed.messages.length,
          userMessages,
          assistantMessages,
          template: parsed.template,
          createdAt: session.createdAt,
          lastUpdated: session.lastUpdatedAt,
          isFavorited: meta?.isFavorited || false,
          isHidden: meta?.isHidden || false,
          tags: meta?.tags || [],
          notes: meta?.notes || null,
          tokens: parsed.stats?.tokens || null,
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting summary: ${error.message}` }],
          isError: true,
        }
      }
    }
  )
}
