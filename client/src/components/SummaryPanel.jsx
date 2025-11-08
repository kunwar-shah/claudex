import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import SessionMetadataControls from './SessionMetadataControls'

const SummaryPanel = ({ projectId, sessionId }) => {
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(false)
  const [isTokenUsageCollapsed, setIsTokenUsageCollapsed] = useState(true)
  const [isManagementCollapsed, setIsManagementCollapsed] = useState(true)
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
          <h3 className="font-semibold text-xs text-slate-800">Summary</h3>
          {pagination && (
            <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              {pagination.total} msgs
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <>
          {/* SECTION 1: Session Summary */}
          <div className="border-b border-slate-200">
          <button
            onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-2 py-2 flex justify-between items-center hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h4 className="text-xs font-semibold text-blue-900">Session Summary</h4>
            </div>
            <svg
              className={`w-4 h-4 text-blue-600 transition-transform ${isSummaryCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!isSummaryCollapsed && (
            <div className="p-1.5 space-y-1.5 bg-slate-50">
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
                  <div className="text-xs text-slate-600 bg-white p-1.5 rounded break-words leading-relaxed">
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
                <div className="space-y-1">
                  {Object.entries(getMessageDistribution(messages)).map(([role, count]) => (
                    <div key={role} className="flex justify-between text-xs">
                      <span className="capitalize text-slate-600">{role}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Token Usage (from PR #17) */}
        {stats?.tokens && stats.tokens.messagesWithUsage > 0 && (
          <div className="border-b border-slate-200">
            <button
              onClick={() => setIsTokenUsageCollapsed(!isTokenUsageCollapsed)}
              className="w-full bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-2 flex justify-between items-center hover:from-amber-100 hover:to-orange-100 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h4 className="text-xs font-semibold text-amber-900">Token Usage</h4>
              </div>
              <svg
                className={`w-4 h-4 text-amber-600 transition-transform ${isTokenUsageCollapsed ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {!isTokenUsageCollapsed && (
              <div className="p-1.5 bg-slate-50">
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Total Tokens:</span>
                    <span className="font-medium">{stats.tokens.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Input:</span>
                    <span className="font-medium text-blue-600">{stats.tokens.totalInputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output:</span>
                    <span className="font-medium text-emerald-600">{stats.tokens.totalOutputTokens.toLocaleString()}</span>
                  </div>
                  {stats.tokens.totalCacheCreationTokens > 0 && (
                    <div className="flex justify-between">
                      <span>Cache Creation:</span>
                      <span className="font-medium text-amber-600">{stats.tokens.totalCacheCreationTokens.toLocaleString()}</span>
                    </div>
                  )}
                  {stats.tokens.totalCacheReadTokens > 0 && (
                    <div className="flex justify-between">
                      <span>Cache Reads:</span>
                      <span className="font-medium text-purple-600">{stats.tokens.totalCacheReadTokens.toLocaleString()}</span>
                    </div>
                  )}
                  {(stats.tokens.totalCacheCreationTokens > 0 || stats.tokens.totalCacheReadTokens > 0) && (
                    <div className="flex justify-between pt-0.5 border-t border-slate-200">
                      <span>Cache Hit Rate:</span>
                      <span className="font-medium text-indigo-600">{stats.tokens.cacheHitRate.toFixed(2)}%</span>
                    </div>
                  )}
                  {(stats.tokens.ephemeral5mTokens > 0 || stats.tokens.ephemeral1hTokens > 0) && (
                    <div className="pt-0.5 border-t border-slate-200 mt-1">
                      <div className="text-xs font-medium text-slate-700 mb-0.5">Cache Breakdown:</div>
                      {stats.tokens.ephemeral5mTokens > 0 && (
                        <div className="flex justify-between pl-2">
                          <span>5m TTL:</span>
                          <span className="font-medium">{stats.tokens.ephemeral5mTokens.toLocaleString()}</span>
                        </div>
                      )}
                      {stats.tokens.ephemeral1hTokens > 0 && (
                        <div className="flex justify-between pl-2">
                          <span>1h TTL:</span>
                          <span className="font-medium">{stats.tokens.ephemeral1hTokens.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Session Management (from dev-3.1) */}
        <div className="border-b border-slate-200">
          <button
            onClick={() => setIsManagementCollapsed(!isManagementCollapsed)}
            className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 px-2 py-2 flex justify-between items-center hover:from-emerald-100 hover:to-teal-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h4 className="text-xs font-semibold text-emerald-900">Session Management</h4>
            </div>
            <svg
              className={`w-4 h-4 text-emerald-600 transition-transform ${isManagementCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {!isManagementCollapsed && (
            <div className="p-1.5 bg-slate-50">
              <SessionMetadataControls
                projectId={projectId}
                sessionId={sessionId}
                currentTitle={session?.title || sessionId}
              />
            </div>
          )}
        </div>
        </>
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