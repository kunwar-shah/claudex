import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, FileText, BarChart3, Settings, Menu } from 'lucide-react'
import { projectsApi } from '../services/api'
import ProjectComboBox from './ProjectComboBox'
import { Button } from './ui/button'

const Header = () => {
  const [selectedProject, setSelectedProject] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  return (
    <header className="sticky top-0 z-sticky bg-background border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-fast">
          <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-text-primary leading-tight">
              Claudex
            </h1>
            <p className="text-xs text-text-secondary leading-tight">
              Professional Conversation Viewer
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/search">
            <Button variant="ghost" size="sm" className="gap-2">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </Link>

          <Link to="/manage-sessions">
            <Button variant="ghost" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              <span>Manage</span>
            </Button>
          </Link>

          <Link to="/tremor-preview">
            <Button variant="ghost" size="sm" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-border mx-2" />

          <ProjectComboBox
            projects={projectsData?.projects || []}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />

          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="w-4 h-4" />
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <nav className="flex flex-col p-4 space-y-2">
            <Link to="/search" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </Link>

            <Link to="/manage-sessions" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <FileText className="w-4 h-4" />
                <span>Manage Sessions</span>
              </Button>
            </Link>

            <Link to="/tremor-preview" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics Dashboard</span>
              </Button>
            </Link>

            <div className="pt-2 border-t border-border">
              <ProjectComboBox
                projects={projectsData?.projects || []}
                selectedProject={selectedProject}
                onProjectSelect={setSelectedProject}
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default Header