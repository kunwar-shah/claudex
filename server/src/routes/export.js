import { FileScanner } from '../services/fileScanner.js';
import { SessionParser } from '../services/sessionParser.js';
import { formatDistanceToNow } from 'date-fns';

export async function exportRoutes(fastify, options) {
  const fileScanner = new FileScanner(process.env.PROJECT_ROOT || '~/.claude/projects');
  const sessionParser = new SessionParser();

  // GET /api/export/session/:projectId/:sessionId?format=json|html|txt
  fastify.get('/export/session/:projectId/:sessionId', async (request, reply) => {
    try {
      const { projectId, sessionId } = request.params;
      const { format = 'json' } = request.query;

      // Get project and session info
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

      // Parse the full session
      const sampleMessages = await fileScanner.getSessionFirstMessages(session.filePath);
      const result = await sessionParser.parseSession(session.filePath, sampleMessages);

      const exportData = {
        session: {
          ...session,
          template: result.template
        },
        messages: result.messages,
        stats: result.stats,
        exportedAt: new Date().toISOString(),
        projectName: project.name
      };

      // Set appropriate headers based on format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${project.name}-${session.title || sessionId}-${timestamp}`;

      switch (format.toLowerCase()) {
        case 'html':
          return generateHTMLExport(reply, exportData, filename);
        case 'txt':
          return generateTextExport(reply, exportData, filename);
        case 'json':
        default:
          reply.header('Content-Type', 'application/json');
          reply.header('Content-Disposition', `attachment; filename="${filename}.json"`);
          return exportData;
      }

    } catch (error) {
      console.error('Export failed:', error);
      reply.code(500).send({ 
        error: 'Failed to export session',
        message: error.message 
      });
    }
  });

  // Generate HTML export
  function generateHTMLExport(reply, data, filename) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.session.title || data.session.sessionId} - Claude Conversation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .message {
            background: white;
            margin: 15px 0;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message.user {
            border-left: 4px solid #3b82f6;
        }
        .message.assistant {
            border-left: 4px solid #10b981;
        }
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
            color: #6b7280;
        }
        .role-badge {
            background: #e5e7eb;
            color: #374151;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-right: 10px;
        }
        .role-badge.user {
            background: #dbeafe;
            color: #1e40af;
        }
        .role-badge.assistant {
            background: #d1fae5;
            color: #065f46;
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .stats {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-top: 20px;
            font-size: 14px;
            color: #6b7280;
        }
        pre {
            background: #f1f5f9;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            border-left: 4px solid #e2e8f0;
        }
        code {
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${data.session.title || 'Claude Conversation'}</h1>
        <p><strong>Project:</strong> ${data.projectName}</p>
        <p><strong>Session ID:</strong> ${data.session.sessionId}</p>
        <p><strong>Template:</strong> ${data.session.template}</p>
        <p><strong>Exported:</strong> ${new Date(data.exportedAt).toLocaleString()}</p>
        <p><strong>Messages:</strong> ${data.messages.length}</p>
    </div>
    
    ${data.messages.map((message, index) => `
    <div class="message ${message.role}">
        <div class="message-header">
            <span class="role-badge ${message.role}">${message.role}</span>
            ${message.timestamp ? `<span>${formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>` : ''}
        </div>
        <div class="message-content">${escapeHtml(message.content || message.text || '')}</div>
    </div>
    `).join('')}
    
    <div class="stats">
        <h3>Session Statistics</h3>
        ${data.stats ? `
            <p><strong>Messages Parsed:</strong> ${data.stats.totalMessages || 0}</p>
            <p><strong>Lines Processed:</strong> ${data.stats.totalLines || 0}</p>
            ${data.stats.skippedLines ? `<p><strong>Lines Skipped:</strong> ${data.stats.skippedLines}</p>` : ''}
        ` : ''}
    </div>
</body>
</html>`;

    reply.header('Content-Type', 'text/html; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}.html"`);
    return html;
  }

  // Generate text export
  function generateTextExport(reply, data, filename) {
    const separator = '=' .repeat(80);
    const text = `${separator}
CLAUDE CONVERSATION EXPORT
${separator}

Project: ${data.projectName}
Session: ${data.session.title || data.session.sessionId}
Template: ${data.session.template}
Exported: ${new Date(data.exportedAt).toLocaleString()}
Total Messages: ${data.messages.length}

${separator}

${data.messages.map((message, index) => {
  const timestamp = message.timestamp ? 
    `[${new Date(message.timestamp).toLocaleString()}]` : 
    `[Message ${index + 1}]`;
  
  return `${timestamp} ${message.role.toUpperCase()}:
${'-'.repeat(40)}
${message.content || message.text || ''}

`;
}).join('')}

${separator}
SESSION STATISTICS
${separator}
${data.stats ? `
Messages Parsed: ${data.stats.totalMessages || 0}
Lines Processed: ${data.stats.totalLines || 0}
${data.stats.skippedLines ? `Lines Skipped: ${data.stats.skippedLines}` : ''}
` : 'No statistics available'}

Generated by Claude Code Conversations Viewer
${new Date().toISOString()}
${separator}`;

    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}.txt"`);
    return text;
  }

  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}