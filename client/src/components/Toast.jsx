import React, { useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'

/**
 * Toast Notification Component
 * Uses theme-aware CSS variables and respects user settings
 *
 * @param {Object} props
 * @param {string} props.type - 'info' | 'success' | 'warning' | 'error'
 * @param {string} props.message - Toast message to display
 * @param {number} props.duration - Display duration in ms (default: 4000)
 * @param {function} props.onClose - Callback when toast closes
 */
const Toast = ({ type = 'info', message, duration = 4000, onClose }) => {
  const { settings } = useSettings()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'info':
      default: return 'ℹ️'
    }
  }

  // Get CSS variable for background color
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'hsl(var(--success))'
      case 'warning': return 'hsl(var(--warning))'
      case 'error': return 'hsl(var(--error))'
      case 'info':
      default: return 'hsl(var(--info))'
    }
  }

  // Border radius classes based on settings
  const getBorderRadiusClass = () => {
    switch (settings.borderRadius) {
      case 'sharp': return 'rounded-none'
      case 'extra-rounded': return 'rounded-xl'
      case 'rounded':
      default: return 'rounded-lg'
    }
  }

  // Animation class based on settings
  const animationClass = settings.enableAnimations
    ? 'transition-all duration-300 animate-slide-in-right'
    : ''

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] shadow-xl backdrop-blur-sm ${getBorderRadiusClass()} ${animationClass}`}
      style={{
        backgroundColor: getBackgroundColor(),
        color: 'hsl(var(--text-on-primary))',
        padding: '0.75rem 1.25rem',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl flex-shrink-0">{getIcon()}</span>
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
    </div>
  )
}

export default Toast
