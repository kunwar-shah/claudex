import React from 'react'
import { cn } from '@/lib/utils'

/**
 * PageContainer - Standard wrapper for all pages
 * Provides consistent padding, background, and max-width
 */
const PageContainer = ({ children, className, noPadding = false }) => {
  return (
    <div className={cn(
      "h-full bg-background overflow-auto",
      !noPadding && "p-6",
      className
    )}>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  )
}

export default PageContainer
