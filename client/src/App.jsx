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

        // Trigger rebuild if:
        // 1. No index exists (total_messages = 0)
        // 2. Index is not currently building
        const shouldBuild =
          indexStatus.stats?.total_messages === 0 &&
          !indexStatus.rebuild?.isBuilding

        if (shouldBuild) {
          console.log('[Auto-Index] Triggering index build on startup...')
          await searchApi.rebuildIndex()

          // Show subtle toast notification
          const toast = document.createElement('div')
          toast.className = 'fixed top-4 right-4 bg-primary text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in'
          toast.textContent = '🔄 Search index is building in the background...'
          document.body.appendChild(toast)

          setTimeout(() => {
            if (document.body.contains(toast)) {
              document.body.removeChild(toast)
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