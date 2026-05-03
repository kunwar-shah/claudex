import React, { createContext, useContext, useCallback, useState, useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

/**
 * ToastContext — single source of truth for all transient notifications.
 *
 * Replaces the previous ad-hoc patterns:
 *   - Footer.jsx: document.createElement('div') hacks
 *   - App.jsx: prop-drilled <Toast> only used by 1 component
 *   - SearchPage.jsx: copySuccess local state
 *
 * Usage:
 *   const toast = useToast()
 *   toast.success('Saved!')
 *   toast.error('Network failed', { duration: 8000 })
 *   toast.info('Indexing started', { action: { label: 'Cancel', onClick: () => abort() } })
 *
 * Features:
 *   - Stacking (multiple toasts stack vertically)
 *   - ARIA-correct (role=status for info/success, role=alert for error/warning)
 *   - Manual dismiss + auto-dismiss
 *   - Optional action button per toast
 *   - Theme-aware (uses CSS variables)
 *   - Animated in/out
 */

const ToastContext = createContext(null)

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((message, options = {}) => {
    const {
      type = 'info',
      duration = 4000,
      action = null,
      title = null,
    } = options
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type, duration, action, title }])
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  const api = {
    show,
    dismiss,
    success: (message, options) => show(message, { ...options, type: 'success' }),
    error:   (message, options) => show(message, { ...options, type: 'error', duration: options?.duration ?? 6000 }),
    warning: (message, options) => show(message, { ...options, type: 'warning', duration: options?.duration ?? 5000 }),
    info:    (message, options) => show(message, { ...options, type: 'info' }),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// ─────────────────────────────────────────────────────────────────────
// Toast UI components
// ─────────────────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const TYPE_CONFIG = {
  success: { Icon: CheckCircle2, bg: 'bg-success', text: 'text-white',  iconColor: 'text-white',   role: 'status' },
  error:   { Icon: XCircle,      bg: 'bg-error',   text: 'text-white',  iconColor: 'text-white',   role: 'alert'  },
  warning: { Icon: AlertTriangle,bg: 'bg-warning', text: 'text-white',  iconColor: 'text-white',   role: 'alert'  },
  info:    { Icon: Info,         bg: 'bg-primary', text: 'text-white',  iconColor: 'text-white',   role: 'status' },
}

function ToastItem({ toast, onDismiss }) {
  const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info
  const { Icon } = config
  const [exiting, setExiting] = useState(false)

  // Animate in on mount
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const handleDismiss = () => {
    setExiting(true)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  return (
    <div
      role={config.role}
      className={`pointer-events-auto flex items-start gap-3 rounded-lg shadow-lg ring-1 ring-black/10 px-4 py-3 min-w-[280px] max-w-md
        ${config.bg} ${config.text}
        transition-all duration-200 ease-out
        ${entered && !exiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}
      `}
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm mb-0.5">{toast.title}</div>
        )}
        <div className="text-sm leading-snug break-words">{toast.message}</div>
        {toast.action && (
          <button
            onClick={() => {
              toast.action.onClick?.()
              handleDismiss()
            }}
            className="mt-2 px-2 py-1 text-xs font-semibold rounded bg-white/15 hover:bg-white/25 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded hover:bg-white/15 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
