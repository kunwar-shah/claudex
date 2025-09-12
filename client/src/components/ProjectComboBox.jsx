import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const ProjectComboBox = ({ projects, selectedProject, onProjectSelect }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleProjectSelect = (project) => {
    onProjectSelect(project)
    setIsOpen(false)
    
    // Determine navigation path based on current route
    if (location.pathname.startsWith('/tremor-preview')) {
      navigate(`/tremor-preview/projects/${project.id}`)
    } else {
      navigate(`/projects/${project.id}`)
    }
  }

  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700 border border-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedProject ? selectedProject.name : 'Select Project'}
        </span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white shadow-lg border border-gray-200 rounded z-10">
          <div className="py-1 max-h-48 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="px-2 py-1 text-xs text-gray-500">
                No projects found
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full text-left px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 flex justify-between items-center"
                  onClick={() => handleProjectSelect(project)}
                >
                  <div>
                    <div className="font-medium text-xs">{project.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(project.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedProject?.id === project.id && (
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProjectComboBox