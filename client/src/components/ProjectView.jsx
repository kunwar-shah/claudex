import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import SessionList from './SessionList'
import ConversationThread from './ConversationThread'
import SummaryPanel from './SummaryPanel'
import EmptyState from './layout/EmptyState'
import { Button } from './ui/button'
import { Card } from './ui/card'

const ProjectView = () => {
  const { projectId, sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const highlightMessageId = searchParams.get('highlight')
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  // No project selected - Clean empty state
  if (!projectId) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Welcome to Claudex"
        description="Select a project from the header to start browsing conversations"
      />
    )
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left Panel - Sessions List */}
      <div
        className={`${
          leftPanelCollapsed ? 'w-12' : 'w-80'
        } border-r border-border bg-surface transition-all duration-300 flex-shrink-0`}
      >
        <div className="h-full flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            {!leftPanelCollapsed && (
              <span className="text-sm font-semibold text-text-primary">Sessions</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              title={leftPanelCollapsed ? "Expand Sessions" : "Collapse Sessions"}
            >
              {leftPanelCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Sessions Content */}
          <div className="flex-1 overflow-hidden">
            {!leftPanelCollapsed && (
              <SessionList projectId={projectId} selectedSessionId={sessionId} />
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Conversation */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {sessionId ? (
            <ConversationThread
              projectId={projectId}
              sessionId={sessionId}
              highlightMessageId={highlightMessageId}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Select a Session"
              description="Choose a session from the left panel to view the conversation"
            />
          )}
        </div>

        {/* Right Panel - Summary */}
        {sessionId && (
          <div
            className={`${
              rightPanelCollapsed ? 'w-12' : 'w-80'
            } border-l border-border bg-surface transition-all duration-300 flex-shrink-0`}
          >
            <div className="h-full flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  title={rightPanelCollapsed ? "Expand Summary" : "Collapse Summary"}
                >
                  {rightPanelCollapsed ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                {!rightPanelCollapsed && (
                  <span className="text-sm font-semibold text-text-primary">Summary</span>
                )}
              </div>

              {/* Summary Content */}
              <div className="flex-1 overflow-hidden">
                {!rightPanelCollapsed && (
                  <SummaryPanel
                    projectId={projectId}
                    sessionId={sessionId}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectView
