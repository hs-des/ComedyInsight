import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { getQuickActions } from '../../utils/quickActions'
import { useNotifications } from '../../contexts/NotificationContext'

export default function QuickActionsFab() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { notify } = useNotifications()
  const [open, setOpen] = useState(false)

  const actions = getQuickActions(pathname)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.shiftKey) return
      const key = event.key.toLowerCase()
      const match = actions.find((action) => action.shortcut === `shift+${key}`)
      if (match && match.to) {
        event.preventDefault()
        navigate(match.to)
        notify({ title: match.label, description: 'Shortcut executed', variant: 'info', duration: 2000 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [actions, navigate, notify])

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="pointer-events-auto w-64 animate-slide-down rounded-2xl border border-gray-700/60 bg-gray-900/95 p-3 shadow-2xl backdrop-blur">
          <p className="mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Quick actions</p>
          <ul className="space-y-1">
            {actions.map((action) => {
              const Icon = action.icon
              return (
                <li key={action.id}>
                  <button
                    onClick={() => {
                      setOpen(false)
                      if (action.to) navigate(action.to)
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-gray-200 transition hover:bg-primary/10 hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} />
                      {action.label}
                    </span>
                    {action.shortcut && <span className="text-[10px] uppercase tracking-wide text-gray-500">{action.shortcut}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <Plus size={24} className={open ? 'rotate-45 transition-transform' : 'transition-transform'} />
        <span className="sr-only">Toggle quick actions</span>
      </button>
    </div>
  )
}

