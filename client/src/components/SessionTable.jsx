import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Circle, CircleDot, PencilLine, MessageCircle, Eye, Trash2, RotateCcw, Star } from 'lucide-react'
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

  // Fetch favorited sessions
  const { data: favoritedData } = useQuery({
    queryKey: ['favorited-sessions', projectId],
    queryFn: () => sessionMetadataApi.getFavoritedSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const hiddenSessions = hiddenData?.hiddenSessions || []
  const deletedSessions = deletedData?.deletedSessions || []
  const favoritedSessions = favoritedData?.favoritedSessions || []

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
    if (showFilter === 'favorites' && !favoritedSessions.includes(session.sessionId)) return false

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
    <div className="bg-[hsl(var(--surface))] rounded-lg shadow border border-[hsl(var(--border))]">
      <table className="w-full">
        <thead className="bg-[hsl(var(--background-secondary))] border-b border-[hsl(var(--border))]">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={input => {
                  if (input) input.indeterminate = !allSelected && someSelected
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-[hsl(var(--primary))] rounded focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Session Title
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Tags
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Messages
            </th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Status
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Last Updated
            </th>
            <th className="w-20 px-4 py-3 text-xs font-semibold text-[hsl(var(--text-primary))] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {sortedSessions.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-4 py-12 text-center text-[hsl(var(--text-tertiary))]">
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
                isFavorited={favoritedSessions.includes(session.sessionId)}
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
const SessionTableRow = ({ session, projectId, isSelected, isHidden, isFavorited, onSelect, onShowSummary, navigate, showFilter }) => {
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

  const toggleFavoriteMutation = useMutation({
    mutationFn: () => sessionMetadataApi.toggleFavorite(projectId, session.sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, session.sessionId])
      queryClient.invalidateQueries(['favorited-sessions', projectId])
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
    <tr className={`hover:bg-[hsl(var(--background-secondary))] transition-colors ${isHidden ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-[hsl(var(--primary))] rounded focus:ring-2 focus:ring-[hsl(var(--primary))]"
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
              className="flex-1 px-2 py-1 text-sm border border-[hsl(var(--border-hover))] rounded focus:ring-2 focus:ring-[hsl(var(--primary))]"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              disabled={setTitleMutation.isPending}
              className="px-2 py-1 text-xs bg-[hsl(var(--primary))] text-white rounded hover:bg-[hsl(var(--primary-hover))]"
            >
              {setTitleMutation.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-2 py-1 text-xs bg-[hsl(var(--border))] text-[hsl(var(--text-primary))] rounded hover:bg-[hsl(var(--border))]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavoriteMutation.mutate() }}
              disabled={toggleFavoriteMutation.isPending}
              className="flex-shrink-0 mt-0.5 hover:scale-110 transition-transform"
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-400'}`} />
            </button>
            {isHidden && <CircleDot className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />}
            <span className="text-sm font-medium text-[hsl(var(--text-primary))] break-words line-clamp-3">
              {displayTitle}
            </span>
            {metadata.customTitle && (
              <PencilLine className="w-3 h-3 text-[hsl(var(--primary))] flex-shrink-0 mt-0.5" />
            )}
            <button
              onClick={() => {
                setEditTitle(displayTitle)
                setIsEditing(true)
              }}
              className="text-xs text-slate-400 hover:text-[hsl(var(--primary))]"
            >
              <PencilLine className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="text-xs text-[hsl(var(--text-tertiary))] mt-1">
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
                className="inline-block px-2 py-0.5 bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))] rounded text-xs"
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
        <span className="inline-block px-2 py-1 bg-[hsl(var(--primary-light))] text-[hsl(var(--primary))] rounded text-sm font-medium">
          {session.messageCount}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => toggleVisibilityMutation.mutate()}
          disabled={toggleVisibilityMutation.isPending}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
            isHidden
              ? 'bg-[hsl(var(--border))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--border))]'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isHidden ? (
            <>
              <CircleDot className="w-3.5 h-3.5" />
              <span>Hidden</span>
            </>
          ) : (
            <>
              <Circle className="w-3.5 h-3.5" />
              <span>Visible</span>
            </>
          )}
        </button>
      </td>

      {/* Last Updated */}
      <td className="px-4 py-3 text-sm text-[hsl(var(--text-secondary))]">
        {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1 hover:bg-[hsl(var(--border))] rounded transition-colors"
        >
          <svg className="w-5 h-5 text-[hsl(var(--text-secondary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="absolute right-0 top-full mt-1 w-56 bg-[hsl(var(--surface))] rounded-lg shadow-lg border border-[hsl(var(--border))] py-1 z-20">
              <button
                onClick={() => {
                  onShowSummary(session)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
                View Summary
              </button>
              <button
                onClick={() => {
                  handleViewConversation()
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
                View Full Conversation
              </button>
              <div className="border-t border-[hsl(var(--border))] my-1" />
              <button
                onClick={() => {
                  setEditTitle(displayTitle)
                  setIsEditing(true)
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
              >
                <PencilLine className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
                Rename
              </button>
              <button
                onClick={() => {
                  toggleVisibilityMutation.mutate()
                  setShowActions(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
              >
                {isHidden ? (
                  <Circle className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
                ) : (
                  <CircleDot className="w-4 h-4 text-[hsl(var(--text-secondary))]" />
                )}
                {isHidden ? 'Show' : 'Hide'}
              </button>
              <div className="border-t border-[hsl(var(--border))] my-1" />
              {/* Restore (only show in trash) */}
              {isInTrash && (
                <button
                  onClick={() => {
                    restoreSessionMutation.mutate()
                    setShowActions(false)
                  }}
                  disabled={restoreSessionMutation.isPending}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[hsl(var(--primary-light))] flex items-center gap-2 text-[hsl(var(--primary))]"
                >
                  <RotateCcw className="w-4 h-4" />
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
                  <Trash2 className="w-4 h-4" />
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
