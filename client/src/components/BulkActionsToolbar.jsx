import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sessionMetadataApi } from '../services/api'

/**
 * BulkActionsToolbar - Toolbar for bulk operations on selected sessions
 *
 * Features:
 * - Show selected count
 * - Bulk operations: Add tags, Hide/Show, Delete metadata
 * - Clear selection
 * - Confirmation for destructive actions
 */
const BulkActionsToolbar = ({ selectedCount, selectedSessions, projectId, onClearSelection }) => {
  const queryClient = useQueryClient()
  const [showTagInput, setShowTagInput] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Bulk hide mutation
  const bulkHideMutation = useMutation({
    mutationFn: async () => {
      await sessionMetadataApi.batchSetVisibility(projectId, selectedSessions, true)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hidden-sessions', projectId])
      queryClient.invalidateQueries(['sessions', projectId])
      onClearSelection()
    }
  })

  // Bulk show mutation
  const bulkShowMutation = useMutation({
    mutationFn: async () => {
      await sessionMetadataApi.batchSetVisibility(projectId, selectedSessions, false)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hidden-sessions', projectId])
      queryClient.invalidateQueries(['sessions', projectId])
      onClearSelection()
    }
  })

  // Bulk add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tag) => {
      await sessionMetadataApi.batchAddTags(projectId, selectedSessions, [tag])
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId])
      queryClient.invalidateQueries(['sessions', projectId])
      setShowTagInput(false)
      setNewTag('')
      onClearSelection()
    }
  })

  // Bulk delete metadata mutation
  const deleteMetadataMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        selectedSessions.map(sessionId =>
          sessionMetadataApi.deleteMetadata(projectId, sessionId)
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['session-metadata', projectId])
      queryClient.invalidateQueries(['sessions', projectId])
      queryClient.invalidateQueries(['hidden-sessions', projectId])
      setShowDeleteConfirm(false)
      onClearSelection()
    }
  })

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTagMutation.mutate(newTag.trim())
    }
  }

  const handleDeleteMetadata = () => {
    deleteMetadataMutation.mutate()
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[hsl(var(--text-primary))]">
            {selectedCount} session{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))] underline"
          >
            Clear
          </button>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          {/* Add Tags */}
          {showTagInput ? (
            <div className="flex items-center gap-2 bg-[hsl(var(--surface))] px-3 py-1.5 rounded-lg border border-[hsl(var(--border))]">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Enter tag name..."
                className="px-2 py-1 text-sm border border-[hsl(var(--border-hover))] rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleAddTag}
                disabled={addTagMutation.isPending || !newTag.trim()}
                className="px-3 py-1 text-xs bg-[hsl(var(--primary))] text-white rounded hover:bg-[hsl(var(--primary-hover))] disabled:opacity-50"
              >
                {addTagMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setShowTagInput(false)
                  setNewTag('')
                }}
                className="px-3 py-1 text-xs bg-[hsl(var(--border))] text-[hsl(var(--text-primary))] rounded hover:bg-[hsl(var(--border))]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(var(--primary-light))] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Add Tag
            </button>
          )}

          {/* Hide All */}
          <button
            onClick={() => bulkHideMutation.mutate()}
            disabled={bulkHideMutation.isPending}
            className="px-3 py-1.5 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border-hover))] text-[hsl(var(--text-primary))] rounded-lg hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            {bulkHideMutation.isPending ? 'Hiding...' : 'Hide All'}
          </button>

          {/* Show All */}
          <button
            onClick={() => bulkShowMutation.mutate()}
            disabled={bulkShowMutation.isPending}
            className="px-3 py-1.5 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--border-hover))] text-[hsl(var(--text-primary))] rounded-lg hover:bg-[hsl(var(--background-secondary))] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {bulkShowMutation.isPending ? 'Showing...' : 'Show All'}
          </button>

          {/* Delete Metadata */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-300">
              <span className="text-sm text-red-900 font-medium">
                Delete metadata for {selectedCount} session{selectedCount !== 1 ? 's' : ''}?
              </span>
              <button
                onClick={handleDeleteMetadata}
                disabled={deleteMetadataMutation.isPending}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                {deleteMetadataMutation.isPending ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-xs bg-[hsl(var(--border))] text-[hsl(var(--text-primary))] rounded hover:bg-[hsl(var(--border))]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm bg-[hsl(var(--surface))] border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Metadata
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkActionsToolbar
