import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { projectsApi } from '../services/api'
import ProjectExportButton from './ProjectExportButton'

const SessionList = ({ projectId, selectedSessionId }) => {
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => projectsApi.getSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  const currentProject = projectsData?.projects?.find(p => p.id === projectId)

  const handleSessionSelect = (sessionId) => {
    navigate(`/projects/${projectId}/sessions/${sessionId}`)
  }

  if (isLoading) {
    return (
      <div className="p-2">
        <div className="animate-pulse space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-8 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="text-red-600 text-xs">
          Failed to load sessions: {error.message}
        </div>
      </div>
    )
  }

  const sessions = data?.sessions || []

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 py-1.5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-900">Sessions</span>
          <span className="text-xs text-gray-500">{sessions.length}</span>
        </div>
        {currentProject && (
          <div className="flex justify-center">
            <ProjectExportButton
              projectId={projectId}
              projectName={currentProject.name}
              variant="compact"
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-2 text-center text-gray-500 text-xs">
            No sessions found
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => handleSessionSelect(session.sessionId)}
                className={`p-1.5 rounded cursor-pointer transition-colors ${
                  selectedSessionId === session.sessionId
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-xs text-slate-900 truncate pr-1 leading-tight">
                    {session.title || session.sessionId}
                  </h3>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {session.messageCount}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="text-xs truncate pr-1">
                    {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                  </span>
                  {session.template && session.template !== 'unknown' && (
                    <span className="bg-slate-100 px-1 py-0.5 rounded text-xs flex-shrink-0">
                      {session.template.slice(0,8)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SessionList