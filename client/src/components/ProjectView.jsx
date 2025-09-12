import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import SessionList from './SessionList'
import ConversationThread from './ConversationThread'
import SummaryPanel from './SummaryPanel'

const ProjectView = () => {
  const { projectId, sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const highlightMessageId = searchParams.get('highlight')
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(320)
  const [rightPanelWidth, setRightPanelWidth] = useState(320)

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center p-8 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Claudex
          </h2>
          <p className="text-slate-600 text-sm">
            Select a project from the header to start browsing conversations
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Sessions List */}
      <div 
        className={`${
          leftPanelCollapsed ? 'w-12' : 'w-80'
        } border-r border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 transition-all duration-300 flex-shrink-0`}
        style={{ width: leftPanelCollapsed ? '48px' : `${leftPanelWidth}px` }}
      >
        <div className="h-full flex flex-col">
          {/* Toggle Button */}
          <div className="flex justify-between items-center p-1 border-b border-slate-200 bg-white/50">
            {!leftPanelCollapsed && <span className="text-xs font-semibold text-slate-700">Sessions</span>}
            <button
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="p-0.5 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors"
              title={leftPanelCollapsed ? "Expand Sessions" : "Collapse Sessions"}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {leftPanelCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Sessions Content */}
          <div className="flex-1 overflow-hidden">
            {!leftPanelCollapsed && (
              <SessionList projectId={projectId} selectedSessionId={sessionId} />
            )}
          </div>
        </div>
        
        {/* Resize Handle */}
        {!leftPanelCollapsed && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors z-10"
            onMouseDown={(e) => {
              const startX = e.pageX;
              const startWidth = leftPanelWidth;
              
              const onMouseMove = (e) => {
                const newWidth = Math.max(200, Math.min(600, startWidth + e.pageX - startX));
                setLeftPanelWidth(newWidth);
              };
              
              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };
              
              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          />
        )}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {sessionId ? (
            <ConversationThread 
              projectId={projectId} 
              sessionId={sessionId}
              highlightMessageId={highlightMessageId}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a Session
                </h3>
                <p className="text-gray-500">
                  Choose a session from the left panel to view the conversation
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Summary */}
        {sessionId && (
          <div 
            className={`${
              rightPanelCollapsed ? 'w-12' : 'w-80'
            } border-l border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 transition-all duration-300 flex-shrink-0 relative`}
            style={{ width: rightPanelCollapsed ? '48px' : `${rightPanelWidth}px` }}
          >
            <div className="h-full flex flex-col">
              {/* Toggle Button */}
              <div className="flex justify-between items-center p-1 border-b border-slate-200 bg-white/50">
                <button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className="p-0.5 hover:bg-blue-100 hover:text-blue-600 rounded transition-colors"
                  title={rightPanelCollapsed ? "Expand Summary" : "Collapse Summary"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {rightPanelCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                </button>
                {!rightPanelCollapsed && <span className="text-xs font-semibold text-slate-700">Summary</span>}
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
            
            {/* Resize Handle */}
            {!rightPanelCollapsed && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1 bg-transparent hover:bg-blue-500 cursor-col-resize transition-colors z-10"
                onMouseDown={(e) => {
                  const startX = e.pageX;
                  const startWidth = rightPanelWidth;
                  
                  const onMouseMove = (e) => {
                    const newWidth = Math.max(200, Math.min(600, startWidth + startX - e.pageX));
                    setRightPanelWidth(newWidth);
                  };
                  
                  const onMouseUp = () => {
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                  };
                  
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectView