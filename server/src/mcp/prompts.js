import { z } from 'zod'

/**
 * Register MCP prompts on the server instance.
 * Prompts are user-invocable slash commands in Claude Code.
 * They appear as /mcp__claudex__<name> in the client.
 */
export function registerPrompts(server) {

  // ─── /mcp__claudex__recall ──────────────────────────────────────
  server.prompt(
    'recall',
    'Search your conversation history for something discussed before',
    { topic: z.string().describe('What to search for (e.g., "authentication", "database migration", "that bug with the sidebar")') },
    ({ topic }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `Search my previous conversations for "${topic}" using the search_conversations tool.`,
            'Show me the most relevant results with session titles, timestamps, and snippets.',
            'If you find relevant sessions, offer to load the full conversation with get_session.',
          ].join('\n'),
        },
      }],
    })
  )

  // ─── /mcp__claudex__catchup ─────────────────────────────────────
  server.prompt(
    'catchup',
    'Get a summary of recent work in this project',
    {},
    () => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            'Use get_project_context to load the current project context.',
            'Then summarize:',
            '1. What was the most recent work done (last 3-5 sessions)?',
            '2. Are there any favorited/pinned sessions I should be aware of?',
            '3. What seems to be the current focus area?',
            'Keep it concise — bullet points preferred.',
          ].join('\n'),
        },
      }],
    })
  )

  // ─── /mcp__claudex__history ─────────────────────────────────────
  server.prompt(
    'history',
    'Browse recent sessions with titles and dates',
    {
      count: z.string().optional().describe('Number of sessions to show (default: 10)'),
    },
    ({ count }) => ({
      messages: [{
        role: 'user',
        content: {
          type: 'text',
          text: [
            `List the ${count || '10'} most recent sessions using list_sessions.`,
            'Show them in a readable format with:',
            '- Session title',
            '- Date/time',
            '- Message count',
            '- Tags and favorite status',
            'Number them so I can reference a specific session.',
          ].join('\n'),
        },
      }],
    })
  )
}
