import { TemplateDetector } from './templateDetector.js';

export class MessageParser {
  constructor() {
    this.parsers = {
      'claude-code': this.parseClaudeCode.bind(this),
      'generic': this.parseGeneric.bind(this)
    };
  }

  parseMessage(rawMessage, template) {
    const templateInfo = TemplateDetector.getTemplateInfo(template);
    const parser = this.parsers[templateInfo.parser] || this.parsers.generic;
    
    try {
      const parsed = parser(rawMessage);
      return {
        ...parsed,
        raw: rawMessage
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return this.parseGeneric(rawMessage);
    }
  }

  parseClaudeCode(rawMessage) {
    // Handle different types based on actual Claude Code format
    const messageType = rawMessage.type || 'unknown';
    let role, content, toolsUsed = [], actions = [];

    switch (messageType) {
      case 'summary':
        return {
          id: rawMessage.leafUuid || this.generateId(),
          role: 'system',
          content: rawMessage.summary || '',
          contentKind: 'text',
          timestamp: new Date().toISOString(), // Summaries don't have timestamps
          toolsUsed: [],
          actions: ['Session summary generated'],
          metadata: { type: 'summary', leafUuid: rawMessage.leafUuid }
        };

      case 'user':
        role = 'user';
        content = this.extractUserContent(rawMessage);
        toolsUsed = this.extractToolResults(rawMessage);
        actions = toolsUsed.length > 0 ? ['Tool execution result'] : [];
        break;

      case 'assistant':
        role = 'assistant';
        content = this.extractAssistantContent(rawMessage);
        toolsUsed = this.extractToolUsage(rawMessage);
        actions = this.extractAssistantActions(rawMessage);
        break;

      case 'system':
        role = 'system';
        content = rawMessage.content || '';
        actions = this.extractSystemActions(rawMessage);
        break;

      default:
        role = 'unknown';
        content = JSON.stringify(rawMessage);
    }

    return {
      id: rawMessage.uuid || this.generateId(),
      role,
      content,
      contentKind: this.inferContentKind(content),
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed,
      actions,
      metadata: {
        sessionId: rawMessage.sessionId,
        cwd: rawMessage.cwd,
        version: rawMessage.version,
        parentUuid: rawMessage.parentUuid,
        requestId: rawMessage.requestId,
        gitBranch: rawMessage.gitBranch
      }
    };
  }

  extractUserContent(rawMessage) {
    if (!rawMessage.message) return '';
    
    const message = rawMessage.message;
    
    // Handle tool results in user messages
    if (Array.isArray(message.content)) {
      return message.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join(' ') || 'Tool execution';
    }
    
    return message.content || message.role || '';
  }

  extractAssistantContent(rawMessage) {
    if (!rawMessage.message?.content) return '';
    
    const content = rawMessage.message.content;
    
    if (Array.isArray(content)) {
      return content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n\n');
    }
    
    return content;
  }

  extractToolUsage(rawMessage) {
    const tools = [];
    
    if (rawMessage.message?.content && Array.isArray(rawMessage.message.content)) {
      rawMessage.message.content
        .filter(item => item.type === 'tool_use')
        .forEach(tool => {
          tools.push({
            name: tool.name,
            id: tool.id,
            details: tool.input
          });
        });
    }
    
    return tools;
  }

  extractToolResults(rawMessage) {
    const tools = [];
    
    if (rawMessage.message?.content && Array.isArray(rawMessage.message.content)) {
      rawMessage.message.content
        .filter(item => item.type === 'tool_result')
        .forEach(result => {
          tools.push({
            name: 'tool_result',
            id: result.tool_use_id,
            details: { 
              content: result.content,
              is_error: result.is_error 
            }
          });
        });
    }
    
    return tools;
  }

  extractAssistantActions(rawMessage) {
    const actions = [];
    const toolsUsed = this.extractToolUsage(rawMessage);
    
    toolsUsed.forEach(tool => {
      actions.push(`Used tool: ${tool.name}`);
    });
    
    return actions;
  }

  extractSystemActions(rawMessage) {
    const content = rawMessage.content || '';
    const actions = [];
    
    // Extract hook information from system messages
    if (content.includes('SessionStart:startup')) {
      actions.push('Session startup');
    } else if (content.includes('Stop')) {
      actions.push('Hook execution');
    }
    
    if (rawMessage.level) {
      actions.push(`Log level: ${rawMessage.level}`);
    }
    
    return actions;
  }

  parseGeneric(rawMessage) {
    const content = rawMessage.content || rawMessage.text || rawMessage.message || JSON.stringify(rawMessage);
    
    return {
      id: rawMessage.id || this.generateId(),
      role: rawMessage.role || rawMessage.author || rawMessage.sender || 'unknown',
      content,
      contentKind: this.inferContentKind(content),
      timestamp: rawMessage.timestamp || rawMessage.time || rawMessage.ts || new Date().toISOString(),
      toolsUsed: [],
      actions: [],
      metadata: this.extractMetadata(rawMessage)
    };
  }

  inferContentKind(content) {
    if (!content || typeof content !== 'string') return 'text';
    
    if (content.includes('```') || content.includes('diff --git')) return 'markdown';
    if (content.startsWith('@@') && content.includes('---') && content.includes('+++')) return 'diff';
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) return 'json';
    
    return 'text';
  }

  extractActions(rawMessage) {
    const actions = [];
    
    if (rawMessage.tools) {
      actions.push(...rawMessage.tools.map(t => `Used ${t.name}`));
    }
    
    if (rawMessage.file_edits) {
      actions.push(...rawMessage.file_edits.map(e => `Edited ${e.file}`));
    }
    
    return actions;
  }

  extractMetadata(rawMessage) {
    const metadata = {};
    
    Object.keys(rawMessage).forEach(key => {
      if (!['content', 'role', 'timestamp', 'tools', 'actions'].includes(key)) {
        metadata[key] = rawMessage[key];
      }
    });
    
    return metadata;
  }

  generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}