import { useEffect } from 'react'

/**
 * useKeyboardShortcuts — register global keyboard handlers.
 *
 * Standard shortcuts (matching modern apps like GitHub, Linear, Notion):
 *
 *   ?         → Show keyboard help overlay (callback: onShowHelp)
 *   /         → Focus search input on the current page (callback: onFocusSearch)
 *   Esc       → Close current modal/overlay (callback: onEscape)
 *   Cmd+K     → Open command palette (callback: onCommandPalette)
 *   Cmd+,     → Open settings (callback: onOpenSettings)
 *   g then s  → Go to Search (callback: onGoSearch)
 *   g then m  → Go to Manage (callback: onGoManage)
 *   g then a  → Go to Analytics (callback: onGoAnalytics)
 *
 * Shortcuts are disabled while focus is in an input/textarea/contenteditable
 * (so typing "/" in a textbox doesn't trigger the search shortcut).
 * `Esc` is the only exception — it always works to close modals.
 */
export function useKeyboardShortcuts({
  onShowHelp,
  onFocusSearch,
  onEscape,
  onCommandPalette,
  onOpenSettings,
  onGoSearch,
  onGoManage,
  onGoAnalytics,
  enabled = true,
} = {}) {
  useEffect(() => {
    if (!enabled) return

    let lastG = 0 // timestamp of last 'g' press for sequence shortcuts

    const isTypingTarget = (target) => {
      if (!target) return false
      const tag = target.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
      if (target.isContentEditable) return true
      return false
    }

    const handler = (e) => {
      const typing = isTypingTarget(e.target)
      const cmd = e.metaKey || e.ctrlKey

      // Esc always works, even when typing
      if (e.key === 'Escape') {
        if (onEscape) {
          onEscape()
        }
        return
      }

      if (typing) return

      // Cmd+K — command palette
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onCommandPalette?.()
        return
      }

      // Cmd+, — settings
      if (cmd && e.key === ',') {
        e.preventDefault()
        onOpenSettings?.()
        return
      }

      // ? — help
      if (e.key === '?') {
        e.preventDefault()
        onShowHelp?.()
        return
      }

      // / — focus search
      if (e.key === '/') {
        e.preventDefault()
        onFocusSearch?.()
        return
      }

      // g + (s|m|a) — go-to navigation
      if (e.key.toLowerCase() === 'g') {
        lastG = Date.now()
        return
      }

      // Within 800ms of pressing g, accept the second key
      if (Date.now() - lastG < 800 && lastG > 0) {
        const second = e.key.toLowerCase()
        if (second === 's') {
          e.preventDefault()
          onGoSearch?.()
        } else if (second === 'm') {
          e.preventDefault()
          onGoManage?.()
        } else if (second === 'a') {
          e.preventDefault()
          onGoAnalytics?.()
        }
        lastG = 0
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enabled, onShowHelp, onFocusSearch, onEscape, onCommandPalette, onOpenSettings, onGoSearch, onGoManage, onGoAnalytics])
}
