import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import ExportButton from './ExportButton'

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
    <footer className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 px-3 py-1.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-6">
          {sessionId && sessionData && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-600">
                  {sessionData.pagination?.total || 0} messages
                </span>
              </div>
              
              <div className="text-xs text-slate-500">
                Template: <span className="font-medium text-blue-600">{sessionData.session?.template || 'unknown'}</span>
              </div>
              
              <button
                onClick={copyProjectContext}
                className="flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                title="Copy project context for Claude Code"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Context</span>
              </button>
              
              <ExportButton 
                projectId={projectId} 
                sessionId={sessionId} 
                sessionTitle={sessionData.session?.title}
                variant="footer"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-xs text-slate-500">
              Claudex v1.0
            </div>

            <a
              href="https://github.com/kunwar-shah/claudex"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              title="View on GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>GitHub</span>
            </a>

            <a
              href="https://kunwar-shah.github.io/claudex/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              title="View Documentation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Docs</span>
            </a>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={scrollToTop}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Scroll to top"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </button>
            
            <button
              onClick={scrollToBottom}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Scroll to bottom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer