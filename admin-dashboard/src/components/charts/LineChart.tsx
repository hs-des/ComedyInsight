import { ReactNode, useMemo } from 'react'
import { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'react-chartjs-2'

import { ensureChartDefaults } from './ChartRegistry'
import { ResponsiveChartContainer } from './ResponsiveChartContainer'

ensureChartDefaults()

interface LineChartProps {
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
  title?: string
  subtitle?: string
  actions?: ReactNode
  minHeight?: number
}

export function LineChart({ data, options, title, subtitle, actions, minHeight }: LineChartProps) {
  const mergedOptions = useMemo<ChartOptions<'line'>>(() => {
    const baseOptions: ChartOptions<'line'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: (data.datasets?.length ?? 0) > 1,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    }

    if (!options) return baseOptions

    return {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        ...options.plugins,
      },
      scales: {
        ...baseOptions.scales,
        ...options.scales,
      },
    }
  }, [data.datasets, options])

  return (
    <ResponsiveChartContainer title={title} subtitle={subtitle} actions={actions} minHeight={minHeight}>
      <Line data={data} options={mergedOptions} updateMode="resize" className="h-full w-full" />
    </ResponsiveChartContainer>
  )
}

