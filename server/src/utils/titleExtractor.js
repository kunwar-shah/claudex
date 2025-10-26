/**
 * Extract a meaningful title from conversation messages
 * @param {Array} messages - Array of parsed message objects
 * @param {string} fallback - Fallback value if no title can be extracted (default: sessionId)
 * @returns {string} Extracted title (50-80 chars max)
 */
export function extractTitleFromMessages(messages, fallback = 'Untitled Session') {
  if (!messages || messages.length === 0) {
    return fallback;
  }

  // Try to find first user message
  const userMessage = messages.find(msg => msg.role === 'user');

  // If no user message, try first assistant message
  const targetMessage = userMessage || messages.find(msg => msg.role === 'assistant');

  if (!targetMessage || !targetMessage.content) {
    return fallback;
  }

  // Extract and clean content
  let title = targetMessage.content;

  // Remove markdown code blocks (```...```)
  title = title.replace(/```[\s\S]*?```/g, '[code]');

  // Remove inline code (`...`)
  title = title.replace(/`([^`]+)`/g, '$1');

  // Remove markdown headers (### )
  title = title.replace(/^#+\s+/gm, '');

  // Remove markdown bold/italic (**text**, *text*)
  title = title.replace(/\*\*([^*]+)\*\*/g, '$1');
  title = title.replace(/\*([^*]+)\*/g, '$1');

  // Remove markdown links ([text](url))
  title = title.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove extra whitespace and newlines
  title = title.replace(/\s+/g, ' ').trim();

  // Take first line if multi-line
  const firstLine = title.split('\n')[0];

  // Limit to 80 characters
  if (firstLine.length > 80) {
    return firstLine.substring(0, 77) + '...';
  }

  // Ensure minimum length (avoid very short titles)
  if (firstLine.length < 3) {
    return fallback;
  }

  return firstLine;
}

/**
 * Extract title from raw JSONL messages (before full parsing)
 * Useful for quick title extraction without full session parse
 * @param {Array} rawMessages - Array of raw JSONL objects
 * @param {string} fallback - Fallback value
 * @returns {string} Extracted title
 */
export function extractTitleFromRawMessages(rawMessages, fallback = 'Untitled Session') {
  if (!rawMessages || rawMessages.length === 0) {
    return fallback;
  }

  // Try to find first user message in raw format
  const userMessage = rawMessages.find(msg =>
    msg.type === 'user' ||
    msg.role === 'user' ||
    (msg.message && msg.message.role === 'user')
  );

  // Fallback to first message if no user message
  const targetMessage = userMessage || rawMessages[0];

  if (!targetMessage) {
    return fallback;
  }

  // Extract content from different raw formats
  let content = '';

  if (targetMessage.message && targetMessage.message.content) {
    // Claude Code V3 format
    if (Array.isArray(targetMessage.message.content)) {
      content = targetMessage.message.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join(' ');
    } else if (typeof targetMessage.message.content === 'string') {
      content = targetMessage.message.content;
    }
  } else if (targetMessage.content) {
    // Simple format
    content = targetMessage.content;
  } else if (targetMessage.text) {
    // Alternative format
    content = targetMessage.text;
  }

  if (!content) {
    return fallback;
  }

  // Use the same cleaning logic as extractTitleFromMessages
  return extractTitleFromMessages([{ role: 'user', content }], fallback);
}
