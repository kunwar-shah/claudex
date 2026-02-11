import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronsUpDown, Check, FolderOpen, Loader2 } from 'lucide-react'

const ProjectComboBox = ({ projects, selectedProject, onProjectSelect, size = 'small', isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const searchInputRef = useRef(null)

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter projects based on search query
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProjectSelect = (project) => {
    onProjectSelect(project)
    setIsOpen(false)
    setSearchQuery('')

    // Determine navigation path based on current route
    if (location.pathname.startsWith('/tremor-preview')) {
      navigate(`/tremor-preview/projects/${project.id}`)
    } else if (location.pathname.startsWith('/manage-sessions')) {
      navigate(`/manage-sessions/${project.id}`)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }

  const handleDropdownToggle = () => {
    if (isOpen) {
      setSearchQuery('')
    }
    setIsOpen(!isOpen)
  }

  // Define styles based on size
  const isLarge = size === 'large'

  // Shadcn-style minimal button (outline variant)
  const buttonStyles = isLarge
    ? "w-full flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-[hsl(var(--surface))] hover:bg-surface text-text-primary transition-colors"
    : "flex items-center justify-between px-3 py-2 text-sm border border-border rounded-md bg-[hsl(var(--surface))] hover:bg-surface text-text-primary transition-colors w-[200px]"

  const iconSize = isLarge ? "w-4 h-4" : "w-4 h-4"

  return (
    <div className="relative">
      <button
        className={buttonStyles}
        onClick={handleDropdownToggle}
        role="combobox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isLoading ? (
            <Loader2 className={`${iconSize} flex-shrink-0 text-muted-foreground animate-spin`} />
          ) : (
            <FolderOpen className={`${iconSize} flex-shrink-0 ${selectedProject ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <span className="truncate" style={{ fontVariant: 'small-caps', letterSpacing: '0.05em' }}>
            {isLoading ? 'Loading projects...' : selectedProject ? selectedProject.name : 'Select project...'}
          </span>
        </div>
        <ChevronsUpDown className={`${iconSize} ml-2 opacity-50 flex-shrink-0`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-[5]"
            onClick={() => {
              setIsOpen(false)
              setSearchQuery('')
            }}
          />

          <div className={isLarge
            ? "absolute top-full left-0 right-0 mt-2 bg-[hsl(var(--surface))] shadow-md border border-border rounded-md z-20 p-0"
            : "absolute top-full right-0 w-[200px] mt-1 bg-[hsl(var(--surface))] shadow-md border border-border rounded-md z-20 p-0"
          }>
            {/* Search Input - Shadcn minimal style */}
            <div className="p-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search project..."
                className="w-full px-3 py-2 text-sm border-0 focus:outline-none h-9"
              />
            </div>

            {/* Project List - Shadcn minimal style */}
            <div className="max-h-60 overflow-y-auto p-1">
              {isLoading ? (
                <div className="py-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading projects...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No project found.' : 'No projects available.'}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    className="relative w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm hover:bg-surface cursor-pointer transition-colors"
                    onClick={() => handleProjectSelect(project)}
                  >
                    <span className="truncate" style={{ fontVariant: 'small-caps', letterSpacing: '0.05em' }}>
                      {project.name}
                    </span>
                    <Check
                      className={`w-4 h-4 ml-auto flex-shrink-0 ${
                        selectedProject?.id === project.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ProjectComboBox