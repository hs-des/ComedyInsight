import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'

import { useNotifications } from '../../contexts/NotificationContext'
import { cn } from '../../utils/cn'

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
}

const variantClasses = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/40 bg-red-500/10 text-red-200',
  info: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
  warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
}

const positionToClasses = {
  'top-right': 'top-4 right-4 items-end',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-6 right-4 items-end',
  'bottom-left': 'bottom-6 left-4 items-start',
}

export default function Toaster() {
  const { notifications, dismiss, preferences } = useNotifications()

  const positionClass = positionToClasses[preferences.position] ?? positionToClasses['top-right']

  return (
    <div className={cn('pointer-events-none fixed z-[70] flex w-full max-w-md flex-col gap-3 px-4', positionClass)}>
      {notifications.map((notification) => {
        const Icon = iconMap[notification.variant]

        return (
          <div
            key={notification.id}
            className={cn(
              'pointer-events-auto w-full animate-slide-down rounded-xl border px-4 py-3 shadow-lg backdrop-blur-lg transition hover:translate-y-[-2px] hover:shadow-xl',
              variantClasses[notification.variant]
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={18} className="mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight">{notification.title}</p>
                {notification.description && <p className="mt-1 text-xs opacity-80">{notification.description}</p>}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {notification.actions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => {
                          action.onPress()
                          dismiss(notification.id)
                        }}
                        className={cn(
                          'rounded-full px-3 py-1 font-medium transition',
                          action.variant === 'danger' && 'bg-red-500/20 text-red-100 hover:bg-red-500/30',
                          action.variant === 'primary' && 'bg-white/20 text-white hover:bg-white/30',
                          (!action.variant || action.variant === 'default') && 'bg-white/10 text-white hover:bg-white/20'
                        )}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(notification.id)}
                className="ml-1 text-xs font-semibold uppercase tracking-wide opacity-70 transition hover:opacity-100"
              >
                Close
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

