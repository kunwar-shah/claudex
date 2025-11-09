import React, { useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Folder, Edit, Tag, Eye, Loader2 } from 'lucide-react'
import { projectsApi, sessionMetadataApi } from '../services/api'
import ProjectComboBox from '../components/ProjectComboBox'
import SessionTable from '../components/SessionTable'
import SessionManagementFilters from '../components/SessionManagementFilters'
import BulkActionsToolbar from '../components/BulkActionsToolbar'
import SessionSummaryModal from '../components/SessionSummaryModal'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { H1, H2, P, Muted } from '../components/ui/typography'

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
      <div className="h-full bg-background overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            {/* Header */}
            <div className="mb-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ClipboardList className="w-8 h-8 text-primary" />
                <H1>Session Management</H1>
              </div>
              <P className="text-text-secondary">
                Organize, rename, tag, and manage your Claude Code sessions
              </P>
            </div>

            {/* Project Selector */}
            <Card className="shadow-xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <H2 className="mb-2">Select a Project</H2>
                  <Muted className="mb-6">
                    Choose a project to view and manage its sessions
                  </Muted>
                </div>

                <div className="mb-6">
                  <ProjectComboBox
                    projects={projects}
                    selectedProject={selectedProject}
                    onProjectSelect={handleProjectChange}
                    size="large"
                  />
                </div>

                <div className="pt-6 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Edit className="w-6 h-6 text-primary mx-auto mb-2" />
                      <Muted className="text-xs">Rename Sessions</Muted>
                    </div>
                    <div>
                      <Tag className="w-6 h-6 text-success mx-auto mb-2" />
                      <Muted className="text-xs">Add Tags</Muted>
                    </div>
                    <div>
                      <Eye className="w-6 h-6 text-accent mx-auto mb-2" />
                      <Muted className="text-xs">Hide/Show</Muted>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              <H1 className="text-2xl">Session Management</H1>
            </div>
            <div className="w-64">
              <ProjectComboBox
                projects={projects}
                selectedProject={selectedProject}
                onProjectSelect={handleProjectChange}
              />
            </div>
          </div>

          <Badge variant="secondary">
            {sessions.length} sessions
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border-b border-border px-6 py-3">
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
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-3">
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
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <Muted>Loading sessions...</Muted>
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
