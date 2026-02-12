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

  // ─── get_project_context ────────────────────────────────────────
  server.tool(
    'get_project_context',
    'Get a condensed context snapshot for the current project. Call this at the START of every session to load project memory: recent sessions, favorited sessions, and project stats. This is your primary memory tool — use it before doing any work.',
    {
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
      detail: z.enum(['minimal', 'standard', 'full']).default('standard').optional().describe('Detail level for token budgeting: "minimal" (~500 tokens), "standard" (~1500 tokens, default), "full" (~3000+ tokens)'),
    },
    async ({ projectId, detail = 'standard' }) => {
      try {
        const { fileScanner, metadataService, memoryService, sessionParser, currentProjectId } = await getServices()
        const { project, projectId: resolvedId } = await resolveProject(fileScanner, projectId, currentProjectId)

        const sessions = await fileScanner.scanSessions(project.path)
        sessions.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt))

        // ── minimal: just project stats + session titles ──
        if (detail === 'minimal') {
          const titles = sessions.slice(0, 5).map(s => s.title || s.sessionId)
          const memStats = await memoryService.getStats(resolvedId)
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                project: project.name,
                sessions: sessions.length,
                lastActivity: sessions[0]?.lastUpdatedAt || null,
                recentTitles: titles,
                storedMemories: memStats.total,
              }),
            }],
          }
        }

        // ── standard + full: recent sessions with metadata ──
        const sessionCount = detail === 'full' ? 10 : 5
        const recentSessions = await Promise.all(
          sessions.slice(0, sessionCount).map(async (s) => {
            const meta = await metadataService.getMetadata(resolvedId, s.sessionId)
            let topicHint = null
            if (detail === 'full') {
              try {
                const parsed = await sessionParser.parseSession(s.filePath)
                const firstUser = parsed.messages.find(m => m.role === 'user')
                if (firstUser) {
                  const content = typeof firstUser.content === 'string'
                    ? firstUser.content
                    : JSON.stringify(firstUser.content)
                  topicHint = content.slice(0, 200).replace(/\n/g, ' ')
                }
              } catch { /* skip parse errors */ }
            }

            return {
              sessionId: s.sessionId,
              title: meta?.customTitle || s.title || s.sessionId,
              messageCount: s.messageCount,
              lastUpdated: s.lastUpdatedAt,
              isFavorited: meta?.isFavorited || false,
              tags: meta?.tags || [],
              ...(topicHint ? { topicHint } : {}),
            }
          })
        )

        // Get favorited sessions
        const allMeta = await Promise.all(
          sessions.map(async (s) => {
            const meta = await metadataService.getMetadata(resolvedId, s.sessionId)
            return meta?.isFavorited ? {
              sessionId: s.sessionId,
              title: meta?.customTitle || s.title || s.sessionId,
              tags: meta?.tags || [],
              notes: meta?.notes || null,
            } : null
          })
        )
        const favorites = allMeta.filter(Boolean)

        // Get stored memories (high-priority ones for context)
        const highPriorityMemories = await memoryService.recall({
          projectId: resolvedId,
          limit: detail === 'full' ? 20 : 10,
        })
        // Filter to priority >= 7 for standard, all for full
        const memories = detail === 'full'
          ? highPriorityMemories
          : highPriorityMemories.filter(m => m.priority >= 7)

        const memStats = await memoryService.getStats(resolvedId)

        const context = {
          project: {
            id: resolvedId,
            name: project.name,
            totalSessions: sessions.length,
            lastActivity: sessions[0]?.lastUpdatedAt || null,
          },
          recentSessions,
          favoritedSessions: favorites.slice(0, 10),
          memories: memories.length > 0 ? memories : undefined,
          memoryStats: memStats,
          summary: `Project "${project.name}" has ${sessions.length} sessions, ${memStats.total} stored memories. Last activity: ${sessions[0]?.lastUpdatedAt || 'unknown'}. ${favorites.length} favorited sessions.`,
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(context, null, 2),
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error getting project context: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

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
    'List sessions for a project. Defaults to the current project. Pass projectId to target a different project. Use this when the user asks about previous conversations, or when you need to find a specific session.',
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
    'Search conversations using full-text search. Defaults to the current project. Set allProjects=true to search across all projects, or pass a specific projectId. Use this when the user asks "did we discuss X before?" or references past work, decisions, or code changes.',
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
    'Get the full conversation from a session. Defaults to the current project. Use this when you need to read the actual messages from a past session — e.g., to recall implementation details, decisions made, or code that was written.',
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
    'Get a quick summary of a session — title, message count, dates, tags, favorites, and token stats. Defaults to the current project. Cheaper than get_session when you only need metadata, not full messages.',
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

  // ─── store_memory ───────────────────────────────────────────────
  server.tool(
    'store_memory',
    'Store a structured memory for the current project. Use this when you discover important codebase patterns, conventions, decisions, or architecture details that should persist across sessions. Memories are stored in SQLite and survive restarts.',
    {
      namespace: z.string().default('codebase').describe('Memory group (default: "codebase"). Use "codebase" for coding memories.'),
      memoryType: z.string().describe('Memory kind: "map" (file tree, architecture), "convention" (coding rules, patterns), "decision" (technical choices + rationale), "snapshot" (current focus/blockers, use with ttlHours), "dependency" (key packages), "error_pattern" (recurring fixes)'),
      key: z.string().describe('Unique identifier within namespace+type (e.g., "file-tree", "naming-convention", "chose-sqlite-over-postgres")'),
      value: z.any().describe('The memory content — structured JSON preferred (e.g., {"pattern": "camelCase", "scope": "variables"})'),
      priority: z.number().min(1).max(10).default(5).optional().describe('Injection priority 1-10 (10 = always inject, 5 = default, 1 = low priority)'),
      confidence: z.number().min(0).max(1).default(1.0).optional().describe('Confidence 0.0-1.0 (1.0 = certain, lower = inferred)'),
      ttlHours: z.number().optional().describe('Auto-expire after N hours (use for snapshots/focus, omit for permanent memories)'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
    },
    async ({ namespace = 'codebase', memoryType, key, value, priority = 5, confidence = 1.0, ttlHours, projectId }) => {
      try {
        const { memoryService, currentProjectId } = await getServices()
        const targetProjectId = projectId || currentProjectId

        await memoryService.store({
          projectId: targetProjectId,
          namespace,
          memoryType,
          key,
          value,
          priority,
          confidence,
          ttlHours: ttlHours || null,
        })

        return {
          content: [{
            type: 'text',
            text: `Memory stored: ${namespace}/${memoryType}/${key} (priority: ${priority}, ttl: ${ttlHours ? ttlHours + 'h' : 'permanent'})`,
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error storing memory: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── recall_memory ──────────────────────────────────────────────
  server.tool(
    'recall_memory',
    'Recall stored memories for the current project. Returns memories sorted by priority and recency. Use this to retrieve codebase knowledge, conventions, decisions, and context from previous sessions.',
    {
      namespace: z.string().optional().describe('Filter by namespace (e.g., "codebase"). Omit to get all namespaces.'),
      memoryType: z.string().optional().describe('Filter by type (e.g., "convention", "map", "decision"). Omit to get all types.'),
      key: z.string().optional().describe('Get a specific memory by key'),
      limit: z.number().min(1).max(50).default(20).optional().describe('Max memories to return (default 20)'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
    },
    async ({ namespace, memoryType, key, limit = 20, projectId }) => {
      try {
        const { memoryService, currentProjectId } = await getServices()
        const targetProjectId = projectId || currentProjectId

        const memories = await memoryService.recall({
          projectId: targetProjectId,
          namespace,
          memoryType,
          key,
          limit,
        })

        if (memories.length === 0) {
          const filters = [namespace, memoryType, key].filter(Boolean).join('/')
          return {
            content: [{
              type: 'text',
              text: `No memories found${filters ? ` for ${filters}` : ''}. Use store_memory to save project knowledge.`,
            }],
          }
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(memories, null, 2),
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error recalling memory: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── list_memories ──────────────────────────────────────────────
  server.tool(
    'list_memories',
    'List all stored memories for the current project with stats. Shows namespace, type, key, priority. Useful for understanding what knowledge is stored.',
    {
      namespace: z.string().optional().describe('Filter by namespace'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
    },
    async ({ namespace, projectId }) => {
      try {
        const { memoryService, currentProjectId } = await getServices()
        const targetProjectId = projectId || currentProjectId

        const [memories, stats] = await Promise.all([
          memoryService.list({ projectId: targetProjectId, namespace }),
          memoryService.getStats(targetProjectId),
        ])

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              projectId: targetProjectId,
              stats,
              memories: memories.map(m => ({
                namespace: m.namespace,
                type: m.memory_type,
                key: m.key,
                priority: m.priority,
                confidence: m.confidence,
                updatedAt: m.updated_at,
                expires: m.expires_at,
              })),
            }, null, 2),
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing memories: ${error.message}` }],
          isError: true,
        }
      }
    }
  )

  // ─── delete_memory ──────────────────────────────────────────────
  server.tool(
    'delete_memory',
    'Delete a specific memory by namespace, type, and key. Use when a memory is outdated or incorrect.',
    {
      namespace: z.string().describe('Memory namespace'),
      memoryType: z.string().describe('Memory type'),
      key: z.string().describe('Memory key'),
      projectId: z.string().optional().describe('Project ID (defaults to current project)'),
    },
    async ({ namespace, memoryType, key, projectId }) => {
      try {
        const { memoryService, currentProjectId } = await getServices()
        const targetProjectId = projectId || currentProjectId

        const deleted = await memoryService.delete({
          projectId: targetProjectId,
          namespace,
          memoryType,
          key,
        })

        return {
          content: [{
            type: 'text',
            text: deleted
              ? `Deleted memory: ${namespace}/${memoryType}/${key}`
              : `Memory not found: ${namespace}/${memoryType}/${key}`,
          }],
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error deleting memory: ${error.message}` }],
          isError: true,
        }
      }
    }
  )
}
