import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'

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

  const exportSession = () => {
    // TODO: Implement export session functionality
    console.log('Exporting session...')
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
              
              <button
                onClick={exportSession}
                className="flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
                title="Export session"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs text-slate-500">
            Claudex v1.0
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