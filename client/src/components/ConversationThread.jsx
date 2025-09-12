import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import MessageBubble from './MessageBubble'

const ConversationThread = ({ projectId, sessionId, highlightMessageId }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [showUser, setShowUser] = useState(true)
  const [showAssistant, setShowAssistant] = useState(true)

  const { data, isLoading, error } = useQuery({
    queryKey: ['session', projectId, sessionId, currentPage, pageSize],
    queryFn: () => projectsApi.getSession(projectId, sessionId, { page: currentPage, pageSize }).then(res => res.data),
    enabled: !!(projectId && sessionId)
  })

  const { session, messages = [], stats, pagination } = data || {}

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-2">Failed to load conversation</div>
          <div className="text-sm text-gray-500">{error.message}</div>
        </div>
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">No messages found</div>
          <div className="text-sm text-gray-400">
            This session appears to be empty
          </div>
        </div>
      </div>
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
    <div className="h-full flex flex-col">
      {/* Session Header */}
      <div className="p-2 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {session?.title || sessionId}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {pagination ? `${pagination.total} total messages` : `${messages.length} messages`} • Template: {session?.template || 'unknown'}
            </p>
          </div>
          
          {stats && stats.skippedLines > 0 && (
            <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
              {stats.skippedLines} lines skipped
            </div>
          )}
        </div>

        {/* Pagination Info & Controls - Prominent Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded p-2 mt-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {pagination && pagination.totalPages > 1 && (
                <>
                  <div className="text-xs font-semibold text-blue-900">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="text-xs text-blue-700">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1}-{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} messages
                  </div>
                </>
              )}
              
              {/* Message Filter Toggle */}
              <div className="flex items-center space-x-2 border-l border-blue-300 pl-4">
                <span className="text-xs font-medium text-blue-900">Show:</span>
                <button
                  onClick={() => {
                    setShowUser(true)
                    setShowAssistant(false)
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showUser && !showAssistant 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
                  }`}
                  title="Show only user messages"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>User</span>
                </button>
                <button
                  onClick={() => {
                    setShowUser(false)
                    setShowAssistant(true)
                  }}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    !showUser && showAssistant 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
                  }`}
                  title="Show only assistant messages"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Assistant</span>
                </button>
                {(!showUser || !showAssistant) && (
                  <button
                    onClick={() => {
                      setShowUser(true)
                      setShowAssistant(true)
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    title="Show all messages"
                  >
                    Show All
                  </button>
                )}
                {/* Filtered count indicator */}
                {(!showUser || !showAssistant) && (
                  <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {messages.filter(message => {
                      if (message.role === 'user' && !showUser) return false
                      if (message.role === 'assistant' && !showAssistant) return false
                      return true
                    }).length} of {messages.length} visible
                  </div>
                )}
              </div>
            </div>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <label className="text-xs font-medium text-blue-900">
                  Per page:
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-blue-300 rounded px-1.5 py-0.5 text-xs bg-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 conversation-scroll-area">
        {messages
          .filter(message => {
            if (message.role === 'user' && !showUser) return false
            if (message.role === 'assistant' && !showAssistant) return false
            return true
          })
          .map((message, index, filteredMessages) => (
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
          ))}
        
        {/* No messages after filtering */}
        {messages.filter(message => {
          if (message.role === 'user' && !showUser) return false
          if (message.role === 'assistant' && !showAssistant) return false
          return true
        }).length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-500 mb-2">No messages to display</div>
              <div className="text-sm text-gray-400">
                Adjust the message filter to see content
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-slate-200 bg-gradient-to-r from-white to-slate-50 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
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
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(pagination.totalPages)}
                      className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {pagination.totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Jump */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-700">Go to page:</span>
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
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs w-12 text-center"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversationThread