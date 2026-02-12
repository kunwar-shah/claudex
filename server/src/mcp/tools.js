import { z } from 'zod'

/**
 * Resolve the target project. Falls back to currentProjectId if not specified.
 * Returns { project, projectId } or throws.
 */
async function resolveProject(fileScanner, projectId, currentProjectId) {
  const targetId = projectId || currentProjectId
  const projects = await fileScanner.scanProjects()
  const project = projects.find(p => p.id === targetId)

  if (!project) {
    // Try partial match (user might pass just the short name)
    const partial = projects.find(p =>
      p.name === targetId || p.id.endsWith(`-${targetId}`)
    )
    if (partial) return { project: partial, projectId: partial.id }

    const available = projects.slice(0, 10).map(p => `  ${p.id} (${p.name})`).join('\n')
    throw new Error(
      `Project not found: "${targetId}"\n\nAvailable projects:\n${available}${projects.length > 10 ? `\n  ... and ${projects.length - 10} more` : ''}`
    )
  }

  return { project, projectId: targetId }
}

/**
 * Register all MCP tools on the server instance.
 * Tools default to the current project (auto-detected from CWD).
 */
export function registerTools(server, getServices) {

  // ─── list_projects ───────────────────────────────────────────────
  server.tool(
    'list_projects',
    'List all Claude Code projects on this machine. Shows which project is currently active.',
    {},
    async () => {
      try {
        const { fileScanner, currentProjectId } = await getServices()
        const projects = await fileScanner.scanProjects()

        const results = []
        for (const project of projects) {
          const sessions = await fileScanner.scanSessions(project.path)
          results.push({
            id: project.id,
            name: project.name,
            sessionCount: sessions.length,
            lastModified: project.lastModified,
            isCurrent: project.id === currentProjectId,
          })
        }

        // Put current project first
        results.sort((a, b) => (b.isCurrent ? 1 : 0) - (a.isCurrent ? 1 : 0))

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
    'List sessions for a project. Defaults to the current project. Pass projectId to target a different project.',
    {
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
      limit: z.number().min(1).max(100).default(20).optional().describe('Max sessions (default 20)'),
      sortBy: z.enum(['updated', 'title', 'messages']).default('updated').optional().describe('Sort order'),
    },
    async ({ projectId, limit = 20, sortBy = 'updated' }) => {
      try {
        const { fileScanner, metadataService, currentProjectId } = await getServices()
        const { project, projectId: resolvedId } = await resolveProject(fileScanner, projectId, currentProjectId)

        let sessions = await fileScanner.scanSessions(project.path)

        // Enrich with metadata
        const enriched = await Promise.all(
          sessions.map(async (s) => {
            const meta = await metadataService.getMetadata(resolvedId, s.sessionId)
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
          content: [{
            type: 'text',
            text: `Sessions for "${project.name}" (${sessions.length} total, showing ${result.length}):\n\n${JSON.stringify(result, null, 2)}`,
          }],
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
    'Search conversations using full-text search. Defaults to the current project. Set allProjects=true to search across all projects, or pass a specific projectId.',
    {
      query: z.string().describe('Search query (supports FTS5: AND, OR, NOT, "exact phrases")'),
      projectId: z.string().optional().describe('Search a specific project (defaults to current)'),
      allProjects: z.boolean().default(false).optional().describe('Search across ALL projects instead of just the current one'),
      limit: z.number().min(1).max(50).default(10).optional().describe('Max results (default 10)'),
    },
    async ({ query, projectId, allProjects = false, limit = 10 }) => {
      try {
        const { searchDb, currentProjectId } = await getServices()

        // Determine search scope
        const searchProjectId = allProjects ? undefined : (projectId || currentProjectId)
        const scopeLabel = allProjects
          ? 'all projects'
          : `project "${searchProjectId}"`

        const results = await searchDb.search({
          query,
          projectId: searchProjectId,
          limit,
          offset: 0,
        })

        if (!results.hits || results.hits.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `No results found for "${query}" in ${scopeLabel}. ${!allProjects ? 'Try allProjects=true to search everywhere.' : ''}`,
            }],
          }
        }

        const formatted = results.hits.map(hit => ({
          project: hit.projectName,
          session: hit.sessionTitle || hit.sessionId,
          sessionId: hit.sessionId,
          projectId: hit.projectId,
          role: hit.role,
          snippet: hit.snippet,
          timestamp: hit.timestamp,
          score: hit.score,
        }))

        return {
          content: [{
            type: 'text',
            text: `Found ${results.total} results for "${query}" in ${scopeLabel} (showing ${formatted.length}):\n\n${JSON.stringify(formatted, null, 2)}`,
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
    'Get the full conversation from a session. Defaults to the current project.',
    {
      sessionId: z.string().describe('The session UUID'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
      maxMessages: z.number().min(1).max(200).default(50).optional().describe('Max messages, most recent first (default 50)'),
    },
    async ({ sessionId, projectId, maxMessages = 50 }) => {
      try {
        const { fileScanner, sessionParser, currentProjectId } = await getServices()
        const { project, projectId: resolvedId } = await resolveProject(fileScanner, projectId, currentProjectId)

        const sessions = await fileScanner.scanSessions(project.path)
        const session = sessions.find(s => s.sessionId === sessionId)

        if (!session) {
          return {
            content: [{ type: 'text', text: `Session not found: ${sessionId} in project "${project.name}"` }],
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
              projectId: resolvedId,
              projectName: project.name,
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
    'Get a quick summary of a session — title, message count, dates, tags, favorites, and token stats. Defaults to the current project.',
    {
      sessionId: z.string().describe('The session UUID'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
    },
    async ({ sessionId, projectId }) => {
      try {
        const { fileScanner, sessionParser, metadataService, currentProjectId } = await getServices()
        const { project, projectId: resolvedId } = await resolveProject(fileScanner, projectId, currentProjectId)

        const sessions = await fileScanner.scanSessions(project.path)
        const session = sessions.find(s => s.sessionId === sessionId)

        if (!session) {
          return {
            content: [{ type: 'text', text: `Session not found: ${sessionId} in project "${project.name}"` }],
            isError: true,
          }
        }

        const meta = await metadataService.getMetadata(resolvedId, sessionId)
        const parsed = await sessionParser.parseSession(session.filePath)

        const userMessages = parsed.messages.filter(m => m.role === 'user').length
        const assistantMessages = parsed.messages.filter(m => m.role === 'assistant').length

        const summary = {
          sessionId,
          projectId: resolvedId,
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
