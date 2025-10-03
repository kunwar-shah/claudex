import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import MessageRenderer from './MessageRenderer'
import ClaudeMessageRenderer from './ClaudeMessageRenderer'

const MessageBubble = ({ message, isFirst, isLast }) => {
  const [showRaw, setShowRaw] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isExpanded, setIsExpanded] = useState(() => {
    // Only collapse for v2-mixed template messages that are explicitly marked as collapsed
    return message.metadata?.collapsed !== true
  })

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      
      // Show success toast
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in'
      toast.textContent = 'Message copied to clipboard!'
      document.body.appendChild(toast)
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 2000)
      
      console.log('Message copied to clipboard')
    } catch (error) {
      console.error('Failed to copy message:', error)
      
      // Show error toast
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in'
      toast.textContent = 'Failed to copy message'
      document.body.appendChild(toast)
      
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 2000)
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'user':
        return 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
      case 'assistant':
        return 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
      case 'system':
        return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
      default:
        return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'user':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        )
      case 'assistant':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'system':
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  return (
    <div className={`border rounded-lg p-4 max-w-full overflow-hidden ${getRoleColor(message.role)}`}>
      {/* Message Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getRoleIcon(message.role)}
          <span className="font-medium text-gray-900 capitalize">
            {message.role}
            {message.role === 'system' && message.metadata?.displayType === 'summary' && (
              <span className="ml-1 text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                Summary
              </span>
            )}
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>
          {message.lineNumber && (
            <span className="text-xs text-gray-400">
              Line {message.lineNumber}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Collapse/Expand button only for v2-mixed template messages */}
          {message.metadata?.collapsed !== undefined && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Show tools used"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Copy message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Show raw JSON"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tools Used */}
      {showActions && message.toolsUsed && message.toolsUsed.length > 0 && (
        <div className="mb-3 p-2 bg-white bg-opacity-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">Tools Used:</div>
          <div className="space-y-1">
            {message.toolsUsed.map((tool, index) => (
              <div key={index} className="text-sm text-gray-600">
                <span className="font-medium">{tool.name}</span>
                {tool.details && (
                  <span className="ml-2 text-gray-500">
                    {typeof tool.details === 'string' 
                      ? tool.details.slice(0, 100)
                      : JSON.stringify(tool.details).slice(0, 100)
                    }...
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {message.actions && message.actions.length > 0 && (
        <div className="mb-3 p-2 bg-white bg-opacity-50 rounded border">
          <div className="text-sm font-medium text-gray-700 mb-2">Actions:</div>
          <div className="flex flex-wrap gap-1">
            {message.actions.map((action, index) => (
              <span key={index} className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded">
                {action}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Message Content */}
      {isExpanded ? (
        <div className="prose prose-sm max-w-none overflow-hidden">
          {/* Use ClaudeMessageRenderer for v2-mixed and v3 templates, otherwise use regular MessageRenderer */}
          {(message.metadata?.template === 'claude-code-v2-mixed' || message.metadata?.template === 'claude-code-v3') ? (
            <ClaudeMessageRenderer message={message} />
          ) : (
            <MessageRenderer content={message.content} contentKind={message.contentKind} />
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 italic">
          {message.metadata?.displayType === 'summary' ? (
            <span>AI Summary: {message.content?.slice(0, 100)}...</span>
          ) : (
            <span>System message (click to expand)</span>
          )}
        </div>
      )}

      {/* Raw JSON */}
      {showRaw && message.raw && (
        <div className="mt-3 p-3 bg-gray-100 rounded text-xs font-mono overflow-hidden">
          <pre className="whitespace-pre-wrap break-words overflow-x-auto">
            {JSON.stringify(message.raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default MessageBubble