import { useMemo } from 'react'
import { Database, GaugeCircle, HardDrive, TrendingUp, Users } from 'lucide-react'
import { useAnalyticsOverview } from '../../hooks/useAnalyticsOverview'

const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, ...options }).format(value)

const formatPercent = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

export default function AnalyticsCards() {
  const { data, isLoading } = useAnalyticsOverview()

  const storagePercent = useMemo(() => {
    if (!data) return 0
    return Math.min(100, Math.round((data.storage.used / data.storage.capacity) * 100))
  }, [data])

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="glass-panel p-6">
            <div className="skeleton h-5 w-20" />
            <div className="mt-6 space-y-2">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-32" />
              <div className="skeleton h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Users size={20} />
          </div>
          <span className="text-xs uppercase tracking-wide text-primary/80">Live</span>
        </div>
        <h3 className="mt-6 text-sm font-medium text-gray-400">Active Users</h3>
        <p className="mt-2 text-3xl font-semibold text-white">{formatNumber(data.users.total)}</p>
        <p className={`mt-2 text-xs font-semibold ${data.users.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatPercent(data.users.growth)} vs last week
        </p>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <HardDrive size={20} />
          </div>
          <span className="text-xs uppercase tracking-wide text-primary/80">Storage</span>
        </div>
        <h3 className="mt-6 text-sm font-medium text-gray-400">Storage Usage</h3>
        <p className="mt-2 text-2xl font-semibold text-white">
          {formatNumber(data.storage.used / 1024 / 1024 / 1024, { minimumFractionDigits: 1 })} GB
          <span className="text-sm text-gray-400"> / {formatNumber(data.storage.capacity / 1024 / 1024 / 1024, { minimumFractionDigits: 1 })} GB</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-gray-800">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${storagePercent}%` }} />
        </div>
        <p className={`mt-2 text-xs font-semibold ${data.storage.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatPercent(data.storage.growth)} usage today
        </p>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <TrendingUp size={20} />
          </div>
          <span className="text-xs uppercase tracking-wide text-primary/80">Traffic</span>
        </div>
        <h3 className="mt-6 text-sm font-medium text-gray-400">API Calls</h3>
        <p className="mt-2 text-3xl font-semibold text-white">{formatNumber(data.api.last24h)}</p>
        <p className="mt-2 text-xs text-gray-400">{formatNumber(data.api.perMinute, { maximumFractionDigits: 1 })} / minute</p>
        <p className={`mt-2 text-xs font-semibold ${data.api.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatPercent(data.api.growth)} vs last 24h
        </p>
      </div>

      <div className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <GaugeCircle size={20} />
          </div>
          <span className="text-xs uppercase tracking-wide text-primary/80">Reliability</span>
        </div>
        <h3 className="mt-6 text-sm font-medium text-gray-400">System Uptime</h3>
        <p className="mt-2 text-3xl font-semibold text-white">{data.uptime.percentage.toFixed(2)}%</p>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{data.uptime.streakHours}h without incident</span>
          {data.uptime.lastIncident && <span>Last incident {new Date(data.uptime.lastIncident).toLocaleDateString()}</span>}
        </div>
      </div>
    </div>
  )
}

