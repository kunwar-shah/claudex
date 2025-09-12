import { SearchIndexer } from '../services/searchIndexer.js';

export async function searchRoutes(fastify, options) {
  const searchIndexer = new SearchIndexer(process.env.PROJECT_ROOT || '~/.claude/projects');
  await searchIndexer.init();

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

  // POST /api/search/index/build - Build search index
  fastify.post('/search/index/build', async (request, reply) => {
    try {
      console.log('🔧 Starting search index build...');
      const result = await searchIndexer.buildFullIndex();
      return {
        success: true,
        message: 'Search index built successfully',
        ...result
      };
    } catch (error) {
      console.error('Failed to build search index:', error);
      reply.code(500).send({
        error: 'Failed to build search index',
        message: error.message
      });
    }
  });

  // GET /api/search/index/status - Get index status
  fastify.get('/search/index/status', async (request, reply) => {
    try {
      const status = await searchIndexer.getIndexStatus();
      return status;
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

  // GET /api/health
  fastify.get('/health', async (request, reply) => {
    try {
      const indexStatus = await searchIndexer.getIndexStatus();
      return {
        status: 'healthy',
        projectsRoot: process.env.PROJECT_ROOT || '~/.claude/projects',
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