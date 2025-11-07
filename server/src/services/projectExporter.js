import { FileScanner } from './fileScanner.js';
import { SessionParser } from './sessionParser.js';

export class ProjectExporter {
  constructor(projectRoot) {
    this.fileScanner = new FileScanner(projectRoot);
    this.sessionParser = new SessionParser();
  }

  async exportProject(projectId) {
    try {
      // Get project info
      const projects = await this.fileScanner.scanProjects();
      const project = projects.find(p => p.id === projectId);

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Get all sessions in the project
      const sessions = await this.fileScanner.scanSessions(project.path);

      if (sessions.length === 0) {
        throw new Error(`No sessions found in project: ${projectId}`);
      }

      // Parse all sessions
      const parsedSessions = [];
      for (const session of sessions) {
        try {
          const sampleMessages = await this.fileScanner.getSessionFirstMessages(session.filePath);
          const result = await this.sessionParser.parseSession(session.filePath, sampleMessages);

          parsedSessions.push({
            sessionId: session.sessionId,
            title: session.title,
            createdAt: session.createdAt,
            lastUpdatedAt: session.lastUpdatedAt,
            messageCount: session.messageCount,
            filePath: session.filePath,
            template: result.template,
            messages: result.messages,
            stats: result.stats
          });
        } catch (error) {
          console.warn(`Failed to parse session ${session.sessionId}:`, error.message);
          // Continue with other sessions even if one fails
        }
      }

      // Calculate aggregate statistics
      const aggregateStats = this.calculateAggregateStats(parsedSessions);

      // Build export data
      return {
        project: {
          id: project.id,
          name: project.name,
          path: project.path,
          sessionCount: parsedSessions.length,
          totalSessions: sessions.length,
          messageCount: parsedSessions.reduce((sum, s) => sum + s.messages.length, 0)
        },
        sessions: parsedSessions,
        aggregateStats,
        exportedAt: new Date().toISOString(),
        exportVersion: '1.0'
      };

    } catch (error) {
      console.error(`Error exporting project ${projectId}:`, error);
      throw error;
    }
  }

  calculateAggregateStats(sessions) {
    const stats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheCreationTokens: 0,
      totalCacheReadTokens: 0,
      ephemeral5mTokens: 0,
      ephemeral1hTokens: 0,
      totalMessages: 0,
      totalParsedMessages: 0,
      totalLines: 0,
      totalSkippedLines: 0,
      messagesWithUsage: 0,
      sessionsWithUsage: 0,
      templateDistribution: {},
      timeline: []
    };

    for (const session of sessions) {
      // Aggregate token stats
      if (session.stats?.tokens) {
        const tokens = session.stats.tokens;
        stats.totalInputTokens += tokens.totalInputTokens || 0;
        stats.totalOutputTokens += tokens.totalOutputTokens || 0;
        stats.totalCacheCreationTokens += tokens.totalCacheCreationTokens || 0;
        stats.totalCacheReadTokens += tokens.totalCacheReadTokens || 0;
        stats.ephemeral5mTokens += tokens.ephemeral5mTokens || 0;
        stats.ephemeral1hTokens += tokens.ephemeral1hTokens || 0;
        stats.messagesWithUsage += tokens.messagesWithUsage || 0;

        if (tokens.messagesWithUsage > 0) {
          stats.sessionsWithUsage++;
        }
      }

      // Aggregate parsing stats
      if (session.stats) {
        stats.totalParsedMessages += session.stats.parsedMessages || 0;
        stats.totalLines += session.stats.totalLines || 0;
        stats.totalSkippedLines += session.stats.skippedLines || 0;
      }

      stats.totalMessages += session.messages?.length || 0;

      // Track template distribution
      if (session.template) {
        stats.templateDistribution[session.template] =
          (stats.templateDistribution[session.template] || 0) + 1;
      }

      // Build timeline data
      if (session.createdAt) {
        stats.timeline.push({
          sessionId: session.sessionId,
          title: session.title,
          createdAt: session.createdAt,
          messageCount: session.messages?.length || 0,
          tokens: session.stats?.tokens?.totalTokens || 0
        });
      }
    }

    // Sort timeline by creation date
    stats.timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Calculate aggregate metrics
    const totalTokens = stats.totalInputTokens + stats.totalCacheCreationTokens + stats.totalCacheReadTokens;
    stats.cacheHitRate = totalTokens > 0
      ? parseFloat(((stats.totalCacheReadTokens / totalTokens) * 100).toFixed(2))
      : 0;

    stats.totalTokens = totalTokens + stats.totalOutputTokens;

    // Calculate averages
    stats.averageMessagesPerSession = sessions.length > 0
      ? Math.round(stats.totalMessages / sessions.length)
      : 0;

    stats.averageTokensPerSession = sessions.length > 0
      ? Math.round(stats.totalTokens / sessions.length)
      : 0;

    return stats;
  }
}
