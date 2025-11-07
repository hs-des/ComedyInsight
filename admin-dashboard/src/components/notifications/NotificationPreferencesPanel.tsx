import { BellRing, Clock, Headphones, LayoutDashboard } from 'lucide-react'

import { useNotifications } from '../../contexts/NotificationContext'
import { cn } from '../../utils/cn'

const positions = [
  { id: 'top-right', label: 'Top right' },
  { id: 'top-center', label: 'Top center' },
  { id: 'bottom-right', label: 'Bottom right' },
  { id: 'bottom-left', label: 'Bottom left' },
]

export function NotificationPreferencesPanel() {
  const { preferences, updatePreferences } = useNotifications()

  return (
    <section className="glass-panel space-y-6 p-6">
      <header className="flex items-center gap-3">
        <div className="rounded-full bg-slate-900/80 p-3 text-white dark:bg-slate-200 dark:text-slate-900">
          <BellRing className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notification preferences</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Choose how you&rsquo;re notified about updates and alerts.</p>
        </div>
      </header>

      <div className="space-y-5 text-sm">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/40 p-4 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Auto-dismiss</span>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            Enable auto-dismiss for toasts
            <input
              type="checkbox"
              checked={preferences.autoDismiss}
              onChange={(event) => updatePreferences({ autoDismiss: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="text-xs text-slate-500 dark:text-slate-400">
            Auto-dismiss delay (ms)
            <input
              type="number"
              min={1000}
              step={500}
              value={preferences.autoDismissDuration}
              onChange={(event) => updatePreferences({ autoDismissDuration: Number(event.target.value) })}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              disabled={!preferences.autoDismiss}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/40 p-4 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Toast position</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {positions.map((position) => (
              <button
                key={position.id}
                type="button"
                onClick={() => updatePreferences({ position: position.id as typeof preferences.position })}
                className={cn(
                  'rounded-xl border px-3 py-2 text-left transition',
                  preferences.position === position.id
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                )}
              >
                {position.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/40 p-4 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Sound effects</span>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            Play sound when a new notification arrives
            <input
              type="checkbox"
              checked={preferences.playSound}
              onChange={(event) => updatePreferences({ playSound: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/40 p-4 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">Notification center</span>
          </div>
          <label className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            Show notifications in the in-app center
            <input
              type="checkbox"
              checked={preferences.showCenter}
              onChange={(event) => updatePreferences({ showCenter: event.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        </div>
      </div>
    </section>
  )
}

