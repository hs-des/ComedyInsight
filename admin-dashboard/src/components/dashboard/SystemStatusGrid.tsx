import { Wifi, Database, HardDrive, Activity } from 'lucide-react'
import { useSystemStatus } from '../../hooks/useSystemStatus'
import SkeletonBlock from '../common/SkeletonBlock'

const statusLabel = {
  operational: { label: 'Operational', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  degraded: { label: 'Degraded', className: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  outage: { label: 'Outage', className: 'bg-red-500/20 text-red-300 border-red-500/40' },
}

const iconMap = {
  database: Database,
  api: Wifi,
  storage: HardDrive,
  queue: Activity,
  ml: Activity,
} as const

export default function SystemStatusGrid() {
  const { data, isLoading } = useSystemStatus()

  if (isLoading || !data) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">System Status</h3>
            <p className="text-xs text-gray-400">Monitoring core services</p>
          </div>
          <SkeletonBlock className="h-3 w-20 rounded-full" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-gray-800/60 bg-gray-900/60 p-4">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="mt-3 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">System Status</h3>
          <p className="text-xs text-gray-400">Automated health checks across core services</p>
        </div>
        <span className="text-xs text-gray-500">Updated {new Date(data.lastUpdated).toLocaleTimeString()}</span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {data.items.map((item) => {
          const statusInfo = statusLabel[item.status]
          const Icon = iconMap[item.component] ?? Activity
          return (
            <div key={item.id} className="rounded-xl border border-gray-800/60 bg-gray-900/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    {item.message && <p className="text-xs text-gray-400">{item.message}</p>}
                    <p className="mt-1 text-[11px] text-gray-500">
                      Checked {new Date(item.lastChecked).toLocaleTimeString()}
                      {typeof item.responseTimeMs === 'number' && ` · ${item.responseTimeMs} ms`}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${statusInfo.className}`}>{statusInfo.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

