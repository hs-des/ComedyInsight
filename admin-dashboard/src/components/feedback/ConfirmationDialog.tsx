import { ReactNode } from 'react'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { createPortal } from 'react-dom'

import { cn } from '../../utils/cn'

type DialogTone = 'default' | 'danger' | 'warning'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  icon?: ReactNode
  isBulkAction?: boolean
  bulkCount?: number
  children?: ReactNode
  customContent?: ReactNode
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

const toneMap: Record<DialogTone, { icon: ReactNode; confirmClass: string }> = {
  default: {
    icon: <ShieldAlert className="h-5 w-5 text-slate-500" />,
    confirmClass: 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    confirmClass: 'bg-amber-500 text-slate-900 hover:bg-amber-600',
  },
  danger: {
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    confirmClass: 'bg-red-600 text-white hover:bg-red-700',
  },
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  icon,
  isBulkAction = false,
  bulkCount,
  children,
  customContent,
  onCancel,
  onConfirm,
  loading = false,
}: ConfirmationDialogProps) {
  if (!open) return null

  const { icon: defaultIcon, confirmClass } = toneMap[tone]

  const content = (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={loading ? undefined : onCancel} />
      <div className="glass-panel relative z-10 w-full max-w-lg space-y-5 p-6">
        <header className="flex items-start gap-4">
          <div className="rounded-full bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {icon ?? defaultIcon}
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
            {isBulkAction && bulkCount !== undefined && (
              <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-300">
                {bulkCount} item{bulkCount === 1 ? '' : 's'} selected
              </div>
            )}
          </div>
        </header>
        {customContent}
        {children && <div className="rounded-xl bg-slate-100/60 p-4 text-sm dark:bg-slate-800/60">{children}</div>}
        <footer className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70',
              confirmClass
            )}
          >
            {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-transparent border-t-current" />}
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )

  const portalRoot = typeof document !== 'undefined' ? document.body : undefined

  return portalRoot ? createPortal(content, portalRoot) : content
}

