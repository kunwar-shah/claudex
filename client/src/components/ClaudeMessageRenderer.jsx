import React, { useState } from 'react'
import MessageRenderer from './MessageRenderer'

const ClaudeMessageRenderer = ({ message }) => {
  const [showThinking, setShowThinking] = useState(false)
  const [showToolDetails, setShowToolDetails] = useState({})

  // Only render for v2-mixed and v3 template messages
  if (message.metadata?.template !== 'claude-code-v2-mixed' && message.metadata?.template !== 'claude-code-v3') {
    return <MessageRenderer content={message.content} contentKind={message.contentKind} />
  }

  const contentBlocks = message.metadata?.contentBlocks || {}

  const toggleToolDetails = (toolId) => {
    setShowToolDetails(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }))
  }

  return (
    <div className="claude-conversation-content">
      {/* Main text content */}
      {message.content && (
        <MessageRenderer content={message.content} contentKind={message.contentKind} />
      )}

      {/* Tool Use Blocks */}
      {contentBlocks.toolUse && contentBlocks.toolUse.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-blue-700 mb-2">🔧 Tool Calls</h4>
          {contentBlocks.toolUse.map((tool, index) => (
            <div key={tool.id || index} className="mb-2 border border-blue-200 rounded-lg bg-blue-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm font-semibold text-blue-800">{tool.name}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {tool.id}
                  </span>
                </div>
                <button
                  onClick={() => toggleToolDetails(tool.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  {showToolDetails[tool.id] ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {showToolDetails[tool.id] && (
                <div className="bg-white rounded p-2 text-xs">
                  <pre className="whitespace-pre-wrap text-gray-800">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tool Result Blocks */}
      {contentBlocks.toolResults && contentBlocks.toolResults.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium text-green-700 mb-2">📤 Tool Results</h4>
          {contentBlocks.toolResults.map((result, index) => (
            <div key={result.tool_use_id || index} className={`mb-2 border rounded-lg p-3 ${
              result.is_error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Tool ID:</span>
                  <span className="font-mono text-xs">{result.tool_use_id}</span>
                  {result.is_error && (
                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      ERROR
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded p-2 max-h-40 overflow-y-auto">
                <MessageRenderer
                  content={result.content}
                  contentKind={result.content && result.content.includes('```') ? 'markdown' : 'text'}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Thinking Blocks */}
      {contentBlocks.thinking && contentBlocks.thinking.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-purple-700">🤔 Internal Reasoning</h4>
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="text-purple-600 hover:text-purple-800 text-xs px-2 py-1 bg-purple-100 rounded"
            >
              {showThinking ? 'Hide Reasoning' : 'Show Reasoning'}
            </button>
          </div>

          {showThinking && contentBlocks.thinking.map((thinking, index) => (
            <div key={index} className="border border-purple-200 rounded-lg bg-purple-50 p-3">
              <div className="bg-white rounded p-3 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-800">
                  {thinking.thinking}
                </pre>
              </div>

              {thinking.signature && (
                <div className="mt-2 text-xs text-purple-600 font-mono truncate">
                  Signature: {thinking.signature.slice(0, 50)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Usage Information for Assistant Messages */}
      {message.metadata?.usage && (
        <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="flex space-x-4">
            <span>Input: {message.metadata.usage.input_tokens}</span>
            <span>Output: {message.metadata.usage.output_tokens}</span>
            {message.metadata.usage.cache_read_input_tokens && (
              <span>Cache: {message.metadata.usage.cache_read_input_tokens}</span>
            )}
            {message.metadata.model && (
              <span>Model: {message.metadata.model}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClaudeMessageRenderer