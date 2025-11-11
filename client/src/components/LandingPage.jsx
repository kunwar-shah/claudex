import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, FolderOpen, FileText, Search, TrendingUp, Zap, BarChart3, ArrowRight, Activity, Clock, Users, Sparkles } from 'lucide-react'
import { searchApi, projectsApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Button } from './ui/button'

const LandingPage = () => {
  const [animatedStats, setAnimatedStats] = useState({
    messages: 0,
    projects: 0,
    sessions: 0
  })

  // Fetch index status for real stats
  const { data: indexStatus } = useQuery({
    queryKey: ['indexStatus'],
    queryFn: () => searchApi.getIndexStatus().then(res => res.data)
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  const stats = indexStatus?.stats || {}
  const targetStats = {
    messages: stats.total_messages || 0,
    projects: stats.total_projects || 0,
    sessions: stats.total_sessions || 0
  }

  // Animated counter effect
  useEffect(() => {
    if (targetStats.messages === 0) return

    const duration = 1200 // 1.2 seconds (faster)
    const steps = 40
    const interval = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        messages: Math.floor(targetStats.messages * progress),
        projects: Math.floor(targetStats.projects * progress),
        sessions: Math.floor(targetStats.sessions * progress)
      })

      if (currentStep >= steps) {
        setAnimatedStats(targetStats)
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [targetStats.messages, targetStats.projects, targetStats.sessions])

  const features = [
    {
      icon: Search,
      title: 'Full-Text Search',
      description: 'Lightning-fast FTS5 search across all conversations with advanced filtering',
      color: 'text-[hsl(var(--primary))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Visualize conversation patterns, tool usage, and insights',
      color: 'text-[hsl(var(--primary))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    },
    {
      icon: FileText,
      title: 'Session Management',
      description: 'Organize, tag, and manage your Claude conversations efficiently',
      color: 'text-[hsl(var(--secondary))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    },
    {
      icon: Zap,
      title: 'Smart Indexing',
      description: 'Automatic indexing with intelligent template detection',
      color: 'text-[hsl(var(--secondary))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    },
    {
      icon: Activity,
      title: 'Real-Time Tracking',
      description: 'Monitor conversation activity and engagement metrics',
      color: 'text-[hsl(var(--info))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Extract key points and decisions from conversations',
      color: 'text-[hsl(var(--warning))]',
      bgColor: 'bg-[hsl(var(--primary-light))]'
    }
  ]

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--background))]">
      {/* SECTION 1: Hero + Stats */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        {/* Hero Section - Compact */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-block mb-2 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-[hsl(var(--surface))] rounded-xl p-4 shadow-lg">
              <MessageSquare className="w-12 h-12 text-[hsl(var(--primary))] mx-auto" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] mb-3 tracking-tight">
            Welcome to Claudex
          </h1>
          <p className="text-lg text-[hsl(var(--text-secondary))] mb-6 max-w-2xl mx-auto">
            Universal conversation viewer for Claude Code with advanced analytics and intelligent search. Choose a session from the project dropdown in the header to view the project and conversations.
          </p>

          <div className="flex items-center justify-center gap-3 mb-10">
            <Link to="/search">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] hover:from-[hsl(var(--primary-hover))] hover:to-[hsl(var(--primary-dark))] shadow-lg hover:shadow-xl transition-all">
                <Search className="w-4 h-4" />
                <span>Start Searching</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
            <Link to="/manage-sessions">
              <Button size="sm" variant="outline" className="gap-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-light))]">
                <FileText className="w-4 h-4" />
                <span>Manage Sessions</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Animated Stats Cards - Compact */}
        {indexStatus?.isIndexed && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Messages', value: animatedStats.messages, icon: MessageSquare, color: 'primary', gradient: 'from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))]' },
              { label: 'Projects', value: animatedStats.projects, icon: FolderOpen, color: 'primary', gradient: 'from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))]' },
              { label: 'Sessions', value: animatedStats.sessions, icon: FileText, color: 'cyan', gradient: 'from-cyan-600 to-cyan-400' }
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  <TrendingUp className={`w-4 h-4 text-${stat.color}-500 animate-bounce`} />
                </div>
                <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${stat.gradient} mb-1`}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-xs text-[hsl(var(--text-secondary))] font-medium uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Features Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-center mb-6 text-[hsl(var(--text-primary))]">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 ${feature.bgColor} rounded-lg mb-3`}>
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <h3 className="text-base font-bold text-[hsl(var(--text-primary))] mb-2">{feature.title}</h3>
              <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Dashboard Analytics Preview */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-3xl font-bold text-center mb-6 text-[hsl(var(--text-primary))]">
          Real-Time Analytics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Activity Chart Simulation */}
          <div className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[hsl(var(--primary))]" />
                Daily Activity
              </h3>
              <span className="text-xs text-[hsl(var(--text-tertiary))]">Last 7 days</span>
            </div>
            <div className="flex items-end justify-between h-24 gap-2">
              {[45, 62, 38, 71, 54, 68, 59].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] rounded-t animate-fade-in-up"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                ></div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-[hsl(var(--text-tertiary))]">Mon</span>
              <span className="text-xs text-[hsl(var(--text-tertiary))]">Sun</span>
            </div>
          </div>

          {/* Tool Usage Distribution */}
          <div className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[hsl(var(--secondary))]" />
                Tool Usage
              </h3>
              <span className="text-xs text-[hsl(var(--text-tertiary))]">This week</span>
            </div>
            <div className="space-y-2">
              {[
                { tool: 'Read', percentage: 85, color: 'bg-[hsl(var(--primary))]' },
                { tool: 'Edit', percentage: 68, color: 'bg-[hsl(var(--primary-hover))]' },
                { tool: 'Bash', percentage: 45, color: 'bg-[hsl(var(--secondary))]' },
                { tool: 'Write', percentage: 32, color: 'bg-[hsl(var(--info))]' }
              ].map((item, i) => (
                <div key={item.tool} className="animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex justify-between text-xs text-[hsl(var(--text-secondary))] mb-1">
                    <span className="font-medium">{item.tool}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-[hsl(var(--surface-hover))] rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-1000`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Response Time Metric */}
          <div className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[hsl(var(--info))]" />
                Avg Response Time
              </h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--info))] to-[hsl(var(--secondary))] mb-2 animate-fade-in">
                2.3s
              </div>
              <div className="flex items-center justify-center gap-1 text-sm text-[hsl(var(--primary))]">
                <TrendingUp className="w-4 h-4" />
                <span>15% faster</span>
              </div>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] flex items-center gap-2">
                <Users className="w-4 h-4 text-[hsl(var(--warning))]" />
                Active Sessions
              </h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--warning))] to-[hsl(var(--secondary))] mb-2 animate-fade-in">
                {animatedStats.sessions || 186}
              </div>
              <div className="text-xs text-[hsl(var(--text-tertiary))]">Total conversation threads</div>
            </div>
          </div>
        </div>

        {/* Conversation Preview */}
        <div className="bg-[hsl(var(--surface))] rounded-lg p-4 shadow-md">
          <h3 className="text-sm font-semibold text-[hsl(var(--text-primary))] mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[hsl(var(--primary))]" />
            Conversation Preview
          </h3>
          <div className="space-y-2">
            {[
              { role: 'user', text: 'Help me build a React component', delay: '0ms' },
              { role: 'assistant', text: "I'll help you create a beautiful component...", delay: '300ms' },
              { role: 'user', text: 'Can you add animations?', delay: '600ms' }
            ].map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                style={{ animationDelay: msg.delay }}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] text-white'
                      : 'bg-[hsl(var(--surface-hover))] text-[hsl(var(--text-primary))]'
                  }`}
                >
                  <div className="text-xs font-semibold mb-0.5 opacity-75">
                    {msg.role === 'user' ? 'You' : 'Claude'}
                  </div>
                  <div>{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Get Started - Bottom */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-6 text-[hsl(var(--text-primary))]">
          Get Started with Claudex
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Quick Start */}
          <div className="bg-[hsl(var(--surface))] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-3">Quick Start</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-4 leading-relaxed">
              Select a project from the header dropdown to browse your conversations. Use the search feature to find specific messages instantly.
            </p>
            <Link to="/search">
              <Button size="sm" className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] hover:from-[hsl(var(--primary-hover))] hover:to-[hsl(var(--primary-dark))]">
                Start Searching
              </Button>
            </Link>
          </div>

          {/* Card 2: Documentation */}
          <div className="bg-[hsl(var(--surface))] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-3">Documentation</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-4 leading-relaxed">
              Learn about advanced features, keyboard shortcuts, search syntax, and best practices for managing your Claude conversations.
            </p>
            <a
              href="https://kunwar-shah.github.io/claudex/"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button size="sm" variant="outline" className="w-full border-[hsl(var(--info))] text-[hsl(var(--info))] hover:bg-[hsl(var(--primary-light))]">
                View Docs
              </Button>
            </a>
          </div>

          {/* Card 3: Manage Sessions */}
          <div className="bg-[hsl(var(--surface))] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[hsl(var(--text-primary))] mb-3">Organize Sessions</h3>
            <p className="text-sm text-[hsl(var(--text-secondary))] mb-4 leading-relaxed">
              Rename conversations, add tags for easy filtering, hide completed sessions, and keep your workspace organized.
            </p>
            <Link to="/manage-sessions">
              <Button size="sm" variant="outline" className="w-full border-[hsl(var(--secondary))] text-[hsl(var(--secondary))] hover:bg-[hsl(var(--primary-light))]">
                Manage Sessions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
