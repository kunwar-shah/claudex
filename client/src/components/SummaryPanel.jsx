import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import SessionMetadataControls from './SessionMetadataControls'

const SummaryPanel = ({ projectId, sessionId }) => {
  // Get the complete session for universal summary (not affected by pagination)
  const { data, isLoading, error } = useQuery({
    queryKey: ['session-complete', projectId, sessionId],
    queryFn: async () => {
      // Get session metadata first
      const firstPage = await projectsApi.getSession(projectId, sessionId, { page: 1, pageSize: 50 }).then(res => res.data)
      const totalMessages = firstPage.pagination?.total || 0
      
      // If there are many messages, get them all in one large request
      if (totalMessages > 50) {
        const fullSession = await projectsApi.getSession(projectId, sessionId, { page: 1, pageSize: totalMessages }).then(res => res.data)
        return fullSession
      }
      
      return firstPage
    },
    enabled: !!(projectId && sessionId),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes since full session rarely changes
  })

  if (isLoading) {
    return (
      <div className="h-full p-2">
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-slate-200 rounded w-3/4"></div>
          <div className="space-y-1.5">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-full p-2">
        <div className="text-red-600 text-xs">
          Failed to load session summary
        </div>
      </div>
    )
  }

  const { session, messages = [], stats, pagination } = data || {}
  
  // Generate summary from all messages for complete analysis
  const summary = generateSessionSummary(messages)
  const actions = extractActions(messages)
  const fileOperations = extractFileOperations(messages)
  const toolUsage = extractToolUsage(messages)

  return (
    <div className="h-full flex flex-col">
      <div className="p-1.5 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-xs text-slate-800">Session Summary</h3>
          {pagination && (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              {pagination.total} msgs
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1 space-y-1.5">
        {/* Session Management */}
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-1">Session Management</h4>
          <SessionMetadataControls
            projectId={projectId}
            sessionId={sessionId}
            currentTitle={session?.title || sessionId}
          />
        </div>

        {/* Overview */}
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-1">Overview</h4>
          <div className="text-xs text-slate-600 space-y-0.5">
            <div>Messages: <span className="font-medium">{pagination?.total || messages.length}</span></div>
            <div>Template: <span className="font-medium">{session?.template || 'unknown'}</span></div>
            <div>Created: <span className="font-medium">{session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown'}</span></div>
            {stats?.skippedLines > 0 && (
              <div className="text-yellow-600 text-xs">
                Skipped: {stats.skippedLines} lines
              </div>
            )}
          </div>
        </div>

        {/* AI Generated Summary */}
        {summary && (
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1">Summary</h4>
            <div className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded break-words leading-relaxed">
              {summary}
            </div>
          </div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1">Actions Performed</h4>
            <div className="space-y-0.5">
              {actions.slice(0,5).map((action, index) => (
                <div key={index} className="text-xs text-slate-600 flex items-start space-x-1">
                  <span className="w-1 h-1 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span className="break-words leading-tight">{action}</span>
                </div>
              ))}
              {actions.length > 5 && <div className="text-xs text-slate-400">+{actions.length - 5} more</div>}
            </div>
          </div>
        )}

        {/* File Operations */}
        {fileOperations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1">File Operations</h4>
            <div className="space-y-0.5">
              {fileOperations.slice(0,3).map((op, index) => (
                <div key={index} className="text-xs bg-blue-50 px-1.5 py-0.5 rounded flex items-center justify-between">
                  <span className="font-mono text-xs break-words flex-1 mr-1 truncate">{op.file}</span>
                  <span className="text-xs text-blue-600 flex-shrink-0">{op.operation}</span>
                </div>
              ))}
              {fileOperations.length > 3 && <div className="text-xs text-slate-400">+{fileOperations.length - 3} more</div>}
            </div>
          </div>
        )}

        {/* Tool Usage */}
        {toolUsage.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-800 mb-1">Tools Used</h4>
            <div className="space-y-0.5">
              {toolUsage.slice(0,4).map((tool, index) => (
                <div key={index} className="text-xs bg-emerald-50 px-1.5 py-0.5 rounded flex items-center justify-between">
                  <span className="truncate">{tool.name}</span>
                  <span className="text-xs text-emerald-600 flex-shrink-0">{tool.count}x</span>
                </div>
              ))}
              {toolUsage.length > 4 && <div className="text-xs text-slate-400">+{toolUsage.length - 4} more</div>}
            </div>
          </div>
        )}

        {/* Message Distribution */}
        <div>
          <h4 className="text-xs font-semibold text-slate-800 mb-1">Message Distribution</h4>
          <div className="space-y-2">
            {Object.entries(getMessageDistribution(messages)).map(([role, count]) => (
              <div key={role} className="flex justify-between text-sm">
                <span className="capitalize text-gray-600">{role}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
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

export default SummaryPanel