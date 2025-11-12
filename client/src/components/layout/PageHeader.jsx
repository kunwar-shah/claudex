import React from 'react'
import { cn } from '@/lib/utils'

/**
 * PageHeader - Standard page header with title, description, and actions
 * Used consistently across all pages
 */
const PageHeader = ({
  title,
  description,
  actions,
  className
}) => {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div>
        {title && (
          <h1 className="text-2xl font-bold text-text-primary mb-1">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-sm text-text-secondary">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageHeader
