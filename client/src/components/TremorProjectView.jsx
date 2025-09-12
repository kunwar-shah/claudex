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
  Badge,
  Flex,
  ProgressBar
} from '@tremor/react'
import { formatDistanceToNow } from 'date-fns'
import ConversationThread from './ConversationThread'
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
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                A comprehensive view of your Claude Code conversations and analytics.
              </p>
            </div>

            {/* KPI Cards with exact Tremor styling */}
            <div className="tremor-grid cols-4 mb-8">
              <Card className="tremor-card">
                <Flex alignItems="start">
                  <div>
                    <Text>Total Projects</Text>
                    <Metric className="tremor-metric-sm">{totalProjectsCount}</Metric>
                  </div>
                </Flex>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge size="xs" color="emerald" className="tremor-badge emerald">
                    +12.3%
                  </Badge>
                  <Text className="text-xs text-secondary">vs. last quarter</Text>
                </div>
              </Card>

              <Card className="tremor-card">
                <Flex alignItems="start">
                  <div>
                    <Text>Total Sessions</Text>
                    <Metric className="tremor-metric-sm">{totalSessionsCount.toLocaleString()}</Metric>
                  </div>
                </Flex>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge size="xs" color="emerald" className="tremor-badge emerald">
                    +5.4%
                  </Badge>
                  <Text className="text-xs text-secondary">vs. last quarter</Text>
                </div>
              </Card>

              <Card className="tremor-card">
                <Flex alignItems="start">
                  <div>
                    <Text>Total Messages</Text>
                    <Metric className="tremor-metric-sm">
                      {totalMessagesCount > 1000 ? `${(totalMessagesCount / 1000).toFixed(1)}K` : totalMessagesCount}
                    </Metric>
                  </div>
                </Flex>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge size="xs" color="emerald" className="tremor-badge emerald">
                    +8.7%
                  </Badge>
                  <Text className="text-xs text-secondary">vs. last quarter</Text>
                </div>
              </Card>

              <Card className="tremor-card">
                <Flex alignItems="start">
                  <div>
                    <Text>Active Today</Text>
                    <Metric className="tremor-metric-sm">{activeTodayCount}</Metric>
                  </div>
                </Flex>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge size="xs" color="emerald" className="tremor-badge emerald">
                    +2.1%
                  </Badge>
                  <Text className="text-xs text-secondary">vs. yesterday</Text>
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="tremor-grid cols-2 mb-8">
              <Card className="tremor-card">
                <div className="mb-6">
                  <Title>Message Distribution</Title>
                  <Text>Breakdown by message type</Text>
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
                    className="h-40"
                    showLabel={false}
                    showAnimation={false}
                  />
                </div>
              </Card>

              <Card className="tremor-card">
                <div className="mb-6">
                  <Title>Project Activity</Title>
                  <Text>Sessions and messages by project</Text>
                </div>
                <div className="tremor-chart">
                  {projectActivityData.length > 0 ? (
                    <BarChart
                      data={projectActivityData}
                      index="project"
                      categories={['sessions', 'messages']}
                      colors={['blue', 'emerald']}
                      className="h-40"
                      yAxisWidth={60}
                      showAnimation={false}
                      showLegend={true}
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center">
                      <Text>Loading project data...</Text>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Project List */}
            <Card className="tremor-card">
              <div className="mb-6">
                <Title>All Projects</Title>
                <Text>Select a project to view detailed analytics</Text>
              </div>
              <div className="space-y-3">
                {allProjects.slice(0, 10).map((project, index) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge size="xs" color="gray" className="tremor-badge gray">
                        {index + 1}
                      </Badge>
                      <div>
                        <Text className="font-medium">
                          {project.name.replace('-mnt-c-laragon-www-', '').replace('-home-boss-', '')}
                        </Text>
                        <Text className="text-xs text-secondary">
                          Last updated {formatDistanceToNow(new Date(project.lastModified), { addSuffix: true })}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <Text className="text-xs text-secondary">Sessions</Text>
                        <Metric className="text-sm">{project.sessionCount || 0}</Metric>
                      </div>
                      <div className="text-right">
                        <Text className="text-xs text-secondary">Messages</Text>
                        <Metric className="text-sm">{project.messageCount || 0}</Metric>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tremor-dashboard-page scrollable">
      <div className="flex h-screen">
        {/* Left Panel - Sessions with Tremor */}
        <div className={`${
          leftPanelCollapsed ? 'w-12' : 'w-80'
        } sidebar-panel transition-all duration-300 flex-shrink-0`}>
          <div className="h-screen flex flex-col">
            {/* Toggle Button */}
            <div className="panel-header">
              {!leftPanelCollapsed && (
                <Text className="font-semibold text-gray-900">Sessions</Text>
              )}
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <div className="mt-2 pt-2 border-t border-gray-200">
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
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex">
          <div className="flex-1 main-content">
            {sessionId ? (
              <ConversationThread 
                projectId={projectId} 
                sessionId={sessionId}
                highlightMessageId={highlightMessageId}
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                  <div className="mb-6">
                    <Title className="text-2xl font-bold text-slate-800">
                      Project Analytics Dashboard
                    </Title>
                    <Text className="mt-2 text-slate-600">
                      Select a session from the sidebar to view detailed conversation analytics
                    </Text>
                    <Badge className="mt-2" color="indigo" size="md">
                      {projectId} Project
                    </Badge>
                  </div>
                  
                  <Grid numItems={1} numItemsSm={2} numItemsLg={4} className="gap-6 mb-8">
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
                    
                    <Card className="ring-1 ring-amber-200 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
                      <Flex alignItems="center" justifyContent="between">
                        <div>
                          <Text className="text-amber-700 font-semibold">Most Active</Text>
                          <Metric className="text-3xl font-bold text-amber-800">
                            {sessions.length > 0 ? Math.max(...sessions.map(s => s.messageCount)) : 0}
                          </Metric>
                          <Text className="mt-1 text-amber-600 font-medium">Messages in top session</Text>
                        </div>
                        <div className="p-3 bg-amber-200 rounded-xl">
                          <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </Flex>
                    </Card>
                  </Grid>

                  <Grid numItems={1} numItemsLg={2} className="gap-6">
                    <Card className="shadow-lg">
                      <Title className="mb-4 text-xl font-bold text-slate-800">Top Sessions</Title>
                      <div className="space-y-3">
                        {sessions
                          .sort((a, b) => b.messageCount - a.messageCount)
                          .slice(0, 8)
                          .map((session, index) => (
                            <div key={session.sessionId} 
                                 className="flex justify-between items-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <Badge className="flex-shrink-0" color="blue" size="xs">
                                  #{index + 1}
                                </Badge>
                                <div>
                                  <Text className="font-medium text-slate-700 truncate max-w-xs">
                                    {session.title || `Session ${session.sessionId.slice(0, 8)}...`}
                                  </Text>
                                  <Text className="text-xs text-slate-500">
                                    {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
                                  </Text>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge color="emerald" size="sm">{session.messageCount}</Badge>
                                <Text className="text-xs text-slate-500">msgs</Text>
                              </div>
                            </div>
                          ))}
                      </div>
                    </Card>
                    
                    <Card className="shadow-lg">
                      <Title className="mb-4 text-xl font-bold text-slate-800">Session Activity</Title>
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
            } sidebar-panel transition-all duration-300 flex-shrink-0`}>
              <div className="h-screen flex flex-col">
                <div className="panel-header">
                  <button
                    onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {rightPanelCollapsed ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      )}
                    </svg>
                  </button>
                  {!rightPanelCollapsed && (
                    <Text className="font-semibold text-gray-900">Analytics</Text>
                  )}
                </div>
                
                {!rightPanelCollapsed && (
                  <div className="panel-content space-y-4">
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
                                <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
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
                        
                        <div className="mt-4 pt-3 border-t border-gray-200">
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
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default TremorProjectView