import { cn } from '../../utils/cn'

interface ProgressIndicatorProps {
  value?: number
  showLabel?: boolean
  className?: string
  color?: 'primary' | 'emerald' | 'amber' | 'sky'
  height?: number
}

export function ProgressIndicator({ value, showLabel = false, className, color = 'primary', height = 6 }: ProgressIndicatorProps) {
  const clamped = typeof value === 'number' ? Math.min(Math.max(value, 0), 100) : undefined

  const colorClass = {
    primary: 'from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300',
    emerald: 'from-emerald-400 to-emerald-600',
    amber: 'from-amber-400 to-amber-600',
    sky: 'from-sky-400 to-sky-600',
  }[color]

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative overflow-hidden rounded-full bg-slate-200/40 dark:bg-slate-800/60" style={{ height }}>
        <div
          className={cn('h-full bg-gradient-to-r transition-all duration-500', colorClass, clamped === undefined && 'opacity-0')}
          style={{ width: `${clamped ?? 100}%` }}
        />
        {clamped === undefined && (
          <div className="absolute inset-0">
            <div className="absolute inset-y-0 left-[-40%] w-2/3 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/15 animate-progress-indeterminate" />
          </div>
        )}
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{clamped === undefined ? 'Processing…' : 'Progress'}</span>
          {clamped !== undefined && <span className="font-medium text-slate-700 dark:text-slate-200">{Math.round(clamped)}%</span>}
        </div>
      )}
    </div>
  )
}

