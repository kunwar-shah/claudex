import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { sessionMetadataApi } from '../services/api'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Small } from './ui/typography'

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

  const hasActiveFilters = searchQuery || tagFilter || showFilter !== 'visible' || sortBy !== 'updated'

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Show Filter */}
      <div className="flex items-center gap-2">
        <Small className="text-text-secondary">Show:</Small>
        <select
          value={showFilter}
          onChange={(e) => setShowFilter(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Sessions</option>
          <option value="visible">Visible Only</option>
          <option value="hidden">Hidden Only</option>
          <option value="trash">Trash</option>
        </select>
      </div>

      {/* Tag Filter */}
      <div className="flex items-center gap-2">
        <Small className="text-text-secondary">Tag:</Small>
        <select
          value={tagFilter || ''}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="h-9 px-3 text-sm rounded-md border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Tags</option>
          {availableTags.map(tag => (
            <option key={tag.tag} value={tag.tag}>
              {tag.tag} ({tag.count})
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <Small className="text-text-secondary">Sort:</Small>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 px-3 text-sm rounded-md border border-border bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="updated">Last Updated</option>
          <option value="title">Title (A-Z)</option>
          <option value="messages">Message Count</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery('')
            setTagFilter(null)
            setShowFilter('visible')
            setSortBy('updated')
          }}
          className="gap-1"
        >
          <X className="w-3 h-3" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

export default SessionManagementFilters
