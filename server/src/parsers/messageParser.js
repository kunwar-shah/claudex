import { TemplateDetector } from './templateDetector.js';

export class MessageParser {
  constructor() {
    this.parsers = {
      'claude-code': this.parseClaudeCode.bind(this),
      'claude-code-v2-mixed': this.parseClaudeCodeV2Mixed.bind(this),
      'claude-code-v3': this.parseClaudeCodeV3.bind(this),
      'generic': this.parseGeneric.bind(this)
    };
  }

  parseMessage(rawMessage, template, lineNumber = null) {
    const templateInfo = TemplateDetector.getTemplateInfo(template);
    const parser = this.parsers[templateInfo.parser] || this.parsers.generic;

    try {
      const parsed = parser(rawMessage, lineNumber);
      return {
        ...parsed,
        raw: rawMessage
      };
    } catch (error) {
      console.error('Error parsing message:', error);
      return this.parseGeneric(rawMessage, lineNumber);
    }
  }

  parseClaudeCode(rawMessage, lineNumber = null) {
    // Handle different types based on actual Claude Code format
    const messageType = rawMessage.type || 'unknown';
    let role, content, toolsUsed = [], actions = [];

    switch (messageType) {
      case 'summary':
        return {
          id: this.makeUniqueId(rawMessage.leafUuid || this.generateId(), lineNumber),
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
      id: this.makeUniqueId(rawMessage.uuid || this.generateId(), lineNumber),
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

  parseGeneric(rawMessage, lineNumber = null) {
    const content = rawMessage.content || rawMessage.text || rawMessage.message || JSON.stringify(rawMessage);

    return {
      id: this.makeUniqueId(rawMessage.id || this.generateId(), lineNumber),
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

  parseClaudeCodeV2Mixed(rawMessage, lineNumber = null) {
    // Enhanced parser for Claude conversation format with tool calls and thinking
    const messageType = rawMessage.type || 'unknown';

    switch (messageType) {
      case 'summary':
        // These are AI-generated summaries, not user messages
        return {
          id: this.makeUniqueId(rawMessage.leafUuid || this.generateId(), lineNumber),
          role: 'system',
          content: rawMessage.summary || 'AI Summary',
          contentKind: 'text',
          timestamp: new Date().toISOString(),
          toolsUsed: [],
          actions: ['Session summary generated'],
          metadata: {
            type: 'summary',
            leafUuid: rawMessage.leafUuid,
            source: 'ai-generated',
            collapsed: true,
            displayType: 'summary',
            template: 'claude-code-v2-mixed'
          }
        };

      case 'assistant':
        // Handle complex Claude assistant messages with tool calls and thinking
        return this.parseClaudeAssistantMessage(rawMessage, lineNumber);

      case 'user':
        // Handle Claude user messages (including tool results)
        return this.parseClaudeUserMessage(rawMessage, lineNumber);

      case 'system':
        // Handle Claude system messages
        return this.parseClaudeSystemMessage(rawMessage, lineNumber);

      default:
        // Handle other formats (legacy support)
        return this.parseClaudeUnknownMessage(rawMessage, lineNumber);
    }
  }

  parseClaudeAssistantMessage(rawMessage, lineNumber = null) {
    const message = rawMessage.message || {};
    const content = message.content || [];

    // Parse content blocks for tool calls, text, and thinking
    const contentBlocks = Array.isArray(content) ? content : [];
    const textBlocks = contentBlocks.filter(block => block.type === 'text');
    const toolUseBlocks = contentBlocks.filter(block => block.type === 'tool_use');
    const thinkingBlocks = contentBlocks.filter(block => block.type === 'thinking');

    // Extract main text content
    const mainContent = textBlocks.map(block => block.text).join('\n\n') || 'Assistant response';

    // Build tools used array
    const toolsUsed = toolUseBlocks.map(tool => ({
      id: tool.id,
      name: tool.name,
      details: tool.input,
      type: 'tool_use'
    }));

    // Build actions
    const actions = [];
    if (toolUseBlocks.length > 0) {
      toolUseBlocks.forEach(tool => {
        actions.push(`Used tool: ${tool.name}`);
      });
    }
    if (thinkingBlocks.length > 0) {
      actions.push('Internal reasoning');
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || message.id || this.generateId(), lineNumber),
      role: 'assistant',
      content: mainContent,
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed,
      actions,
      metadata: {
        template: 'claude-code-v2-mixed',
        model: message.model,
        messageId: message.id,
        requestId: rawMessage.requestId,
        contentBlocks: {
          text: textBlocks,
          toolUse: toolUseBlocks,
          thinking: thinkingBlocks
        },
        usage: message.usage,
        stopReason: message.stop_reason
      }
    };
  }

  parseClaudeUserMessage(rawMessage, lineNumber = null) {
    const message = rawMessage.message || {};
    const content = message.content || [];

    // Parse content blocks for text and tool results
    const contentBlocks = Array.isArray(content) ? content : [];
    const textBlocks = contentBlocks.filter(block => block.type === 'text');
    const toolResultBlocks = contentBlocks.filter(block => block.type === 'tool_result');

    // Extract main text content
    const mainContent = textBlocks.map(block => block.text).join('\n\n') || 'User message';

    // Build tools used array for tool results
    const toolsUsed = toolResultBlocks.map(result => ({
      id: result.tool_use_id,
      name: 'tool_result',
      details: {
        content: result.content,
        is_error: result.is_error
      },
      type: 'tool_result'
    }));

    return {
      id: this.makeUniqueId(rawMessage.uuid || this.generateId(), lineNumber),
      role: 'user',
      content: mainContent,
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed,
      actions: toolResultBlocks.length > 0 ? ['Tool results provided'] : ['User message'],
      metadata: {
        template: 'claude-code-v2-mixed',
        contentBlocks: {
          text: textBlocks,
          toolResults: toolResultBlocks
        }
      }
    };
  }

  parseClaudeSystemMessage(rawMessage, lineNumber = null) {
    const content = rawMessage.content || '';

    // Detect system message types
    let actions = ['System message'];
    let displayType = 'system';

    if (content.includes('compacted') || content.includes('Conversation compacted')) {
      actions = ['Conversation compacted'];
      displayType = 'compaction';
    } else if (content.includes('PreToolUse') || content.includes('PostToolUse')) {
      actions = ['Tool execution'];
      displayType = 'tool-system';
    } else if (content.includes('SessionStart')) {
      actions = ['Session started'];
      displayType = 'session-start';
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || this.generateId(), lineNumber),
      role: 'system',
      content,
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed: [],
      actions,
      metadata: {
        template: 'claude-code-v2-mixed',
        type: rawMessage.subtype || 'system',
        displayType,
        collapsed: displayType !== 'session-start', // Only expand session-start messages
        level: rawMessage.level,
        toolUseID: rawMessage.toolUseID,
        parentUuid: rawMessage.parentUuid
      }
    };
  }

  parseClaudeUnknownMessage(rawMessage, lineNumber = null) {
    // Legacy fallback for unknown message types
    let role = 'system';
    let content = '';
    let contentKind = 'text';
    let actions = ['Unknown message'];

    if (typeof rawMessage === 'string') {
      content = rawMessage;

      // Simple pattern detection
      const trimmed = rawMessage.trim().toLowerCase();
      if (trimmed.includes('compacted')) {
        actions = ['Conversation compacted'];
      }
    } else if (typeof rawMessage === 'object' && rawMessage !== null) {
      content = this.safeStringify(rawMessage);
      contentKind = 'json';
      actions = ['System data'];
    } else {
      content = String(rawMessage);
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || rawMessage.id || this.generateId(), lineNumber),
      role,
      content,
      contentKind,
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed: [],
      actions,
      metadata: {
        template: 'claude-code-v2-mixed',
        type: 'unknown'
      }
    };
  }

  extractNestedContent(rawMessage) {
    // Handle nested content structures
    if (rawMessage.content) {
      if (typeof rawMessage.content === 'string') {
        return rawMessage.content;
      }
      if (Array.isArray(rawMessage.content)) {
        return rawMessage.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n\n') || 'Complex message content';
      }
      if (typeof rawMessage.content === 'object') {
        return this.safeStringify(rawMessage.content);
      }
    }

    // Try other common content fields
    if (rawMessage.message) return String(rawMessage.message);
    if (rawMessage.text) return String(rawMessage.text);

    return this.safeStringify(rawMessage);
  }

  safeStringify(obj) {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return String(obj);
    }
  }

  parseClaudeCodeV3(rawMessage, lineNumber = null) {
    // Enhanced V3 parser - Universal compatibility for all Claude Code versions
    // Handles: V1.x, V2-mixed, V2.0+ with backward compatibility

    // V2.0+ detection: Check if message has 'role' field directly (new format)
    if (rawMessage.role && !rawMessage.type) {
      return this.parseClaudeV2NewFormat(rawMessage, lineNumber);
    }

    // V1/V2-mixed detection: Use 'type' field (old format)
    const messageType = rawMessage.type || 'unknown';

    switch (messageType) {
      case 'summary':
        // AI-generated summaries as assistant messages
        return {
          id: this.makeUniqueId(rawMessage.leafUuid || this.generateId(), lineNumber),
          role: 'assistant',
          content: rawMessage.summary || 'AI Summary',
          contentKind: 'text',
          timestamp: new Date().toISOString(),
          toolsUsed: [],
          actions: ['Session summary generated', 'System summary (displayed as assistant)'],
          metadata: {
            type: 'summary',
            leafUuid: rawMessage.leafUuid,
            template: 'claude-code-v3',
            originalRole: 'system',
            source: 'ai-generated',
            collapsed: true,
            displayType: 'summary'
          }
        };

      case 'file-history-snapshot':
        // Claude Code v2.0+ file history tracking (display as assistant system message)
        return this.parseFileHistorySnapshot(rawMessage, lineNumber);

      case 'assistant':
        // Handle complex Claude assistant messages with tool calls and thinking
        return this.parseClaudeV3AssistantMessage(rawMessage, lineNumber);

      case 'user':
        // Handle Claude user messages (including tool results)
        return this.parseClaudeV3UserMessage(rawMessage, lineNumber);

      case 'system':
        // Handle Claude system messages as assistant messages
        return this.parseClaudeV3SystemMessage(rawMessage, lineNumber);

      default:
        // Handle other formats and unknown messages
        return this.parseClaudeV3UnknownMessage(rawMessage, lineNumber);
    }
  }

  parseClaudeV3AssistantMessage(rawMessage, lineNumber = null) {
    const message = rawMessage.message || {};
    const content = message.content || [];

    // Parse content blocks for tool calls, text, and thinking
    const contentBlocks = Array.isArray(content) ? content : [];
    const textBlocks = contentBlocks.filter(block => block.type === 'text');
    const toolUseBlocks = contentBlocks.filter(block => block.type === 'tool_use');
    const thinkingBlocks = contentBlocks.filter(block => block.type === 'thinking');

    // Extract main text content
    const mainContent = textBlocks.map(block => block.text).join('\n\n') || 'Assistant response';

    // Build tools used array
    const toolsUsed = toolUseBlocks.map(tool => ({
      id: tool.id,
      name: tool.name,
      details: tool.input,
      type: 'tool_use'
    }));

    // Build actions
    const actions = [];
    if (toolUseBlocks.length > 0) {
      toolUseBlocks.forEach(tool => {
        actions.push(`Used tool: ${tool.name}`);
      });
    }
    if (thinkingBlocks.length > 0) {
      actions.push('Internal reasoning');
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || message.id || this.generateId(), lineNumber),
      role: 'assistant',
      content: mainContent,
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed,
      actions,
      metadata: {
        template: 'claude-code-v3',
        model: message.model,
        messageId: message.id,
        requestId: rawMessage.requestId,
        contentBlocks: {
          text: textBlocks,
          toolUse: toolUseBlocks,
          thinking: thinkingBlocks
        },
        usage: message.usage,
        stopReason: message.stop_reason
      }
    };
  }

  parseClaudeV3UserMessage(rawMessage, lineNumber = null) {
    const message = rawMessage.message || {};
    const content = message.content || [];

    // Parse content blocks for text and tool results
    const contentBlocks = Array.isArray(content) ? content : [];
    const textBlocks = contentBlocks.filter(block => block.type === 'text');
    const toolResultBlocks = contentBlocks.filter(block => block.type === 'tool_result');

    // Extract main text content or use V1 extraction method
    let mainContent;
    if (textBlocks.length > 0) {
      mainContent = textBlocks.map(block => block.text).join('\n\n');
    } else {
      mainContent = this.extractUserContent(rawMessage);
    }

    // Build tools used array for tool results
    const toolsUsed = toolResultBlocks.length > 0
      ? toolResultBlocks.map(result => ({
          id: result.tool_use_id,
          name: 'tool_result',
          details: {
            content: result.content,
            is_error: result.is_error
          },
          type: 'tool_result'
        }))
      : this.extractToolResults(rawMessage);

    return {
      id: this.makeUniqueId(rawMessage.uuid || this.generateId(), lineNumber),
      role: 'user',
      content: mainContent || 'User message',
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed,
      actions: toolsUsed.length > 0 ? ['Tool results provided'] : ['User message'],
      metadata: {
        template: 'claude-code-v3',
        contentBlocks: {
          text: textBlocks,
          toolResults: toolResultBlocks
        }
      }
    };
  }

  parseClaudeV3SystemMessage(rawMessage, lineNumber = null) {
    const content = rawMessage.content || '';

    // Detect system message types but display as assistant
    let actions = ['System message (displayed as assistant)'];
    let displayType = 'system';

    if (content.includes('compacted') || content.includes('Conversation compacted')) {
      actions = ['Conversation compacted', 'System message (displayed as assistant)'];
      displayType = 'compaction';
    } else if (content.includes('PreToolUse') || content.includes('PostToolUse')) {
      actions = ['Tool execution', 'System message (displayed as assistant)'];
      displayType = 'tool-system';
    } else if (content.includes('SessionStart')) {
      actions = ['Session started', 'System message (displayed as assistant)'];
      displayType = 'session-start';
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || this.generateId(), lineNumber),
      role: 'assistant', // V3: System messages become assistant messages
      content,
      contentKind: 'text',
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed: [],
      actions,
      metadata: {
        template: 'claude-code-v3',
        originalRole: 'system',
        type: rawMessage.subtype || 'system',
        displayType,
        collapsed: displayType !== 'session-start',
        level: rawMessage.level,
        toolUseID: rawMessage.toolUseID,
        parentUuid: rawMessage.parentUuid
      }
    };
  }

  parseClaudeV3UnknownMessage(rawMessage, lineNumber = null) {
    // Enhanced unknown message handling with only user/assistant roles
    const inferredRole = this.inferRoleFromContent(rawMessage);
    let content = this.extractUnknownContent(rawMessage);
    let contentKind = 'text';
    let actions = [`Inferred role: ${inferredRole}`];

    if (typeof rawMessage === 'string') {
      content = rawMessage;

      // Simple pattern detection
      const trimmed = rawMessage.trim().toLowerCase();
      if (trimmed.includes('compacted')) {
        actions = ['Conversation compacted', 'System message (displayed as assistant)'];
      }
    } else if (typeof rawMessage === 'object' && rawMessage !== null) {
      if (!content || content === this.safeStringify(rawMessage)) {
        content = this.safeStringify(rawMessage);
        contentKind = 'json';
        actions = ['System data (displayed as assistant)'];
      }
    } else {
      content = String(rawMessage);
    }

    return {
      id: this.makeUniqueId(rawMessage.uuid || rawMessage.id || this.generateId(), lineNumber),
      role: inferredRole, // Only 'user' or 'assistant'
      content,
      contentKind,
      timestamp: rawMessage.timestamp || new Date().toISOString(),
      toolsUsed: [],
      actions,
      metadata: {
        template: 'claude-code-v3',
        originalType: rawMessage.type || 'unknown',
        inferredRole
      }
    };
  }

  inferRoleFromContent(rawMessage) {
    // Enhanced role inference for unknown messages - V3 treats everything as user/assistant only
    const content = this.extractUnknownContent(rawMessage);
    const contentLower = content.toLowerCase();

    // Check for user patterns (questions, requests, commands)
    if (contentLower.includes('can you') ||
        contentLower.includes('please') ||
        contentLower.includes('help me') ||
        contentLower.includes('how do i') ||
        contentLower.includes('show me') ||
        contentLower.includes('explain') ||
        contentLower.includes('what is') ||
        contentLower.includes('why') ||
        contentLower.includes('fix this') ||
        contentLower.includes('debug')) {
      return 'user';
    }

    // Everything else defaults to assistant (including former system messages)
    // This includes: responses, system notifications, errors, warnings, hooks, etc.
    return 'assistant';
  }

  extractUnknownContent(rawMessage) {
    // Enhanced content extraction for unknown message types
    if (rawMessage.content && typeof rawMessage.content === 'string') {
      return rawMessage.content;
    }

    if (rawMessage.content && Array.isArray(rawMessage.content)) {
      return rawMessage.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n\n') || 'Complex message content';
    }

    if (rawMessage.message) {
      return this.extractNestedContent(rawMessage);
    }

    if (rawMessage.text) {
      return rawMessage.text;
    }

    if (rawMessage.summary) {
      return rawMessage.summary;
    }

    // Last resort: stringify the object
    return this.safeStringify(rawMessage);
  }

  parseClaudeV2NewFormat(rawMessage, lineNumber = null) {
    // Handle Claude Code v2.0+ new format with 'role' field directly
    const role = rawMessage.role;
    const content = rawMessage.content || [];
    const messageId = rawMessage.id || this.generateId();

    // Extract text content
    const textBlocks = Array.isArray(content)
      ? content.filter(block => block.type === 'text')
      : [];
    const textContent = textBlocks.map(block => block.text).join('\n\n') || '';

    // Map roles (no system role in V3)
    const mappedRole = role === 'assistant' ? 'assistant' : 'user';

    return {
      id: this.makeUniqueId(messageId, lineNumber),
      role: mappedRole,
      content: textContent || 'Message content',
      contentKind: 'text',
      timestamp: new Date().toISOString(),
      toolsUsed: [],
      actions: [`Claude Code v2.0+ format (${role})`],
      metadata: {
        template: 'claude-code-v3',
        originalRole: role,
        model: rawMessage.model,
        messageId: rawMessage.id,
        contentBlocks: content,
        usage: rawMessage.usage,
        stopReason: rawMessage.stop_reason,
        format: 'v2.0-new'
      }
    };
  }

  parseFileHistorySnapshot(rawMessage, lineNumber = null) {
    // Handle file-history-snapshot messages from Claude Code v2.0+
    const snapshot = rawMessage.snapshot || {};
    const trackedFiles = snapshot.trackedFileBackups || {};
    const fileCount = Object.keys(trackedFiles).length;

    let content = `File history snapshot`;
    if (fileCount > 0) {
      const fileList = Object.keys(trackedFiles).join(', ');
      content = `File history snapshot: ${fileCount} file(s) tracked\n\nFiles: ${fileList}`;
    }

    return {
      id: this.makeUniqueId(rawMessage.messageId || this.generateId(), lineNumber),
      role: 'assistant',
      content,
      contentKind: 'text',
      timestamp: snapshot.timestamp || new Date().toISOString(),
      toolsUsed: [],
      actions: ['File history snapshot', 'System tracking (displayed as assistant)'],
      metadata: {
        template: 'claude-code-v3',
        type: 'file-history-snapshot',
        originalRole: 'system',
        messageId: rawMessage.messageId,
        snapshot: snapshot,
        fileCount,
        isSnapshotUpdate: rawMessage.isSnapshotUpdate,
        collapsed: true,
        displayType: 'file-snapshot'
      }
    };
  }

  generateId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  makeUniqueId(sourceId, lineNumber = null) {
    // Combine source ID with line number to ensure uniqueness
    // This handles cases where the same message ID appears on multiple lines
    if (lineNumber) {
      return `${sourceId}-L${lineNumber}`;
    }
    return sourceId;
  }
}