import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi, sessionMetadataApi } from '../services/api'
import ProjectComboBox from '../components/ProjectComboBox'
import SessionTable from '../components/SessionTable'
import SessionManagementFilters from '../components/SessionManagementFilters'
import BulkActionsToolbar from '../components/BulkActionsToolbar'
import SessionSummaryModal from '../components/SessionSummaryModal'

/**
 * SessionManagementPage - Dedicated page for managing sessions
 *
 * Features:
 * - Table view of all sessions
 * - Filters (show/hide, tags, sort)
 * - Bulk operations (hide, tag, delete metadata)
 * - Summary modal
 * - Navigation to full conversation
 */
const SessionManagementPage = () => {
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  // Filter states
  const [showFilter, setShowFilter] = useState('visible') // 'all', 'visible', 'hidden'
  const [tagFilter, setTagFilter] = useState(null)
  const [sortBy, setSortBy] = useState('updated') // 'updated', 'title', 'messages'
  const [searchQuery, setSearchQuery] = useState('')

  // Bulk selection
  const [selectedSessions, setSelectedSessions] = useState([])

  // Modal state
  const [summaryModalSession, setSummaryModalSession] = useState(null)

  // Selected project state for ProjectComboBox
  const [selectedProject, setSelectedProject] = useState(null)

  // Fetch all projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  const projects = projectsData?.projects || []

  // Fetch all sessions (tag filtering done on frontend)
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => projectsApi.getSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const sessions = sessionsData?.sessions || []

  // Handle project change
  const handleProjectChange = (project) => {
    setSelectedProject(project)
    setSearchParams({ project: project.id })
    setSelectedSessions([]) // Clear selection on project change
  }

  // Handle bulk selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedSessions(sessions.map(s => s.sessionId))
    } else {
      setSelectedSessions([])
    }
  }

  const handleSelectSession = (sessionId, checked) => {
    if (checked) {
      setSelectedSessions(prev => [...prev, sessionId])
    } else {
      setSelectedSessions(prev => prev.filter(id => id !== sessionId))
    }
  }

  // Handle bulk operations
  const handleBulkOperation = (operation) => {
    // Will be handled by BulkActionsToolbar
    console.log('Bulk operation:', operation, 'on', selectedSessions)
  }

  if (!projectId) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Session Management
              </h1>
              <p className="text-sm text-slate-600">
                Organize, rename, tag, and manage your Claude Code sessions
              </p>
            </div>

            {/* Project Selector */}
            <div className="bg-white rounded-lg shadow-xl p-8 border border-slate-200">
              <div className="text-center mb-6">
                <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Select a Project</h2>
                <p className="text-sm text-slate-600 mb-6">
                  Choose a project to view and manage its sessions
                </p>
              </div>

              <div className="mb-6">
                <ProjectComboBox
                  projects={projects}
                  selectedProject={selectedProject}
                  onProjectSelect={handleProjectChange}
                  size="large"
                />
              </div>

              <div className="pt-6 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">✏️</div>
                    <div className="text-xs text-slate-600 mt-1">Rename Sessions</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-emerald-600">�️</div>
                    <div className="text-xs text-slate-600 mt-1">Add Tags</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-purple-600">👁️</div>
                    <div className="text-xs text-slate-600 mt-1">Hide/Show</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Session Management
            </h1>
            <div className="w-64">
              <ProjectComboBox
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={handleProjectChange}
              />
            </div>
          </div>

          <div className="text-sm text-slate-600">
            <span className="font-semibold">{sessions.length}</span> sessions
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <SessionManagementFilters
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          projectId={projectId}
        />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedSessions.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <BulkActionsToolbar
            selectedCount={selectedSessions.length}
            selectedSessions={selectedSessions}
            projectId={projectId}
            onClearSelection={() => setSelectedSessions([])}
          />
        </div>
      )}

      {/* Session Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-600">Loading sessions...</p>
            </div>
          </div>
        ) : (
          <SessionTable
            sessions={sessions}
            projectId={projectId}
            selectedSessions={selectedSessions}
            onSelectAll={handleSelectAll}
            onSelectSession={handleSelectSession}
            onShowSummary={setSummaryModalSession}
            showFilter={showFilter}
            tagFilter={tagFilter}
            sortBy={sortBy}
            searchQuery={searchQuery}
          />
        )}
      </div>

      {/* Session Summary Modal */}
      {summaryModalSession && (
        <SessionSummaryModal
          session={summaryModalSession}
          projectId={projectId}
          onClose={() => setSummaryModalSession(null)}
        />
      )}
    </div>
  )
}

export default SessionManagementPage
