import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Folder, ChevronDown, Check } from 'lucide-react'

const ProjectComboBox = ({ projects, selectedProject, onProjectSelect, size = 'small' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleProjectSelect = (project) => {
    onProjectSelect(project)
    setIsOpen(false)

    // Determine navigation path based on current route
    if (location.pathname.startsWith('/tremor-preview')) {
      navigate(`/tremor-preview/projects/${project.id}`)
    } else if (location.pathname.startsWith('/manage-sessions')) {
      navigate(`/manage-sessions/${project.id}`)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }

  // Define styles based on size
  const isLarge = size === 'large'

  const buttonStyles = isLarge
    ? "w-full flex items-center justify-between bg-surface hover:bg-surface/80 px-4 py-3 rounded-lg text-base font-medium text-text-primary border-2 border-primary hover:border-primary/80 transition-all shadow-sm hover:shadow-md"
    : "flex items-center space-x-1 bg-surface hover:bg-surface/80 px-2 py-1 rounded text-xs font-medium text-text-secondary border border-border"

  const iconSize = isLarge ? "w-5 h-5" : "w-3 h-3"
  const dropdownWidth = isLarge ? "left-0 right-0" : "right-0 w-56"

  return (
    <div className="relative">
      <button
        className={buttonStyles}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isLarge ? (
          <>
            <div className="flex items-center gap-3">
              <Folder className="w-5 h-5 text-primary" />
              <span className="truncate">
                {selectedProject ? selectedProject.name : 'Select Project'}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        ) : (
          <>
            <span>
              {selectedProject ? selectedProject.name : 'Select Project'}
            </span>
            <ChevronDown className={iconSize} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {isLarge && (
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          )}

          <div className={isLarge
            ? "absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl border-2 border-primary/20 rounded-lg z-20 overflow-hidden"
            : "absolute top-full right-0 w-56 mt-1 bg-white shadow-lg border border-border rounded z-10 overflow-hidden"
          }>
            <div className={isLarge ? "py-2 max-h-80 overflow-y-auto" : "py-1 max-h-48 overflow-y-auto"}>
              {projects.length === 0 ? (
                <div className={isLarge ? "px-4 py-6 text-center text-muted-foreground" : "px-2 py-1 text-center text-muted-foreground"}>
                  {isLarge ? (
                    <>
                      <Folder className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium">No projects found</p>
                      <p className="text-xs mt-1">Check your ~/.claude/projects folder</p>
                    </>
                  ) : (
                    <span className="text-xs">No projects found</span>
                  )}
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.id}
                    className={isLarge
                      ? `w-full text-left px-4 py-3 text-sm hover:bg-primary/5 flex justify-between items-center transition-colors ${
                          selectedProject?.id === project.id ? 'bg-primary/5 border-l-4 border-primary' : ''
                        }`
                      : `w-full text-left px-2 py-1 text-xs hover:bg-surface flex justify-between items-center transition-colors ${
                          selectedProject?.id === project.id ? 'bg-surface' : ''
                        }`
                    }
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={isLarge ? "font-semibold text-text-primary truncate" : "font-medium text-text-primary truncate text-xs"}>
                        {project.name}
                      </div>
                      <div className={isLarge ? "text-xs text-muted-foreground mt-1" : "text-xs text-muted-foreground"}>
                        {isLarge && 'Last modified: '}{new Date(project.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedProject?.id === project.id && (
                      <Check className={isLarge ? "w-5 h-5 text-primary ml-2 flex-shrink-0" : "w-3 h-3 text-primary ml-2 flex-shrink-0"} />
                    )}
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