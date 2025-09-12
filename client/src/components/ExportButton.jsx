import React, { useState } from 'react'

const ExportButton = ({ projectId, sessionId, sessionTitle, variant = 'default' }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleExport = async (format) => {
    if (!projectId || !sessionId) return

    setIsExporting(true)
    setShowDropdown(false)

    try {
      const response = await fetch(`/api/export/session/${projectId}/${sessionId}?format=${format}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `conversation-${sessionId}.${format}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log(`Conversation exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export conversation. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const exportFormats = [
    {
      format: 'json',
      label: 'JSON',
      description: 'Raw data format',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      format: 'html',
      label: 'HTML',
      description: 'Web page format',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      format: 'txt',
      label: 'Text',
      description: 'Plain text format',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ]

  const buttonClasses = variant === 'footer' 
    ? "flex items-center space-x-1 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    : "inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

  const iconSize = variant === 'footer' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
        className={buttonClasses}
        title="Export conversation"
      >
        {isExporting ? (
          <>
            <div className={`animate-spin ${iconSize} mr-1.5 border-2 border-blue-600 border-t-transparent rounded-full`}></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg className={`${iconSize} ${variant === 'footer' ? 'mr-1' : 'mr-1.5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
            {variant !== 'footer' && (
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Menu */}
          <div className={`absolute right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 ${
            variant === 'footer' 
              ? 'bottom-full mb-1' // Appear above the button for footer
              : 'top-full mt-1'    // Appear below the button for header
          }`}>
            <div className="p-2">
              <div className="text-xs text-gray-500 px-3 py-2 font-medium">
                Export "{sessionTitle || 'Conversation'}" as:
              </div>
              
              {exportFormats.map((item) => (
                <button
                  key={item.format}
                  onClick={() => handleExport(item.format)}
                  className="w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded mr-3">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-200 p-2">
              <div className="text-xs text-gray-400 px-3 py-1">
                Files will be downloaded to your device
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton