import React, { useState, useEffect, useRef } from 'react'
import { X, Palette, Search, Eye, Settings as SettingsIcon, FolderOpen, Database } from 'lucide-react'
import { useSettings } from '../contexts/SettingsContext'
import { Button } from './ui/button'
import ConfirmationModal from './ConfirmationModal'

// All available themes with rich color metadata for the preview block.
// Each theme includes: primary, primaryDark, surface, text, textMuted, badge.
const THEMES = [
  { id: 'default', name: 'Default', primary: '#475569', primaryDark: '#334155', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#f1f5f9' },
  { id: 'emerald', name: 'Emerald', primary: '#10b981', primaryDark: '#059669', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#ecfdf5' },
  { id: 'green',   name: 'Green',   primary: '#16a34a', primaryDark: '#15803d', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#f0fdf4' },
  { id: 'blue',    name: 'Blue',    primary: '#2563eb', primaryDark: '#1d4ed8', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#eff6ff' },
  { id: 'purple',  name: 'Purple',  primary: '#9333ea', primaryDark: '#7e22ce', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#faf5ff' },
  { id: 'orange',  name: 'Orange',  primary: '#f97316', primaryDark: '#ea580c', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#fff7ed' },
  { id: 'red',     name: 'Red',     primary: '#ef4444', primaryDark: '#dc2626', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#fef2f2' },
  { id: 'rose',    name: 'Rose',    primary: '#fb7185', primaryDark: '#e11d48', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#fff1f2' },
  { id: 'yellow',  name: 'Yellow',  primary: '#eab308', primaryDark: '#ca8a04', surface: '#ffffff', text: '#0f172a', textMuted: '#64748b', badgeBg: '#fefce8' },
  { id: 'classic', name: 'Classic', primary: '#5B8DEF', primaryDark: '#3b6cd6', surface: '#FCFCFD', text: '#0f172a', textMuted: '#64748b', badgeBg: '#f0f5ff' },
]

// All visual settings that can be randomized
const RANDOMIZABLE_OPTIONS = {
  colorTheme:       THEMES.map(t => t.id),
  fontFamily:       ['inter', 'geist', 'roboto', 'poppins', 'montserrat', 'open-sans', 'lato', 'raleway', 'nunito', 'ubuntu', 'rubik', 'dm-sans', 'work-sans', 'space-grotesk', 'quicksand', 'karla', 'outfit', 'jakarta', 'manrope', 'lexend', 'archivo', 'system'],
  fontSize:         ['small', 'small-medium', 'medium', 'medium-large', 'large'],
  density:          ['compact', 'comfortable', 'spacious'],
  borderRadius:     ['sharp', 'rounded', 'extra-rounded'],
  conversationView: ['detailed', 'messaging'],
}

// Mini theme preview block — renders a small mock UI in the theme's colors.
// Replaces the global CSS swap on hover. Pure inline styles, no theme-context.
function ThemePreviewCard({ theme, isActive, isHovered, onClick, onHover, onLeave }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      aria-pressed={isActive}
      aria-label={`Theme: ${theme.name}${isActive ? ' (currently selected)' : ''}`}
      className={`group relative p-2 rounded-lg border-2 transition-all duration-200 text-left ${
        isActive
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-border hover:border-primary/40 hover:shadow-sm'
      } ${isHovered ? 'scale-[1.03]' : ''}`}
    >
      {/* Mini mockup of the theme — rendered with inline styles */}
      <div
        className="w-full h-14 rounded-md overflow-hidden flex flex-col mb-1.5 ring-1 ring-black/5"
        style={{ background: theme.surface }}
      >
        {/* Mock header bar with primary color */}
        <div
          className="h-3 flex items-center px-1.5 gap-0.5"
          style={{ background: theme.primary }}
        >
          <div className="w-1 h-1 rounded-full bg-white/70" />
          <div className="w-1 h-1 rounded-full bg-white/70" />
          <div className="w-1 h-1 rounded-full bg-white/70" />
        </div>
        {/* Mock body — text + button + badge */}
        <div className="flex-1 px-1.5 py-1 flex items-center gap-1">
          <div className="flex-1 space-y-0.5">
            <div className="h-1 rounded-full" style={{ background: theme.text, opacity: 0.7, width: '70%' }} />
            <div className="h-1 rounded-full" style={{ background: theme.textMuted, opacity: 0.5, width: '50%' }} />
          </div>
          <div
            className="rounded text-[5px] font-bold px-1 py-0.5 flex-shrink-0"
            style={{ background: theme.primary, color: '#fff' }}
          >
            BTN
          </div>
        </div>
      </div>
      {/* Theme name + active checkmark */}
      <div className="text-xs font-medium flex items-center justify-between gap-1">
        <span className="truncate">{theme.name}</span>
        {isActive && <span className="text-primary text-sm leading-none">✓</span>}
      </div>
    </button>
  )
}

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings, exportSettings } = useSettings()
  const [activeTab, setActiveTab] = useState('appearance')
  const [pendingChanges, setPendingChanges] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showReloadConfirm, setShowReloadConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Reset pending changes when modal reopens
  useEffect(() => {
    if (isOpen) {
      setPendingChanges({})
      setHasUnsavedChanges(false)
    }
  }, [isOpen])

  // Visual/cosmetic settings auto-apply instantly for live feedback (matches
  // modern apps like Linear, Notion). Data/operational settings still require
  // explicit Save & Apply because they trigger backend work or affect cost.
  const AUTO_APPLY_KEYS = new Set([
    'colorTheme',
    'themeMode',
    'fontFamily',
    'fontSize',
    'density',
    'borderRadius',
    'enableAnimations',
    'codeTheme',
    'conversationView',
    'showTimestamps',
    'showToolIcons',
    'messageGrouping',
    'markdownPreview',
    'highlightColor',
  ])

  // Update value:
  //   - Visual key → apply instantly via updateSettings (no Save button needed)
  //   - Data key   → stash in pendingChanges, require explicit Save & Apply
  const handleChange = (key, value) => {
    if (AUTO_APPLY_KEYS.has(key)) {
      updateSettings({ [key]: value })
      // Clean any stale pending entry for this key (in case it was set earlier
      // when the key wasn't in AUTO_APPLY_KEYS)
      if (pendingChanges.hasOwnProperty(key)) {
        setPendingChanges(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
        if (Object.keys(pendingChanges).length === 1) setHasUnsavedChanges(false)
      }
    } else {
      setPendingChanges(prev => ({ ...prev, [key]: value }))
      setHasUnsavedChanges(true)
    }
  }

  // Get current value (pending or saved)
  const getValue = (key) => {
    return pendingChanges.hasOwnProperty(key) ? pendingChanges[key] : settings[key]
  }

  // ─────────────────────────────────────────────────────────────────
  // Theme hover state — local only, drives the preview block animation
  // (no global CSS swap; the preview lives entirely inside each card).
  // ─────────────────────────────────────────────────────────────────
  const [hoveredTheme, setHoveredTheme] = useState(null)

  // ─────────────────────────────────────────────────────────────────
  // Randomize ALL visual settings at once.
  // Picks a different value than current for each randomizable key.
  // ─────────────────────────────────────────────────────────────────
  const pickDifferent = (current, options) => {
    if (!options || options.length <= 1) return current
    let pick = current
    let attempts = 0
    while (pick === current && attempts < 20) {
      pick = options[Math.floor(Math.random() * options.length)]
      attempts++
    }
    return pick
  }

  const handleRandomize = () => {
    const changes = {}
    for (const [key, options] of Object.entries(RANDOMIZABLE_OPTIONS)) {
      changes[key] = pickDifferent(getValue(key), options)
    }
    // All RANDOMIZABLE_OPTIONS keys are visual → apply instantly
    updateSettings(changes)
  }

  // Save changes for current section
  const handleSave = () => {
    if (Object.keys(pendingChanges).length > 0) {
      updateSettings(pendingChanges)
      setPendingChanges({})
      setHasUnsavedChanges(false)

      // Show modern reload confirmation dialog
      setShowReloadConfirm(true)
    }
  }

  // Handle reload confirmation
  const handleReloadConfirm = () => {
    window.location.reload()
  }

  // Discard pending changes
  const handleDiscard = () => {
    setPendingChanges({})
    setHasUnsavedChanges(false)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: Palette, available: true },
    { id: 'search', label: 'Search & Index', icon: Search, available: true },
    { id: 'sessions', label: 'Sessions', icon: FolderOpen, available: true },
    { id: 'display', label: 'Display', icon: Eye, available: true },
    { id: 'data', label: 'Data & Privacy', icon: Database, available: true },
    { id: 'advanced', label: 'Advanced', icon: SettingsIcon, available: true }
  ]

  return (
    <>
      {/* Settings Modal — full-screen on mobile, dialog on desktop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
        <div className="bg-[hsl(var(--surface))] sm:rounded-lg rounded-t-lg shadow-xl w-full max-w-3xl h-[95vh] sm:max-h-[90vh] sm:h-auto overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-[hsl(var(--text-primary))]">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            title="Close settings"
            className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Sidebar Tabs — horizontal scroll on mobile, vertical sidebar on desktop */}
          <div className="w-full sm:w-48 border-b sm:border-b-0 sm:border-r border-border bg-surface p-2 flex sm:block overflow-x-auto sm:overflow-x-visible flex-shrink-0">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => tab.available && setActiveTab(tab.id)}
                  disabled={!tab.available}
                  aria-label={`${tab.label} settings${!tab.available ? ' (coming soon)' : ''}`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`flex-shrink-0 sm:w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0 sm:mb-1 mr-1 sm:mr-0 relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : tab.available
                      ? 'text-text-secondary hover:bg-background hover:text-text-primary'
                      : 'text-text-tertiary opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-left">{tab.label}</span>
                  {!tab.available && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--border))] text-text-tertiary">
                      Soon
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Appearance Settings</h3>

                  {/* Color Theme Selector — preview block + Randomize all */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <label className="block text-sm font-medium text-text-primary">
                        Color Theme
                        <span className="ml-2 text-xs text-text-tertiary font-normal">
                          (each card shows a live preview)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRandomize}
                        title="Randomize ALL visual settings — theme, font, size, density, radius, view"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-dark rounded-md hover:shadow-md hover:scale-105 transition-all active:scale-95"
                      >
                        🎲 Surprise Me
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                      {THEMES.map(theme => (
                        <ThemePreviewCard
                          key={theme.id}
                          theme={theme}
                          isActive={getValue('colorTheme') === theme.id}
                          isHovered={hoveredTheme === theme.id}
                          onClick={() => handleChange('colorTheme', theme.id)}
                          onHover={() => setHoveredTheme(theme.id)}
                          onLeave={() => setHoveredTheme(null)}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      ✨ Visual settings apply instantly. Data settings (search, sessions) require <span className="font-semibold">Save &amp; Apply</span>.
                    </p>
                  </div>

                  {/* Theme Mode (Light/Dark) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Theme Mode
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('themeMode', 'light')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          getValue('themeMode') === 'light'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div className="font-medium text-sm">☀️ Light</div>
                      </button>
                      <button
                        onClick={() => handleChange('themeMode', 'dark')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          getValue('themeMode') === 'dark'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div className="font-medium text-sm">🌙 Dark</div>
                      </button>
                    </div>
                  </div>

                  {/* Conversation View Toggle */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Conversation View
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('conversationView', 'detailed')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          getValue("conversationView") === 'detailed'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div className="font-medium text-sm text-text-primary">Detailed View</div>
                        <div className="text-xs text-text-tertiary mt-1">
                          Show tools, results, and metadata
                        </div>
                      </button>
                      <button
                        onClick={() => handleChange('conversationView', 'messaging')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                          getValue("conversationView") === 'messaging'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div className="font-medium text-sm text-text-primary">Messaging View</div>
                        <div className="text-xs text-text-tertiary mt-1">
                          Clean chat bubbles (like landing page)
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Font Size */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Font Size
                    </label>
                    <select
                      value={getValue("fontSize")}
                      onChange={(e) => handleChange('fontSize', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium (Default)</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>

                  {/* Density */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Density
                    </label>
                    <select
                      value={getValue("density")}
                      onChange={(e) => handleChange('density', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable (Default)</option>
                      <option value="spacious">Spacious</option>
                    </select>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Control spacing throughout the interface
                    </p>
                  </div>

                  {/* Font Size */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Font Size
                    </label>
                    <select
                      value={getValue("fontSize")}
                      onChange={(e) => handleChange('fontSize', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="small">Small (14px)</option>
                      <option value="small-medium">Small-Medium (15px)</option>
                      <option value="medium">Medium (16px) - Default</option>
                      <option value="medium-large">Medium-Large (17px)</option>
                      <option value="large">Large (18px)</option>
                    </select>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Fine-tune text size for optimal readability
                    </p>
                  </div>

                  {/* Border Radius */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Border Radius
                    </label>
                    <select
                      value={getValue("borderRadius")}
                      onChange={(e) => handleChange('borderRadius', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="sharp">Sharp (No Radius)</option>
                      <option value="rounded">Rounded (Default)</option>
                      <option value="extra-rounded">Extra Rounded</option>
                    </select>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Control corner rounding of cards and components
                    </p>
                  </div>

                  {/* Font Family */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Font Family
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1 border border-border rounded-md bg-background">
                      {/* System & Framework */}
                      <button
                        onClick={() => handleChange('fontFamily', 'inter')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'inter'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }} className="font-preview font-semibold text-base mb-1">Inter</div>
                        <div className="text-xs text-text-tertiary">Default</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'geist')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'geist'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Geist' }} className="font-preview font-semibold text-base mb-1">Geist</div>
                        <div className="text-xs text-text-tertiary">shadcn/ui</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'system')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'system'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont' }} className="font-preview font-semibold text-base mb-1">System</div>
                        <div className="text-xs text-text-tertiary">Native</div>
                      </button>

                      {/* Most Popular */}
                      <button
                        onClick={() => handleChange('fontFamily', 'roboto')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'roboto'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Roboto' }} className="font-preview font-semibold text-base mb-1">Roboto</div>
                        <div className="text-xs text-text-tertiary">Popular</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'open-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'open-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Open Sans' }} className="font-preview font-semibold text-base mb-1">Open Sans</div>
                        <div className="text-xs text-text-tertiary">Popular</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'poppins')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'poppins'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Poppins' }} className="font-preview font-semibold text-base mb-1">Poppins</div>
                        <div className="text-xs text-text-tertiary">Popular</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'montserrat')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'montserrat'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Montserrat' }} className="font-preview font-semibold text-base mb-1">Montserrat</div>
                        <div className="text-xs text-text-tertiary">Popular</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'lato')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'lato'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Lato' }} className="font-preview font-semibold text-base mb-1">Lato</div>
                        <div className="text-xs text-text-tertiary">Popular</div>
                      </button>

                      {/* Modern & Clean */}
                      <button
                        onClick={() => handleChange('fontFamily', 'dm-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'dm-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'DM Sans' }} className="font-preview font-semibold text-base mb-1">DM Sans</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'work-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'work-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Work Sans' }} className="font-preview font-semibold text-base mb-1">Work Sans</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'source-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'source-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Source Sans 3' }} className="font-preview font-semibold text-base mb-1">Source Sans</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'noto-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'noto-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Noto Sans' }} className="font-preview font-semibold text-base mb-1">Noto Sans</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'rubik')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'rubik'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Rubik' }} className="font-preview font-semibold text-base mb-1">Rubik</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      {/* Friendly & Rounded */}
                      <button
                        onClick={() => handleChange('fontFamily', 'nunito')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'nunito'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Nunito' }} className="font-preview font-semibold text-base mb-1">Nunito</div>
                        <div className="text-xs text-text-tertiary">Friendly</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'ubuntu')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'ubuntu'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Ubuntu' }} className="font-preview font-semibold text-base mb-1">Ubuntu</div>
                        <div className="text-xs text-text-tertiary">Friendly</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'raleway')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'raleway'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Raleway' }} className="font-preview font-semibold text-base mb-1">Raleway</div>
                        <div className="text-xs text-text-tertiary">Friendly</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'pt-sans')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'pt-sans'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'PT Sans' }} className="font-preview font-semibold text-base mb-1">PT Sans</div>
                        <div className="text-xs text-text-tertiary">Friendly</div>
                      </button>

                      {/* Display & Unique */}
                      <button
                        onClick={() => handleChange('fontFamily', 'space-grotesk')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'space-grotesk'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Space Grotesk' }} className="font-preview font-semibold text-base mb-1">Space Grotesk</div>
                        <div className="text-xs text-text-tertiary">Unique</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'oswald')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'oswald'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Oswald' }} className="font-preview font-semibold text-base mb-1">Oswald</div>
                        <div className="text-xs text-text-tertiary">Display</div>
                      </button>

                      {/* Trending 2024/2025 */}
                      <button
                        onClick={() => handleChange('fontFamily', 'outfit')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'outfit'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Outfit' }} className="font-preview font-semibold text-base mb-1">Outfit</div>
                        <div className="text-xs text-text-tertiary">Trending</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'jakarta')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'jakarta'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Plus Jakarta Sans' }} className="font-preview font-semibold text-base mb-1">Jakarta Sans</div>
                        <div className="text-xs text-text-tertiary">Trending</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'manrope')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'manrope'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Manrope' }} className="font-preview font-semibold text-base mb-1">Manrope</div>
                        <div className="text-xs text-text-tertiary">Trending</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'lexend')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'lexend'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Lexend' }} className="font-preview font-semibold text-base mb-1">Lexend</div>
                        <div className="text-xs text-text-tertiary">Readable</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'quicksand')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'quicksand'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Quicksand' }} className="font-preview font-semibold text-base mb-1">Quicksand</div>
                        <div className="text-xs text-text-tertiary">Rounded</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'karla')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'karla'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Karla' }} className="font-preview font-semibold text-base mb-1">Karla</div>
                        <div className="text-xs text-text-tertiary">Geometric</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'archivo')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'archivo'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Archivo' }} className="font-preview font-semibold text-base mb-1">Archivo</div>
                        <div className="text-xs text-text-tertiary">Modern</div>
                      </button>

                      {/* Serif Fonts */}
                      <button
                        onClick={() => handleChange('fontFamily', 'playfair')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'playfair'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Playfair Display' }} className="font-preview font-semibold text-base mb-1">Playfair</div>
                        <div className="text-xs text-text-tertiary">Serif</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'merriweather')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'merriweather'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Merriweather' }} className="font-preview font-semibold text-base mb-1">Merriweather</div>
                        <div className="text-xs text-text-tertiary">Serif</div>
                      </button>

                      <button
                        onClick={() => handleChange('fontFamily', 'bebas')}
                        className={`p-3 text-left border-2 rounded-md transition-all ${
                          getValue('fontFamily') === 'bebas'
                            ? 'border-primary bg-primary bg-opacity-10'
                            : 'border-border hover:border-primary hover:border-opacity-50'
                        }`}
                      >
                        <div style={{ fontFamily: 'Bebas Neue' }} className="font-preview font-semibold text-base mb-1">Bebas Neue</div>
                        <div className="text-xs text-text-tertiary">Display</div>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                      Preview each font to find your perfect match
                    </p>
                  </div>

                  {/* Code Theme */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Code Syntax Theme
                    </label>
                    <select
                      value={getValue("codeTheme")}
                      onChange={(e) => handleChange('codeTheme', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="github-dark">GitHub Dark</option>
                      <option value="monokai">Monokai</option>
                      <option value="solarized-light">Solarized Light</option>
                    </select>
                    <p className="mt-1 text-xs text-text-tertiary">
                      Syntax highlighting for code blocks
                    </p>
                  </div>

                  {/* Animations */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Enable Animations
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Smooth transitions and effects
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("enableAnimations")}
                        onChange={(e) => handleChange('enableAnimations', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Search & Index Settings</h3>

                  {/* Auto Index on Startup */}
                  <div className="mb-6 p-4 bg-surface rounded-lg border border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Auto-Index on Startup
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Automatically rebuild search index when app starts (background job)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={getValue("autoIndexOnStartup")}
                          onChange={(e) => handleChange('autoIndexOnStartup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  {/* Auto-Index Days Threshold */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Auto-Index Age Threshold
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={getValue("autoIndexDays")}
                        onChange={(e) => handleChange('autoIndexDays', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-[hsl(var(--border))] rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={getValue("autoIndexDays")}
                          onChange={(e) => handleChange('autoIndexDays', Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                          className="w-16 px-2 py-1 text-sm border border-[hsl(var(--border))] rounded focus:outline-none focus:ring-2 focus:ring-primary bg-[hsl(var(--input-bg))] text-[hsl(var(--text-primary))]"
                        />
                        <span className="text-sm text-text-secondary">days</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">
                      Rebuild search index automatically if older than {getValue("autoIndexDays")} {getValue("autoIndexDays") === 1 ? 'day' : 'days'}
                    </p>
                  </div>

                  {/* Results Per Page */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Results Per Page
                    </label>
                    <select
                      value={getValue("resultsPerPage")}
                      onChange={(e) => handleChange('resultsPerPage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="10">10 results</option>
                      <option value="25">25 results (Default)</option>
                      <option value="50">50 results</option>
                      <option value="100">100 results</option>
                    </select>
                  </div>

                  {/* Search History */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Keep Search History
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Remember last 20 searches
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("searchHistory")}
                        onChange={(e) => handleChange('searchHistory', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Highlight Color */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Search Match Highlight Color
                    </label>
                    <select
                      value={getValue("highlightColor")}
                      onChange={(e) => handleChange('highlightColor', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="yellow">Yellow (Default)</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Session Management</h3>

                  {/* Default Sort */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Default Sort Order
                    </label>
                    <select
                      value={getValue("defaultSort")}
                      onChange={(e) => handleChange('defaultSort', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="last-updated">Last Updated</option>
                      <option value="title">Title (A-Z)</option>
                      <option value="message-count">Message Count</option>
                    </select>
                  </div>

                  {/* Default View */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Default View Filter
                    </label>
                    <select
                      value={getValue("defaultView")}
                      onChange={(e) => handleChange('defaultView', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All Sessions</option>
                      <option value="visible">Visible Only</option>
                      <option value="hidden">Hidden Only</option>
                    </select>
                  </div>

                  {/* Session Page Size */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Sessions Per Page
                    </label>
                    <select
                      value={getValue("sessionPageSize")}
                      onChange={(e) => handleChange('sessionPageSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="25">25 sessions</option>
                      <option value="50">50 sessions (Default)</option>
                      <option value="100">100 sessions</option>
                    </select>
                  </div>

                  {/* Auto-Hide Old Sessions */}
                  <div className="p-4 bg-surface rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Auto-Hide Old Sessions
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Automatically hide sessions older than specified days
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={getValue("autoHideOldSessions")}
                          onChange={(e) => handleChange('autoHideOldSessions', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                    {getValue("autoHideOldSessions") && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-text-secondary mb-1">
                          Days threshold
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={getValue("autoHideDays")}
                          onChange={(e) => handleChange('autoHideDays', parseInt(e.target.value))}
                          className="w-24 px-2 py-1 text-sm border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="ml-2 text-xs text-text-tertiary">days</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Display Preferences</h3>

                  {/* Show Timestamps */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Show Timestamps
                    </label>
                    <select
                      value={getValue("showTimestamps")}
                      onChange={(e) => handleChange('showTimestamps', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="always">Always</option>
                      <option value="on-hover">On Hover (Default)</option>
                      <option value="never">Never</option>
                    </select>
                  </div>

                  {/* Show Tool Icons */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Show Tool Icons
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Display tool usage indicators in messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("showToolIcons")}
                        onChange={(e) => handleChange('showToolIcons', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Message Grouping */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Message Grouping
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Group consecutive messages by same role
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("messageGrouping")}
                        onChange={(e) => handleChange('messageGrouping', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Markdown Preview */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Markdown Preview
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Enable rich markdown rendering in messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("markdownPreview")}
                        onChange={(e) => handleChange('markdownPreview', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Data & Privacy</h3>

                  {/* Clear Cache */}
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Clear Cache
                    </label>
                    <p className="text-xs text-text-tertiary mb-3">
                      Remove all cached data including search index and temporary files
                    </p>
                    <Button
                      onClick={() => {
                        // TODO: Implement cache clearing functionality
                        console.log('Clear cache clicked - functionality to be implemented')
                      }}
                      variant="outline"
                      size="sm"
                      className="border-amber-600 text-amber-700 hover:bg-amber-100"
                    >
                      Clear All Cache
                    </Button>
                  </div>

                  {/* Export Settings */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Export Settings
                    </label>
                    <p className="text-xs text-text-tertiary mb-3">
                      Download your settings as JSON file for backup
                    </p>
                    <Button
                      onClick={exportSettings}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Download Settings JSON
                    </Button>
                  </div>

                  {/* Reset to Defaults */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Reset to Defaults
                    </label>
                    <p className="text-xs text-text-tertiary mb-3">
                      Reset all settings to their default values
                    </p>
                    <Button
                      onClick={() => setShowResetConfirm(true)}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-600 text-red-700 hover:bg-red-100"
                    >
                      Reset All Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Advanced Settings</h3>

                  {/* Developer Mode */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Developer Mode
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Show raw JSON and debug information
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("developerMode")}
                        onChange={(e) => handleChange('developerMode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-text-primary">
                        Keyboard Shortcuts
                      </label>
                      <p className="text-xs text-text-tertiary mt-1">
                        Enable global keyboard shortcuts (Ctrl+K, etc.)
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={getValue("keyboardShortcuts")}
                        onChange={(e) => handleChange('keyboardShortcuts', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Beta Features */}
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary">
                          Enable Beta Features
                        </label>
                        <p className="text-xs text-text-tertiary mt-1">
                          Access experimental features (may be unstable)
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={getValue("betaFeatures")}
                          onChange={(e) => handleChange('betaFeatures', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[hsl(var(--border))] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[hsl(var(--surface))] after:border-[hsl(var(--border-hover))] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-surface flex-shrink-0">
          {hasUnsavedChanges && (
            <div className="text-sm text-amber-600 font-medium">
              ⚠️ You have unsaved changes
            </div>
          )}
          {!hasUnsavedChanges && <div></div>}

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <>
                <Button onClick={handleDiscard} variant="outline" size="sm">
                  Discard Changes
                </Button>
                <Button onClick={handleSave} size="sm" className="bg-primary text-white hover:bg-primary-hover">
                  Save & Apply
                </Button>
              </>
            )}
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Reload Confirmation Modal */}
      <ConfirmationModal
        isOpen={showReloadConfirm}
        onClose={() => setShowReloadConfirm(false)}
        onConfirm={handleReloadConfirm}
        title="Settings Saved!"
        message="Some changes require a page reload to take effect. Would you like to reload now?"
        confirmText="Reload Now"
        cancelText="Later"
        type="success"
      />

      {/* Reset Settings Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          resetSettings()
          setShowResetConfirm(false)
        }}
        title="Reset All Settings?"
        message="This will reset all your settings to their default values. This action cannot be undone."
        confirmText="Reset Settings"
        cancelText="Cancel"
        type="warning"
      />
    </>
  )
}

export default SettingsModal
