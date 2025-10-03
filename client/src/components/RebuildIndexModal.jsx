import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { searchApi } from '../services/api'

const RebuildIndexModal = ({ isOpen, onClose, currentStats }) => {
  const [state, setState] = useState('confirm') // confirm, building, success, error
  const [buildResult, setBuildResult] = useState(null)
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()

  if (!isOpen) return null

  const handleRebuild = async () => {
    setState('building')
    setError(null)

    try {
      const response = await searchApi.rebuildIndex()
      setBuildResult(response.data)
      setState('success')

      // Invalidate index status to refetch
      queryClient.invalidateQueries(['indexStatus'])
    } catch (err) {
      console.error('Failed to rebuild index:', err)
      setError(err.response?.data?.message || err.message || 'Failed to rebuild search index')
      setState('error')
    }
  }

  const handleClose = () => {
    setState('confirm')
    setBuildResult(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl animate-scale-in">
        {/* Confirmation State */}
        {state === 'confirm' && (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Rebuild Search Index
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                This will rebuild the entire search index for all conversations. This may take a few minutes for large conversation histories.
              </p>

              {currentStats && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Current Index:</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Messages:</span>
                      <span className="font-medium">{currentStats.total_messages?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects:</span>
                      <span className="font-medium">{currentStats.total_projects || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-medium">{currentStats.total_sessions || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                The search functionality will continue to work with the existing index during the rebuild process.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRebuild}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Rebuild Index
              </button>
            </div>
          </>
        )}

        {/* Building State */}
        {state === 'building' && (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Rebuilding Search Index...
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Please wait while we rebuild the search index. This may take a few minutes depending on the size of your conversation history.
              </p>

              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
              </div>

              <p className="text-center text-sm text-slate-500">
                Building index...
              </p>
            </div>
          </>
        )}

        {/* Success State */}
        {state === 'success' && (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Index Rebuilt Successfully!
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Your search index has been updated and is ready to use.
              </p>

              {buildResult && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex justify-between">
                      <span>Messages Indexed:</span>
                      <span className="font-semibold text-green-700">
                        {buildResult.indexed?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projects:</span>
                      <span className="font-semibold text-green-700">
                        {buildResult.projects || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sessions:</span>
                      <span className="font-semibold text-green-700">
                        {buildResult.sessions || 0}
                      </span>
                    </div>
                    {buildResult.duration && (
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span>Completed in:</span>
                        <span className="font-semibold text-green-700">
                          {buildResult.duration}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}

        {/* Error State */}
        {state === 'error' && (
          <>
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Failed to Rebuild Index
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-3">
                An error occurred while rebuilding the search index:
              </p>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
                <p className="text-sm text-red-800 font-mono">
                  {error}
                </p>
              </div>

              <p className="text-xs text-slate-500">
                Please check the server logs for more details or try again later.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleRebuild}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}

export default RebuildIndexModal
