import { SessionMetadataService } from '../services/sessionMetadataService.js'

/**
 * Session Metadata API Routes
 *
 * Endpoints for managing custom session names, tags, visibility, and notes.
 * SAFE: Never modifies Claude Code JSONL files - all data stored in separate database table.
 */
export async function sessionMetadataRoutes(fastify, options) {
  const metadataService = new SessionMetadataService()
  await metadataService.init()

  // GET /api/session-metadata/:projectId/:sessionId
  // Get session metadata (custom title, tags, notes, visibility)
  fastify.get('/session-metadata/:projectId/:sessionId', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params

      const metadata = await metadataService.getMetadata(projectId, sessionId)

      if (!metadata) {
        return reply.code(404).send({
          error: 'Metadata not found',
          message: `No custom metadata exists for session ${sessionId} in project ${projectId}`
        })
      }

      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to get session metadata',
        message: error.message
      })
    }
  })

  // PUT /api/session-metadata/:projectId/:sessionId
  // Set or update session metadata (full update)
  fastify.put('/session-metadata/:projectId/:sessionId', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params
      const { customTitle, originalTitle, isHidden, tags, notes } = request.body

      const metadata = await metadataService.setMetadata(projectId, sessionId, {
        customTitle,
        originalTitle,
        isHidden,
        tags,
        notes
      })

      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to set session metadata',
        message: error.message
      })
    }
  })

  // PATCH /api/session-metadata/:projectId/:sessionId/title
  // Update only custom title
  fastify.patch('/session-metadata/:projectId/:sessionId/title', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params
      const { customTitle } = request.body

      if (customTitle === undefined || customTitle === null) {
        return reply.code(400).send({
          error: 'Missing customTitle',
          message: 'Request body must include customTitle field'
        })
      }

      const metadata = await metadataService.setCustomTitle(projectId, sessionId, customTitle)
      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to update session title',
        message: error.message
      })
    }
  })

  // PATCH /api/session-metadata/:projectId/:sessionId/visibility
  // Toggle session visibility (hide/show)
  fastify.patch('/session-metadata/:projectId/:sessionId/visibility', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params

      const metadata = await metadataService.toggleVisibility(projectId, sessionId)
      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to toggle session visibility',
        message: error.message
      })
    }
  })

  // POST /api/session-metadata/:projectId/:sessionId/tags
  // Add tags to session (merges with existing)
  fastify.post('/session-metadata/:projectId/:sessionId/tags', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params
      const { tags } = request.body

      if (!Array.isArray(tags)) {
        return reply.code(400).send({
          error: 'Invalid tags',
          message: 'Tags must be an array of strings'
        })
      }

      const metadata = await metadataService.addTags(projectId, sessionId, tags)
      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to add tags',
        message: error.message
      })
    }
  })

  // DELETE /api/session-metadata/:projectId/:sessionId/tags
  // Remove specific tags from session
  fastify.delete('/session-metadata/:projectId/:sessionId/tags', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params
      const { tags } = request.body

      if (!Array.isArray(tags)) {
        return reply.code(400).send({
          error: 'Invalid tags',
          message: 'Tags must be an array of strings'
        })
      }

      const metadata = await metadataService.removeTags(projectId, sessionId, tags)
      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to remove tags',
        message: error.message
      })
    }
  })

  // PATCH /api/session-metadata/:projectId/:sessionId/notes
  // Set session notes
  fastify.patch('/session-metadata/:projectId/:sessionId/notes', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params
      const { notes } = request.body

      const metadata = await metadataService.setNotes(projectId, sessionId, notes)
      return { metadata }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to set session notes',
        message: error.message
      })
    }
  })

  // DELETE /api/session-metadata/:projectId/:sessionId
  // Delete all custom metadata (restore to default)
  fastify.delete('/session-metadata/:projectId/:sessionId', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params

      await metadataService.deleteMetadata(projectId, sessionId)
      return { success: true, message: 'Session metadata deleted' }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to delete session metadata',
        message: error.message
      })
    }
  })

  // GET /api/session-metadata/:projectId/hidden
  // Get all hidden sessions in a project
  fastify.get('/session-metadata/:projectId/hidden', async (request, reply) => {
    try {
      const { projectId } = request.params

      const hiddenSessions = await metadataService.getHiddenSessions(projectId)
      return { projectId, hiddenSessions, count: hiddenSessions.length }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to get hidden sessions',
        message: error.message
      })
    }
  })

  // GET /api/session-metadata/:projectId/tags/:tag
  // Get all sessions with a specific tag
  fastify.get('/session-metadata/:projectId/tags/:tag', async (request, reply) => {
    try {
      const { projectId, tag } = request.params

      const sessions = await metadataService.getSessionsByTag(projectId, tag)
      return { projectId, tag, sessions, count: sessions.length }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to get sessions by tag',
        message: error.message
      })
    }
  })

  // GET /api/session-metadata/:projectId/tags
  // Get all tags used in a project
  fastify.get('/session-metadata/:projectId/tags', async (request, reply) => {
    try {
      const { projectId } = request.params

      const tags = await metadataService.getAllTags(projectId)
      return { projectId, tags, count: tags.length }
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to get project tags',
        message: error.message
      })
    }
  })

  // POST /api/session-metadata/:projectId/batch/visibility
  // Batch hide/show sessions
  fastify.post('/session-metadata/:projectId/batch/visibility', async (request, reply) => {
    try {
      const { projectId } = request.params
      const { sessionIds, isHidden } = request.body

      if (!Array.isArray(sessionIds)) {
        return reply.code(400).send({
          error: 'Invalid sessionIds',
          message: 'sessionIds must be an array'
        })
      }

      if (typeof isHidden !== 'boolean') {
        return reply.code(400).send({
          error: 'Invalid isHidden',
          message: 'isHidden must be a boolean'
        })
      }

      const result = await metadataService.batchSetVisibility(projectId, sessionIds, isHidden)
      return result
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to batch update visibility',
        message: error.message
      })
    }
  })

  // POST /api/session-metadata/:projectId/batch/tags
  // Batch add tags to multiple sessions
  fastify.post('/session-metadata/:projectId/batch/tags', async (request, reply) => {
    try {
      const { projectId } = request.params
      const { sessionIds, tags } = request.body

      if (!Array.isArray(sessionIds)) {
        return reply.code(400).send({
          error: 'Invalid sessionIds',
          message: 'sessionIds must be an array'
        })
      }

      if (!Array.isArray(tags)) {
        return reply.code(400).send({
          error: 'Invalid tags',
          message: 'tags must be an array of strings'
        })
      }

      const result = await metadataService.batchAddTags(projectId, sessionIds, tags)
      return result
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to batch add tags',
        message: error.message
      })
    }
  })
}
