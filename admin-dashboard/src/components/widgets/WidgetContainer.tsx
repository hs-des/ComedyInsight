import { MoreHorizontal, Settings } from 'lucide-react'
import { ReactNode } from 'react'

import type { WidgetInstance } from '../../contexts/WidgetLayoutContext'

interface WidgetContainerProps {
  widget: WidgetInstance
  onOpenSettings?: (widget: WidgetInstance) => void
  actions?: ReactNode
}

export function WidgetContainer({ widget, onOpenSettings, actions }: WidgetContainerProps) {
  const renderContent = typeof widget.render === 'function' ? widget.render() : widget.render

  return (
    <section className="glass-panel flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{widget.title}</h3>
          {widget.description && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{widget.description}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          {onOpenSettings && (
            <button
              type="button"
              onClick={() => onOpenSettings(widget)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`Configure ${widget.title}`}
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Widget quick actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4">{renderContent}</div>
    </section>
  )
}

