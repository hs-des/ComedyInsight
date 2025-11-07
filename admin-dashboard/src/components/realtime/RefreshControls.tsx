import { formatDistanceToNow } from 'date-fns'
import { Pause, Play, RefreshCcw, WifiOff } from 'lucide-react'

interface RefreshControlsProps {
  lastUpdated: number | null
  onRefresh: () => void
  isRefreshing?: boolean
  autoRefreshEnabled?: boolean
  onToggleAutoRefresh?: (enabled: boolean) => void
  onReconnect?: () => void
  isConnected?: boolean
}

export function RefreshControls({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  autoRefreshEnabled = true,
  onToggleAutoRefresh,
  onReconnect,
  isConnected = true,
}: RefreshControlsProps) {
  const showToggle = Boolean(onToggleAutoRefresh)
  const showReconnect = Boolean(onReconnect) && !isConnected

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {lastUpdated
          ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
          : 'Waiting for updates'}
      </span>
      {showToggle && (
        <button
          type="button"
          onClick={() => onToggleAutoRefresh?.(!autoRefreshEnabled)}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
        >
          {autoRefreshEnabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoRefreshEnabled ? 'Pause auto-refresh' : 'Resume auto-refresh'}
        </button>
      )}
      {showReconnect && (
        <button
          type="button"
          onClick={onReconnect}
          className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-100/40 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <WifiOff className="h-3.5 w-3.5" />
          Reconnect
        </button>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}

