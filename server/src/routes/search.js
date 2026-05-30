import { SearchIndexer } from '../services/searchIndexer.js';
import { getProjectRoot } from '../utils/pathHelper.js';

export async function searchRoutes(fastify, options) {
  const searchIndexer = new SearchIndexer(getProjectRoot());
  await searchIndexer.init();

  // Global state for tracking index rebuild status
  let rebuildStatus = {
    isBuilding: false,
    progress: 0,
    totalMessages: 0,
    currentSession: 0,
    totalSessions: 0,
    error: null,
    startTime: null,
    result: null
  };

  // POST /api/search  
  fastify.post('/search', async (request, reply) => {
    try {
      const { 
        q: query, 
        projectId, 
        role, 
        from, 
        to, 
        limit = 50,
        offset = 0
      } = request.body;

      if (!query || query.trim().length === 0) {
        return reply.code(400).send({ error: 'Search query is required' });
      }

      // Check if index exists
      const indexStatus = await searchIndexer.getIndexStatus();
      if (!indexStatus.isIndexed) {
        return reply.code(503).send({ 
          error: 'Search index not available',
          message: 'Search index is being built. Please try again in a few moments.',
          indexStatus
        });
      }

      // Use FTS5 search
      const results = await searchIndexer.search({
        query: query.trim(),
        projectId,
        role,
        from,
        to,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      return results;

    } catch (error) {
      console.error('Search failed:', error);
      reply.code(500).send({ 
        error: 'Search failed',
        message: error.message 
      });
    }
  });

  // POST /api/search/index/build - Build search index (async)
  fastify.post('/search/index/build', async (request, reply) => {
    try {
      // Check if already building
      if (rebuildStatus.isBuilding) {
        return reply.code(409).send({
          error: 'Index rebuild already in progress',
          status: rebuildStatus
        });
      }

      // Reset status
      rebuildStatus = {
        isBuilding: true,
        progress: 0,
        totalMessages: 0,
        currentSession: 0,
        totalSessions: 0,
        error: null,
        startTime: Date.now(),
        result: null
      };

      // Incremental by default; pass ?full=true (or { full: true }) to force a
      // full rebuild from scratch.
      const full = request.query?.full === 'true' || request.query?.full === true
        || request.body?.full === true;

      console.log(`🔧 Starting async search index ${full ? 'full rebuild' : 'incremental update'}...`);

      // Progress callback to update status in real-time
      const progressCallback = (progressData) => {
        rebuildStatus.progress = progressData.progress;
        rebuildStatus.totalMessages = progressData.totalMessages;
        rebuildStatus.currentSession = progressData.currentSession;
        rebuildStatus.totalSessions = progressData.totalSessions;
      };

      // Start indexing in background (don't await)
      const indexBuild = full
        ? searchIndexer.buildFullIndex(progressCallback)
        : searchIndexer.buildIncrementalIndex(progressCallback);

      indexBuild
        .then(result => {
          rebuildStatus.isBuilding = false;
          rebuildStatus.progress = 100;
          rebuildStatus.result = result;
          console.log('✅ Search index build completed successfully');
        })
        .catch(error => {
          rebuildStatus.isBuilding = false;
          rebuildStatus.error = error.message;
          console.error('❌ Search index build failed:', error);
        });

      // Return immediately
      return {
        success: true,
        mode: full ? 'full' : 'incremental',
        message: `Index ${full ? 'full rebuild' : 'incremental update'} started in background`,
        status: rebuildStatus
      };

    } catch (error) {
      console.error('Failed to start index build:', error);
      reply.code(500).send({
        error: 'Failed to start index build',
        message: error.message
      });
    }
  });

  // GET /api/search/index/status - Get index status (includes rebuild progress)
  fastify.get('/search/index/status', async (request, reply) => {
    try {
      const indexStatus = await searchIndexer.getIndexStatus();

      // Include rebuild status if in progress
      return {
        ...indexStatus,
        rebuild: rebuildStatus.isBuilding ? {
          isBuilding: true,
          progress: rebuildStatus.progress,
          totalMessages: rebuildStatus.totalMessages,
          currentSession: rebuildStatus.currentSession,
          totalSessions: rebuildStatus.totalSessions,
          elapsedTime: Date.now() - rebuildStatus.startTime,
          error: rebuildStatus.error
        } : {
          isBuilding: false,
          lastResult: rebuildStatus.result,
          lastError: rebuildStatus.error
        }
      };
    } catch (error) {
      console.error('Failed to get index status:', error);
      reply.code(500).send({
        error: 'Failed to get index status',
        message: error.message
      });
    }
  });

  // POST /api/search/index/clear - Clear search index
  fastify.post('/search/index/clear', async (request, reply) => {
    try {
      await searchIndexer.searchDb.clearIndex();
      return {
        success: true,
        message: 'Search index cleared successfully'
      };
    } catch (error) {
      console.error('Failed to clear search index:', error);
      reply.code(500).send({
        error: 'Failed to clear search index',
        message: error.message
      });
    }
  });

  // GET /api/stats/message-roles
  // Returns real counts of messages by role from the FTS5 index
  fastify.get('/stats/message-roles', async (request, reply) => {
    try {
      const db = searchIndexer.searchDb.db
      // Single GROUP BY query — fast on FTS5 with role column
      const rows = await db.all(
        `SELECT role, COUNT(*) AS count FROM messages_fts GROUP BY role`
      ) || []
      const roleStats = { user: 0, assistant: 0, system: 0, tool: 0, other: 0 }
      let total = 0
      for (const row of rows) {
        const role = (row.role || '').toLowerCase()
        const n = Number(row.count) || 0
        if (role in roleStats) roleStats[role] += n
        else roleStats.other += n
        total += n
      }
      return {
        total,
        byRole: roleStats,
        percentages: total > 0
          ? Object.fromEntries(Object.entries(roleStats).map(([k, v]) => [k, Number(((v / total) * 100).toFixed(1))]))
          : roleStats,
        source: 'real',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      reply.code(500).send({
        error: 'stats_failed',
        message: error.message
      })
    }
  });

  // GET /api/health
  fastify.get('/health', async (request, reply) => {
    try {
      const indexStatus = await searchIndexer.getIndexStatus();
      return {
        status: 'healthy',
        projectsRoot: getProjectRoot(),
        searchIndex: indexStatus,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500).send({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}