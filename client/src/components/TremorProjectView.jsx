import React, { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  MessageSquare,
  Folder,
  Zap,
  Clock,
  ChevronRight,
  ChevronLeft,
  Activity
} from 'lucide-react'
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
            <div className="mb-8 -mx-8 px-8 py-8 bg-surface border-2 border-border rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold text-text-primary">Analytics Dashboard</h1>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary max-w-2xl">
                    Comprehensive insights into your Claude Code conversations, projects, and usage patterns.
                  </p>
                </div>
                <Badge size="lg" color="indigo">
                  <Zap className="w-4 h-4 mr-1" />
                  Live Data
                </Badge>
              </div>
            </div>

            {/* KPI Cards - Enterprise Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-primary">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Projects</Text>
                    <Metric className="tremor-metric-sm mt-2">{totalProjectsCount}</Metric>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Folder className="w-6 h-6 text-primary" />
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-text-secondary">
                    Organized workspace collections
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-success">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Sessions</Text>
                    <Metric className="tremor-metric-sm mt-2">{totalSessionsCount.toLocaleString()}</Metric>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-success" />
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-text-secondary">
                    Conversation threads tracked
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-accent">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total Messages</Text>
                    <Metric className="tremor-metric-sm mt-2">
                      {totalMessagesCount > 1000 ? `${(totalMessagesCount / 1000).toFixed(1)}K` : totalMessagesCount}
                    </Metric>
                  </div>
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-accent" />
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-text-secondary">
                    AI interactions processed
                  </Text>
                </div>
              </Card>

              <Card className="tremor-card hover:shadow-xl transition-shadow duration-300 border-l-4 border-l-warning">
                <Flex alignItems="start" justifyContent="between">
                  <div>
                    <Text className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Active Today</Text>
                    <Metric className="tremor-metric-sm mt-2">{activeTodayCount}</Metric>
                  </div>
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <Zap className="w-6 h-6 text-warning" />
                  </div>
                </Flex>
                <div className="mt-4">
                  <Text className="text-xs text-text-secondary">
                    Projects modified today
                  </Text>
                </div>
              </Card>
            </div>

            {/* Charts Section - Enterprise Design */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3b82f6'}}></div>
                      <Text className="text-xs text-text-secondary">User</Text>
                    </div>
                    <Metric className="text-lg text-primary">{Math.floor(totalMessagesCount * 0.44).toLocaleString()}</Metric>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#10b981'}}></div>
                      <Text className="text-xs text-text-secondary">Assistant</Text>
                    </div>
                    <Metric className="text-lg text-success">{Math.floor(totalMessagesCount * 0.47).toLocaleString()}</Metric>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#64748b'}}></div>
                      <Text className="text-xs text-text-secondary">System</Text>
                    </div>
                    <Metric className="text-lg text-text-secondary">{Math.floor(totalMessagesCount * 0.09).toLocaleString()}</Metric>
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
                        <Text className="font-semibold text-gray-700">Sessions by Project</Text>
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
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-3">
                        <Text className="font-semibold text-gray-700">Messages by Project</Text>
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
                  <div className="flex h-48 items-center justify-center bg-surface rounded-lg">
                    <div className="text-center">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <Text className="text-text-secondary">Loading project data...</Text>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Project List - Enterprise Design */}
            <Card className="tremor-card hover:shadow-xl transition-shadow duration-300">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div>
                  <Title className="text-xl font-bold">All Projects</Title>
                  <Text className="text-sm">Select a project to view detailed analytics</Text>
                </div>
                <Badge color="indigo" size="lg">
                  {allProjects.length} Total
                </Badge>
              </div>
              {allProjects.length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-lg">
                  <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <Title className="text-text-secondary mb-2">No Projects Found</Title>
                  <Text className="text-text-secondary">Start using Claude Code to create conversation projects</Text>
                </div>
              ) : (
                <div className="space-y-2">
                  {allProjects.slice(0, 10).map((project, index) => (
                    <div
                      key={project.id}
                      className="group flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-200 hover:shadow-md"
                      onClick={() => navigate(`/tremor-preview/projects/${project.id}`)}
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Text className="font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                            {project.name.replace('-mnt-c-laragon-www-', '').replace('-home-boss-', '')}
                          </Text>
                          <div className="flex items-center space-x-2 mt-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <Text className="text-xs text-text-secondary">
                              Updated {formatDistanceToNow(new Date(project.lastModified), { addSuffix: true })}
                            </Text>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center px-3 py-2 bg-primary/5 rounded-lg">
                          <Text className="text-xs text-primary font-medium">Sessions</Text>
                          <Metric className="text-base text-primary">{project.sessionCount || 0}</Metric>
                        </div>
                        <div className="text-center px-3 py-2 bg-success/10 rounded-lg">
                          <Text className="text-xs text-success font-medium">Messages</Text>
                          <Metric className="text-base text-success">{project.messageCount || 0}</Metric>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  ))}
                  {allProjects.length > 10 && (
                    <div className="text-center pt-4 border-t border-border mt-4">
                      <Text className="text-sm text-text-secondary">
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
              <Text className="font-semibold text-text-primary">Sessions</Text>
            )}
            <button
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="p-1 hover:bg-surface rounded transition-colors"
            >
              {leftPanelCollapsed ? (
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              )}
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
                            session.messageCount > 50 ? 'bg-success' :
                            session.messageCount > 20 ? 'bg-warning' : 'bg-muted-foreground'
                          }`}></div>
                          <Text className="text-xs text-secondary">
                            {session.messageCount > 50 ? 'high' : session.messageCount > 20 ? 'med' : 'low'}
                          </Text>
                        </div>
                      </div>
                      
                      {sessionId === session.sessionId && (
                        <div className="mt-2 pt-2 border-t border-border">
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
              <div className="h-full bg-background p-4 overflow-y-auto pb-20">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-8">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Title className="text-2xl font-bold text-text-primary">
                            Project Analytics Dashboard
                          </Title>
                          <Badge color="blue" size="sm" className="flex-shrink-0 text-white font-semibold">
                            Live
                          </Badge>
                        </div>
                        <Text className="text-text-secondary">
                          Select a session from the sidebar to view detailed conversation analytics
                        </Text>
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
                  
                  {/* KPI Cards Grid - 3 columns on large screens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card className="ring-1 ring-primary/20 shadow-md hover:shadow-lg bg-primary/5 transition-all duration-300">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">Total Sessions</Text>
                          <Metric className="text-3xl font-bold text-primary mb-3">{sessions.length}</Metric>
                          <ProgressBar value={(sessions.length / 50) * 100} className="mt-2" color="blue" />
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                          <MessageSquare className="w-7 h-7 text-primary" />
                        </div>
                      </Flex>
                    </Card>

                    <Card className="ring-1 ring-success/20 shadow-md hover:shadow-lg bg-success/5 transition-all duration-300">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-xs font-semibold uppercase tracking-wider text-success/70 mb-2">Total Messages</Text>
                          <Metric className="text-3xl font-bold text-success mb-1">
                            {sessions.reduce((acc, s) => acc + s.messageCount, 0).toLocaleString()}
                          </Metric>
                          <Badge color="emerald" size="xs" className="mt-2 text-white font-medium">Across all sessions</Badge>
                        </div>
                        <div className="p-3 bg-success/10 rounded-xl border border-success/20">
                          <MessageSquare className="w-7 h-7 text-success" />
                        </div>
                      </Flex>
                    </Card>

                    <Card className="ring-1 ring-accent/20 shadow-md hover:shadow-lg bg-accent/5 transition-all duration-300">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-xs font-semibold uppercase tracking-wider text-accent/70 mb-2">Avg Messages/Session</Text>
                          <Metric className="text-3xl font-bold text-accent mb-1">
                            {Math.round(sessions.reduce((acc, s) => acc + s.messageCount, 0) / sessions.length || 0)}
                          </Metric>
                          <Badge color="purple" size="xs" className="mt-2 text-white font-medium">Per Session</Badge>
                        </div>
                        <div className="p-3 bg-accent/10 rounded-xl border border-accent/20">
                          <BarChart3 className="w-7 h-7 text-accent" />
                        </div>
                      </Flex>
                    </Card>

                    {projectTokenStats?.tokens && projectTokenStats.tokens.messagesWithUsage > 0 && (
                      <>
                        <Card className="ring-1 ring-primary/20 shadow-md hover:shadow-lg bg-primary/5 transition-all duration-300">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-2">Total Tokens</Text>
                              <Metric className="text-3xl font-bold text-primary mb-1">
                                {projectTokenStats.tokens.totalTokens > 1000000
                                  ? `${(projectTokenStats.tokens.totalTokens / 1000000).toFixed(1)}M`
                                  : projectTokenStats.tokens.totalTokens.toLocaleString()}
                              </Metric>
                              <Badge color="blue" size="xs" className="mt-2 text-white font-medium">
                                {projectTokenStats.tokens.totalInputTokens.toLocaleString()} in / {projectTokenStats.tokens.totalOutputTokens.toLocaleString()} out
                              </Badge>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                              <Activity className="w-7 h-7 text-primary" />
                            </div>
                          </Flex>
                        </Card>

                        <Card className="ring-1 ring-success/20 shadow-md hover:shadow-lg bg-success/5 transition-all duration-300">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-xs font-semibold uppercase tracking-wider text-success/70 mb-2">Cache Efficiency</Text>
                              <Metric className="text-3xl font-bold text-success mb-3">
                                {projectTokenStats.tokens.cacheHitRate.toFixed(1)}%
                              </Metric>
                              <ProgressBar value={Math.min(projectTokenStats.tokens.cacheHitRate, 100)} className="mt-2" color="emerald" />
                              <Badge color="emerald" size="xs" className="mt-3 text-white font-medium">
                                {projectTokenStats.tokens.totalCacheReadTokens.toLocaleString()} cache reads
                              </Badge>
                            </div>
                            <div className="p-3 bg-success/10 rounded-xl border border-success/20">
                              <Zap className="w-7 h-7 text-success" />
                            </div>
                          </Flex>
                        </Card>

                        <Card className="ring-1 ring-warning/20 shadow-md hover:shadow-lg bg-warning/5 transition-all duration-300">
                          <Flex alignItems="center" justifyContent="between">
                            <div>
                              <Text className="text-xs font-semibold uppercase tracking-wider text-warning/70 mb-2">Sessions with Usage</Text>
                              <Metric className="text-3xl font-bold text-warning mb-1">
                                {projectTokenStats.tokens.sessionsWithUsage}
                              </Metric>
                              <Badge color="amber" size="xs" className="mt-2 text-white font-medium">
                                {projectTokenStats.tokens.messagesWithUsage.toLocaleString()} messages tracked
                              </Badge>
                            </div>
                            <div className="p-3 bg-warning/10 rounded-xl border border-warning/20">
                              <BarChart3 className="w-7 h-7 text-warning" />
                            </div>
                          </Flex>
                        </Card>
                      </>
                    )}
                  </div>

                  {/* Charts Section - 2 columns on large screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                        <Title className="text-xl font-bold text-text-primary">Top Sessions</Title>
                        <Badge color="blue" size="sm" className="text-white font-semibold">Top 8</Badge>
                      </div>
                      <div className="space-y-3">
                        {sessions
                          .sort((a, b) => b.messageCount - a.messageCount)
                          .slice(0, 8)
                          .map((session, index) => (
                            <div key={session.sessionId}
                                 className="flex justify-between items-center p-3 bg-surface rounded-lg hover:bg-primary/5 transition-colors">
                              <div className="flex items-center space-x-3">
                                <Badge className="flex-shrink-0" color="blue" size="xs">
                                  #{index + 1}
                                </Badge>
                                <div>
                                  <Text className="font-medium text-text-primary truncate max-w-xs">
                                    {session.title || `Session ${session.sessionId.slice(0, 8)}...`}
                                  </Text>
                                  <Text className="text-xs text-text-secondary">
                                    {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                                  </Text>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge color="emerald" size="sm">{session.messageCount}</Badge>
                                <Text className="text-xs text-text-secondary">msgs</Text>
                              </div>
                            </div>
                          ))}
                      </div>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                        <Title className="text-xl font-bold text-text-primary">Session Activity</Title>
                        <Badge color="emerald" size="sm" className="text-white font-semibold">Top 10</Badge>
                      </div>
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
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel - Analytics with Tremor */}
          {sessionId && (
            <div className={`${
              rightPanelCollapsed ? 'w-12' : 'w-80'
            } sidebar-panel transition-all duration-300 flex-shrink-0 border-l border-border`}>
              <div className="panel-header">
                <button
                  onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                  className="p-1 hover:bg-surface rounded transition-colors"
                >
                  {rightPanelCollapsed ? (
                    <ChevronLeft className="w-4 h-4 text-text-secondary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  )}
                </button>
                {!rightPanelCollapsed && (
                  <Text className="font-semibold text-text-primary">Analytics</Text>
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
                              <div className="w-3 h-3 bg-primary/50 rounded-full"></div>
                              <Text className="text-xs">User Messages</Text>
                            </div>
                            <Badge className="tremor-badge blue">{userMessages}</Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 bg-success/100 rounded-full"></div>
                              <Text className="text-xs">Assistant Messages</Text>
                            </div>
                            <Badge className="tremor-badge emerald">{assistantMessages}</Badge>
                          </div>
                          
                          {systemMessages > 0 && (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-surface0 rounded-full"></div>
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
                          <Text className="text-sm text-success">
                            {currentSession?.lastUpdatedAt ? formatDistanceToNow(new Date(currentSession.lastUpdatedAt), { addSuffix: true }) : 'Unknown'}
                          </Text>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border">
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
                                <div className="w-3 h-3 bg-primary/50 rounded-full"></div>
                                <Text className="text-xs">Input</Text>
                              </div>
                              <Badge className="tremor-badge blue">{sessionData.stats.tokens.totalInputTokens.toLocaleString()}</Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-success/100 rounded-full"></div>
                                <Text className="text-xs">Output</Text>
                              </div>
                              <Badge className="tremor-badge emerald">{sessionData.stats.tokens.totalOutputTokens.toLocaleString()}</Badge>
                            </div>

                            {sessionData.stats.tokens.totalCacheCreationTokens > 0 && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-warning/100 rounded-full"></div>
                                  <Text className="text-xs">Cache Creation</Text>
                                </div>
                                <Badge className="tremor-badge amber">{sessionData.stats.tokens.totalCacheCreationTokens.toLocaleString()}</Badge>
                              </div>
                            )}

                            {sessionData.stats.tokens.totalCacheReadTokens > 0 && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 bg-accent/100 rounded-full"></div>
                                  <Text className="text-xs">Cache Reads</Text>
                                </div>
                                <Badge className="tremor-badge purple">{sessionData.stats.tokens.totalCacheReadTokens.toLocaleString()}</Badge>
                              </div>
                            )}
                          </div>

                          {(sessionData.stats.tokens.totalCacheCreationTokens > 0 || sessionData.stats.tokens.totalCacheReadTokens > 0) && (
                            <div className="mt-4 pt-3 border-t border-border">
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