export class TemplateDetector {
  static templates = {
    'claude-code-v2-mixed': {
      name: 'Claude Code V2.x Mixed Format',
      detect: (samples) => {
        // Disabled - all edge cases now handled by v3
        return false;
      },
      parser: 'claude-code-v2-mixed'
    },
    'claude-code-v3': {
      name: 'Claude Code V3.x Universal',
      detect: (samples) => {
        // V3 is now the superset - detects ALL Claude Code formats

        // Detect Claude Code v2.0+ NEW format (role field directly, no type field)
        const hasV2NewFormat = samples.some(s =>
          s.role && ['user', 'assistant'].includes(s.role) && !s.type
        );

        // Detect file-history-snapshot (Claude Code v2.0+)
        const hasFileSnapshots = samples.some(s => s.type === 'file-history-snapshot');

        // Detect edge case format with summary-only messages and complex structures (formerly v2-mixed)
        const hasOnlySummaryMessages = samples.every(s => s.type === 'summary' && s.leafUuid);
        const hasMixedUnknownRoles = samples.some(s => !s.uuid && !s.sessionId && s.type === 'summary');

        // Detect standard v1-like format
        const hasV1Structure = samples.some(s =>
          s.uuid && s.sessionId && s.type && s.timestamp &&
          ['user', 'assistant', 'system', 'summary'].includes(s.type)
        );

        // Detect v1 format with unknown roles that need special handling
        const hasUnknownRoles = samples.some(s =>
          s.role && !['user', 'assistant', 'system', 'summary'].includes(s.role)
        );
        const hasSystemAsAssistant = samples.some(s =>
          s.type === 'system' && s.content && typeof s.content === 'string'
        );

        // V3 handles ALL cases: v2.0+, edge cases, standard v1, and unknown roles
        return hasV2NewFormat || hasFileSnapshots || hasOnlySummaryMessages || hasMixedUnknownRoles || hasV1Structure || hasUnknownRoles || hasSystemAsAssistant;
      },
      parser: 'claude-code-v3'
    },
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

    // Check templates in order of specificity - V3 first to handle edge cases
    if (this.templates['claude-code-v3'].detect(sampleMessages)) {
      return 'claude-code-v3';
    }

    if (this.templates['claude-code-v2-mixed'].detect(sampleMessages)) {
      return 'claude-code-v2-mixed';
    }

    if (this.templates['claude-code-v1'].detect(sampleMessages)) {
      return 'claude-code-v1';
    }

    return 'unknown';
  }

  static getTemplateInfo(templateId) {
    return this.templates[templateId] || { name: 'Unknown', parser: 'generic' };
  }
}