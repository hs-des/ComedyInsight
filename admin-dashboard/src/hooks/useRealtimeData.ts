import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAutoRefresh } from './useAutoRefresh'
import { useWebSocket, WebSocketStatus } from './useWebSocket'

type MergeStrategy<TData> = (current: TData, incoming: TData) => TData

export interface UseRealtimeDataOptions<TData> {
  url?: string | null
  initialData: TData
  parseMessage?: (event: MessageEvent) => TData
  mergeStrategy?: MergeStrategy<TData>
  onData?: (nextData: TData) => void
  fetcher?: () => Promise<TData>
  refreshIntervalMs?: number
  autoRefresh?: boolean
}

export interface UseRealtimeDataReturn<TData> {
  data: TData
  lastUpdated: number | null
  status: WebSocketStatus
  isConnected: boolean
  error: Event | null
  refresh: () => Promise<void>
  isRefreshing: boolean
  autoRefreshEnabled: boolean
  setAutoRefreshEnabled: (value: boolean) => void
  reconnect: () => void
}

export function useRealtimeData<TData>({
  url = null,
  initialData,
  parseMessage,
  mergeStrategy,
  onData,
  fetcher,
  refreshIntervalMs,
  autoRefresh = true,
}: UseRealtimeDataOptions<TData>): UseRealtimeDataReturn<TData> {
  const [data, setData] = useState<TData>(initialData)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(Boolean(autoRefresh))

  const effectiveMergeStrategy = useMemo<MergeStrategy<TData>>(
    () => mergeStrategy ?? ((_, incoming) => incoming),
    [mergeStrategy]
  )

  const { status, isConnected, lastMessage, error, reconnect } = useWebSocket<TData>(url, {
    parseMessage,
  })

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    if (lastMessage === null) return

    setData((current) => {
      const next = effectiveMergeStrategy(current, lastMessage)
      onData?.(next)
      return next
    })
    setLastUpdated(Date.now())
  }, [effectiveMergeStrategy, lastMessage, onData])

  const refresh = useCallback(async () => {
    if (!fetcher) return

    setIsRefreshing(true)
    try {
      const nextData = await fetcher()
      setData((current) => effectiveMergeStrategy(current, nextData))
      setLastUpdated(Date.now())
      onData?.(nextData)
    } finally {
      setIsRefreshing(false)
    }
  }, [effectiveMergeStrategy, fetcher, onData])

  useAutoRefresh(() => {
    if (!fetcher) return
    void refresh()
  }, {
    intervalMs: refreshIntervalMs,
    enabled: Boolean(fetcher) && Boolean(refreshIntervalMs) && autoRefreshEnabled,
  })

  return {
    data,
    lastUpdated,
    status,
    isConnected,
    error,
    refresh,
    isRefreshing,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    reconnect,
  }
}

