import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Copy, ArrowUp, ArrowDown, Github, BookOpen, Activity } from 'lucide-react'
import { projectsApi } from '../services/api'
import ExportButton from './ExportButton'
import { Button } from './ui/button'

const Footer = () => {
  const { projectId, sessionId } = useParams()
  
  const { data: sessionData } = useQuery({
    queryKey: ['session', projectId, sessionId],
    queryFn: () => projectsApi.getSession(projectId, sessionId, { page: 1, pageSize: 1 }).then(res => res.data),
    enabled: !!(projectId && sessionId)
  })

  const scrollToTop = () => {
    // Scroll the conversation thread container to top
    const conversationArea = document.querySelector('.conversation-scroll-area')
    if (conversationArea) {
      conversationArea.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    // Scroll the conversation thread container to bottom
    const conversationArea = document.querySelector('.conversation-scroll-area')
    if (conversationArea) {
      conversationArea.scrollTo({ top: conversationArea.scrollHeight, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  const copyProjectContext = async () => {
    try {
      // Get the full session data with all messages
      const fullSessionData = await projectsApi.getSession(projectId, sessionId, { page: 1, pageSize: 1000 })
      const { session, messages = [] } = fullSessionData.data || {}
      
      if (!messages.length) {
        throw new Error('No messages to copy')
      }
      
      // Extract project context in Claude Code format
      const projectName = projectId || 'Unknown Project'
      const sessionTitle = session?.title || session?.summary || 'Conversation'
      const templateType = session?.template || 'unknown'
      
      // Get recent technical content from messages
      const technicalMessages = messages
        .filter(msg => msg.content && (
          msg.content.includes('file') ||
          msg.content.includes('implementation') ||
          msg.content.includes('error') ||
          msg.content.includes('fix') ||
          msg.content.includes('working on') ||
          msg.content.includes('project') ||
          msg.content.includes('code') ||
          msg.content.includes('function')
        ))
        .slice(-10) // Last 10 relevant messages
      
      // Format context for Claude Code
      const contextText = `# 🔄 PROJECT CONTEXT EXTRACTION

**Auto-extracted from Claude Conversations Viewer**

## Project Overview
- **Project**: ${projectName}
- **Session**: ${sessionTitle}
- **Template**: ${templateType}
- **Messages**: ${messages.length} total
- **Extracted**: ${new Date().toISOString().split('T')[0]}

## Recent Technical Discussion

${technicalMessages.map((msg, index) => `### Message ${index + 1} (${msg.role})
${msg.content.length > 500 ? msg.content.substring(0, 500) + '...' : msg.content}
`).join('\n')}

## Key Context Points
${technicalMessages
  .map(msg => msg.content.match(/- .+|working on .+|implementing .+|fixed .+|issue .+|problem .+/gi))
  .filter(matches => matches)
  .flat()
  .slice(-15)
  .map(point => `- ${point.replace(/^- /, '')}`)
  .join('\n')}

---
*Context extracted from Claude Conversations Viewer for AI continuity*`

      await navigator.clipboard.writeText(contextText)
      
      // Show success message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in'
      toast.textContent = 'Project context copied for Claude Code!'
      document.body.appendChild(toast)
      
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 3000)
      
      console.log('Project context copied to clipboard')
    } catch (error) {
      console.error('Failed to copy project context:', error)
      
      // Show error message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
      toast.textContent = 'Failed to copy context: ' + error.message
      document.body.appendChild(toast)
      
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 3000)
    }
  }


  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-1.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Left Section - Session Info */}
        <div className="flex items-center gap-3 flex-wrap">
          {sessionId && sessionData && (
            <>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-success animate-pulse" />
                <span className="text-xs font-medium text-text-primary">
                  {sessionData.pagination?.total || 0} messages
                </span>
              </div>

              <div className="text-xs text-text-secondary">
                Template: <span className="font-medium text-primary">{sessionData.session?.template || 'unknown'}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={copyProjectContext}
                className="gap-1.5 h-7 text-xs"
                title="Copy project context for Claude Code"
              >
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy Context</span>
              </Button>

              <ExportButton
                projectId={projectId}
                sessionId={sessionId}
                sessionTitle={sessionData.session?.title}
                variant="footer"
              />
            </>
          )}
        </div>

        {/* Right Section - Links & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary font-medium">
              Claudex v1.2
            </span>

            <a
              href="https://github.com/kunwar-shah/claudex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors duration-fast"
              title="View on GitHub"
            >
              <Github className="w-3 h-3" />
              <span className="hidden sm:inline">GitHub</span>
            </a>

            <a
              href="https://kunwar-shah.github.io/claudex/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors duration-fast"
              title="View Documentation"
            >
              <BookOpen className="w-3 h-3" />
              <span className="hidden sm:inline">Docs</span>
            </a>

            <a
              href="https://github.com/sponsors/kunwar-shah"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--text-on-primary))] hover:opacity-90 transition-opacity"
              title="Support development"
            >
              <span>☕</span>
              <span className="hidden sm:inline">Support</span>
            </a>
          </div>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToTop}
              title="Scroll to top"
              className="h-7 w-7"
            >
              <ArrowUp className="w-3 h-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={scrollToBottom}
              title="Scroll to bottom"
              className="h-7 w-7"
            >
              <ArrowDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer