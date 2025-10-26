import { FileScanner } from '../services/fileScanner.js';
import { SessionParser } from '../services/sessionParser.js';
import { getProjectRoot } from '../utils/pathHelper.js';

export async function projectRoutes(fastify, options) {
  const fileScanner = new FileScanner(getProjectRoot());
  const sessionParser = new SessionParser();

  // GET /api/projects
  fastify.get('/projects', async (request, reply) => {
    try {
      const projects = await fileScanner.scanProjects();

      // Enhance each project with session and message counts
      const enhancedProjects = await Promise.all(
        projects.map(async (project) => {
          try {
            const sessions = await fileScanner.scanSessions(project.path);
            const sessionCount = sessions.length;
            const messageCount = sessions.reduce((sum, session) => sum + (session.messageCount || 0), 0);

            return {
              ...project,
              sessionCount,
              messageCount
            };
          } catch (error) {
            // If scanning fails for a project, return it with zero counts
            console.error(`Failed to scan project ${project.id}:`, error.message);
            return {
              ...project,
              sessionCount: 0,
              messageCount: 0
            };
          }
        })
      );

      return { projects: enhancedProjects };
    } catch (error) {
      reply.code(500).send({
        error: 'Failed to scan projects',
        message: error.message
      });
    }
  });

  // GET /api/projects/:projectId/sessions
  fastify.get('/projects/:projectId/sessions', async (request, reply) => {
    try {
      const { projectId } = request.params;
      const { limit = 50, offset = 0, sort = 'lastUpdated' } = request.query;

      const projects = await fileScanner.scanProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const sessions = await fileScanner.scanSessions(project.path);
      
      // Apply sorting
      const sortedSessions = sessions.sort((a, b) => {
        switch (sort) {
          case 'created':
            return new Date(b.createdAt) - new Date(a.createdAt);
          case 'name':
            return a.title.localeCompare(b.title);
          default:
            return new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt);
        }
      });

      // Apply pagination
      const paginatedSessions = sortedSessions.slice(offset, offset + limit);

      return { 
        sessions: paginatedSessions,
        total: sessions.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to scan sessions',
        message: error.message 
      });
    }
  });

  // GET /api/projects/:projectId/sessions/:sessionId
  fastify.get('/projects/:projectId/sessions/:sessionId', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params;
      const { page = 1, pageSize = 50 } = request.query;

      const projects = await fileScanner.scanProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const sessions = await fileScanner.scanSessions(project.path);
      const session = sessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      // Get sample messages to detect template
      const sampleMessages = await fileScanner.getSessionFirstMessages(session.filePath);
      
      // Parse session with pagination
      const result = await sessionParser.parseSession(session.filePath, sampleMessages);
      
      // Apply pagination to messages
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + parseInt(pageSize);
      const paginatedMessages = result.messages.slice(startIndex, endIndex);

      return {
        session: {
          ...session,
          template: result.template
        },
        messages: paginatedMessages,
        stats: result.stats,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: result.messages.length,
          totalPages: Math.ceil(result.messages.length / pageSize)
        }
      };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to parse session',
        message: error.message 
      });
    }
  });

  // GET /api/projects/:projectId/sessions/:sessionId/messages/:messageId
  fastify.get('/projects/:projectId/sessions/:sessionId/messages/:messageId', async (request, reply) => {
    try {
      const { projectId, sessionId, messageId } = request.params;

      const projects = await fileScanner.scanProjects();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      const sessions = await fileScanner.scanSessions(project.path);
      const session = sessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const sampleMessages = await fileScanner.getSessionFirstMessages(session.filePath);
      const result = await sessionParser.parseSession(session.filePath, sampleMessages);
      
      const message = result.messages.find(m => m.id === messageId);
      
      if (!message) {
        return reply.code(404).send({ error: 'Message not found' });
      }

      return { message };
    } catch (error) {
      reply.code(500).send({ 
        error: 'Failed to get message',
        message: error.message 
      });
    }
  });
}