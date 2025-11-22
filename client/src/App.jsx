import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectView from './components/ProjectView'
import TremorProjectView from './components/TremorProjectView'
import SearchPage from './components/SearchPage'
import SessionManagementPage from './pages/SessionManagementPage'
import Toast from './components/Toast'
import { useSettings } from './contexts/SettingsContext'
import { searchApi } from './services/api'
import './App.css'

function App() {
  const { settings } = useSettings()
  const [autoIndexTriggered, setAutoIndexTriggered] = useState(false)
  const [toast, setToast] = useState(null) // { type, message }

  // Auto-index on startup
  useEffect(() => {
    const triggerAutoIndex = async () => {
      // Only run once per session
      if (autoIndexTriggered) return

      // Check if auto-index is enabled in settings
      if (!settings.autoIndexOnStartup) return

      try {
        // Check current index status
        const response = await searchApi.getIndexStatus()
        const indexStatus = response.data

        console.log('[Auto-Index] Current index status:', indexStatus)

        // Check if index is outdated (based on user setting)
        const lastUpdated = indexStatus.stats?.last_updated
        const daysSinceUpdate = lastUpdated
          ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        const isOutdated = daysSinceUpdate > settings.autoIndexDays

        // Trigger rebuild if:
        // 1. No index exists (total_messages = 0), OR
        // 2. Index is outdated (> autoIndexDays threshold)
        // 3. AND index is not currently building
        const shouldBuild =
          (indexStatus.stats?.total_messages === 0 || isOutdated) &&
          !indexStatus.rebuild?.isBuilding

        if (shouldBuild) {
          const reason = indexStatus.stats?.total_messages === 0
            ? 'no index exists'
            : daysSinceUpdate === Infinity
            ? 'index has no timestamp'
            : `index is ${daysSinceUpdate} days old`
          console.log(`[Auto-Index] Triggering index build on startup (${reason})...`)
          await searchApi.rebuildIndex()

          // Show start notification
          console.log('[Auto-Index] Creating start notification toast...')
          setToast({ type: 'info', message: 'Search index is building in the background...' })

          // Poll for completion (check every 3 seconds, max 10 minutes)
          let pollCount = 0
          const maxPolls = 200 // 10 minutes
          const pollInterval = setInterval(async () => {
            pollCount++
            try {
              const status = await searchApi.getIndexStatus()

              // Check if build is complete
              if (!status.data.rebuild?.isBuilding) {
                clearInterval(pollInterval)

                // Show success notification
                console.log('[Auto-Index] Index build complete! Creating success toast...')
                const messageCount = status.data.stats?.total_messages || 0
                setToast({
                  type: 'success',
                  message: `Search index built successfully! (${messageCount} messages indexed)`
                })
              }

              // Stop polling after max attempts
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval)
              }
            } catch (error) {
              console.error('[Auto-Index] Polling error:', error)
              clearInterval(pollInterval)
            }
          }, 3000)
        } else {
          // Index is recent - show info toast
          const ageText = daysSinceUpdate === Infinity ? 'unknown age' : `${daysSinceUpdate} days old`
          console.log(`[Auto-Index] Index is recent (${ageText}), skipping rebuild`)
          console.log('[Auto-Index] Creating info toast...')
          const messageCount = indexStatus.stats?.total_messages || 0
          setToast({
            type: 'info',
            message: `Search index is up to date (${messageCount} messages, ${ageText})`
          })
        }

        setAutoIndexTriggered(true)
      } catch (error) {
        console.error('[Auto-Index] Failed to trigger auto-index:', error)
        setAutoIndexTriggered(true)
      }
    }

    // Small delay to let the app render first
    const timer = setTimeout(triggerAutoIndex, 1000)
    return () => clearTimeout(timer)
  }, [settings.autoIndexOnStartup, autoIndexTriggered])

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ProjectView />} />
          <Route path="projects/:projectId" element={<ProjectView />} />
          <Route path="projects/:projectId/sessions/:sessionId" element={<ProjectView />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="manage-sessions" element={<SessionManagementPage />} />
          <Route path="manage-sessions/:projectId" element={<SessionManagementPage />} />
          <Route path="tremor-preview" element={<TremorProjectView />} />
          <Route path="tremor-preview/projects/:projectId" element={<TremorProjectView />} />
          <Route path="tremor-preview/projects/:projectId/sessions/:sessionId" element={<TremorProjectView />} />
        </Route>
      </Routes>

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App