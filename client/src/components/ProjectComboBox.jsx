import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
    ? "w-full flex items-center justify-between bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 px-4 py-3 rounded-lg text-base font-medium text-gray-800 border-2 border-blue-300 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
    : "flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700 border border-gray-300"

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
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate">
                {selectedProject ? selectedProject.name : 'Select Project'}
              </span>
            </div>
            <svg className={`w-5 h-5 text-blue-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <span>
              {selectedProject ? selectedProject.name : 'Select Project'}
            </span>
            <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <>
          {isLarge && (
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          )}

          <div className={isLarge
            ? "absolute top-full left-0 right-0 mt-2 bg-white shadow-2xl border-2 border-blue-200 rounded-lg z-20 overflow-hidden"
            : "absolute top-full right-0 w-56 mt-1 bg-white shadow-lg border border-gray-200 rounded z-10 overflow-hidden"
          }>
            <div className={isLarge ? "py-2 max-h-80 overflow-y-auto" : "py-1 max-h-48 overflow-y-auto"}>
              {projects.length === 0 ? (
                <div className={isLarge ? "px-4 py-6 text-center text-gray-500" : "px-2 py-1 text-center text-gray-500"}>
                  {isLarge ? (
                    <>
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
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
                      ? `w-full text-left px-4 py-3 text-sm hover:bg-blue-50 flex justify-between items-center transition-colors ${
                          selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`
                      : `w-full text-left px-2 py-1 text-xs hover:bg-gray-50 flex justify-between items-center transition-colors ${
                          selectedProject?.id === project.id ? 'bg-gray-50' : ''
                        }`
                    }
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={isLarge ? "font-semibold text-gray-900 truncate" : "font-medium text-gray-900 truncate text-xs"}>
                        {project.name}
                      </div>
                      <div className={isLarge ? "text-xs text-gray-500 mt-1" : "text-xs text-gray-500"}>
                        {isLarge && 'Last modified: '}{new Date(project.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedProject?.id === project.id && (
                      <svg className={isLarge ? "w-5 h-5 text-blue-600 ml-2 flex-shrink-0" : "w-3 h-3 text-blue-600 ml-2 flex-shrink-0"} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
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