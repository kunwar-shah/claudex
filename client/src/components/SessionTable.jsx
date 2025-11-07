import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { sessionMetadataApi } from '../services/api'

/**
 * SessionTable - Table view of sessions with inline actions
 *
 * Features:
 * - Checkbox selection
 * - Custom titles display
 * - Tags badges
 * - Hide/show status
 * - Actions menu
 * - Filter and sort
 */
const SessionTable = ({
  sessions,
  projectId,
  selectedSessions,
  onSelectAll,
  onSelectSession,
  onShowSummary,
  showFilter,
  tagFilter,
  sortBy,
  searchQuery
}) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch hidden sessions
  const { data: hiddenData } = useQuery({
    queryKey: ['hidden-sessions', projectId],
    queryFn: () => sessionMetadataApi.getHiddenSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  // Fetch deleted sessions
  const { data: deletedData } = useQuery({
    queryKey: ['deleted-sessions', projectId],
    queryFn: () => sessionMetadataApi.getDeletedSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const hiddenSessions = hiddenData?.hiddenSessions || []
  const deletedSessions = deletedData?.deletedSessions || []

  // Fetch all metadata for tag filtering (only when tag filter is active)
  const { data: allMetadataData } = useQuery({
    queryKey: ['all-session-metadata', projectId, sessions.map(s => s.sessionId).sort().join(',')],
    queryFn: async () => {
      const metadataPromises = sessions.map(s =>
        sessionMetadataApi.getMetadata(projectId, s.sessionId)
          .then(res => ({ sessionId: s.sessionId, ...res.data }))
          .catch(() => ({ sessionId: s.sessionId, tags: [] }))
      )
      return Promise.all(metadataPromises)
    },
    enabled: !!projectId && !!tagFilter && sessions.length > 0
  })

  const metadataBySession = (allMetadataData || []).reduce((acc, data) => {
    acc[data.sessionId] = data
    return acc
  }, {})

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const isHidden = hiddenSessions.includes(session.sessionId)
    const isDeleted = deletedSessions.includes(session.sessionId)

    // Trash filter - only show deleted sessions
    if (showFilter === 'trash') {
      return isDeleted
    }

    // Hide deleted sessions from all other views
    if (isDeleted) return false

    // Show filter (for non-deleted sessions)
    if (showFilter === 'visible' && isHidden) return false
    if (showFilter === 'hidden' && !isHidden) return false

    // Tag filter (only runs if tagFilter is set and metadata is loaded)
    if (tagFilter && metadataBySession[session.sessionId]) {
      const sessionTags = metadataBySession[session.sessionId].tags || []
      if (!sessionTags.includes(tagFilter)) return false
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const titleMatch = session.title?.toLowerCase().includes(query)
      const idMatch = session.sessionId.toLowerCase().includes(query)
      if (!titleMatch && !idMatch) return false
    }

    return true
  })

  // Sort sessions
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || a.sessionId).localeCompare(b.title || b.sessionId)
      case 'messages':
        return b.messageCount - a.messageCount
      case 'updated':
      default:
        return new Date(b.lastUpdatedAt) - new Date(a.lastUpdatedAt)
    }
  })

  // Handle select all
  const allSelected = sortedSessions.length > 0 && sortedSessions.every(s => selectedSessions.includes(s.sessionId))
  const someSelected = sortedSessions.some(s => selectedSessions.includes(s.sessionId))

  return (
    <div className="bg-white rounded-lg shadow border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = !allSelected && someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Session Title
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Tags
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Messages
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="w-20 px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {sortedSessions.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-12 text-center text-slate-500">
                <svg className="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No sessions found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
              </td>
            </tr>
          ) : (
            sortedSessions.map((session) => (
              <SessionTableRow
                key={session.sessionId}
                session={session}
                projectId={projectId}
                isSelected={selectedSessions.includes(session.sessionId)}
                isHidden={hiddenSessions.includes(session.sessionId)}
                onSelect={(checked) => onSelectSession(session.sessionId, checked)}
                onShowSummary={onShowSummary}
                navigate={navigate}
                showFilter={showFilter}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Individual table row component
const SessionTableRow = ({ session, projectId, isSelected, isHidden, onSelect, onShowSummary, navigate, showFilter }) => {
  const queryClient = useQueryClient()
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')

  // Fetch metadata
  const { data: metadataData } = useQuery({
    queryKey: ['session-metadata', projectId, session.sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, session.sessionId).then(res => res.data),
    enabled: !!projectId && !!session.sessionId
  })

  const metadata = metadataData?.metadata || {}
  const displayTitle = metadata.customTitle || session.title || session.sessionId
  const isDeleted = metadata.isDeleted || false
  const isInTrash = showFilter === 'trash'

  // Mutations
  const setTitleMutation = useMutation({
    mutationFn: (title) => sessionMetadataApi.setCustomTitle(projectId, session.sessionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, session.sessionId])
      setIsEditing(false)
    }
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: () => sessionMetadataApi.toggleVisibility(projectId, session.sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, session.sessionId])
      queryClient.invalidateQueries(['hidden-sessions', projectId])
    }
  })

  const deleteSessionMutation = useMutation({
    mutationFn: () => sessionMetadataApi.setDeleted(projectId, session.sessionId, true),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, session.sessionId])
      queryClient.invalidateQueries(['sessions', projectId])
      queryClient.invalidateQueries(['deleted-sessions', projectId])
    }
  })

  const restoreSessionMutation = useMutation({
    mutationFn: () => sessionMetadataApi.restoreSession(projectId, session.sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, session.sessionId])
      queryClient.invalidateQueries(['sessions', projectId])
      queryClient.invalidateQueries(['deleted-sessions', projectId])
    }
  })

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      setTitleMutation.mutate(editTitle.trim())
    }
  }

  const handleViewConversation = () => {
    navigate(`/projects/${projectId}/sessions/${session.sessionId}`)
  }

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isHidden ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </td>

      {/* Title */}
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              disabled={setTitleMutation.isPending}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {setTitleMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            {isHidden && <span className="text-xs flex-shrink-0">👁️‍🗨️</span>}
            <span className="text-sm font-medium text-slate-900 break-words line-clamp-3">
              {displayTitle}
            </span>
            {metadata.customTitle && (
              <span className="text-xs text-blue-600 flex-shrink-0">✏️</span>
            )}
            <button
              onClick={() => {
                setEditTitle(displayTitle)
                setIsEditing(true)
              }}
              className="text-xs text-slate-400 hover:text-blue-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
        <div className="text-xs text-slate-500 mt-1">
          {session.sessionId.slice(0, 12)}...
        </div>
      </td>

      {/* Tags */}
      <td className="px-4 py-3">
        {metadata.tags?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {metadata.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {metadata.tags.length > 2 && (
              <span className="text-xs text-slate-400">+{metadata.tags.length - 2}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">No tags</span>
        )}
      </td>

      {/* Message Count */}
      <td className="px-4 py-3 text-center">
        <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
          {session.messageCount}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => toggleVisibilityMutation.mutate()}
          disabled={toggleVisibilityMutation.isPending}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
            isHidden
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isHidden ? '👁️‍🗨️ Hidden' : '👁️ Visible'}
        </button>
      </td>

      {/* Last Updated */}
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Actions Menu */}
        {showActions && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActions(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
              <button
                onClick={() => {
                  onShowSummary(session)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <span>👁️</span>
                View Summary
              </button>
              <button
                onClick={() => {
                  handleViewConversation()
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <span>💬</span>
                View Full Conversation
              </button>
              <div className="border-t border-slate-200 my-1" />
              <button
                onClick={() => {
                  setEditTitle(displayTitle)
                  setIsEditing(true)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <span>✏️</span>
                Rename
              </button>
              <button
                onClick={() => {
                  toggleVisibilityMutation.mutate()
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <span>{isHidden ? '👁️' : '👁️‍🗨️'}</span>
                {isHidden ? 'Show' : 'Hide'}
              </button>
              <div className="border-t border-slate-200 my-1" />
              {/* Restore (only show in trash) */}
              {isInTrash && (
                <button
                  onClick={() => {
                    restoreSessionMutation.mutate()
                    setShowActions(false)
                  }}
                  disabled={restoreSessionMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 flex items-center gap-2 text-emerald-700"
                >
                  <span>♻️</span>
                  {restoreSessionMutation.isPending ? 'Restoring...' : 'Restore Session'}
                </button>
              )}
              {/* Delete (only show when not in trash) */}
              {!isInTrash && (
                <button
                  onClick={() => {
                    deleteSessionMutation.mutate()
                    setShowActions(false)
                  }}
                  disabled={deleteSessionMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700"
                >
                  <span>🗑️</span>
                  {deleteSessionMutation.isPending ? 'Deleting...' : 'Delete Session'}
                </button>
              )}
            </div>
          </>
        )}
      </td>
    </tr>
  )
}

export default SessionTable
