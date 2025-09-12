export class TemplateDetector {
  static templates = {
    'claude-code-v1': {
      name: 'Claude Code V1.0.x',
      detect: (samples) => samples.some(s => 
        s.uuid && s.sessionId && s.type && s.timestamp && 
        ['user', 'assistant', 'system', 'summary'].includes(s.type)
      ),
      parser: 'claude-code'
    }
  };

  static detectTemplate(sampleMessages) {
    if (!sampleMessages || sampleMessages.length === 0) {
      return 'unknown';
    }

    // Check for Claude Code format - most specific first
    if (this.templates['claude-code-v1'].detect(sampleMessages)) {
      return 'claude-code-v1';
    }

    return 'unknown';
  }

  static getTemplateInfo(templateId) {
    return this.templates[templateId] || { name: 'Unknown', parser: 'generic' };
  }
}