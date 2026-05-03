import React from 'react'
import { AlertTriangle, RefreshCw, Home, ExternalLink } from 'lucide-react'

/**
 * ErrorBoundary — root-level safety net.
 *
 * Catches JavaScript errors anywhere in the tree, logs them, and shows a
 * recoverable error UI instead of a white screen.
 *
 * Required to be a class component (React's API).
 *
 * Usage in main.jsx:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log to console with full context for dev debugging
    console.error('[Claudex ErrorBoundary] Caught error:', error)
    console.error('[Claudex ErrorBoundary] Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })

    // Future: report to error tracking service (Sentry/LogRocket)
    // window.__claudexErrorReporter?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleHome = () => {
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { error, errorInfo } = this.state
    const isDev = import.meta.env?.DEV ?? false
    const errorTitle = error?.name || 'Error'
    const errorMessage = error?.message || 'An unexpected error occurred'
    const stack = error?.stack || ''

    // Build a GitHub Issue URL with pre-populated body
    const issueBody = encodeURIComponent(`## Error
${errorTitle}: ${errorMessage}

## Stack
\`\`\`
${stack.slice(0, 1500)}
\`\`\`

## Component Stack
\`\`\`
${(errorInfo?.componentStack || 'unknown').slice(0, 1500)}
\`\`\`

## Browser
${navigator.userAgent}

## URL
${window.location.href}
`)
    const issueUrl = `https://github.com/kunwar-shah/claudex/issues/new?title=${encodeURIComponent('[Bug] ' + errorTitle)}&body=${issueBody}`

    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <p className="text-zinc-700">
              Claudex hit an unexpected error and couldn't continue. Your data is safe — this is a UI-only crash.
            </p>

            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="text-sm font-mono text-red-900 break-words">
                <span className="font-semibold">{errorTitle}:</span> {errorMessage}
              </div>
            </div>

            {/* Show stack only in dev */}
            {isDev && stack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 font-medium">
                  Show technical details (dev mode)
                </summary>
                <pre className="mt-2 p-3 bg-zinc-100 rounded text-zinc-700 overflow-x-auto max-h-64 overflow-y-auto">
                  {stack}
                  {errorInfo?.componentStack && '\n\nComponent Stack:' + errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="text-sm text-zinc-600">
              You can try the actions below. If the error keeps happening, please report it.
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Reload Page
              </button>
              <button
                onClick={this.handleHome}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border border-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Go Home
              </button>
              <a
                href={issueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-primary hover:bg-primary/5 border border-primary/30 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                Report Issue
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-3 text-xs text-zinc-500">
            Claudex v1.3.2 · Error caught by ErrorBoundary
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
