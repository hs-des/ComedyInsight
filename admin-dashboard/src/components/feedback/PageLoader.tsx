import { cn } from '../../utils/cn'
import { LoadingSpinner } from './LoadingSpinner'

interface PageLoaderProps {
  title?: string
  message?: string
  fullscreen?: boolean
  progress?: number
  className?: string
}

export function PageLoader({ title = 'Loading', message = 'Fetching latest data…', fullscreen = true, progress, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'glass-panel pointer-events-auto flex flex-col items-center justify-center gap-4 text-center shadow-xl',
        fullscreen ? 'fixed inset-0 z-50 m-4 backdrop-blur-xl' : 'w-full p-10',
        className
      )}
    >
      <LoadingSpinner size={fullscreen ? 'lg' : 'md'} variant="neutral" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {message && <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>}
      </div>
      {typeof progress === 'number' && (
        <div className="w-full max-w-sm">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/50">
            <div
              className="h-full rounded-full bg-slate-900 transition-all duration-300 dark:bg-slate-100"
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-300">{Math.round(progress)}% complete</div>
        </div>
      )}
    </div>
  )
}

