import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectView from './components/ProjectView'
import TremorProjectView from './components/TremorProjectView'
import SearchPage from './components/SearchPage'
import SessionManagementPage from './pages/SessionManagementPage'
import './App.css'

function App() {
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