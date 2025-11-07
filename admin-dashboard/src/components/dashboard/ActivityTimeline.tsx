import { useMemo, useState } from 'react'
import { CalendarDays, Filter, RefreshCcw } from 'lucide-react'
import { useActivityFeed, ActivityFeedFilters, ActivityType } from '../../hooks/useActivityFeed'
import SkeletonBlock from '../common/SkeletonBlock'

const typeOptions: Array<{ label: string; value: ActivityType | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'User', value: 'user' },
  { label: 'System', value: 'system' },
  { label: 'Security', value: 'security' },
  { label: 'Automation', value: 'automation' },
]

const rangeOptions: Array<{ label: string; value: ActivityFeedFilters['dateRange'] }> = [
  { label: '24 hours', value: '24h' },
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: 'All time', value: 'all' },
]

export default function ActivityTimeline() {
  const [filters, setFilters] = useState<ActivityFeedFilters>({ type: 'all', dateRange: '7d' })
  const [page, setPage] = useState(1)

  const queryParams = useMemo(() => ({ page, ...filters }), [filters, page])
  const { data, isLoading, isFetching, refetch } = useActivityFeed(queryParams)

  const resetFilters = () => {
    setFilters({ type: 'all', dateRange: '7d' })
    setPage(1)
  }

  const items = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <p className="text-xs text-gray-400">Track user actions and automated events in real time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 rounded-full border border-gray-700/60 bg-gray-900/60 px-3 py-1.5">
            <Filter size={14} className="text-gray-500" />
            <select
              className="bg-transparent text-gray-200 focus:outline-none"
              value={filters.type}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, type: event.target.value as ActivityType | 'all' }))
                setPage(1)
              }}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-gray-700/60 bg-gray-900/60 px-3 py-1.5">
            <CalendarDays size={14} className="text-gray-500" />
            <select
              className="bg-transparent text-gray-200 focus:outline-none"
              value={filters.dateRange}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, dateRange: event.target.value as ActivityFeedFilters['dateRange'] }))
                setPage(1)
              }}
            >
              {rangeOptions.map((option) => (
                <option key={option.value} value={option.value ?? 'all'} className="bg-gray-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-gray-700/60 px-3 py-1.5 text-gray-300 transition hover:border-gray-500"
            onClick={resetFilters}
          >
            Reset
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-gray-700/60 px-3 py-1.5 text-gray-300 transition hover:border-gray-500"
            onClick={() => refetch()}
          >
            <RefreshCcw size={14} className={isFetching ? 'animate-spin text-primary' : 'text-gray-500'} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3">
                <SkeletonBlock className="h-3 w-3 rounded-full" />
                <div className="flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-48" />
                  <SkeletonBlock className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-700/60 bg-gray-900/40 p-6 text-center text-sm text-gray-400">
            No activity found for the selected filters.
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <ol className="relative space-y-4">
            {items.map((item, index) => (
              <li key={item.id} className="relative pl-6">
                <span className="absolute left-0 top-1 h-3 w-3 rounded-full border border-primary bg-primary/40" />
                {index !== items.length - 1 && <span className="absolute left-1 top-4 h-full w-px bg-gray-800" />}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {item.actor && <span>{item.actor}</span>}
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                  <span className="rounded-full border border-gray-700/60 px-2 py-0.5 uppercase tracking-wide">
                    {item.type}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {data && data.total > data.pageSize && (
        <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
          <button
            className="rounded-lg border border-gray-700/70 px-3 py-1.5 text-gray-300 transition hover:border-gray-500"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={!data?.hasPreviousPage}
          >
            Previous
          </button>
          <span>Page {data.page} of {totalPages}</span>
          <button
            className="rounded-lg border border-gray-700/70 px-3 py-1.5 text-gray-300 transition hover:border-gray-500"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!data?.hasNextPage}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

