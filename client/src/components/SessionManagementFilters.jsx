import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, X, Filter, Tag as TagIcon, ArrowUpDown } from 'lucide-react'
import { sessionMetadataApi } from '../services/api'
import { Input } from './ui/input'
import { Button } from './ui/button'

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
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search - Full Width on Mobile */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Show Filter - Shadcn Style */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Filter className="w-4 h-4 text-muted-foreground" />
        </div>
        <select
          value={showFilter}
          onChange={(e) => setShowFilter(e.target.value)}
          className="h-9 pl-9 pr-8 text-sm rounded-md border border-border bg-[hsl(var(--surface))] hover:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1rem'
          }}
        >
          <option value="all">All Sessions</option>
          <option value="visible">Visible Only</option>
          <option value="favorites">Favorites</option>
          <option value="hidden">Hidden Only</option>
          <option value="trash">Trash</option>
        </select>
      </div>

      {/* Tag Filter - Shadcn Style */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <TagIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <select
          value={tagFilter || ''}
          onChange={(e) => setTagFilter(e.target.value || null)}
          className="h-9 pl-9 pr-8 text-sm rounded-md border border-border bg-[hsl(var(--surface))] hover:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer appearance-none min-w-[140px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1rem'
          }}
        >
          <option value="">All Tags</option>
          {availableTags.map(tag => (
            <option key={tag.tag} value={tag.tag}>
              {tag.tag} ({tag.count})
            </option>
          ))}
        </select>
      </div>

      {/* Sort - Shadcn Style */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 pl-9 pr-8 text-sm rounded-md border border-border bg-[hsl(var(--surface))] hover:bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors cursor-pointer appearance-none min-w-[150px]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0.5rem center',
            backgroundSize: '1rem'
          }}
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
          className="gap-1.5 h-9"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  )
}

export default SessionManagementFilters
