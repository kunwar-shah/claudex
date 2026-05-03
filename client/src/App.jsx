import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { TopProgressBar, LoadingScreen } from './components/ui/loading'
import './App.css'

// Code-split routes into separate chunks — loaded only when navigated to.
// Initial bundle drops to just Layout + Header + Footer + LoadingScreen.
const ProjectView           = lazy(() => import('./components/ProjectView'))
const TremorProjectView     = lazy(() => import('./components/TremorProjectView'))
const SearchPage            = lazy(() => import('./components/SearchPage'))
const SessionManagementPage = lazy(() => import('./pages/SessionManagementPage'))

// Global toasts now live in <ToastProvider> (mounted in main.jsx).
// Use `useToast()` from any component to fire a notification.

function App() {
  return (
    <div className="App">
      {/* Global indeterminate progress bar — activates whenever ANY query/mutation is fetching */}
      <TopProgressBar />

      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<LoadingScreen label="Loading workspace…" />}>
              <ProjectView />
            </Suspense>
          } />
          <Route path="projects/:projectId" element={
            <Suspense fallback={<LoadingScreen label="Loading workspace…" />}>
              <ProjectView />
            </Suspense>
          } />
          <Route path="projects/:projectId/sessions/:sessionId" element={
            <Suspense fallback={<LoadingScreen label="Loading workspace…" />}>
              <ProjectView />
            </Suspense>
          } />
          <Route path="search" element={
            <Suspense fallback={<LoadingScreen label="Loading search…" />}>
              <SearchPage />
            </Suspense>
          } />
          <Route path="manage-sessions" element={
            <Suspense fallback={<LoadingScreen label="Loading session manager…" />}>
              <SessionManagementPage />
            </Suspense>
          } />
          <Route path="manage-sessions/:projectId" element={
            <Suspense fallback={<LoadingScreen label="Loading session manager…" />}>
              <SessionManagementPage />
            </Suspense>
          } />
          <Route path="tremor-preview" element={
            <Suspense fallback={<LoadingScreen label="Loading analytics dashboard…" />}>
              <TremorProjectView />
            </Suspense>
          } />
          <Route path="tremor-preview/projects/:projectId" element={
            <Suspense fallback={<LoadingScreen label="Loading analytics…" />}>
              <TremorProjectView />
            </Suspense>
          } />
          <Route path="tremor-preview/projects/:projectId/sessions/:sessionId" element={
            <Suspense fallback={<LoadingScreen label="Loading analytics…" />}>
              <TremorProjectView />
            </Suspense>
          } />
        </Route>
      </Routes>
    </div>
  )
}

export default App