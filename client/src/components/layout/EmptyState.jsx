import React from 'react'
import { MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * EmptyState - Clean empty state component
 * NO gradients, NO fancy effects - just clean design
 */
const EmptyState = ({
  icon: Icon = MessageSquare,
  title = 'No Data',
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center justify-center h-full",
      className
    )}>
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center text-center p-12">
          <div className="flex items-center justify-center w-16 h-16 mb-4 bg-primary/10 rounded-full">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-text-secondary mb-6">
              {description}
            </p>
          )}
          {action}
        </CardContent>
      </Card>
    </div>
  )
}

export default EmptyState
