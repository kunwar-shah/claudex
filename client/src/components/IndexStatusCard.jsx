import React from 'react'
import { useQuery } from '@tanstack/react-query'
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
      <div className="bg-white border border-slate-200 rounded-lg p-4 max-w-md mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const stats = indexStatus?.stats || {}
  const isIndexed = indexStatus?.isIndexed || false
  const lastUpdated = stats.lastUpdated ? new Date(stats.lastUpdated) : null
  const isStale = lastUpdated && (Date.now() - lastUpdated.getTime()) > 7 * 24 * 60 * 60 * 1000 // 7 days

  return (
    <div className={`bg-white border rounded-lg p-5 max-w-md mx-auto shadow-sm ${
      !isIndexed ? 'border-amber-300 bg-amber-50' :
      isStale ? 'border-amber-300 bg-amber-50' :
      'border-slate-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Search Index Status
        </h3>
        {isIndexed && !isStale ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Indexed
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {isStale ? 'Outdated' : 'Not Indexed'}
          </span>
        )}
      </div>

      {!isIndexed ? (
        <div className="mb-4">
          <p className="text-sm text-amber-800 mb-2">
            Search index has not been built yet. Build the index to enable full-text search across your conversations.
          </p>
        </div>
      ) : isStale ? (
        <div className="mb-4">
          <p className="text-sm text-amber-800 mb-2">
            Search index may be outdated. Consider rebuilding to include recent conversations.
          </p>
        </div>
      ) : null}

      {isIndexed && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages
            </span>
            <span className="font-semibold text-slate-800">
              {stats.total_messages?.toLocaleString() || 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Projects
            </span>
            <span className="font-semibold text-slate-800">
              {stats.total_projects || 0}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 flex items-center">
              <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
              Sessions
            </span>
            <span className="font-semibold text-slate-800">
              {stats.total_sessions || 0}
            </span>
          </div>

          {lastUpdated && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-100">
              <span className="text-slate-600 flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last Updated
              </span>
              <span className="text-xs text-slate-500">
                {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onRebuildClick}
        className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {!isIndexed ? 'Build Index Now' : 'Rebuild Index'}
      </button>
    </div>
  )
}

export default IndexStatusCard
