import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi, searchApi } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import ClaudeMessageRenderer from './ClaudeMessageRenderer'

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
    template: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState('')

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
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
    setFilters({ role: '', from: '', to: '', template: '' })
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
    <div className="h-full flex flex-col bg-slate-50">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 p-3">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg font-bold text-slate-800 mb-3">Search Conversations</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex items-center space-x-2 flex-wrap">
              {/* Search Input */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search across all conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Project Selector */}
              <div className="relative">
                <select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = (projectsData?.projects || []).find(p => p.id === e.target.value)
                    setSelectedProject(project || null)
                  }}
                  className="px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {(projectsData?.projects || []).map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${showFilters ? 'text-blue-600 bg-blue-50' : ''}`}
                title="Advanced filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>

              {/* Search Button */}
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>

              {/* Clear Button */}
              {hasSearched && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                    <select
                      value={filters.role}
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={filters.from}
                      onChange={(e) => handleFilterChange('from', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={filters.to}
                      onChange={(e) => handleFilterChange('to', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Template</label>
                    <select
                      value={filters.template}
                      onChange={(e) => handleFilterChange('template', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                    >
                      <option value="">All Templates</option>
                      <option value="claude-code-v3">Claude Code v3 (Universal)</option>
                      <option value="claude-code-v2-mixed">Claude Code v2 Mixed</option>
                      <option value="claude-code-v1">Claude Code v1</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-6xl mx-auto">
          {isSearching && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-slate-600 text-sm">Searching conversations...</p>
            </div>
          )}

          {!isSearching && hasSearched && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                  Search Results {searchResults.length > 0 && `(${searchResults.length} found)`}
                </h2>
                {searchQuery && (
                  <p className="text-xs text-slate-500">
                    Searching for: "<span className="font-medium">{searchQuery}</span>"
                    {selectedProject && ` in ${selectedProject.name}`}
                  </p>
                )}
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.137 0-4.146-.832-5.657-2.343m0 0L3.172 9.485a.75.75 0 011.06-1.06L7.515 11.7M3.172 9.485A7.962 7.962 0 0115 4c1.346 0 2.62.332 3.728.925" />
                  </svg>
                  <h3 className="text-slate-600 font-medium mb-1">No results found</h3>
                  <p className="text-slate-500 text-sm">Try adjusting your search terms or filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, index) => {
                    const getRoleClasses = (role) => {
                      if (role === 'user') return 'bg-blue-100 text-blue-800'
                      if (role === 'assistant') return 'bg-emerald-100 text-emerald-800'
                      return 'bg-slate-100 text-slate-800'
                    }

                    const conversationUrl = `/projects/${result.projectId}/sessions/${result.sessionId}${result.messageId ? `?highlight=${result.messageId}` : ''}`

                    return (
                      <div key={index} className="bg-white border border-slate-200 rounded p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleClasses(result.role)}`}>
                              {result.role}
                            </span>
                            <span className="text-xs text-slate-500">
                              {result.sessionTitle || result.sessionId}
                            </span>
                            <span className="text-xs text-slate-400">
                              {result.timestamp && formatDistanceToNow(new Date(result.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-400">
                              {result.projectName}
                            </span>
                            <a 
                              href={conversationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Open in new tab with highlight"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Open
                            </a>
                          </div>
                        </div>
                        
                        <div
                          onClick={() => handleResultClick(result)}
                          className="block cursor-pointer"
                        >
                          <div className="text-sm text-slate-700 hover:text-slate-900 transition-colors line-clamp-4">
                            {result.snippet || result.content || result.excerpt || 'No content preview'}
                          </div>
                        </div>

                        {result.matchContext && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                              <strong>Match context:</strong> {result.matchContext}
                            </p>
                          </div>
                        )}

                        {(result.score || result.line) && (
                          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                            {result.score && <span>Relevance: {result.score}</span>}
                            {result.line && <span>Line: {result.line}</span>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {!hasSearched && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-slate-800 font-semibold mb-2">Search Your Conversations</h2>
              <p className="text-slate-600 text-sm mb-4 max-w-md mx-auto">
                Enter keywords to search across all your Claude conversations. Use filters to narrow down your results.
              </p>
              <div className="text-xs text-slate-500 space-y-1">
                <p><strong>Tips:</strong></p>
                <p>• Search by specific terms, phrases, or code snippets</p>
                <p>• Use filters to search by role, date range, or template</p>
                <p>• Select a specific project to limit your search scope</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Full Message Content
              </h3>
              <div className="flex items-center space-x-2">
                {selectedMessage && !selectedMessage.error && (
                  <button
                    onClick={() => copyToClipboard(selectedMessage.content || selectedMessage.text || selectedMessage.snippet || '')}
                    className={`inline-flex items-center px-3 py-1.5 text-sm rounded transition-colors ${
                      copySuccess 
                        ? 'text-green-600 bg-green-50 border border-green-200' 
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                    title="Copy message to clipboard"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-slate-100 rounded transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Copy Success Message */}
            {copySuccess && (
              <div className="px-4 py-2 bg-green-50 border-b border-green-200">
                <div className="flex items-center text-sm text-green-800">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {copySuccess}
                </div>
              </div>
            )}
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingMessage ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3"></div>
                  <span className="text-slate-600">Loading full message...</span>
                </div>
              ) : selectedMessage?.error ? (
                <div className="text-red-600 text-center py-8">
                  <p>{selectedMessage.error}</p>
                </div>
              ) : selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      selectedMessage.role === 'user' ? 'bg-blue-100 text-blue-800' :
                      selectedMessage.role === 'assistant' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {selectedMessage.role}
                    </span>
                    {selectedMessage.timestamp && (
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(selectedMessage.timestamp), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="prose prose-sm max-w-none">
                    {selectedMessage.content || selectedMessage.text ? (
                      <ClaudeMessageRenderer
                        message={selectedMessage}
                      />
                    ) : selectedMessage.snippet ? (
                      <div className="whitespace-pre-wrap text-slate-700">
                        {highlightSearchText(selectedMessage.snippet, selectedMessage.searchQuery)}
                      </div>
                    ) : (
                      <div className="text-slate-500">No content available</div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPage