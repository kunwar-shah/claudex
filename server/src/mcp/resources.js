import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'

/**
 * Register all MCP resources on the server instance.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {() => Promise<{fileScanner: import('../services/fileScanner.js').FileScanner, metadataService: import('../services/sessionMetadataService.js').SessionMetadataService}>} getServices
 */
export function registerResources(server, getServices) {

  // ─── Static: all projects ────────────────────────────────────────
  server.resource(
    'projects',
    'claudex://projects',
    { description: 'List of all Claude Code projects on this machine', mimeType: 'application/json' },
    async (uri) => {
      const { fileScanner } = await getServices()
      const projects = await fileScanner.scanProjects()

      const result = await Promise.all(
        projects.map(async (p) => {
          const sessions = await fileScanner.scanSessions(p.path)
          return { id: p.id, name: p.name, sessionCount: sessions.length, lastModified: p.lastModified }
        })
      )

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(result, null, 2),
        }],
      }
    }
  )

  // ─── Dynamic: recent sessions for a project ─────────────────────
  server.resource(
    'recent-sessions',
    new ResourceTemplate('claudex://projects/{projectId}/recent', { list: undefined }),
    { description: 'Recent sessions for a specific project (last 10)', mimeType: 'application/json' },
    async (uri, { projectId }) => {
      const { fileScanner, metadataService } = await getServices()
      const projects = await fileScanner.scanProjects()
      const project = projects.find(p => p.id === projectId)

      if (!project) {
        return { contents: [{ uri: uri.href, text: JSON.stringify({ error: 'Project not found' }) }] }
      }

      const sessions = await fileScanner.scanSessions(project.path)
      sessions.sort((a, b) => new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt))

      const recent = await Promise.all(
        sessions.slice(0, 10).map(async (s) => {
          const meta = await metadataService.getMetadata(projectId, s.sessionId)
          return {
            sessionId: s.sessionId,
            title: meta?.customTitle || s.title || s.sessionId,
            messageCount: s.messageCount,
            lastUpdated: s.lastUpdatedAt,
            isFavorited: meta?.isFavorited || false,
            tags: meta?.tags || [],
          }
        })
      )

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(recent, null, 2),
        }],
      }
    }
  )
}
