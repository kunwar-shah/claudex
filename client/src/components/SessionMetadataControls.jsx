import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionMetadataApi } from '../services/api'

/**
 * SessionMetadataControls - UI for managing session metadata
 * Features: Rename, Hide/Show, Tags, Notes
 *
 * Props:
 * - projectId: string
 * - sessionId: string
 * - currentTitle: string (original title from JSONL)
 * - compact: boolean (show compact inline version)
 */
const SessionMetadataControls = ({ projectId, sessionId, currentTitle, compact = false }) => {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [notesInput, setNotesInput] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  // Fetch metadata
  const { data: metadataData, isLoading } = useQuery({
    queryKey: ['session-metadata', projectId, sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, sessionId).then(res => res.data),
    enabled: !!projectId && !!sessionId
  })

  const metadata = metadataData?.metadata || {}

  // Mutations
  const setTitleMutation = useMutation({
    mutationFn: (title) => sessionMetadataApi.setCustomTitle(projectId, sessionId, title),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
      queryClient.invalidateQueries(['sessions', projectId])
      setIsEditing(false)
    }
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: () => sessionMetadataApi.toggleVisibility(projectId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
      queryClient.invalidateQueries(['sessions', projectId])
    }
  })

  const addTagsMutation = useMutation({
    mutationFn: (tags) => sessionMetadataApi.addTags(projectId, sessionId, tags),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
      setTagInput('')
    }
  })

  const removeTagMutation = useMutation({
    mutationFn: (tag) => sessionMetadataApi.removeTags(projectId, sessionId, [tag]),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
    }
  })

  const setNotesMutation = useMutation({
    mutationFn: (notes) => sessionMetadataApi.setNotes(projectId, sessionId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
      setShowNotes(false)
    }
  })

  const deleteMetadataMutation = useMutation({
    mutationFn: () => sessionMetadataApi.deleteMetadata(projectId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId, sessionId])
      queryClient.invalidateQueries(['sessions', projectId])
    }
  })

  // Handlers
  const handleSaveTitle = () => {
    if (customTitle.trim()) {
      setTitleMutation.mutate(customTitle.trim())
    }
  }

  const handleAddTags = () => {
    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    if (tags.length > 0) {
      addTagsMutation.mutate(tags)
    }
  }

  const handleSaveNotes = () => {
    setNotesMutation.mutate(notesInput)
  }

  const displayTitle = metadata.customTitle || currentTitle || sessionId

  // Compact inline version (for session list)
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        {metadata.isHidden && (
          <span className="text-xs text-slate-400" title="Hidden">👁️‍🗨️</span>
        )}
        {metadata.tags?.length > 0 && (
          <div className="flex gap-1">
            {metadata.tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-700 px-1 py-0.5 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {metadata.tags.length > 2 && (
              <span className="text-slate-400">+{metadata.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Full version (for session detail page)
  return (
    <div className="bg-[hsl(var(--surface))] border border-[hsl(var(--border))] rounded-lg p-4 space-y-4">
      {/* Title Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-[hsl(var(--text-primary))]">Session Title</label>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={currentTitle}
              className="flex-1 px-3 py-2 border border-[hsl(var(--border-hover))] rounded text-sm"
              autoFocus
            />
            <button
              onClick={handleSaveTitle}
              disabled={setTitleMutation.isPending}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {setTitleMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-[hsl(var(--text-primary))]">
            {displayTitle}
            {metadata.customTitle && (
              <span className="ml-2 text-xs text-[hsl(var(--text-tertiary))]">(custom)</span>
            )}
          </div>
        )}
      </div>

      {/* Visibility Toggle */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-[hsl(var(--text-primary))]">Visibility</label>
          <button
            onClick={() => toggleVisibilityMutation.mutate()}
            disabled={toggleVisibilityMutation.isPending}
            className={`px-3 py-1.5 rounded text-xs font-medium ${
              metadata.isHidden
                ? 'bg-[hsl(var(--border))] text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--border))]'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {metadata.isHidden ? '👁️‍🗨️ Hidden' : '👁️ Visible'}
          </button>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <label className="text-sm font-semibold text-[hsl(var(--text-primary))] block mb-2">Tags</label>

        {/* Existing tags */}
        {metadata.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {metadata.tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTagMutation.mutate(tag)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add tags input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add tags (comma-separated)"
            className="flex-1 px-3 py-2 border border-[hsl(var(--border-hover))] rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTags()}
          />
          <button
            onClick={handleAddTags}
            disabled={addTagsMutation.isPending || !tagInput.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-[hsl(var(--text-primary))]">Notes</label>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {showNotes ? 'Hide' : metadata.notes ? 'Edit' : 'Add'}
          </button>
        </div>

        {showNotes ? (
          <div className="space-y-2">
            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Add notes about this session..."
              className="w-full px-3 py-2 border border-[hsl(var(--border-hover))] rounded text-sm"
              rows={4}
            />
            <button
              onClick={handleSaveNotes}
              disabled={setNotesMutation.isPending}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {setNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        ) : metadata.notes ? (
          <div className="text-sm text-[hsl(var(--text-secondary))] bg-[hsl(var(--background-secondary))] p-2 rounded">
            {metadata.notes}
          </div>
        ) : null}
      </div>

      {/* Reset Metadata */}
      {metadata.customTitle || metadata.tags?.length > 0 || metadata.notes ? (
        <div className="pt-2 border-t border-[hsl(var(--border))]">
          <button
            onClick={() => {
              if (confirm('Reset all custom metadata for this session?')) {
                deleteMetadataMutation.mutate()
              }
            }}
            disabled={deleteMetadataMutation.isPending}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Reset to Default
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default SessionMetadataControls
