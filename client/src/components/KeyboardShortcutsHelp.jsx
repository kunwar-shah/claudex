import React from 'react'
import { X, Keyboard } from 'lucide-react'

/**
 * KeyboardShortcutsHelp — modal overlay listing all available shortcuts.
 * Triggered by `?` keypress (registered in Layout via useKeyboardShortcuts).
 */
const SHORTCUTS = [
  {
    section: 'General',
    items: [
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Close any modal' },
      { keys: ['/'], description: 'Focus search input' },
      { keys: ['Cmd', 'K'], description: 'Open command palette (coming soon)' },
      { keys: ['Cmd', ','], description: 'Open settings' },
    ],
  },
  {
    section: 'Navigation',
    items: [
      { keys: ['g', 's'], description: 'Go to Search' },
      { keys: ['g', 'm'], description: 'Go to Manage Sessions' },
      { keys: ['g', 'a'], description: 'Go to Analytics' },
    ],
  },
]

export default function KeyboardShortcutsHelp({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-shortcuts-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-black/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Keyboard className="w-5 h-5" aria-hidden="true" />
            <h2 id="kb-shortcuts-title" className="text-lg font-semibold">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts"
            className="text-white/80 hover:text-white p-1 rounded hover:bg-white/15 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section, sectionIdx) => (
            <div key={section.section} className={sectionIdx > 0 ? 'mt-5 pt-5 border-t border-border' : ''}>
              <div className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                {section.section}
              </div>
              <ul className="space-y-2.5">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-primary">{item.description}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.keys.map((k, ki) => (
                        <React.Fragment key={ki}>
                          {ki > 0 && <span className="text-xs text-text-tertiary mx-0.5">+</span>}
                          <kbd className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-text-primary border border-border rounded shadow-sm min-w-[24px] text-center">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-surface border-t border-border text-xs text-text-tertiary text-center">
          Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">Esc</kbd> to close
        </div>
      </div>
    </div>
  )
}
