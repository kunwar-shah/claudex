import { extractTitleFromMessages, extractTitleFromRawMessages } from './titleExtractor.js';

describe('titleExtractor', () => {
  describe('extractTitleFromMessages', () => {
    test('extracts title from first user message', () => {
      const messages = [
        { role: 'user', content: 'Help me fix this authentication bug in the login form' },
        { role: 'assistant', content: 'I can help you with that...' }
      ];

      const title = extractTitleFromMessages(messages);
      expect(title).toBe('Help me fix this authentication bug in the login form');
    });

    test('removes markdown formatting', () => {
      const messages = [
        { role: 'user', content: '**Bold text** and *italic* with `inline code`' }
      ];

      const title = extractTitleFromMessages(messages);
      expect(title).toBe('Bold text and italic with inline code');
    });

    test('truncates long titles to 80 chars', () => {
      const longMessage = 'A'.repeat(100);
      const messages = [
        { role: 'user', content: longMessage }
      ];

      const title = extractTitleFromMessages(messages);
      expect(title.length).toBe(80);
      expect(title).toMatch(/\.\.\.$/);
    });

    test('falls back to assistant message if no user message', () => {
      const messages = [
        { role: 'assistant', content: 'I can help you with...' }
      ];

      const title = extractTitleFromMessages(messages);
      expect(title).toBe('I can help you with...');
    });

    test('falls back to fallback value if no valid content', () => {
      const messages = [];
      const title = extractTitleFromMessages(messages, 'session-123');
      expect(title).toBe('session-123');
    });

    test('removes code blocks from title', () => {
      const messages = [
        { role: 'user', content: 'Fix this code:\n```javascript\nconst x = 1;\n```\nand test it' }
      ];

      const title = extractTitleFromMessages(messages);
      expect(title).toBe('Fix this code: [code] and test it');
    });
  });

  describe('extractTitleFromRawMessages', () => {
    test('extracts from Claude Code v3 format (user message)', () => {
      const rawMessages = [
        {
          type: 'user',
          message: {
            role: 'user',
            content: [
              { type: 'text', text: 'Create a new React component for user profile' }
            ]
          }
        }
      ];

      const title = extractTitleFromRawMessages(rawMessages);
      expect(title).toBe('Create a new React component for user profile');
    });

    test('extracts from simple format', () => {
      const rawMessages = [
        {
          role: 'user',
          content: 'Debug the payment processing endpoint'
        }
      ];

      const title = extractTitleFromRawMessages(rawMessages);
      expect(title).toBe('Debug the payment processing endpoint');
    });

    test('handles empty raw messages', () => {
      const title = extractTitleFromRawMessages([], 'fallback-id');
      expect(title).toBe('fallback-id');
    });

    test('extracts from first message if no user message found', () => {
      const rawMessages = [
        {
          type: 'assistant',
          content: 'Sure, I can help with that task'
        }
      ];

      const title = extractTitleFromRawMessages(rawMessages);
      expect(title).toBe('Sure, I can help with that task');
    });
  });
});
