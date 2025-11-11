import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { projectsApi } from '../services/api'
import SessionMetadataControls from './SessionMetadataControls'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Muted, Small } from './ui/typography'
import { cn } from '@/lib/utils'

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
      <div className="h-full flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
          <Muted className="text-xs text-error">Failed to load summary</Muted>
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
    <div className="h-full flex flex-col bg-background">
      <div className="p-3 border-b border-border bg-surface">
        <div className="flex items-center justify-between">
          <Small className="font-semibold">Summary</Small>
          {pagination && (
            <Badge variant="secondary">
              {pagination.total} msgs
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* SECTION 1: Session Summary */}
        <Card className="border-primary/20">
          <Button
            variant="ghost"
            onClick={() => setIsSummaryCollapsed(!isSummaryCollapsed)}
            className="w-full justify-between hover:bg-primary/5 p-3"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <Small className="font-semibold">Session Summary</Small>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-primary transition-transform",
              !isSummaryCollapsed && "rotate-180"
            )} />
          </Button>

          {!isSummaryCollapsed && (
            <CardContent className="p-3 pt-0 space-y-3">
              {/* Overview */}
              <div>
                <Small className="font-semibold mb-1 block">Overview</Small>
                <div className="space-y-0.5">
                  <Muted className="text-xs">Messages: <span className="font-medium text-text-primary">{pagination?.total || messages.length}</span></Muted>
                  <Muted className="text-xs">Template: <span className="font-medium text-text-primary">{session?.template || 'unknown'}</span></Muted>
                  <Muted className="text-xs">Created: <span className="font-medium text-text-primary">{session?.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Unknown'}</span></Muted>
                  {stats?.skippedLines > 0 && (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 h-5">
                      Skipped: {stats.skippedLines} lines
                    </Badge>
                  )}
                </div>
              </div>

              {/* AI Generated Summary */}
              {summary && (
                <div>
                  <Small className="font-semibold mb-1 block">Summary</Small>
                  <Card className="bg-surface/50">
                    <CardContent className="p-2">
                      <Muted className="text-xs break-words leading-relaxed">
                        {summary}
                      </Muted>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Actions */}
              {actions.length > 0 && (
                <div>
                  <Small className="font-semibold mb-1 block">Actions Performed</Small>
                  <div className="space-y-1">
                    {actions.slice(0,5).map((action, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full mt-1.5 flex-shrink-0"></span>
                        <Muted className="text-xs break-words leading-tight flex-1">{action}</Muted>
                      </div>
                    ))}
                    {actions.length > 5 && <Muted className="text-xs">+{actions.length - 5} more</Muted>}
                  </div>
                </div>
              )}

              {/* Tool Usage */}
              {toolUsage.length > 0 && (
                <div>
                  <Small className="font-semibold mb-1 block">Tools Used</Small>
                  <div className="space-y-1">
                    {toolUsage.slice(0,4).map((tool, index) => (
                      <div key={index} className="flex items-center justify-between bg-accent/5 border border-accent/20 px-2 py-1 rounded">
                        <span className="text-xs truncate text-text-primary">{tool.name}</span>
                        <Badge variant="secondary" className="h-5">
                          {tool.count}x
                        </Badge>
                      </div>
                    ))}
                    {toolUsage.length > 4 && <Muted className="text-xs">+{toolUsage.length - 4} more</Muted>}
                  </div>
                </div>
              )}

              {/* Message Distribution */}
              <div>
                <Small className="font-semibold mb-1 block">Message Distribution</Small>
                <div className="space-y-1">
                  {Object.entries(getMessageDistribution(messages)).map(([role, count]) => (
                    <div key={role} className="flex justify-between">
                      <Muted className="text-xs capitalize">{role}:</Muted>
                      <span className="text-xs font-medium text-text-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* SECTION 2: Token Usage */}
        {stats?.tokens && stats.tokens.messagesWithUsage > 0 && (
          <Card className="border-warning/20">
            <Button
              variant="ghost"
              onClick={() => setIsTokenUsageCollapsed(!isTokenUsageCollapsed)}
              className="w-full justify-between hover:bg-warning/5 p-3"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-warning" />
                <Small className="font-semibold">Token Usage</Small>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-warning transition-transform",
                !isTokenUsageCollapsed && "rotate-180"
              )} />
            </Button>

            {!isTokenUsageCollapsed && (
              <CardContent className="p-3 pt-0">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Muted className="text-xs">Total Tokens:</Muted>
                    <span className="text-xs font-medium text-text-primary">{stats.tokens.totalTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <Muted className="text-xs">Input:</Muted>
                    <span className="text-xs font-medium text-primary">{stats.tokens.totalInputTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <Muted className="text-xs">Output:</Muted>
                    <span className="text-xs font-medium text-accent">{stats.tokens.totalOutputTokens.toLocaleString()}</span>
                  </div>
                  {stats.tokens.totalCacheCreationTokens > 0 && (
                    <div className="flex justify-between">
                      <Muted className="text-xs">Cache Creation:</Muted>
                      <span className="text-xs font-medium text-warning">{stats.tokens.totalCacheCreationTokens.toLocaleString()}</span>
                    </div>
                  )}
                  {stats.tokens.totalCacheReadTokens > 0 && (
                    <div className="flex justify-between">
                      <Muted className="text-xs">Cache Reads:</Muted>
                      <span className="text-xs font-medium text-success">{stats.tokens.totalCacheReadTokens.toLocaleString()}</span>
                    </div>
                  )}
                  {(stats.tokens.totalCacheCreationTokens > 0 || stats.tokens.totalCacheReadTokens > 0) && (
                    <div className="flex justify-between pt-1 border-t border-border">
                      <Muted className="text-xs">Cache Hit Rate:</Muted>
                      <span className="text-xs font-medium text-primary">{stats.tokens.cacheHitRate.toFixed(2)}%</span>
                    </div>
                  )}
                  {(stats.tokens.ephemeral5mTokens > 0 || stats.tokens.ephemeral1hTokens > 0) && (
                    <div className="pt-1 border-t border-border mt-1">
                      <Small className="font-semibold mb-1 block">Cache Breakdown:</Small>
                      {stats.tokens.ephemeral5mTokens > 0 && (
                        <div className="flex justify-between pl-2">
                          <Muted className="text-xs">5m TTL:</Muted>
                          <span className="text-xs font-medium text-text-primary">{stats.tokens.ephemeral5mTokens.toLocaleString()}</span>
                        </div>
                      )}
                      {stats.tokens.ephemeral1hTokens > 0 && (
                        <div className="flex justify-between pl-2">
                          <Muted className="text-xs">1h TTL:</Muted>
                          <span className="text-xs font-medium text-text-primary">{stats.tokens.ephemeral1hTokens.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* SECTION 3: Session Management */}
        <Card className="border-accent/20">
          <Button
            variant="ghost"
            onClick={() => setIsManagementCollapsed(!isManagementCollapsed)}
            className="w-full justify-between hover:bg-accent/5 p-3"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-accent" />
              <Small className="font-semibold">Session Management</Small>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-accent transition-transform",
              !isManagementCollapsed && "rotate-180"
            )} />
          </Button>

          {!isManagementCollapsed && (
            <CardContent className="p-3 pt-0">
              <SessionMetadataControls
                projectId={projectId}
                sessionId={sessionId}
                currentTitle={session?.title || sessionId}
              />
            </CardContent>
          )}
        </Card>
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