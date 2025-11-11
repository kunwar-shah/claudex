import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../services/api'
import {
  Card,
  Title,
  Text,
  Metric,
  Grid,
  DonutChart,
  BarChart,
  BarList,
  Badge,
  Flex,
  ProgressBar
} from '@tremor/react'
import { formatDistanceToNow } from 'date-fns'
import ConversationThread from './ConversationThread'
import SessionMetadataControls from './SessionMetadataControls'
import ProjectExportButton from './ProjectExportButton'
import '../styles/tremor-dashboard.scss'

const TremorProjectView = () => {
  const { projectId, sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const highlightMessageId = searchParams.get('highlight')
  const navigate = useNavigate()
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)

  const handleSessionSelect = (sessionId) => {
    navigate(`/tremor-preview/projects/${projectId}/sessions/${sessionId}`)
  }

  // Get all projects data for dashboard overview
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  // Get sessions data
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => projectsApi.getSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  // Get current session data for analytics
  const { data: sessionData } = useQuery({
    queryKey: ['session', projectId, sessionId],
    queryFn: () => projectsApi.getSession(projectId, sessionId, { page: 1, pageSize: 1000 }).then(res => res.data),
    enabled: !!(projectId && sessionId)
  })

  // Get project-level token statistics
  const { data: projectTokenStats } = useQuery({
    queryKey: ['project-tokens', projectId],
    queryFn: () => fetch(`http://localhost:3400/api/projects/${projectId}/token-stats`).then(res => res.json()),
    enabled: !!(projectId && !sessionId),
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  const sessions = sessionsData?.sessions || []
  const currentSession = sessionData?.session
  const messages = sessionData?.messages || []
  const allProjects = projectsData?.projects || []

  // Analytics data
  const totalMessages = messages.length
  const userMessages = messages.filter(m => m.role === 'user').length
  const assistantMessages = messages.filter(m => m.role === 'assistant').length
  const systemMessages = messages.filter(m => m.role === 'system').length

  // Chart data for message distribution over time
  const messageDistribution = [
    { name: 'User', Messages: userMessages, color: 'blue' },
    { name: 'Assistant', Messages: assistantMessages, color: 'emerald' },
    { name: 'System', Messages: systemMessages, color: 'slate' }
  ]

  // Dynamic project activity data from API
  const projectActivityData = allProjects.slice(0, 5).map(project => ({
    project: project.name.replace('-mnt-c-laragon-www-', '').replace('-home-boss-', ''),
    sessions: project.sessionCount || 0,
    messages: project.messageCount || 0
  }))

  // Dynamic statistics
  const totalProjectsCount = allProjects.length
  const totalSessionsCount = allProjects.reduce((acc, p) => acc + (p.sessionCount || 0), 0)
  const totalMessagesCount = allProjects.reduce((acc, p) => acc + (p.messageCount || 0), 0)
  const activeTodayCount = allProjects.filter(p => {
    const lastMod = new Date(p.lastModified)
    const today = new Date()
    return lastMod.toDateString() === today.toDateString()
  }).length

  if (!projectId) {
    return (
      <div className="tremor-dashboard-page scrollable">
        <div className="main-content">
          <div className="tremor-container py-10">
            {/* Header with gradient background */}
            <div className="mb-8 -mx-8 px-8 py-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-[hsl(var(--border-hover))] rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))] flex items-center gap-3">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics Dashboard
                  </h1>
                  <p className="mt-2 text-sm text-[hsl(var(--text-secondary))] max-w-2xl">
                    Comprehensive insights into your Claude Code conversations, projects, and usage patterns.
                  </p>
                </div>
                <Badge size="lg" color="indigo">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Live Data
                </Badge>
              </div>
            </div>

            {/* KPI Cards - Enterprise Level */}
            <div className="tremor-grid cols-4 mb-8">
              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-blue-500">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">Total Projects</Text>
                    <Metric className="tremor-metric-sm mt-2">{totalProjectsCount}</Metric>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-[hsl(var(--text-secondary))]">
                    Organized workspace collections
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-emerald-500">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">Total Sessions</Text>
                    <Metric className="tremor-metric-sm mt-2">{totalSessionsCount.toLocaleString()}</Metric>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-[hsl(var(--text-secondary))]">
                    Conversation threads tracked
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-purple-500">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">Total Messages</Text>
                    <Metric className="tremor-metric-sm mt-2">
                      {totalMessagesCount > 1000 ? `${(totalMessagesCount / 1000).toFixed(1)}K` : totalMessagesCount}
                    </Metric>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-[hsl(var(--text-secondary))]">
                    AI interactions processed
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-amber-500">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-tertiary))]">Active Today</Text>
                    <Metric className="tremor-metric-sm mt-2">{activeTodayCount}</Metric>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-lg">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-[hsl(var(--text-secondary))]">
                    Projects modified today
                  </Text>
                </div>
              </Card>
            </div>

            {/* Charts Section - Enterprise Design */}
            <div className="tremor-grid cols-2 mb-8">
              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <Title className="text-lg font-bold">Message Distribution</Title>
                    <Text className="text-sm">Breakdown by conversation role</Text>
                  </div>
                  <Badge color="blue" size="sm">Live</Badge>
                </div>
                <div className="tremor-chart">
                  <DonutChart
                    data={[
                      { name: 'User Messages', value: Math.floor(totalMessagesCount * 0.44) },
                      { name: 'Assistant Messages', value: Math.floor(totalMessagesCount * 0.47) },
                      { name: 'System Messages', value: Math.floor(totalMessagesCount * 0.09) }
                    ]}
                    category="value"
                    index="name"
                    colors={['blue', 'emerald', 'slate']}
                    className="h-48"
                    showLabel={true}
                    showAnimation={true}
                    variant="donut"
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-[hsl(var(--border))]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3b82f6'}}></div>
                      <Text className="text-xs text-[hsl(var(--text-tertiary))]">User</Text>
                    </div>
                    <Metric className="text-lg text-blue-600">{Math.floor(totalMessagesCount * 0.44).toLocaleString()}</Metric>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#10b981'}}></div>
                      <Text className="text-xs text-[hsl(var(--text-tertiary))]">Assistant</Text>
                    </div>
                    <Metric className="text-lg text-emerald-600">{Math.floor(totalMessagesCount * 0.47).toLocaleString()}</Metric>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#64748b'}}></div>
                      <Text className="text-xs text-[hsl(var(--text-tertiary))]">System</Text>
                    </div>
                    <Metric className="text-lg text-[hsl(var(--text-secondary))]">{Math.floor(totalMessagesCount * 0.09).toLocaleString()}</Metric>
                  </div>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <Title className="text-lg font-bold">Project Activity</Title>
                    <Text className="text-sm">Top 5 projects by engagement</Text>
                  </div>
                  <Badge color="emerald" size="sm">Updated</Badge>
                </div>
                {projectActivityData.length > 0 ? (
                  <div className="space-y-6">
                    {/* Sessions Chart */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Text className="font-semibold text-[hsl(var(--text-primary))]">Sessions by Project</Text>
                        <Badge color="blue" size="xs">Total: {projectActivityData.reduce((sum, p) => sum + p.sessions, 0)}</Badge>
                      </div>
                      <BarList
                        data={projectActivityData.map(p => ({
                          name: p.project,
                          value: p.sessions
                        }))}
                        color="blue"
                        showAnimation={true}
                      />
                    </div>

                    {/* Messages Chart */}
                    <div className="pt-4 border-t border-[hsl(var(--border))]">
                      <div className="flex items-center justify-between mb-3">
                        <Text className="font-semibold text-[hsl(var(--text-primary))]">Messages by Project</Text>
                        <Badge color="emerald" size="xs">Total: {projectActivityData.reduce((sum, p) => sum + p.messages, 0).toLocaleString()}</Badge>
                      </div>
                      <BarList
                        data={projectActivityData.map(p => ({
                          name: p.project,
                          value: p.messages
                        }))}
                        color="emerald"
                        showAnimation={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-[hsl(var(--background-secondary))] rounded-lg">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <Text className="text-[hsl(var(--text-tertiary))]">Loading project data...</Text>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Project List - Enterprise Design */}
            <Card className="tremor-card hover:shadow-xl transition-shadow duration-300">
              <div className="mb-6 flex items-center justify-between border-b border-[hsl(var(--border))] pb-4">
                <div>
                  <Title className="text-xl font-bold">All Projects</Title>
                  <Text className="text-sm">Select a project to view detailed analytics</Text>
                </div>
                <Badge color="indigo" size="lg">
                  {allProjects.length} Total
                </Badge>
              </div>
              {allProjects.length === 0 ? (
                <div className="text-center py-12 bg-[hsl(var(--background-secondary))] rounded-lg">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <Title className="text-[hsl(var(--text-secondary))] mb-2">No Projects Found</Title>
                  <Text className="text-[hsl(var(--text-tertiary))]">Start using Claude Code to create conversation projects</Text>
                </div>
              ) : (
                <div className="space-y-2">
                  {allProjects.slice(0, 10).map((project, index) => (
                    <div
                      key={project.id}
                      className="group flex items-center justify-between p-4 border border-[hsl(var(--border))] rounded-lg hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={() => navigate(`/tremor-preview/projects/${project.id}`)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text className="font-semibold text-[hsl(var(--text-primary))] truncate group-hover:text-indigo-600 transition-colors">
                            {project.name.replace('-mnt-c-laragon-www-', '').replace('-home-boss-', '')}
                          </Text>
                          <div className="flex items-center space-x-2 mt-1">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <Text className="text-xs text-[hsl(var(--text-tertiary))]">
                              Updated {formatDistanceToNow(new Date(project.lastModified), { addSuffix: true })}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                          <Text className="text-xs text-blue-600 font-medium">Sessions</Text>
                          <Metric className="text-base text-blue-700">{project.sessionCount || 0}</Metric>
                        </div>
                        <div className="text-center px-3 py-2 bg-emerald-50 rounded-lg">
                          <Text className="text-xs text-emerald-600 font-medium">Messages</Text>
                          <Metric className="text-base text-emerald-700">{project.messageCount || 0}</Metric>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  ))}
                  {allProjects.length > 10 && (
                    <div className="text-center pt-4 border-t border-[hsl(var(--border))] mt-4">
                      <Text className="text-sm text-[hsl(var(--text-tertiary))]">
                        Showing 10 of {allProjects.length} projects
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tremor-dashboard-page scrollable">
      <div className="flex" style={{height: 'calc(100vh - 120px)'}}>
        {/* Left Panel - Sessions with Tremor */}
        <div className={`${
          leftPanelCollapsed ? 'w-12' : 'w-80'
        } sidebar-panel transition-all duration-300 flex-shrink-0`}>
          {/* Panel Header */}
          <div className="panel-header">
            {!leftPanelCollapsed && (
              <Text className="font-semibold text-[hsl(var(--text-primary))]">Sessions</Text>
            )}
            <button
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="p-1 hover:bg-[hsl(var(--surface-hover))] rounded transition-colors"
            >
              <svg className="w-4 h-4 text-[hsl(var(--text-tertiary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {leftPanelCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>

          {/* Sessions Content with Tremor Cards */}
          <div className="panel-content">
            {!leftPanelCollapsed && (
              <div className="space-y-2">
                {sessions.map((session) => (
                    <div
                      key={session.sessionId}
                      className={`session-card ${
                        sessionId === session.sessionId ? 'active' : ''
                      }`}
                      onClick={() => handleSessionSelect(session.sessionId)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Text className="text-xs font-medium truncate">
                          {session.title || `Session ${session.sessionId.slice(0, 8)}...`}
                        </Text>
                        <Badge size="xs" color={sessionId === session.sessionId ? 'blue' : 'gray'} className="tremor-badge">
                          {session.messageCount}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Text className="text-xs text-secondary">
                          {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                        </Text>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            session.messageCount > 50 ? 'bg-emerald-400' :
                            session.messageCount > 20 ? 'bg-yellow-400' : 'bg-slate-400'
                          }`}></div>
                          <Text className="text-xs text-secondary">
                            {session.messageCount > 50 ? 'high' : session.messageCount > 20 ? 'med' : 'low'}
                          </Text>
                        </div>
                      </div>
                      
                      {sessionId === session.sessionId && (
                        <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]">
                          <Badge size="xs" color="blue" className="tremor-badge blue">
                            ● Active
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {sessionId ? (
              <ConversationThread
                projectId={projectId}
                sessionId={sessionId}
                highlightMessageId={highlightMessageId}
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-y-auto pb-20">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Title className="text-2xl font-bold text-[hsl(var(--text-primary))]">
                          Project Analytics Dashboard
                        </Title>
                        <Text className="mt-2 text-[hsl(var(--text-secondary))]">
                          Select a session from the sidebar to view detailed conversation analytics
                        </Text>
                        <Badge className="mt-2" color="indigo" size="md">
                          {projectId} Project
                        </Badge>
                      </div>
                      <div className="ml-4">
                        <ProjectExportButton
                          projectId={projectId}
                          projectName={allProjects.find(p => p.id === projectId)?.name || projectId}
                          variant="default"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-8">
                    <Card className="ring-1 ring-blue-200 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-blue-700 font-semibold">Total Sessions</Text>
                          <Metric className="text-3xl font-bold text-blue-800">{sessions.length}</Metric>
                          <ProgressBar value={(sessions.length / 50) * 100} className="mt-2" color="blue" />
                        </div>
                        <div className="p-3 bg-blue-200 rounded-xl">
                          <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      </Flex>
                    </Card>

                    <Card className="ring-1 ring-emerald-200 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-emerald-700 font-semibold">Total Messages</Text>
                          <Metric className="text-3xl font-bold text-emerald-800">
                            {sessions.reduce((acc, s) => acc + s.messageCount, 0).toLocaleString()}
                          </Metric>
                          <Text className="mt-1 text-emerald-600 font-medium">Across all sessions</Text>
                        </div>
                        <div className="p-3 bg-emerald-200 rounded-xl">
                          <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                      </Flex>
                    </Card>

                    <Card className="ring-1 ring-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-purple-700 font-semibold">Avg Messages/Session</Text>
                          <Metric className="text-3xl font-bold text-purple-800">
                            {Math.round(sessions.reduce((acc, s) => acc + s.messageCount, 0) / sessions.length || 0)}
                          </Metric>
                          <Badge className="mt-1" color="purple" size="sm">Per Session</Badge>
                        </div>
                        <div className="p-3 bg-purple-200 rounded-xl">
                          <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                      </Flex>
                    </Card>

                    {projectTokenStats?.tokens && projectTokenStats.tokens.messagesWithUsage > 0 && (
                      <>
                        <Card className="ring-1 ring-indigo-200 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-indigo-700 font-semibold">Total Tokens</Text>
                              <Metric className="text-3xl font-bold text-indigo-800">
                                {projectTokenStats.tokens.totalTokens > 1000000
                                  ? `${(projectTokenStats.tokens.totalTokens / 1000000).toFixed(1)}M`
                                  : projectTokenStats.tokens.totalTokens.toLocaleString()}
                              </Metric>
                              <Text className="mt-1 text-indigo-600 font-medium">
                                {projectTokenStats.tokens.totalInputTokens.toLocaleString()} in / {projectTokenStats.tokens.totalOutputTokens.toLocaleString()} out
                              </Text>
                            </div>
                            <div className="p-3 bg-indigo-200 rounded-xl">
                              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </Flex>
                        </Card>

                        <Card className="ring-1 ring-pink-200 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-pink-700 font-semibold">Cache Efficiency</Text>
                              <Metric className="text-3xl font-bold text-pink-800">
                                {projectTokenStats.tokens.cacheHitRate.toFixed(1)}%
                              </Metric>
                              <Text className="mt-1 text-pink-600 font-medium">
                                {projectTokenStats.tokens.totalCacheReadTokens.toLocaleString()} cache reads
                              </Text>
                            </div>
                            <div className="p-3 bg-pink-200 rounded-xl">
                              <svg className="w-6 h-6 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                          </Flex>
                          <ProgressBar value={Math.min(projectTokenStats.tokens.cacheHitRate, 100)} className="mt-2" color="pink" />
                        </Card>

                        <Card className="ring-1 ring-amber-200 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-amber-700 font-semibold">Sessions with Usage</Text>
                              <Metric className="text-3xl font-bold text-amber-800">
                                {projectTokenStats.tokens.sessionsWithUsage}
                              </Metric>
                              <Text className="mt-1 text-amber-600 font-medium">
                                {projectTokenStats.tokens.messagesWithUsage.toLocaleString()} messages tracked
                              </Text>
                            </div>
                            <div className="p-3 bg-amber-200 rounded-xl">
                              <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                          </Flex>
                        </Card>
                      </>
                    )}
                  </Grid>

                  <Grid numItems={1} numItemsLg={2} className="gap-6">
                    <Card className="shadow-lg">
                      <Title className="mb-4 text-xl font-bold text-[hsl(var(--text-primary))]">Top Sessions</Title>
                      <div className="space-y-3">
                        {sessions
                          .sort((a, b) => b.messageCount - a.messageCount)
                          .slice(0, 8)
                          .map((session, index) => (
                            <div key={session.sessionId} 
                                 className="flex justify-between items-center p-3 bg-[hsl(var(--background-secondary))] rounded-lg hover:bg-[hsl(var(--surface-hover))] transition-colors">
                              <div className="flex items-center space-x-3">
                                <Badge className="flex-shrink-0" color="blue" size="xs">
                                  #{index + 1}
                                </Badge>
                                <div>
                                  <Text className="font-medium text-[hsl(var(--text-primary))] truncate max-w-xs">
                                    {session.title || `Session ${session.sessionId.slice(0, 8)}...`}
                                  </Text>
                                  <Text className="text-xs text-[hsl(var(--text-tertiary))]">
                                    {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                                  </Text>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge color="emerald" size="sm">{session.messageCount}</Badge>
                                <Text className="text-xs text-[hsl(var(--text-tertiary))]">msgs</Text>
                              </div>
                            </div>
                          ))}
                      </div>
                    </Card>
                    
                    <Card className="shadow-lg">
                      <Title className="mb-4 text-xl font-bold text-[hsl(var(--text-primary))]">Session Activity</Title>
                      <BarChart
                        className="h-64"
                        data={sessions
                          .sort((a, b) => b.messageCount - a.messageCount)
                          .slice(0, 10)
                          .map((session, index) => ({
                            name: `Session ${index + 1}`,
                            messages: session.messageCount,
                            session: session.title?.slice(0, 15) || session.sessionId.slice(0, 8)
                          }))}
                        index="name"
                        categories={['messages']}
                        colors={['emerald']}
                        yAxisWidth={48}
                        showAnimation={true}
                      />
                    </Card>
                  </Grid>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel - Analytics with Tremor */}
          {sessionId && (
            <div className={`${
              rightPanelCollapsed ? 'w-12' : 'w-80'
            } sidebar-panel transition-all duration-300 flex-shrink-0 border-l border-[hsl(var(--border))]`}>
              <div className="panel-header">
                <button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className="p-1 hover:bg-[hsl(var(--surface-hover))] rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-[hsl(var(--text-tertiary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {rightPanelCollapsed ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                </button>
                {!rightPanelCollapsed && (
                  <Text className="font-semibold text-[hsl(var(--text-primary))]">Analytics</Text>
                )}
              </div>

              {!rightPanelCollapsed && (
                <div className="panel-content space-y-4">
                    {/* Session Management Section */}
                    <div className="tremor-card">
                      <Title className="text-lg mb-3">Session Management</Title>
                      <SessionMetadataControls
                        projectId={projectId}
                        sessionId={sessionId}
                        currentTitle={currentSession?.title || sessionId}
                      />
                    </div>

                    <div className="tremor-card">
                      <Title className="text-lg">Message Overview</Title>
                      <div className="space-y-4 mt-4">
                        <div className="flex justify-between items-center">
                          <Text className="text-secondary">Total Messages</Text>
                          <Metric className="tremor-metric-sm">{totalMessages}</Metric>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <Text className="text-xs">User Messages</Text>
                            </div>
                            <Badge className="tremor-badge blue">{userMessages}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                              <Text className="text-xs">Assistant Messages</Text>
                            </div>
                            <Badge className="tremor-badge emerald">{assistantMessages}</Badge>
                          </div>
                          
                          {systemMessages > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-[hsl(var(--background-secondary))]0 rounded-full"></div>
                                <Text className="text-xs">System Messages</Text>
                              </div>
                              <Badge className="tremor-badge gray">{systemMessages}</Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4">
                          <Text className="text-sm text-secondary mb-2">Distribution</Text>
                          <div className="tremor-chart">
                            <DonutChart
                              className="h-32"
                              data={messageDistribution}
                              category="Messages"
                              index="name"
                              colors={['blue', 'emerald', 'slate']}
                              showLabel={false}
                              showAnimation={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tremor-card">
                      <Title className="text-lg">Session Details</Title>
                      <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center">
                          <Text className="text-secondary">Template</Text>
                          <Badge className="tremor-badge blue">
                            {currentSession?.template || 'unknown'}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <Text className="text-secondary">Created</Text>
                          <Text className="text-sm">
                            {currentSession?.createdAt ? new Date(currentSession.createdAt).toLocaleDateString() : 'Unknown'}
                          </Text>
                        </div>

                        <div className="flex justify-between items-center">
                          <Text className="text-secondary">Last Updated</Text>
                          <Text className="text-sm text-emerald-600">
                            {currentSession?.lastUpdatedAt ? formatDistanceToNow(new Date(currentSession.lastUpdatedAt), { addSuffix: true }) : 'Unknown'}
                          </Text>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                          <Text className="text-secondary mb-2">Activity Level</Text>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-secondary">Engagement</span>
                            <span className="text-primary">
                              {totalMessages > 50 ? 'High' : totalMessages > 20 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                          <div className="tremor-progress-bar">
                            <div
                              className={`progress-fill ${totalMessages > 50 ? 'emerald' : totalMessages > 20 ? 'blue' : 'red'}`}
                              style={{ width: `${Math.min((totalMessages / 100) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Token Usage Card */}
                    {sessionData?.stats?.tokens && sessionData.stats.tokens.messagesWithUsage > 0 && (
                      <div className="tremor-card">
                        <Title className="text-lg">Token Usage</Title>
                        <div className="space-y-3 mt-4">
                          <div className="flex justify-between items-center">
                            <Text className="text-secondary">Total Tokens</Text>
                            <Metric className="tremor-metric-sm">{sessionData.stats.tokens.totalTokens.toLocaleString()}</Metric>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <Text className="text-xs">Input</Text>
                              </div>
                              <Badge className="tremor-badge blue">{sessionData.stats.tokens.totalInputTokens.toLocaleString()}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                <Text className="text-xs">Output</Text>
                              </div>
                              <Badge className="tremor-badge emerald">{sessionData.stats.tokens.totalOutputTokens.toLocaleString()}</Badge>
                            </div>

                            {sessionData.stats.tokens.totalCacheCreationTokens > 0 && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                  <Text className="text-xs">Cache Creation</Text>
                                </div>
                                <Badge className="tremor-badge amber">{sessionData.stats.tokens.totalCacheCreationTokens.toLocaleString()}</Badge>
                              </div>
                            )}

                            {sessionData.stats.tokens.totalCacheReadTokens > 0 && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                  <Text className="text-xs">Cache Reads</Text>
                                </div>
                                <Badge className="tremor-badge purple">{sessionData.stats.tokens.totalCacheReadTokens.toLocaleString()}</Badge>
                              </div>
                            )}
                          </div>

                          {(sessionData.stats.tokens.totalCacheCreationTokens > 0 || sessionData.stats.tokens.totalCacheReadTokens > 0) && (
                            <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                              <Text className="text-secondary mb-2">Cache Efficiency</Text>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-secondary">Hit Rate</span>
                                <span className="text-primary font-semibold">{sessionData.stats.tokens.cacheHitRate.toFixed(2)}%</span>
                              </div>
                              <div className="tremor-progress-bar">
                                <div
                                  className="progress-fill indigo"
                                  style={{ width: `${Math.min(sessionData.stats.tokens.cacheHitRate, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default TremorProjectView