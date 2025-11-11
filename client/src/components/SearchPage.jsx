import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import {
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  Tag
} from 'lucide-react'
import { projectsApi, searchApi, sessionMetadataApi } from '../services/api'
import ClaudeMessageRenderer from './ClaudeMessageRenderer'
import RebuildIndexModal from './RebuildIndexModal'
import IndexStatusCard from './IndexStatusCard'
import IndexStatusBadge from './IndexStatusBadge'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { H1, Muted, Small } from './ui/typography'
import EmptyState from './layout/EmptyState'
import { cn } from '@/lib/utils'

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [filters, setFilters] = useState({
    role: '',
    from: '',
    to: '',
    template: '',
    tag: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')
  const [showRebuildModal, setShowRebuildModal] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  const { data: indexStatus } = useQuery({
    queryKey: ['indexStatus'],
    queryFn: () => searchApi.getIndexStatus().then(res => res.data)
  })

  // Fetch all tags across all projects or selected project
  const { data: tagsData } = useQuery({
    queryKey: ['all-tags', selectedProject?.id],
    queryFn: () => {
      if (selectedProject) {
        return sessionMetadataApi.getAllTags(selectedProject.id).then(res => res.data)
      }
      // If no project selected, we could fetch tags from all projects
      // For now, return empty to avoid errors
      return Promise.resolve({ tags: [] })
    },
    enabled: !!selectedProject
  })

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const searchParams = {
        q: searchQuery,
        ...filters,
        ...(selectedProject && { projectId: selectedProject.id })
      }
      
      const response = await searchApi.search(searchParams)
      setSearchResults(response.data?.hits || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    setFilters({ role: '', from: '', to: '', template: '', tag: '' })
  }

  const handleResultClick = async (result) => {
    setIsLoadingMessage(true)
    setShowModal(true)
    
    try {
      const response = await projectsApi.getMessage(result.projectId, result.sessionId, result.messageId)
      setSelectedMessage({ ...response.data.message, searchQuery })
    } catch (error) {
      console.error('Failed to load message:', error)
      setSelectedMessage({ error: 'Failed to load full message content' })
    } finally {
      setIsLoadingMessage(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedMessage(null)
    setCopySuccess('')
  }

  const highlightSearchText = (text, query) => {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi')
    return text.split(regex).map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    )
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess('Message copied to clipboard!')
      setTimeout(() => setCopySuccess(''), 3000)
    } catch (err) {
      console.error('Failed to copy message:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopySuccess('Message copied to clipboard!')
        setTimeout(() => setCopySuccess(''), 3000)
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr)
        setCopySuccess('Failed to copy message')
        setTimeout(() => setCopySuccess(''), 3000)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Search Header */}
      <div className="border-b border-border bg-surface p-3">
        <div className="max-w-6xl mx-auto">
          <H1 className="text-lg mb-2">Search Conversations</H1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search Input */}
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search across all conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Project Selector */}
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = (projectsData?.projects || []).find(p => p.id === e.target.value)
                  setSelectedProject(project || null)
                }}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">All Projects</option>
                {(projectsData?.projects || []).map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Filter Toggle */}
              <Button
                type="button"
                variant={showFilters ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                title="Advanced filters"
              >
                <Filter className="w-4 h-4" />
              </Button>

              {/* Search Button */}
              <Button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>

              {/* Clear Button */}
              {hasSearched && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="bg-surface/50">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">Role</label>
                      <select
                        value={filters.role}
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="assistant">Assistant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Tag
                      </label>
                      <select
                        value={filters.tag}
                        onChange={(e) => handleFilterChange('tag', e.target.value)}
                        className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                        disabled={!selectedProject}
                      >
                        <option value="">All Tags</option>
                        {(tagsData?.tags || []).map(tag => (
                          <option key={tag.tag} value={tag.tag}>
                            {tag.tag} ({tag.count})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">From Date</label>
                      <Input
                        type="date"
                        value={filters.from}
                        onChange={(e) => handleFilterChange('from', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">To Date</label>
                      <Input
                        type="date"
                        value={filters.to}
                        onChange={(e) => handleFilterChange('to', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-primary mb-1">Template</label>
                      <select
                        value={filters.template}
                        onChange={(e) => handleFilterChange('template', e.target.value)}
                        className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="">All Templates</option>
                        <option value="claude-code-v3">Claude Code v3 (Universal)</option>
                        <option value="claude-code-v2-mixed">Claude Code v2 Mixed</option>
                        <option value="claude-code-v1">Claude Code v1</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-6xl mx-auto">
          {isSearching && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <Muted>Searching conversations...</Muted>
            </div>
          )}

          {!isSearching && hasSearched && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Small className="font-semibold">
                    Search Results {searchResults.length > 0 && `(${searchResults.length} found)`}
                  </Small>
                  <IndexStatusBadge />
                </div>
                {searchQuery && (
                  <Muted className="text-xs">
                    Searching for: "<span className="font-medium">{searchQuery}</span>"
                    {selectedProject && ` in ${selectedProject.name}`}
                  </Muted>
                )}
              </div>

              {searchResults.length === 0 ? (
                <EmptyState
                  icon={AlertCircle}
                  title="No results found"
                  description="Try adjusting your search terms or filters"
                />
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, index) => {
                    const conversationUrl = `/projects/${result.projectId}/sessions/${result.sessionId}${result.messageId ? `?highlight=${result.messageId}` : ''}`

                    return (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={result.role === 'user' ? 'default' : 'secondary'}>
                                {result.role}
                              </Badge>
                              <Muted className="text-xs">
                                {result.sessionTitle || result.sessionId}
                              </Muted>
                              <Muted className="text-xs">
                                {result.timestamp && formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                              </Muted>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Muted className="text-xs">
                                {result.projectName}
                              </Muted>
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-7"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <a
                                  href={conversationUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in new tab with highlight"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </div>
                        
                          <div
                            onClick={() => handleResultClick(result)}
                            className="block cursor-pointer mb-3"
                          >
                            <Muted className="text-sm hover:text-text-primary transition-colors line-clamp-4">
                              {result.snippet || result.content || result.excerpt || 'No content preview'}
                            </Muted>
                          </div>

                          {result.matchContext && (
                            <Card className="bg-warning/5 border-warning/20 mb-2">
                              <CardContent className="p-2">
                                <Muted className="text-xs">
                                  <strong>Match context:</strong> {result.matchContext}
                                </Muted>
                              </CardContent>
                            </Card>
                          )}

                          {(result.score || result.line) && (
                            <div className="flex items-center justify-between">
                              {result.score && <Muted className="text-xs">Relevance: {result.score}</Muted>}
                              {result.line && <Muted className="text-xs">Line: {result.line}</Muted>}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <Small className="font-semibold mb-2 block">Search Your Conversations</Small>
              <Muted className="text-sm mb-6 max-w-md mx-auto block">
                Enter keywords to search across all your Claude conversations.
              </Muted>

              <IndexStatusCard onRebuildClick={() => setShowRebuildModal(true)} />
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Small className="font-semibold">Full Message Content</Small>
              <div className="flex items-center gap-2">
                {selectedMessage && !selectedMessage.error && (
                  <Button
                    onClick={() => copyToClipboard(selectedMessage.content || selectedMessage.text || selectedMessage.snippet || '')}
                    variant={copySuccess ? "outline" : "ghost"}
                    size="sm"
                    className={cn(
                      copySuccess && "text-success bg-success/10 border-success/20"
                    )}
                    title="Copy message to clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={closeModal}
                  variant="ghost"
                  size="icon"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Copy Success Message */}
            {copySuccess && (
              <div className="px-4 py-2 bg-success/10 border-b border-success/20">
                <div className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-success" />
                  <Muted className="text-sm text-success">{copySuccess}</Muted>
                </div>
              </div>
            )}

            <CardContent className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingMessage ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
                  <Muted>Loading full message...</Muted>
                </div>
              ) : selectedMessage?.error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-error mx-auto mb-2" />
                  <Muted className="text-error">{selectedMessage.error}</Muted>
                </div>
              ) : selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedMessage.role === 'user' ? 'default' : 'secondary'}>
                      {selectedMessage.role}
                    </Badge>
                    {selectedMessage.timestamp && (
                      <Muted className="text-xs">
                        {formatDistanceToNow(new Date(selectedMessage.timestamp), { addSuffix: true })}
                      </Muted>
                    )}
                  </div>

                  <div className="prose prose-sm max-w-none">
                    {selectedMessage.content || selectedMessage.text ? (
                      <ClaudeMessageRenderer
                        message={selectedMessage}
                      />
                    ) : selectedMessage.snippet ? (
                      <div className="whitespace-pre-wrap">
                        {highlightSearchText(selectedMessage.snippet, selectedMessage.searchQuery)}
                      </div>
                    ) : (
                      <Muted>No content available</Muted>
                    )}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rebuild Index Modal */}
      <RebuildIndexModal
        isOpen={showRebuildModal}
        onClose={() => setShowRebuildModal(false)}
        currentStats={indexStatus?.stats}
      />
    </div>
  )
}

export default SearchPage