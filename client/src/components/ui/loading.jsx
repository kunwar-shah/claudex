import React from 'react'
import { Loader2 } from 'lucide-react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

/**
 * Loading Component Library — single source of truth for loading UX
 *
 * Variants:
 *   <Spinner />            — small inline spinner (icon)
 *   <LoadingScreen />      — full panel: centered spinner + optional label
 *   <Skeleton />           — single shimmer placeholder
 *   <SkeletonText />       — multi-line text shimmer
 *   <SkeletonCard />       — card-shaped shimmer
 *   <TableLoadingRows />   — N skeleton rows for tables
 *   <CardLoadingGrid />    — N skeleton cards in a grid
 *   <ListLoadingItems />   — N skeleton list rows (with avatar/title/subtitle)
 *   <ModalLoadingContent /> — content area for loading modals
 *
 * Use:
 *   if (isLoading) return <LoadingScreen label="Loading sessions..." />
 *   {isLoading ? <TableLoadingRows count={5} /> : <Table data={data} />}
 */

// ─────────────────────────────────────────────────────────────────────
// Spinner — minimal inline spinner (icon-only)
// ─────────────────────────────────────────────────────────────────────
export function Spinner({ size = 'default', className, ...props }) {
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  }
  return (
    <Loader2
      className={cn('animate-spin text-primary', sizeMap[size] || sizeMap.default, className)}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────
// LoadingScreen — centered spinner + label, fills its container
// ─────────────────────────────────────────────────────────────────────
export function LoadingScreen({
  label,
  description,
  size = 'xl',
  fullScreen = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen w-full' : 'h-full w-full py-12',
        className
      )}
    >
      <Spinner size={size} />
      {label && (
        <div className="text-sm font-medium text-foreground">{label}</div>
      )}
      {description && (
        <div className="text-xs text-muted-foreground max-w-md text-center">
          {description}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// Skeleton — single shimmer block
// Uses zinc tones for visibility across all 10 themes (--surface is often
// pure white which renders the skeleton invisible against card bg).
// ─────────────────────────────────────────────────────────────────────
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-700/40',
        className
      )}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────
// SkeletonText — multi-line shimmer (paragraph placeholder)
// ─────────────────────────────────────────────────────────────────────
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-3.5',
            i === lines - 1 ? 'w-4/6' : i % 2 === 0 ? 'w-full' : 'w-5/6'
          )}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// SkeletonCard — card-shaped placeholder with title + body
// ─────────────────────────────────────────────────────────────────────
export function SkeletonCard({ className, hasImage = false }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 space-y-3',
        className
      )}
    >
      {hasImage && <Skeleton className="h-32 w-full rounded-md" />}
      <Skeleton className="h-5 w-2/3" />
      <SkeletonText lines={2} />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// TableLoadingRows — N skeleton rows, useful inside <tbody>
// ─────────────────────────────────────────────────────────────────────
export function TableLoadingRows({ count = 5, columns = 5, className }) {
  return (
    <>
      {Array.from({ length: count }).map((_, rowIdx) => (
        <tr key={rowIdx} className={cn('border-b border-border', className)}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3">
              <Skeleton
                className={cn(
                  'h-4',
                  colIdx === 0 ? 'w-3/4' : colIdx === columns - 1 ? 'w-12' : 'w-2/3'
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────
// CardLoadingGrid — grid of N skeleton cards
// ─────────────────────────────────────────────────────────────────────
export function CardLoadingGrid({ count = 6, columns = 3, className }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <div className={cn('grid gap-4', gridCols[columns] || gridCols[3], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ListLoadingItems — N skeleton list rows (avatar + title + subtitle)
// ─────────────────────────────────────────────────────────────────────
export function ListLoadingItems({ count = 5, hasIcon = true, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          {hasIcon && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-1.5 min-w-0">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// ModalLoadingContent — purpose-built for modal bodies (like SessionSummaryModal)
// ─────────────────────────────────────────────────────────────────────
export function ModalLoadingContent({ label = 'Loading...', className }) {
  return (
    <div className={cn('space-y-5 py-2', className)}>
      <div className="flex items-center justify-center gap-2 pb-2">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {/* Card 1 placeholder */}
      <div className="rounded-lg border border-primary/20 overflow-hidden">
        <div className="bg-primary/5 px-4 py-3 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="p-4">
          <SkeletonText lines={3} />
        </div>
      </div>
      {/* Card 2 placeholder */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="bg-surface px-4 py-3 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// TopProgressBar — global indeterminate progress bar at top of viewport
// Activates when any TanStack Query is fetching or any mutation is running.
// Drop into App root once; auto-shows during all data activity.
// ─────────────────────────────────────────────────────────────────────
export function TopProgressBar({ className }) {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const active = isFetching > 0 || isMutating > 0

  // Slight delay before showing to avoid flicker on fast queries
  const [visible, setVisible] = React.useState(false)
  React.useEffect(() => {
    let t
    if (active) {
      t = setTimeout(() => setVisible(true), 150) // only show if > 150ms
    } else {
      setVisible(false)
    }
    return () => clearTimeout(t)
  }, [active])

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 h-0.5 z-[9999] overflow-hidden pointer-events-none',
        'transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
        className
      )}
      role="progressbar"
      aria-label={active ? 'Loading' : ''}
      aria-busy={active}
    >
      {/* Animated indeterminate bar — shimmer movement across the full width */}
      <div className="h-full w-full bg-primary/10">
        <div className="h-full w-1/3 bg-primary animate-[loadingbar_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// InlineProgressBar — indeterminate bar that fits inside a container
// Use for in-component loading (modal headers, panel tops, etc).
// ─────────────────────────────────────────────────────────────────────
export function InlineProgressBar({ active = true, className }) {
  if (!active) return null
  return (
    <div
      className={cn(
        'h-0.5 w-full overflow-hidden bg-primary/10 rounded-full',
        className
      )}
      role="progressbar"
      aria-label="Loading"
      aria-busy={active}
    >
      <div className="h-full w-1/3 bg-primary animate-[loadingbar_1.4s_ease-in-out_infinite]" />
    </div>
  )
}

// Default export bundle — convenient for `import Loading from '@/components/ui/loading'`
const Loading = {
  Spinner,
  Screen: LoadingScreen,
  Skeleton,
  Text: SkeletonText,
  Card: SkeletonCard,
  TableRows: TableLoadingRows,
  CardGrid: CardLoadingGrid,
  ListItems: ListLoadingItems,
  ModalContent: ModalLoadingContent,
  TopBar: TopProgressBar,
  InlineBar: InlineProgressBar,
}

export default Loading
