import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { ReactNode } from 'react'

import { cn } from '../../utils/cn'

interface ErrorStateProps {
  title?: string
  description?: string
  retryLabel?: string
  onRetry?: () => void
  action?: ReactNode
  className?: string
  details?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We ran into a problem loading this section. You can try again or contact support if the issue persists.',
  retryLabel = 'Try again',
  onRetry,
  action,
  details,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'glass-panel mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-8 text-center text-slate-600 dark:text-slate-300',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10">
        <AlertTriangle className="text-amber-400" size={28} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        {details && <pre className="mt-2 max-h-32 w-full overflow-auto rounded-md bg-slate-900/80 p-3 text-left text-xs text-slate-200 dark:bg-slate-800">{details}</pre>}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            <RefreshCcw className="h-4 w-4" />
            {retryLabel}
          </button>
        )}
        {action}
      </div>
    </div>
  )
}

