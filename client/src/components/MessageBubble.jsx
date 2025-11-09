import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  User,
  Bot,
  Settings,
  Info,
  ChevronRight,
  Copy,
  Code,
  Wrench,
  BarChart3
} from 'lucide-react'
import MessageRenderer from './MessageRenderer'
import ClaudeMessageRenderer from './ClaudeMessageRenderer'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Muted, Small } from './ui/typography'
import { cn } from '@/lib/utils'

const MessageBubble = ({ message, isFirst, isLast }) => {
  const [showRaw, setShowRaw] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
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

  const getRoleStyles = (role) => {
    switch (role) {
      case 'user':
        return {
          card: 'bg-primary/5 border-primary/20',
          icon: User,
          iconColor: 'text-primary'
        }
      case 'assistant':
        return {
          card: 'bg-accent/5 border-accent/20',
          icon: Bot,
          iconColor: 'text-accent'
        }
      case 'system':
        return {
          card: 'bg-muted border-border',
          icon: Settings,
          iconColor: 'text-muted-foreground'
        }
      default:
        return {
          card: 'bg-muted border-border',
          icon: Info,
          iconColor: 'text-muted-foreground'
        }
    }
  }

  const roleStyles = getRoleStyles(message.role)
  const RoleIcon = roleStyles.icon

  return (
    <Card className={cn("max-w-full", roleStyles.card)}>
      <CardContent className="p-4">
        {/* Message Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <RoleIcon className={cn("w-4 h-4", roleStyles.iconColor)} />
            <Small className="font-semibold capitalize">
              {message.role}
            </Small>
            {message.role === 'system' && message.metadata?.displayType === 'summary' && (
              <Badge variant="secondary" className="h-5">
                Summary
              </Badge>
            )}
            <Muted className="text-xs">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </Muted>
            {message.lineNumber && (
              <Muted className="text-xs">
                Line {message.lineNumber}
              </Muted>
            )}
            {message.metadata?.usage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUsage(!showUsage)}
                className="h-6 px-2 gap-1"
                title="Click to see detailed token usage"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="text-xs">
                  {message.metadata.usage.input_tokens?.toLocaleString() || 0} in / {message.metadata.usage.output_tokens?.toLocaleString() || 0} out
                </span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse/Expand button only for v2-mixed template messages */}
            {message.metadata?.collapsed !== undefined && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90"
                )} />
              </Button>
            )}

            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowActions(!showActions)}
                className="h-7 w-7"
                title="Show tools used"
              >
                <Wrench className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className="h-7 w-7"
              title="Copy message"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRaw(!showRaw)}
              className="h-7 w-7"
              title="Show raw JSON"
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Token Usage Details */}
        {showUsage && message.metadata?.usage && (
          <Card className="mb-3 bg-background/50">
            <CardContent className="p-3">
              <Small className="font-semibold mb-2">Token Usage Details:</Small>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <Muted>Input:</Muted>
                  <span className="font-medium text-primary">{message.metadata.usage.input_tokens?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <Muted>Output:</Muted>
                  <span className="font-medium text-accent">{message.metadata.usage.output_tokens?.toLocaleString() || 0}</span>
                </div>
                {message.metadata.usage.cache_creation_input_tokens > 0 && (
                  <div className="flex justify-between">
                    <Muted>Cache Creation:</Muted>
                    <span className="font-medium text-warning">{message.metadata.usage.cache_creation_input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {message.metadata.usage.cache_read_input_tokens > 0 && (
                  <div className="flex justify-between">
                    <Muted>Cache Reads:</Muted>
                    <span className="font-medium text-success">{message.metadata.usage.cache_read_input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {message.metadata.usage.cache_creation && (
                  <>
                    {message.metadata.usage.cache_creation.ephemeral_5m_input_tokens > 0 && (
                      <div className="flex justify-between col-span-2 pl-2">
                        <Muted className="text-xs">5m TTL:</Muted>
                        <span className="text-xs font-medium">{message.metadata.usage.cache_creation.ephemeral_5m_input_tokens.toLocaleString()}</span>
                      </div>
                    )}
                    {message.metadata.usage.cache_creation.ephemeral_1h_input_tokens > 0 && (
                      <div className="flex justify-between col-span-2 pl-2">
                        <Muted className="text-xs">1h TTL:</Muted>
                        <span className="text-xs font-medium">{message.metadata.usage.cache_creation.ephemeral_1h_input_tokens.toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tools Used */}
        {showActions && message.toolsUsed && message.toolsUsed.length > 0 && (
          <Card className="mb-3 bg-background/50">
            <CardContent className="p-3">
              <Small className="font-semibold mb-2">Tools Used:</Small>
              <div className="space-y-1">
                {message.toolsUsed.map((tool, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-text-primary">{tool.name}</span>
                    {tool.details && (
                      <Muted className="ml-2">
                        {typeof tool.details === 'string'
                          ? tool.details.slice(0, 100)
                          : JSON.stringify(tool.details).slice(0, 100)
                        }...
                      </Muted>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <Card className="mb-3 bg-background/50">
            <CardContent className="p-3">
              <Small className="font-semibold mb-2">Actions:</Small>
              <div className="flex flex-wrap gap-1.5">
                {message.actions.map((action, index) => (
                  <Badge key={index} variant="secondary">
                    {action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
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
          <Muted className="text-sm italic">
            {message.metadata?.displayType === 'summary' ? (
              <span>AI Summary: {message.content?.slice(0, 100)}...</span>
            ) : (
              <span>System message (click to expand)</span>
            )}
          </Muted>
        )}

        {/* Raw JSON */}
        {showRaw && message.raw && (
          <Card className="mt-3 bg-muted/50">
            <CardContent className="p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto">
                {JSON.stringify(message.raw, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

export default MessageBubble