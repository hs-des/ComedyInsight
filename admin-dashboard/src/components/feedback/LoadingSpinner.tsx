import { cn } from '../../utils/cn'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
  xl: 'h-16 w-16 border-4',
}

interface LoadingSpinnerProps {
  size?: SpinnerSize
  label?: string
  className?: string
  variant?: 'primary' | 'neutral' | 'inverted'
}

export function LoadingSpinner({ size = 'md', variant = 'primary', label, className }: LoadingSpinnerProps) {
  const variantClass = {
    primary: 'border-t-slate-900 dark:border-t-white border-slate-200/20 dark:border-slate-700/20',
    neutral: 'border-t-slate-400 border-slate-300/60 dark:border-slate-600/60 dark:border-t-slate-200',
    inverted: 'border-t-white border-white/30',
  }[variant]

  return (
    <div className={cn('flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400', className)}>
      <div className={cn('animate-spin rounded-full border-solid', sizeMap[size], variantClass)} />
      {label && <span className="text-xs font-medium tracking-wide uppercase">{label}</span>}
    </div>
  )
}

