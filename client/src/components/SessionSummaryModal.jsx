import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { X, FileText, ChevronDown, Settings, Edit, MessageSquare } from 'lucide-react'
import { projectsApi, sessionMetadataApi } from '../services/api'
import { ModalLoadingContent } from './ui/loading'

/**
 * SessionSummaryModal - Modal dialog showing session summary
 *
 * Features:
 * - Modal overlay with backdrop
 * - Session summary content (reuses SummaryPanel logic)
 * - View Full Conversation button
 * - Close on backdrop click or X button
 * - Two collapsible cards: Management and Summary
 */
const SessionSummaryModal = ({ session, projectId, onClose }) => {
  const navigate = useNavigate()
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false)
  const [isManagementCollapsed, setIsManagementCollapsed] = useState(false)

  // Get the complete session for universal summary
  const { data, isLoading, error } = useQuery({
    queryKey: ['session-complete', projectId, session?.sessionId],
    queryFn: async () => {
      // Get session metadata first
      const firstPage = await projectsApi.getSession(projectId, session.sessionId, { page: 1, pageSize: 50 }).then(res => res.data)
      const totalMessages = firstPage.pagination?.total || 0

      // If there are many messages, get them all in one large request
      if (totalMessages > 50) {
        const fullSession = await projectsApi.getSession(projectId, session.sessionId, { page: 1, pageSize: totalMessages }).then(res => res.data)
        return fullSession
      }

      return firstPage
    },
    enabled: !!(projectId && session?.sessionId),
    staleTime: 5 * 60 * 1000
  })

  // Fetch metadata for tags and custom title
  const { data: metadataData } = useQuery({
    queryKey: ['session-metadata', projectId, session?.sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, session.sessionId).then(res => res.data),
    enabled: !!(projectId && session?.sessionId)
  })

  const metadata = metadataData?.metadata || {}

  if (!session) return null

  const handleViewConversation = () => {
    navigate(`/projects/${projectId}/sessions/${session.sessionId}`)
    onClose()
  }

  const { messages = [], stats, pagination } = data || {}

  // Generate summary from all messages for complete analysis
  const summary = generateSessionSummary(messages)
  const actions = extractActions(messages)
  const fileOperations = extractFileOperations(messages)
  const toolUsage = extractToolUsage(messages)

  // Extract context for renaming
  const firstUserMessages = extractFirstUserMessages(messages, 5)
  const suggestedTitles = generateSuggestedTitles(messages)
  const topicKeywords = extractTopicKeywords(messages)
  const conversationPreview = extractConversationPreview(messages, 6)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[hsl(var(--surface))] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary truncate">
                {metadata.customTitle || session.title || session.sessionId}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Session ID: {session.sessionId.slice(0, 12)}...
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close session summary"
              title="Close"
              className="ml-4 p-2 hover:bg-surface rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <X className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <ModalLoadingContent label="Loading session summary..." />
            ) : error ? (
              <div className="text-error text-sm">
                Failed to load session summary
              </div>
            ) : (
              <div className="space-y-4">
                {/* CARD 1: Session Summary */}
                <div className="border border-primary/20 rounded-lg overflow-hidden bg-[hsl(var(--surface))] shadow-sm">
                  <button
                    onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
                    className="w-full bg-primary/5 px-4 py-3 flex justify-between items-center hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-sm font-semibold text-primary">Session Summary</h3>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-primary transition-transform ${isSummaryCollapsed ? '' : 'rotate-180'}`} />
                  </button>

                  {!isSummaryCollapsed && (
                    <div className="p-4 space-y-4">
                      {/* AI Generated Summary */}
                      {summary && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">Summary</h4>
                          <div className="text-sm text-text-secondary bg-surface p-4 rounded-lg leading-relaxed">
                            {summary}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {actions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                            Actions Performed ({actions.length})
                          </h4>
                    <div className="space-y-2">
                      {actions.slice(0, 8).map((action, index) => (
                        <div key={index} className="text-sm text-text-secondary flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-primary/50 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{action}</span>
                        </div>
                      ))}
                      {actions.length > 8 && (
                        <div className="text-sm text-muted-foreground italic">
                          +{actions.length - 8} more actions
                        </div>
                      )}
                          </div>
                        </div>
                      )}

                      {/* File Operations */}
                      {fileOperations.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                            File Operations ({fileOperations.length})
                          </h4>
                    <div className="space-y-2">
                      {fileOperations.slice(0, 6).map((op, index) => (
                        <div
                          key={index}
                          className="bg-primary/5 px-3 py-2 rounded-lg flex items-center justify-between border border-primary/20"
                        >
                          <span className="font-mono text-sm text-text-primary truncate flex-1 mr-2">
                            {op.file}
                          </span>
                          <span className="text-xs font-medium text-primary flex-shrink-0">
                            {op.operation}
                          </span>
                        </div>
                      ))}
                      {fileOperations.length > 6 && (
                        <div className="text-sm text-muted-foreground italic">
                          +{fileOperations.length - 6} more files
                        </div>
                      )}
                          </div>
                        </div>
                      )}

                      {/* Tool Usage */}
                      {toolUsage.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">
                            Tools Used ({toolUsage.length})
                          </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {toolUsage.slice(0, 8).map((tool, index) => (
                        <div
                          key={index}
                          className="bg-success/5 px-3 py-2 rounded-lg flex items-center justify-between border border-success/20"
                        >
                          <span className="text-sm font-medium text-text-primary truncate">
                            {tool.name}
                          </span>
                          <span className="text-sm font-bold text-success flex-shrink-0 ml-2">
                            {tool.count}x
                          </span>
                        </div>
                      ))}
                          </div>
                          {toolUsage.length > 8 && (
                            <div className="text-sm text-muted-foreground italic mt-2">
                              +{toolUsage.length - 8} more tools
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message Distribution */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">Message Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(getMessageDistribution(messages)).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center bg-surface px-4 py-2 rounded-lg">
                        <span className="capitalize text-sm text-text-secondary font-medium">{role}</span>
                        <span className="text-sm font-bold text-text-primary">{count}</span>
                        </div>
                      ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CARD 2: Session Management */}
                <div className="border border-success/20 rounded-lg overflow-hidden bg-[hsl(var(--surface))] shadow-sm">
                  <button
                    onClick={() => setIsManagementCollapsed(!isManagementCollapsed)}
                    className="w-full bg-success/5 px-4 py-3 flex justify-between items-center hover:bg-success/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-success" />
                      <h3 className="text-sm font-semibold text-success">Session Management</h3>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-success transition-transform ${isManagementCollapsed ? '' : 'rotate-180'}`} />
                  </button>

                  {!isManagementCollapsed && (
                    <div className="p-4 space-y-4">
                      {/* Overview */}
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">Overview</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-surface p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Messages</div>
                            <div className="text-lg font-semibold text-text-primary">
                              {pagination?.total || messages.length}
                            </div>
                          </div>
                          <div className="bg-surface p-3 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Template</div>
                            <div className="text-sm font-medium text-text-primary">
                              {data?.session?.template || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        {metadata.tags && metadata.tags.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-muted-foreground mb-2">Tags</div>
                            <div className="flex flex-wrap gap-2">
                              {metadata.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {metadata.notes && (
                          <div className="mt-3">
                            <div className="text-xs text-muted-foreground mb-2">Notes</div>
                            <div className="text-sm text-text-secondary bg-warning/5 p-3 rounded-lg border border-warning/20">
                              {metadata.notes}
                            </div>
                          </div>
                        )}
                      </div>

                {/* Conversation Preview for Renaming */}
                {conversationPreview.length > 0 && (
                  <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                      <Edit className="w-4 h-4" />
                      Conversation Preview (for Renaming)
                    </h3>

                    {/* Suggested Titles */}
                    {suggestedTitles.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-accent mb-2">💡 Suggested Titles (click to copy):</div>
                        <div className="space-y-1">
                          {suggestedTitles.map((title, i) => (
                            <button
                              key={i}
                              onClick={() => navigator.clipboard.writeText(title)}
                              className="block w-full text-left px-3 py-2 text-sm bg-[hsl(var(--surface))] hover:bg-accent/10 rounded border border-accent/20 transition-colors"
                            >
                              {i + 1}. {title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Topic Keywords */}
                    {topicKeywords.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-accent mb-2">🔑 Topic Keywords:</div>
                        <div className="flex flex-wrap gap-2">
                          {topicKeywords.map((keyword, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Conversation Messages */}
                    <div>
                      <div className="text-xs font-medium text-accent mb-2">💬 First Messages:</div>
                      <div className="space-y-3">
                        {conversationPreview.map((msg, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${
                            msg.role === 'user'
                              ? 'bg-primary/5 border-primary/20'
                              : 'bg-[hsl(var(--surface))] border-accent/20'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-accent">
                                {msg.role === 'user' ? '👤 User' : '🤖 Assistant'}
                              </span>
                            </div>
                            <div className="text-xs text-text-secondary whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                    </div>
                  )}
                </div>              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface rounded-lg hover:bg-surface/80 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleViewConversation}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              View Full Conversation
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Helper functions (reused from SummaryPanel)
function generateSessionSummary(messages) {
  if (!messages.length) return null

  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  if (!userMessages.length) return 'No user messages found'

  const firstUserMessage = userMessages[0]?.content?.slice(0, 100) + '...'
  const toolsUsed = messages.flatMap(m => m.toolsUsed || []).length

  return `Session started with: "${firstUserMessage}". ` +
         `${assistantMessages.length} assistant responses, ${toolsUsed} tool operations.`
}

function extractActions(messages) {
  return messages
    .flatMap(m => m.actions || [])
    .filter(Boolean)
}

function extractFileOperations(messages) {
  const operations = []
  messages.forEach(message => {
    if (message.toolsUsed) {
      message.toolsUsed.forEach(tool => {
        if (tool.details && (tool.details.file || tool.details.path)) {
          operations.push({
            file: tool.details.file || tool.details.path,
            operation: tool.name
          })
        }
      })
    }
  })
  return operations
}

function extractToolUsage(messages) {
  const toolCounts = {}
  messages.forEach(message => {
    if (message.toolsUsed) {
      message.toolsUsed.forEach(tool => {
        toolCounts[tool.name] = (toolCounts[tool.name] || 0) + 1
      })
    }
  })

  return Object.entries(toolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function getMessageDistribution(messages) {
  return messages.reduce((acc, message) => {
    acc[message.role] = (acc[message.role] || 0) + 1
    return acc
  }, {})
}

// New helper functions for renaming context
function extractFirstUserMessages(messages, limit = 5) {
  const userMessages = messages.filter(m => m.role === 'user' && m.content)
  return userMessages.slice(0, limit).map(m => {
    const content = m.content
    // Truncate long messages
    if (content.length > 150) {
      return content.slice(0, 150) + '...'
    }
    return content
  })
}

function extractConversationPreview(messages, limit = 6) {
  if (!messages.length) return []

  // Helper to check if content is conversational (not tool calls, IDE notifications, etc.)
  const isConversationalContent = (content) => {
    if (!content || content.trim().length < 10) return false

    const trimmed = content.trim()

    // Skip JSON objects (tool calls, queue operations, etc.)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return false

    // Skip IDE notifications
    if (trimmed.includes('<ide_opened_file>') ||
        trimmed.includes('<ide_selection>') ||
        trimmed.includes('<system-reminder>') ||
        trimmed.includes('<command-message>')) return false

    // Skip placeholder text
    if (trimmed === 'Assistant response' ||
        trimmed === 'User message' ||
        trimmed === 'Tool response') return false

    // Skip very short messages (likely not conversational)
    if (trimmed.length < 20) return false

    return true
  }

  // Get first N messages with actual conversational content
  const conversationMessages = messages
    .filter(m => m.content && isConversationalContent(m.content))
    .slice(0, limit)
    .map(m => {
      let content = m.content.trim()

      // Remove IDE tags if present but keep the actual message
      content = content.replace(/<ide_opened_file>.*?<\/ide_opened_file>/gs, '')
      content = content.replace(/<ide_selection>.*?<\/ide_selection>/gs, '')
      content = content.replace(/<system-reminder>.*?<\/system-reminder>/gs, '')
      content = content.trim()

      // Truncate long messages (500 chars max)
      if (content.length > 500) {
        content = content.slice(0, 500) + '...'
      }

      // Normalize role (ensure it's either 'user' or 'assistant')
      let role = m.role
      if (role !== 'user' && role !== 'assistant') {
        // If role is something else, try to infer from content
        // If content looks like a question or short statement, assume user
        role = 'user'
      }

      return {
        role: role,
        content: content
      }
    })
    .filter(m => m.content.length > 0) // Remove any that became empty after tag removal

  return conversationMessages
}

function generateSuggestedTitles(messages) {
  if (!messages.length) return []

  const userMessages = messages.filter(m => m.role === 'user' && m.content)
  if (!userMessages.length) return []

  const suggestions = []

  // Title based on first user message (short version)
  const firstMsg = userMessages[0]?.content || ''
  if (firstMsg) {
    const words = firstMsg.split(' ').slice(0, 8).join(' ')
    if (words) suggestions.push(words + (firstMsg.split(' ').length > 8 ? '...' : ''))
  }

  // Title based on detected patterns
  const allText = messages.map(m => m.content || '').join(' ')

  // Check for file mentions
  const fileMatches = allText.match(/(\w+\.\w+)/g)
  if (fileMatches && fileMatches.length > 0) {
    const uniqueFiles = [...new Set(fileMatches)].slice(0, 2)
    suggestions.push(`Working on ${uniqueFiles.join(', ')}`)
  }

  // Check for action verbs
  const actions = ['fix', 'bug', 'add', 'feature', 'implement', 'create', 'update', 'refactor', 'debug', 'error']
  const foundActions = actions.filter(action => allText.toLowerCase().includes(action))
  if (foundActions.length > 0) {
    const action = foundActions[0]
    suggestions.push(`${action.charAt(0).toUpperCase() + action.slice(1)} task`)
  }

  // Check for specific technologies mentioned
  const techs = ['react', 'node', 'python', 'javascript', 'typescript', 'api', 'database', 'frontend', 'backend']
  const foundTechs = techs.filter(tech => allText.toLowerCase().includes(tech))
  if (foundTechs.length > 0) {
    suggestions.push(`${foundTechs[0].charAt(0).toUpperCase() + foundTechs[0].slice(1)} development`)
  }

  return [...new Set(suggestions)].slice(0, 4) // Return max 4 unique suggestions
}

function extractTopicKeywords(messages) {
  if (!messages.length) return []

  const allText = messages.map(m => m.content || '').join(' ')

  // Extract file names
  const fileMatches = allText.match(/[\w-]+\.\w+/g) || []
  const files = [...new Set(fileMatches)].slice(0, 5)

  // Extract function/class names (camelCase or snake_case patterns)
  const codePatterns = allText.match(/\b[a-z][a-zA-Z0-9_]*\b/g) || []
  const filtered = codePatterns
    .filter(word => word.length > 4 && word.length < 20)
    .filter(word => !['const', 'function', 'return', 'import', 'export', 'this'].includes(word))
  const uniqueCode = [...new Set(filtered)].slice(0, 5)

  // Combine and return
  return [...files, ...uniqueCode].slice(0, 10)
}

export default SessionSummaryModal
