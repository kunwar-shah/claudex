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
import { useSettings } from '../contexts/SettingsContext'

const MessageBubble = ({ message, isFirst, isLast }) => {
  const { settings } = useSettings()
  const [showRaw, setShowRaw] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showUsage, setShowUsage] = useState(false)
  const [isExpanded, setIsExpanded] = useState(() => {
    // Only collapse for v2-mixed template messages that are explicitly marked as collapsed
    return message.metadata?.collapsed !== true
  })

  // Check if timestamp should be shown based on settings
  const shouldShowTimestamp = settings.showTimestamps === 'always' ||
    (settings.showTimestamps === 'on-hover' && true) // Always show for now, hover state would need CSS

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
          card: 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] border-primary/30',
          icon: User,
          iconColor: 'text-white',
          textColor: 'text-white'
        }
      case 'assistant':
        return {
          card: 'bg-accent/5 border-accent/20',
          icon: Bot,
          iconColor: 'text-accent',
          textColor: ''
        }
      case 'system':
        return {
          card: 'bg-muted border-border',
          icon: Settings,
          iconColor: 'text-muted-foreground',
          textColor: ''
        }
      default:
        return {
          card: 'bg-muted border-border',
          icon: Info,
          iconColor: 'text-muted-foreground',
          textColor: ''
        }
    }
  }

  const roleStyles = getRoleStyles(message.role)
  const RoleIcon = roleStyles.icon

  return (
    <Card className={cn("max-w-full", roleStyles.card)}>
      <CardContent className={cn("p-4", roleStyles.textColor)}>
        {/* Message Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <RoleIcon className={cn("w-4 h-4", roleStyles.iconColor)} />
            <Small className={cn("font-semibold capitalize", roleStyles.textColor)}>
              {message.role}
            </Small>
            {message.role === 'system' && message.metadata?.displayType === 'summary' && (
              <Badge variant="secondary" className="h-5">
                Summary
              </Badge>
            )}
            {(settings.showTimestamps === 'always' || settings.showTimestamps === 'on-hover') && (
              <Muted className={cn("text-xs", roleStyles.textColor && "opacity-90")}>
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </Muted>
            )}
            {message.lineNumber && (
              <Muted className={cn("text-xs", roleStyles.textColor && "opacity-90")}>
                Line {message.lineNumber}
              </Muted>
            )}
            {message.metadata?.usage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUsage(!showUsage)}
                className={cn("h-6 px-2 gap-1", roleStyles.textColor && "border-white/30 hover:bg-white/20")}
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
                className={cn("h-7 w-7", roleStyles.textColor && "hover:bg-white/20")}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-90",
                  roleStyles.textColor
                )} />
              </Button>
            )}

            {message.toolsUsed && message.toolsUsed.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowActions(!showActions)}
                className={cn("h-7 w-7", roleStyles.textColor && "hover:bg-white/20")}
                title="Show tools used"
              >
                <Wrench className={cn("w-4 h-4", roleStyles.textColor)} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={copyToClipboard}
              className={cn("h-7 w-7", roleStyles.textColor && "hover:bg-white/20")}
              title="Copy message"
            >
              <Copy className={cn("w-4 h-4", roleStyles.textColor)} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRaw(!showRaw)}
              className={cn("h-7 w-7", roleStyles.textColor && "hover:bg-white/20")}
              title="Show raw JSON"
            >
              <Code className={cn("w-4 h-4", roleStyles.textColor)} />
            </Button>
          </div>
        </div>

        {/* Token Usage Details */}
        {showUsage && message.metadata?.usage && (
          <Card className={cn("mb-3", roleStyles.textColor ? "bg-white/20" : "bg-background/50")}>
            <CardContent className={cn("p-3", roleStyles.textColor)}>
              <Small className={cn("font-semibold mb-2", roleStyles.textColor)}>Token Usage Details:</Small>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className={cn(roleStyles.textColor && "opacity-80")}>Input:</span>
                  <span className={cn("font-medium", roleStyles.textColor || "text-primary")}>{message.metadata.usage.input_tokens?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className={cn(roleStyles.textColor && "opacity-80")}>Output:</span>
                  <span className={cn("font-medium", roleStyles.textColor || "text-accent")}>{message.metadata.usage.output_tokens?.toLocaleString() || 0}</span>
                </div>
                {message.metadata.usage.cache_creation_input_tokens > 0 && (
                  <div className="flex justify-between">
                    <span className={cn(roleStyles.textColor && "opacity-80")}>Cache Creation:</span>
                    <span className={cn("font-medium", roleStyles.textColor || "text-warning")}>{message.metadata.usage.cache_creation_input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {message.metadata.usage.cache_read_input_tokens > 0 && (
                  <div className="flex justify-between">
                    <span className={cn(roleStyles.textColor && "opacity-80")}>Cache Reads:</span>
                    <span className={cn("font-medium", roleStyles.textColor || "text-success")}>{message.metadata.usage.cache_read_input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {message.metadata.usage.cache_creation && (
                  <>
                    {message.metadata.usage.cache_creation.ephemeral_5m_input_tokens > 0 && (
                      <div className="flex justify-between col-span-2 pl-2">
                        <span className={cn("text-xs", roleStyles.textColor && "opacity-80")}>5m TTL:</span>
                        <span className={cn("text-xs font-medium", roleStyles.textColor)}>{message.metadata.usage.cache_creation.ephemeral_5m_input_tokens.toLocaleString()}</span>
                      </div>
                    )}
                    {message.metadata.usage.cache_creation.ephemeral_1h_input_tokens > 0 && (
                      <div className="flex justify-between col-span-2 pl-2">
                        <span className={cn("text-xs", roleStyles.textColor && "opacity-80")}>1h TTL:</span>
                        <span className={cn("text-xs font-medium", roleStyles.textColor)}>{message.metadata.usage.cache_creation.ephemeral_1h_input_tokens.toLocaleString()}</span>
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
          <Card className={cn("mb-3", roleStyles.textColor ? "bg-white/20" : "bg-background/50")}>
            <CardContent className={cn("p-3", roleStyles.textColor)}>
              <Small className={cn("font-semibold mb-2", roleStyles.textColor)}>Tools Used:</Small>
              <div className="space-y-1">
                {message.toolsUsed.map((tool, index) => (
                  <div key={index} className="text-sm">
                    <span className={cn("font-medium", roleStyles.textColor)}>{tool.name}</span>
                    {tool.details && (
                      <span className={cn("ml-2", roleStyles.textColor && "opacity-80")}>
                        {typeof tool.details === 'string'
                          ? tool.details.slice(0, 100)
                          : JSON.stringify(tool.details).slice(0, 100)
                        }...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {message.actions && message.actions.length > 0 && (
          <Card className={cn("mb-3", roleStyles.textColor ? "bg-white/20" : "bg-background/50")}>
            <CardContent className={cn("p-3", roleStyles.textColor)}>
              <Small className={cn("font-semibold mb-2", roleStyles.textColor)}>Actions:</Small>
              <div className="flex flex-wrap gap-1.5">
                {message.actions.map((action, index) => (
                  <Badge key={index} variant="secondary" className={cn(roleStyles.textColor && "bg-white/30 text-white")}>
                    {action}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message Content */}
        {isExpanded ? (
          <div className={cn(
            "prose prose-sm max-w-none overflow-hidden",
            roleStyles.textColor && "prose-invert"
          )}>
            {/* Use ClaudeMessageRenderer for v2-mixed and v3 templates, otherwise use regular MessageRenderer */}
            {(message.metadata?.template === 'claude-code-v2-mixed' || message.metadata?.template === 'claude-code-v3') ? (
              <ClaudeMessageRenderer message={message} />
            ) : (
              <MessageRenderer content={message.content} contentKind={message.contentKind} />
            )}
          </div>
        ) : (
          <Muted className={cn("text-sm italic", roleStyles.textColor && "opacity-90")}>
            {message.metadata?.displayType === 'summary' ? (
              <span>AI Summary: {message.content?.slice(0, 100)}...</span>
            ) : (
              <span>System message (click to expand)</span>
            )}
          </Muted>
        )}

        {/* Raw JSON */}
        {showRaw && message.raw && (
          <Card className={cn("mt-3", roleStyles.textColor ? "bg-white/20" : "bg-muted/50")}>
            <CardContent className="p-3">
              <pre className={cn("text-xs font-mono whitespace-pre-wrap break-words overflow-x-auto", roleStyles.textColor)}>
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