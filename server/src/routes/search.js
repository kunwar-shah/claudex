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

  // Shared build plumbing, used by both the manual endpoint and the optional
  // periodic re-index timer, so they can't run concurrently and report status
  // the same way.
  const progressCallback = (progressData) => {
    rebuildStatus.progress = progressData.progress;
    rebuildStatus.totalMessages = progressData.totalMessages;
    rebuildStatus.currentSession = progressData.currentSession;
    rebuildStatus.totalSessions = progressData.totalSessions;
  };

  function beginRebuildStatus() {
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
  }

  // Kick off a build and keep rebuildStatus in sync. Returns the promise so
  // callers can await it (periodic timer) or fire-and-forget (HTTP endpoint).
  function launchBuild(full) {
    const build = full
      ? searchIndexer.buildFullIndex(progressCallback)
      : searchIndexer.buildIncrementalIndex(progressCallback);

    return build
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
  }

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

      // Incremental by default; pass ?full=true (or { full: true }) to force a
      // full rebuild from scratch.
      const full = request.query?.full === 'true' || request.query?.full === true
        || request.body?.full === true;

      console.log(`🔧 Starting async search index ${full ? 'full rebuild' : 'incremental update'}...`);

      beginRebuildStatus();
      launchBuild(full); // fire-and-forget; status tracked via rebuildStatus

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

  // ---- Optional periodic incremental re-index ----
  // Set CLAUDEX_REINDEX_INTERVAL to a number of seconds to keep the index fresh
  // automatically (e.g. 60). Unset or <= 0 disables it (default). Each tick runs
  // an incremental pass, skipped if a manual build is already in progress, so it
  // never overlaps. The first pass runs shortly after startup, which also
  // bootstraps an empty index without needing a manual rebuild.
  const reindexSeconds = parseInt(process.env.CLAUDEX_REINDEX_INTERVAL || '0', 10);
  if (Number.isFinite(reindexSeconds) && reindexSeconds > 0) {
    const intervalMs = Math.max(reindexSeconds, 5) * 1000; // floor at 5s

    const tick = async () => {
      if (rebuildStatus.isBuilding) return; // a manual or prior build is running
      beginRebuildStatus();
      try {
        await launchBuild(false); // incremental
      } catch (error) {
        console.error('❌ Periodic re-index failed:', error);
      }
    };

    // Initial pass a moment after boot, then on the interval.
    const initialTimer = setTimeout(tick, 1000);
    const reindexTimer = setInterval(tick, intervalMs);
    // Don't let these timers keep the process alive on their own.
    if (initialTimer.unref) initialTimer.unref();
    if (reindexTimer.unref) reindexTimer.unref();

    fastify.addHook('onClose', async () => {
      clearTimeout(initialTimer);
      clearInterval(reindexTimer);
    });

    console.log(`🕒 Periodic incremental re-index enabled: every ${Math.max(reindexSeconds, 5)}s`);
  }
}