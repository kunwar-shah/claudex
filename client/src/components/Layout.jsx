import React, { useState, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

const Layout = () => {
  const navigate = useNavigate()
  const [helpOpen, setHelpOpen] = useState(false)

  // Focus the first visible search input on the page (if any)
  const focusSearch = useCallback(() => {
    const search = document.querySelector(
      'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]'
    )
    if (search) search.focus()
  }, [])

  // Esc closes help; consumers can also listen on their own
  const handleEscape = useCallback(() => {
    if (helpOpen) setHelpOpen(false)
  }, [helpOpen])

  useKeyboardShortcuts({
    onShowHelp:       () => setHelpOpen(true),
    onFocusSearch:    focusSearch,
    onEscape:         handleEscape,
    onCommandPalette: () => {/* TODO: Cmd+K palette */},
    onOpenSettings:   () => {/* Settings is owned by Header — would need lift state */},
    onGoSearch:       () => navigate('/search'),
    onGoManage:       () => navigate('/manage-sessions'),
    onGoAnalytics:    () => navigate('/tremor-preview'),
  })

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <Footer />

      {/* Keyboard shortcuts overlay (triggered by ?) */}
      <KeyboardShortcutsHelp isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default Layout
