import React, { useState } from 'react'
import { searchApi } from '../services/api'

const RebuildIndexButton = () => {
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [rebuildStatus, setRebuildStatus] = useState(null)

  const handleRebuildIndex = async () => {
    if (!window.confirm('Rebuild the search index? This may take a few minutes for large conversation histories.')) {
      return
    }

    setIsRebuilding(true)
    setRebuildStatus(null)

    try {
      const response = await searchApi.rebuildIndex()
      setRebuildStatus({
        success: true,
        message: response.data?.message || 'Search index rebuilt successfully!'
      })

      // Auto-hide success message after 5 seconds
      setTimeout(() => setRebuildStatus(null), 5000)
    } catch (error) {
      console.error('Failed to rebuild index:', error)
      setRebuildStatus({
        success: false,
        message: error.response?.data?.error || 'Failed to rebuild search index'
      })

      // Auto-hide error message after 8 seconds
      setTimeout(() => setRebuildStatus(null), 8000)
    } finally {
      setIsRebuilding(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-center space-y-2">
      <button
        onClick={handleRebuildIndex}
        disabled={isRebuilding}
        className={`inline-flex items-center px-4 py-2 text-sm rounded transition-colors ${
          isRebuilding
            ? 'bg-slate-400 text-white cursor-not-allowed'
            : 'bg-slate-600 text-white hover:bg-slate-700'
        }`}
        title="Rebuild search index (use this if search results seem outdated)"
      >
        {isRebuilding ? (
          <>
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Rebuilding Index...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Rebuild Search Index
          </>
        )}
      </button>

      {rebuildStatus && (
        <div className={`text-xs px-3 py-1.5 rounded ${
          rebuildStatus.success
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {rebuildStatus.message}
        </div>
      )}
    </div>
  )
}

export default RebuildIndexButton
