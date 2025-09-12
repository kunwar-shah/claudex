import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Highlight, themes } from 'prism-react-renderer'

const MessageRenderer = ({ content, contentKind = 'text' }) => {
  if (!content) {
    return <div className="text-gray-400 italic">No content</div>
  }

  switch (contentKind) {
    case 'markdown':
      return (
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <Highlight
                  theme={themes.github}
                  code={String(children).replace(/\n$/, '')}
                  language={match[1]}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre className={className} style={style}>
                      {tokens.map((line, i) => {
                        const lineProps = getLineProps({ line })
                        return (
                          <div key={i} {...lineProps}>
                            {line.map((token, tokenIndex) => {
                              const tokenProps = getTokenProps({ token })
                              return <span key={tokenIndex} {...tokenProps} />
                            })}
                          </div>
                        )
                      })}
                    </pre>
                  )}
                </Highlight>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            },
            pre({ children }) {
              return <div className="overflow-x-auto">{children}</div>
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700">
                  {children}
                </blockquote>
              )
            }
          }}
        >
          {content}
        </ReactMarkdown>
      )

    case 'diff':
      return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            {content.split('\n').map((line, index) => (
              <div key={index} className={`${
                line.startsWith('+') ? 'text-green-400' :
                line.startsWith('-') ? 'text-red-400' :
                line.startsWith('@@') ? 'text-blue-400' :
                ''
              }`}>
                {line}
              </div>
            ))}
          </pre>
        </div>
      )

    case 'json':
      try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content
        return (
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-hidden">
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        )
      } catch (error) {
        // Fall back to raw text if JSON parsing fails
        return (
          <div className="bg-gray-100 p-4 rounded-lg overflow-hidden">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
              {content}
            </pre>
          </div>
        )
      }

    case 'code':
      return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-hidden">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
            <code>{content}</code>
          </pre>
        </div>
      )

    case 'raw':
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg overflow-hidden">
          <div className="text-xs text-yellow-800 mb-2 font-medium">
            Raw/Unknown Format
          </div>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words overflow-x-auto">
            {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
          </pre>
        </div>
      )

    default:
      // Plain text with basic formatting
      const formattedContent = content
        .split('\n')
        .map((line, index) => (
          <div key={index}>
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))

      return (
        <div className="whitespace-pre-wrap text-gray-800">
          {formattedContent}
        </div>
      )
  }
}

export default MessageRenderer