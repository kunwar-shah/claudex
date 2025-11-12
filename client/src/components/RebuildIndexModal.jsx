import React, { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { searchApi } from '../services/api'

const RebuildIndexModal = ({ isOpen, onClose, currentStats }) => {
  const [state, setState] = useState('confirm') // confirm, building, success, error
  const [buildResult, setBuildResult] = useState(null)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [sessionProgress, setSessionProgress] = useState({ current: 0, total: 0 })
  const [messageCount, setMessageCount] = useState(0)
  const queryClient = useQueryClient()
  const pollIntervalRef = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  const pollStatus = async () => {
    try {
      const response = await searchApi.getIndexStatus()
      const rebuildInfo = response.data.rebuild

      if (rebuildInfo.isBuilding) {
        // Still building - update progress
        setProgress(rebuildInfo.progress || 0)
        setElapsedTime(Math.floor(rebuildInfo.elapsedTime / 1000))
        setSessionProgress({
          current: rebuildInfo.currentSession || 0,
          total: rebuildInfo.totalSessions || 0
        })
        setMessageCount(rebuildInfo.totalMessages || 0)
      } else {
        // Finished
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null

        if (rebuildInfo.lastError) {
          setError(rebuildInfo.lastError)
          setState('error')
        } else if (rebuildInfo.lastResult) {
          setBuildResult(rebuildInfo.lastResult.stats)
          setState('success')
          queryClient.invalidateQueries(['indexStatus'])
        }
      }
    } catch (err) {
      console.error('Failed to poll status:', err)
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
      setError('Failed to check indexing status')
      setState('error')
    }
  }

  const handleRebuild = async () => {
    setState('building')
    setError(null)
    setProgress(0)
    setElapsedTime(0)
    setSessionProgress({ current: 0, total: 0 })
    setMessageCount(0)

    try {
      // Start rebuild (returns immediately)
      await searchApi.rebuildIndex()

      // Start polling for status every 2 seconds
      pollIntervalRef.current = setInterval(pollStatus, 2000)

      // Initial status check
      pollStatus()
    } catch (err) {
      console.error('Failed to start rebuild:', err)
      setError(err.response?.data?.message || err.message || 'Failed to start rebuild')
      setState('error')
    }
  }

  const handleClose = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setState('confirm')
    setBuildResult(null)
    setError(null)
    setProgress(0)
    setElapsedTime(0)
    setSessionProgress({ current: 0, total: 0 })
    setMessageCount(0)
    onClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[hsl(var(--surface))] rounded-lg max-w-md w-full shadow-xl animate-scale-in">
        {/* Confirmation State */}
        {state === 'confirm' && (
          <>
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                  Rebuild Search Index
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-4">
                This will rebuild the entire search index for all conversations. This may take a few minutes for large conversation histories.
              </p>

              {currentStats && (
                <div className="bg-[hsl(var(--background-secondary))] rounded-lg p-4 border border-[hsl(var(--border))] mb-4">
                  <p className="text-xs font-semibold text-[hsl(var(--text-primary))] mb-2">Current Index:</p>
                  <div className="space-y-1 text-sm text-[hsl(var(--text-secondary))]">
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

              <p className="text-xs text-[hsl(var(--text-tertiary))]">
                The search functionality will continue to work with the existing index during the rebuild process.
              </p>
            </div>

            <div className="p-4 bg-[hsl(var(--background-secondary))] border-t border-[hsl(var(--border))] flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--text-primary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))] rounded-md transition-colors"
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
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                  Rebuilding Search Index...
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-4">
                Rebuilding search index for all conversations. This typically takes 2-5 minutes for 100+ sessions.
              </p>

              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-[hsl(var(--text-secondary))] mb-2">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-[hsl(var(--border))] rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Spinner */}
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                </div>

                {/* Status */}
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-[hsl(var(--text-primary))]">
                    Building index...
                  </p>
                  {sessionProgress.total > 0 && (
                    <p className="text-xs text-[hsl(var(--text-secondary))]">
                      Processing: {sessionProgress.current} / {sessionProgress.total} sessions
                    </p>
                  )}
                  {messageCount > 0 && (
                    <p className="text-xs text-[hsl(var(--text-tertiary))]">
                      {messageCount.toLocaleString()} messages indexed
                    </p>
                  )}
                  <p className="text-xs text-[hsl(var(--text-tertiary))]">
                    Elapsed time: {formatTime(elapsedTime)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Success State */}
        {state === 'success' && (
          <>
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                  Index Rebuilt Successfully!
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-4">
                Your search index has been updated and is ready to use.
              </p>

              {buildResult && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="space-y-2 text-sm text-[hsl(var(--text-primary))]">
                    <div className="flex justify-between">
                      <span>Messages Indexed:</span>
                      <span className="font-semibold text-green-700">
                        {buildResult.messages?.toLocaleString() || 0}
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
                          {buildResult.duration.toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-[hsl(var(--background-secondary))] border-t border-[hsl(var(--border))] flex items-center justify-end">
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
            <div className="p-6 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                  Failed to Rebuild Index
                </h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-3">
                An error occurred while rebuilding the search index:
              </p>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200 mb-4">
                <p className="text-sm text-red-800 font-mono">
                  {error}
                </p>
              </div>

              <p className="text-xs text-[hsl(var(--text-tertiary))]">
                Please check the server logs for more details or try again later.
              </p>
            </div>

            <div className="p-4 bg-[hsl(var(--background-secondary))] border-t border-[hsl(var(--border))] flex items-center justify-end space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--text-primary))] hover:text-[hsl(var(--text-primary))] hover:bg-[hsl(var(--surface-hover))] rounded-md transition-colors"
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
