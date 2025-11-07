import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { sessionMetadataApi } from '../services/api'

/**
 * SessionManagementFilters - Filter controls for session management
 *
 * Features:
 * - Show filter (all/visible/hidden)
 * - Tag filter (from available tags)
 * - Sort dropdown (updated/title/messages)
 * - Search input
 */
const SessionManagementFilters = ({
  showFilter,
  setShowFilter,
  tagFilter,
  setTagFilter,
  sortBy,
  setSortBy,
  searchQuery,
  setSearchQuery,
  projectId
}) => {
  // Fetch all tags for this project
  const { data: tagsData } = useQuery({
    queryKey: ['all-tags', projectId],
    queryFn: () => sessionMetadataApi.getAllTags(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const availableTags = tagsData?.tags || []

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full px-4 py-2 pl-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Show Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Show:</label>
        <select
          value={showFilter}
          onChange={(e) => setShowFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option key="all" value="all">All Sessions</option>
          <option key="visible" value="visible">Visible Only</option>
          <option key="hidden" value="hidden">Hidden Only</option>
          <option key="trash" value="trash">🗑️ Trash</option>
        </select>
      </div>

      {/* Tag Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Tag:</label>
        <select
          value={tagFilter || ''}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option key="all-tags" value="">All Tags</option>
          {availableTags.map(tag => (
            <option key={tag.tag} value={tag.tag}>
              {tag.tag} ({tag.count})
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700">Sort:</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        >
          <option key="updated" value="updated">Last Updated</option>
          <option key="title" value="title">Title (A-Z)</option>
          <option key="messages" value="messages">Message Count</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(searchQuery || tagFilter || showFilter !== 'visible' || sortBy !== 'updated') && (
        <button
          onClick={() => {
            setSearchQuery('')
            setTagFilter(null)
            setShowFilter('visible')
            setSortBy('updated')
          }}
          className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  )
}

export default SessionManagementFilters
