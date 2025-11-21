import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectView from './components/ProjectView'
import TremorProjectView from './components/TremorProjectView'
import SearchPage from './components/SearchPage'
import SessionManagementPage from './pages/SessionManagementPage'
import { useSettings } from './contexts/SettingsContext'
import { searchApi } from './services/api'
import './App.css'

function App() {
  const { settings } = useSettings()
  const [autoIndexTriggered, setAutoIndexTriggered] = useState(false)

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

        // Check if index is outdated (older than 7 days)
        const lastUpdated = indexStatus.stats?.last_updated
        const daysSinceUpdate = lastUpdated
          ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        const isOutdated = daysSinceUpdate > 7

        // Trigger rebuild if:
        // 1. No index exists (total_messages = 0), OR
        // 2. Index is outdated (> 7 days old)
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
          const startToast = document.createElement('div')
          startToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
          startToast.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background-color: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 9999;'
          startToast.textContent = '🔄 Search index is building in the background...'
          document.body.appendChild(startToast)
          console.log('[Auto-Index] Start toast added to DOM')

          setTimeout(() => {
            if (document.body.contains(startToast)) {
              document.body.removeChild(startToast)
            }
          }, 4000)

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
                const successToast = document.createElement('div')
                successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
                successToast.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background-color: #16a34a; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 9999;'
                successToast.textContent = `✅ Search index built successfully! (${status.data.stats?.total_messages || 0} messages indexed)`
                document.body.appendChild(successToast)
                console.log('[Auto-Index] Success toast added to DOM')

                setTimeout(() => {
                  if (document.body.contains(successToast)) {
                    document.body.removeChild(successToast)
                  }
                }, 5000)
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
          const infoToast = document.createElement('div')
          infoToast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
          infoToast.style.cssText = 'position: fixed; top: 1rem; right: 1rem; background-color: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 9999;'
          infoToast.textContent = `ℹ️ Search index is up to date (${indexStatus.stats?.total_messages || 0} messages, ${ageText})`
          document.body.appendChild(infoToast)
          console.log('[Auto-Index] Info toast added to DOM')

          setTimeout(() => {
            if (document.body.contains(infoToast)) {
              document.body.removeChild(infoToast)
            }
          }, 4000)
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
    </div>
  )
}

export default App