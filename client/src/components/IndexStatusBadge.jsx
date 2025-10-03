import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const IndexStatusBadge = () => {
  const { data: indexStatus } = useQuery({
    queryKey: ['indexStatus'],
    queryFn: () => searchApi.getIndexStatus().then(res => res.data),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  if (!indexStatus?.isIndexed) {
    return null
  }

  const stats = indexStatus.stats || {}
  const lastUpdated = stats.lastUpdated ? new Date(stats.lastUpdated) : null
  const messageCount = stats.total_messages || 0
  const projectCount = stats.total_projects || 0

  // Format message count (e.g., 67698 → 67.7k)
  const formatCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <div className="inline-flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <span className="font-medium">
        Index: {formatCount(messageCount)} messages
      </span>
      <span className="text-slate-400">•</span>
      <span>
        {projectCount} {projectCount === 1 ? 'project' : 'projects'}
      </span>
      {lastUpdated && (
        <>
          <span className="text-slate-400">•</span>
          <span className="flex items-center" title={lastUpdated.toLocaleString()}>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </>
      )}
    </div>
  )
}

export default IndexStatusBadge
