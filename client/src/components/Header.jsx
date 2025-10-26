import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { projectsApi } from '../services/api'
import ProjectComboBox from './ProjectComboBox'

const Header = () => {
  const [selectedProject, setSelectedProject] = useState(null)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  return (
    <header className="bg-gradient-to-r from-slate-50 to-blue-50 shadow-sm border-b border-slate-200 px-3 py-1">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-sm font-bold text-slate-800 leading-tight">
            Claudex - A Friendly Viewer
          </h1>
          <p className="text-xs text-slate-500 leading-tight">
            Browse and explore your Claude conversations
          </p>
        </Link>
        
        <div className="flex items-center space-x-2">
          <Link 
            to="/search"
            className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Search conversations"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search</span>
          </Link>
          
          <Link
            to="/tremor-preview"
            className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="Analytics Dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Dashboard</span>
          </Link>
          
          <ProjectComboBox
            projects={projectsData?.projects || []}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
          
          <button 
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header