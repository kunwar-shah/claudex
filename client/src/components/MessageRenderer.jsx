import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Highlight, themes } from 'prism-react-renderer'
import { useSettings } from '../contexts/SettingsContext'

const MessageRenderer = ({ content, contentKind = 'text' }) => {
  const { settings } = useSettings()

  // Map settings.codeTheme to prism themes
  const getTheme = () => {
    switch (settings.codeTheme) {
      case 'github-dark':
        return themes.vsDark
      case 'monokai':
        return themes.nightOwl
      case 'solarized-light':
        return themes.github
      default:
        return themes.vsDark
    }
  }

  const selectedTheme = getTheme()

  // Robust content validation and normalization
  if (!content && content !== 0) {
    return <div className="text-gray-400 italic">No content</div>
  }

  // Ensure content is a string for operations that require it
  const normalizeContent = (value) => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2)
    }
    return String(value || '')
  }

  const safeContent = normalizeContent(content)

  switch (contentKind) {
    case 'markdown':
      return (
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <Highlight
                  theme={selectedTheme}
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
                <code className="bg-[hsl(var(--surface-hover))] px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            },
            pre({ children }) {
              return <div className="overflow-x-auto">{children}</div>
            },
            blockquote({ children }) {
              return (
                <blockquote className="border-l-4 border-[hsl(var(--border-hover))] pl-4 italic">
                  {children}
                </blockquote>
              )
            }
          }}
        >
          {safeContent}
        </ReactMarkdown>
      )

    case 'diff':
      return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
            {safeContent.split('\n').map((line, index) => (
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
          <div className="bg-[hsl(var(--surface-hover))] p-4 rounded-lg overflow-hidden">
            <pre className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
              {safeContent}
            </pre>
          </div>
        )
      }

    case 'code':
      return (
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-hidden">
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
            <code>{safeContent}</code>
          </pre>
        </div>
      )

    case 'raw':
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg overflow-hidden">
          <div className="text-xs text-yellow-800 mb-2 font-medium">
            Raw/Unknown Format
          </div>
          <pre className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
            {safeContent}
          </pre>
        </div>
      )

    default:
      // Plain text with basic formatting
      const formattedContent = safeContent
        .split('\n')
        .map((line, index) => (
          <div key={index}>
            {line || '\u00A0'} {/* Non-breaking space for empty lines */}
          </div>
        ))

      return (
        <div className="whitespace-pre-wrap">
          {formattedContent}
        </div>
      )
  }
}

export default MessageRenderer