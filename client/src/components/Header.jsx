import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, FileText, BarChart3, Settings, Menu } from 'lucide-react'
import { projectsApi } from '../services/api'
import ProjectComboBox from './ProjectComboBox'
import { Button } from './ui/button'
import SettingsModal from './SettingsModal'

const Header = () => {
  const [selectedProject, setSelectedProject] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  return (
    <header className="sticky top-0 z-sticky bg-primary-header border-b border-primary-light shadow-lg">
      <div className="flex items-center justify-between px-6 py-2 max-w-7xl mx-auto">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity duration-fast">
          <div className="flex items-center justify-center w-11 h-11 bg-[hsl(var(--surface))] rounded-xl shadow-lg hover:shadow-xl transition-all">
            <span className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary-hover))] bg-clip-text text-transparent font-black text-xl tracking-tighter">Cx</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold text-white leading-none tracking-tight drop-shadow-sm">
              Claudex
            </h1>
            <p className="text-[11px] text-primary-light leading-none font-medium mt-0.5">
              Analyze Your Claude Conversations
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/search">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-[hsl(var(--surface))]/20 hover:text-white">
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Button>
          </Link>

          <Link to="/manage-sessions">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-[hsl(var(--surface))]/20 hover:text-white">
              <FileText className="w-4 h-4" />
              <span>Manage</span>
            </Button>
          </Link>

          <Link to="/tremor-preview">
            <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-[hsl(var(--surface))]/20 hover:text-white">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </Button>
          </Link>

          <div className="h-6 w-px bg-[hsl(var(--surface))]/30 mx-2" />

          <ProjectComboBox
            projects={projectsData?.projects || []}
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />

          <Button
            variant="ghost"
            size="icon"
            title="Settings"
            className="text-white hover:bg-[hsl(var(--surface))]/20 hover:text-white"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </nav>

        {/* Settings Modal */}
        <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-white hover:bg-[hsl(var(--surface))]/20"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/30 bg-[hsl(var(--primary-hover))]">
          <nav className="flex flex-col p-4 space-y-2">
            <Link to="/search" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-white hover:bg-[hsl(var(--surface))]/20">
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </Link>

            <Link to="/manage-sessions" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-white hover:bg-[hsl(var(--surface))]/20">
                <FileText className="w-4 h-4" />
                <span>Manage Sessions</span>
              </Button>
            </Link>

            <Link to="/tremor-preview" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-white hover:bg-[hsl(var(--surface))]/20">
                <BarChart3 className="w-4 h-4" />
                <span>Analytics Dashboard</span>
              </Button>
            </Link>

            <div className="pt-2 border-t border-white/30">
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