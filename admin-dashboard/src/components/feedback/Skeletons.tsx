import { cn } from '../../utils/cn'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200/60 dark:bg-slate-700/60', className)} />
}

interface SkeletonTextProps extends SkeletonProps {
  lines?: number
  lineClassName?: string
}

export function SkeletonText({ lines = 3, className, lineClassName }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={`skeleton-text-${index}`} className={cn('h-3 w-full', lineClassName, index === lines - 1 && 'w-5/6')} />
      ))}
    </div>
  )
}

interface SkeletonAvatarProps extends SkeletonProps {
  size?: number
  rounded?: 'full' | 'lg'
}

export function SkeletonAvatar({ size = 48, rounded = 'full', className }: SkeletonAvatarProps) {
  return (
    <Skeleton
      className={cn(rounded === 'full' ? 'rounded-full' : 'rounded-lg', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function SkeletonBadge({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-20 rounded-full', className)} />
}

interface SkeletonCardProps extends SkeletonProps {
  withFooter?: boolean
}

export function SkeletonCard({ className, withFooter = false }: SkeletonCardProps) {
  return (
    <div className={cn('space-y-4 rounded-2xl border border-slate-100/20 bg-white/40 p-5 backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/40', className)}>
      <div className="flex items-center gap-4">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <SkeletonBadge />
      </div>
      <SkeletonText lines={4} />
      {withFooter && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}

interface SkeletonListProps extends SkeletonProps {
  count?: number
  itemHeight?: number
}

export function SkeletonList({ count = 5, itemHeight = 56, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={`skeleton-list-${index}`} className="rounded-xl" style={{ height: itemHeight }} />
      ))}
    </div>
  )
}

