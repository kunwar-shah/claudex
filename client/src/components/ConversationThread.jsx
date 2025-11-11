import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  User,
  Bot,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { projectsApi, sessionMetadataApi } from '../services/api'
import MessageBubble from './MessageBubble'
import MessagingBubble from './MessagingBubble'
import ExportButton from './ExportButton'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { Muted, Small } from './ui/typography'
import EmptyState from './layout/EmptyState'
import { cn } from '@/lib/utils'
import { useSettings } from '../contexts/SettingsContext'

const ConversationThread = ({ projectId, sessionId, highlightMessageId }) => {
  const { settings } = useSettings()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showUser, setShowUser] = useState(true)
  const [showAssistant, setShowAssistant] = useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['session', projectId, sessionId, currentPage, pageSize],
    queryFn: () => projectsApi.getSession(projectId, sessionId, { page: currentPage, pageSize }).then(res => res.data),
    enabled: !!(projectId && sessionId)
  })

  // Fetch session metadata for custom title
  const { data: metadataData } = useQuery({
    queryKey: ['session-metadata', projectId, sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, sessionId).then(res => res.data),
    enabled: !!(projectId && sessionId)
  })

  const { session, messages = [], stats, pagination} = data || {}
  const metadata = metadataData?.metadata || null

  // Scroll to highlighted message when data loads
  useEffect(() => {
    if (highlightMessageId && messages.length > 0) {
      const highlightedMessage = messages.find(msg => msg.id === highlightMessageId)
      
      if (highlightedMessage) {
        // Small delay to ensure the DOM is rendered
        setTimeout(() => {
          const messageElement = document.getElementById(`message-${highlightMessageId}`)
          
          if (messageElement) {
            messageElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            })
            // Add temporary highlight effect
            messageElement.style.backgroundColor = '#fef3c7' // yellow-100
            messageElement.style.border = '2px solid #f59e0b' // yellow-500
            messageElement.style.borderRadius = '8px'
            messageElement.style.padding = '8px'
            messageElement.style.transition = 'all 0.3s ease'
            
            // Remove highlight after 30 seconds
            setTimeout(() => {
              messageElement.style.backgroundColor = ''
              messageElement.style.border = ''
              messageElement.style.borderRadius = ''
              messageElement.style.padding = ''
              messageElement.style.transition = ''
            }, 30000)
          }
        }, 500) // Increased delay to ensure DOM is ready
      } else {
        // Message not found in current page - need to load all messages first
        if (pagination && pagination.totalPages > 1) {
          // Load all messages by setting page size to total
          setCurrentPage(1)
          setPageSize(pagination.total)
        }
      }
    }
  }, [highlightMessageId, messages, pagination])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Failed to load conversation"
        description={error.message}
      />
    )
  }

  if (!messages.length) {
    return (
      <EmptyState
        title="No messages found"
        description="This session appears to be empty"
      />
    )
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when page size changes
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Session Header */}
      <div className="p-4 border-b border-border bg-surface">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <Small className="font-semibold line-clamp-2 mb-1">
              {metadata?.customTitle || session?.title || sessionId}
            </Small>
            {metadata?.customTitle && (
              <Muted className="text-xs italic mb-1">
                Original: {session?.title || sessionId}
              </Muted>
            )}
            <Muted className="text-xs">
              {pagination ? `${pagination.total} total messages` : `${messages.length} messages`} • Template: {session?.template || 'unknown'}
            </Muted>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {stats && stats.skippedLines > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                {stats.skippedLines} lines skipped
              </Badge>
            )}

            <ExportButton
              projectId={projectId}
              sessionId={sessionId}
              sessionTitle={metadata?.customTitle || session?.title}
            />
          </div>
        </div>

        {/* Pagination Info & Controls */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                {pagination && pagination.totalPages > 1 && (
                  <>
                    <Small className="font-semibold">
                      Page {pagination.page} of {pagination.totalPages}
                    </Small>
                    <Muted className="text-xs">
                      Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} messages
                    </Muted>
                  </>
                )}

                {/* Message Filter Toggle */}
                <div className="flex items-center gap-2 pl-4 border-l border-border">
                  <Muted className="text-xs font-medium">Show:</Muted>
                  <Button
                    variant={showUser && !showAssistant ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowUser(true)
                      setShowAssistant(false)
                    }}
                    className="h-7 gap-1"
                    title="Show only user messages"
                  >
                    <User className="w-3 h-3" />
                    User
                  </Button>
                  <Button
                    variant={!showUser && showAssistant ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setShowUser(false)
                      setShowAssistant(true)
                    }}
                    className="h-7 gap-1"
                    title="Show only assistant messages"
                  >
                    <Bot className="w-3 h-3" />
                    Assistant
                  </Button>
                  {(!showUser || !showAssistant) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowUser(true)
                        setShowAssistant(true)
                      }}
                      className="h-7 text-xs"
                      title="Show all messages"
                    >
                      Show All
                    </Button>
                  )}
                  {/* Filtered count indicator */}
                  {(!showUser || !showAssistant) && (
                    <Badge variant="secondary">
                      {messages.filter(message => {
                        if (message.role === 'user' && !showUser) return false
                        if (message.role === 'assistant' && !showAssistant) return false
                        return true
                      }).length} of {messages.length} visible
                    </Badge>
                  )}
                </div>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Muted className="text-xs font-medium">Per page:</Muted>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <div className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden conversation-scroll-area",
        settings.conversationView === 'messaging'
          ? "p-4 bg-background"
          : "p-2 space-y-2"
      )}>
        {messages
          .filter(message => {
            if (message.role === 'user' && !showUser) return false
            if ((message.role === 'assistant' || message.role === 'tool_results') && !showAssistant) return false
            return true
          })
          .map((message, index, filteredMessages) => {
            // Use messaging view if enabled
            if (settings.conversationView === 'messaging') {
              return (
                <MessagingBubble
                  key={message.id || index}
                  message={message}
                  showTimestamp={settings.showTimestamps === 'always'}
                />
              )
            }

            // Use detailed view (default)
            return (
              <div
                key={message.id || index}
                id={message.id ? `message-${message.id}` : undefined}
                className="max-w-full"
              >
                <MessageBubble
                  message={message}
                  isFirst={index === 0}
                  isLast={index === filteredMessages.length - 1}
                />
              </div>
            )
          })}
        
        {/* No messages after filtering */}
        {messages.filter(message => {
          if (message.role === 'user' && !showUser) return false
          if ((message.role === 'assistant' || message.role === 'tool_results') && !showAssistant) return false
          return true
        }).length === 0 && (
          <EmptyState
            title="No messages to display"
            description="Adjust the message filter to see content"
          />
        )}
      </div>

      {/* Bottom Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-border bg-surface p-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="h-7"
              >
                <ChevronLeft className="w-3 h-3 mr-1" />
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-7 w-7 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                  <>
                    <Muted className="px-2 text-xs">...</Muted>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className="h-7 w-7 p-0"
                    >
                      {pagination.totalPages}
                    </Button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-7"
              >
                Next
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {/* Quick Jump */}
            <div className="flex items-center gap-2">
              <Muted className="text-xs">Go to page:</Muted>
              <input
                type="number"
                min="1"
                max={pagination.totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Number(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="h-7 w-12 rounded-md border border-border bg-background px-2 text-xs text-center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationThread