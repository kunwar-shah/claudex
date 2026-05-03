import React, { useState } from 'react'

const ProjectExportButton = ({ projectId, projectName, variant = 'default' }) => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!projectId) return

    setIsExporting(true)

    try {
      const response = await fetch(`/api/export/project/${projectId}`)

      if (!response.ok) {
        throw new Error('Project export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${projectId}-complete.json`

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

      console.log(`Project exported successfully: ${filename}`)
    } catch (error) {
      console.error('Project export failed:', error)
      alert('Failed to export project. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const buttonClasses = variant === 'compact'
    ? "inline-flex items-center px-2.5 py-1.5 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-200 hover:border-green-300"
    : "inline-flex items-center px-3 py-2 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-green-200 hover:border-green-300"

  const iconSize = variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={buttonClasses}
      title={`Export complete project: ${projectName || projectId}`}
      aria-label={`Export project ${projectName || projectId} as JSON`}
    >
      {isExporting ? (
        <>
          <div className={`animate-spin ${iconSize} mr-1.5 border-2 border-green-600 border-t-transparent rounded-full`}></div>
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <svg className={`${iconSize} mr-1.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Project</span>
        </>
      )}
    </button>
  )
}

export default ProjectExportButton
