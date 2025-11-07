import { ReactNode } from 'react'

interface ResponsiveChartContainerProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  minHeight?: number
  children: ReactNode
}

export function ResponsiveChartContainer({
  title,
  subtitle,
  actions,
  minHeight = 280,
  children,
}: ResponsiveChartContainerProps) {
  return (
    <section className="glass-panel flex h-full flex-col p-6">
      {(title || subtitle || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="mt-6 flex-1" style={{ minHeight }}>
        <div className="h-full w-full">{children}</div>
      </div>
    </section>
  )
}

