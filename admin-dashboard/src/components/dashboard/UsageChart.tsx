import { useMemo } from 'react'
import type { ChartData, ChartOptions } from 'chart.js'

import { LineChart } from '../charts/LineChart'
import { RefreshControls } from '../realtime/RefreshControls'
import { useRealtimeData } from '../../hooks/useRealtimeData'
import { UsagePoint } from '../../hooks/useDashboardMetrics'

interface UsageChartProps {
  url?: string | null
  initialData: UsagePoint[]
  fetchTrend?: () => Promise<UsagePoint[]>
}

const formatLabel = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

export default function UsageChart({ url = null, initialData, fetchTrend }: UsageChartProps) {
  const { data, lastUpdated, refresh, isRefreshing, autoRefreshEnabled, setAutoRefreshEnabled, reconnect, isConnected } = useRealtimeData<UsagePoint[]>({
    url,
    initialData,
    fetcher: fetchTrend,
    refreshIntervalMs: 30_000,
    parseMessage: (event) => JSON.parse(event.data) as UsagePoint[],
  })

  const chartData = useMemo<ChartData<'line'>>(
    () => ({
      labels: data.map((point) => formatLabel(point.timestamp)),
      datasets: [
        {
          label: 'Requests per hour',
          data: data.map((point) => point.value),
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.15)',
          tension: 0.35,
          pointRadius: 2,
          fill: true,
        },
      ],
    }),
    [data]
  )

  const chartOptions = useMemo<ChartOptions<'line'>>(
    () => ({
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${value} req`,
          },
        },
      },
    }),
    []
  )

  return (
    <LineChart
      data={chartData}
      options={chartOptions}
      title="API Usage Trend"
      subtitle="Realtime requests per hour"
      actions={
        <RefreshControls
          lastUpdated={lastUpdated}
          onRefresh={() => {
            void refresh()
          }}
          isRefreshing={isRefreshing}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={setAutoRefreshEnabled}
          onReconnect={url ? reconnect : undefined}
          isConnected={isConnected}
        />
      }
    />
  )
}

