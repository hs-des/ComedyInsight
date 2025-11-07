import { useEffect } from 'react'
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { NotificationItem, useNotifications } from '../../contexts/NotificationContext'

const iconMap: Record<NotificationItem['variant'], JSX.Element> = {
  success: <CheckCircle2 className="text-emerald-400" size={18} />,
  info: <Info className="text-sky-400" size={18} />,
  warning: <AlertTriangle className="text-amber-400" size={18} />,
  error: <AlertCircle className="text-red-400" size={18} />,
}

const backdropClasses: Record<NotificationItem['variant'], string> = {
  success: 'bg-emerald-500/10 border border-emerald-500/40',
  info: 'bg-sky-500/10 border border-sky-500/40',
  warning: 'bg-amber-500/10 border border-amber-500/40',
  error: 'bg-red-500/10 border border-red-500/40',
}

export default function NotificationCenter() {
  const { notifications, dismiss, preferences } = useNotifications()

  useEffect(() => {
    if (!preferences.showCenter) return

    const interval = window.setInterval(() => {
      const threshold = Date.now() - 60000
      notifications.filter((n) => n.timestamp < threshold).forEach((n) => dismiss(n.id))
    }, 30000)
    return () => window.clearInterval(interval)
  }, [dismiss, notifications, preferences.showCenter])

  if (!preferences.showCenter) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur ${backdropClasses[notification.variant]} text-sm text-white animate-slide-in`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1">{iconMap[notification.variant]}</div>
            <div className="flex-1">
              <p className="font-semibold">{notification.title}</p>
              {notification.description && <p className="mt-1 text-xs opacity-80">{notification.description}</p>}
            </div>
            <button onClick={() => dismiss(notification.id)} className="mt-1 text-white/60 hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

