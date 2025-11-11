import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, CheckCircle, AlertTriangle, RefreshCw, MessageSquare, FolderOpen, FileText } from 'lucide-react'
import { searchApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const IndexStatusCard = ({ onRebuildClick }) => {
  const { data: indexStatus, isLoading } = useQuery({
    queryKey: ['indexStatus'],
    queryFn: () => searchApi.getIndexStatus().then(res => res.data),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="bg-[hsl(var(--surface))] border border-border rounded-lg p-3 max-w-md mx-auto shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-surface rounded w-3/4 mb-1.5"></div>
          <div className="h-3 bg-surface rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const stats = indexStatus?.stats || {}
  const isIndexed = indexStatus?.isIndexed || false
  const lastUpdated = stats.lastUpdated ? new Date(stats.lastUpdated) : null
  const isStale = lastUpdated && (Date.now() - lastUpdated.getTime()) > 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <div className={`bg-[hsl(var(--surface))] border rounded-lg p-3 max-w-lg mx-auto shadow-md ${
      !isIndexed ? 'border-warning/40 bg-warning/5' :
      isStale ? 'border-warning/40 bg-warning/5' :
      'border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-text-primary flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-primary" />
          Search Index
        </h3>
        {isIndexed && !isStale ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Indexed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-warning/10 text-warning border border-warning/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            {isStale ? 'Outdated' : 'Not Indexed'}
          </span>
        )}
      </div>

      {!isIndexed ? (
        <div className="mb-2 p-2 bg-warning/5 border border-warning/20 rounded-md">
          <p className="text-xs text-warning">
            Search index not built yet. Build to enable search.
          </p>
        </div>
      ) : isStale ? (
        <div className="mb-2 p-2 bg-warning/5 border border-warning/20 rounded-md">
          <p className="text-xs text-warning">
            Index may be outdated. Consider rebuilding.
          </p>
        </div>
      ) : null}

      {isIndexed && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="text-center p-1.5 bg-surface rounded-md">
            <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
            <div className="text-xs text-muted-foreground mb-0.5">Messages</div>
            <div className="text-base font-bold text-text-primary">
              {stats.total_messages?.toLocaleString() || 0}
            </div>
          </div>
          <div className="text-center p-1.5 bg-surface rounded-md">
            <FolderOpen className="w-4 h-4 text-[hsl(var(--primary))] mx-auto mb-1" />
            <div className="text-xs text-muted-foreground mb-0.5">Projects</div>
            <div className="text-base font-bold text-text-primary">
              {stats.total_projects || 0}
            </div>
          </div>
          <div className="text-center p-1.5 bg-surface rounded-md">
            <FileText className="w-4 h-4 text-primary mx-auto mb-1" />
            <div className="text-xs text-muted-foreground mb-0.5">Sessions</div>
            <div className="text-base font-bold text-text-primary">
              {stats.total_sessions || 0}
            </div>
          </div>
        </div>
      )}

      {isIndexed && lastUpdated && (
        <div className="text-center text-xs text-muted-foreground mb-2">
          Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </div>
      )}

      <button
        onClick={onRebuildClick}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] hover:from-[hsl(var(--primary-hover))] hover:to-[hsl(var(--primary-dark))] rounded-md shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <RefreshCw className="w-4 h-4" />
        {!isIndexed ? 'Build Index Now' : 'Rebuild Index'}
      </button>
    </div>
  )
}

export default IndexStatusCard
