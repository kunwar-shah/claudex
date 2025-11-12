import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import MessageRenderer from './MessageRenderer'
import ClaudeMessageRenderer from './ClaudeMessageRenderer'
import { cn } from '@/lib/utils'

const MessagingBubble = ({ message, showTimestamp = true }) => {
  const isUser = message.role === 'user'
  // Treat both 'assistant' and 'tool_results' as Claude's messages
  const isAssistant = message.role === 'assistant' || message.role === 'tool_results'

  // Skip system messages in messaging view (only system, not tool_results)
  if (!isUser && !isAssistant) {
    return null
  }

  // Skip user messages that are tool-related placeholders (not actual conversation)
  const toolPlaceholders = ['Tool execution', 'Tool execution result', 'Tool results']
  if (isUser && message.content && toolPlaceholders.some(placeholder =>
    message.content.trim() === placeholder || message.content.trim().startsWith(placeholder)
  )) {
    return null
  }

  return (
    <div
      className={cn(
        "flex mb-3 animate-slide-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Message Bubble - Matches landing page style */}
      <div className={cn("max-w-xs sm:max-w-md md:max-w-lg")}>
        <div
          className={cn(
            "px-3 py-2 rounded-lg text-sm shadow-sm",
            isUser
              ? "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] text-white"
              : "bg-[hsl(var(--surface-hover))] text-[hsl(var(--text-primary))] border border-[hsl(var(--border))]"
          )}
        >
          {/* Role Label - Matches landing page */}
          <div className={cn(
            "text-xs font-semibold mb-0.5 opacity-75",
            isUser ? "text-white" : "text-[hsl(var(--text-secondary))]"
          )}>
            {isUser ? 'You' : 'Claude'}
          </div>

          {/* Message Content */}
          <div className="prose prose-sm max-w-none overflow-hidden">
            {/* Use ClaudeMessageRenderer for v2-mixed and v3 templates */}
            {(message.metadata?.template === 'claude-code-v2-mixed' || message.metadata?.template === 'claude-code-v3') ? (
              <ClaudeMessageRenderer message={message} compact={true} />
            ) : (
              <MessageRenderer
                content={message.content}
                contentKind={message.contentKind}
              />
            )}
          </div>
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div className={cn(
            "text-xs text-[hsl(var(--text-tertiary))] mt-1 px-1",
            isUser ? "text-right" : "text-left"
          )}>
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessagingBubble
