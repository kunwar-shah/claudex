import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { projectsApi, sessionMetadataApi } from '../services/api'
import SessionMetadataControls from './SessionMetadataControls'

const SessionList = ({ projectId, selectedSessionId }) => {
  const navigate = useNavigate()
  const [filterTag, setFilterTag] = useState(null)
  const [showHidden, setShowHidden] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => projectsApi.getSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  // Fetch all tags for filtering
  const { data: tagsData } = useQuery({
    queryKey: ['session-tags', projectId],
    queryFn: () => sessionMetadataApi.getAllTags(projectId).then(res => res.data),
    enabled: !!projectId
  })

  // Fetch hidden sessions
  const { data: hiddenData } = useQuery({
    queryKey: ['hidden-sessions', projectId],
    queryFn: () => sessionMetadataApi.getHiddenSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

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
  const availableTags = tagsData?.tags || []
  const hiddenSessions = hiddenData?.hiddenSessions || []

  // Filter sessions based on visibility and tags
  const filteredSessions = sessions.filter(session => {
    // Filter hidden sessions
    if (!showHidden && hiddenSessions.includes(session.sessionId)) {
      return false
    }
    return true
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters */}
      <div className="px-2 py-1 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-900">Sessions</span>
          <span className="text-xs text-gray-500">{filteredSessions.length}</span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 mt-1">
          {/* Show hidden toggle */}
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`text-xs px-2 py-0.5 rounded ${
              showHidden
                ? 'bg-slate-200 text-slate-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {showHidden ? '👁️ All' : '👁️‍🗨️ Show Hidden'}
          </button>

          {/* Tag filter */}
          {availableTags.length > 0 && (
            <select
              value={filterTag || ''}
              onChange={(e) => setFilterTag(e.target.value || null)}
              className="text-xs px-2 py-0.5 border border-slate-300 rounded"
            >
              <option value="">All Tags</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag}>🏷️ {tag}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="p-2 text-center text-gray-500 text-xs">
            No sessions found
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {filteredSessions.map((session) => {
              const isHidden = hiddenSessions.includes(session.sessionId)

              return (
                <SessionListItem
                  key={session.sessionId}
                  session={session}
                  projectId={projectId}
                  isSelected={selectedSessionId === session.sessionId}
                  isHidden={isHidden}
                  onSelect={handleSessionSelect}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for each session item to handle metadata fetching
const SessionListItem = ({ session, projectId, isSelected, isHidden, onSelect }) => {
  // Fetch metadata for this session
  const { data: metadataData } = useQuery({
    queryKey: ['session-metadata', projectId, session.sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, session.sessionId)
      .then(res => res.data.metadata)
      .catch(err => {
        if (err.response?.status === 404) return null
        throw err
      }),
    enabled: !!projectId && !!session.sessionId
  })

  const metadata = metadataData || {}
  const displayTitle = metadata.customTitle || session.title || session.sessionId

  return (
    <div
      onClick={() => onSelect(session.sessionId)}
      className={`p-1.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'bg-white hover:bg-slate-50 border border-slate-200'
      } ${isHidden ? 'opacity-60' : ''}`}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1 flex-1">
          {isHidden && <span className="text-xs">👁️‍🗨️</span>}
          <h3 className="font-medium text-xs text-slate-900 truncate pr-1 leading-tight">
            {displayTitle}
            {metadata.customTitle && (
              <span className="ml-1 text-xs text-blue-600">✏️</span>
            )}
          </h3>
        </div>
        <span className="text-xs text-slate-500 flex-shrink-0">
          {session.messageCount}
        </span>
      </div>

      {/* Tags */}
      {metadata.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {metadata.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {metadata.tags.length > 3 && (
            <span className="text-xs text-slate-400">+{metadata.tags.length - 3}</span>
          )}
        </div>
      )}

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
  )
}

export default SessionList