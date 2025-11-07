import { ReactNode, useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'

import { ensureChartDefaults } from './ChartRegistry'
import { ResponsiveChartContainer } from './ResponsiveChartContainer'

ensureChartDefaults()

interface BarChartProps {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
  stacked?: boolean
  title?: string
  subtitle?: string
  actions?: ReactNode
  minHeight?: number
}

export function BarChart({ data, options, stacked = false, title, subtitle, actions, minHeight }: BarChartProps) {
  const mergedOptions = useMemo<ChartOptions<'bar'>>(() => {
    const baseOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          stacked,
          grid: { display: false },
        },
        y: {
          stacked,
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
      plugins: {
        legend: {
          display: (data.datasets?.length ?? 0) > 1,
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
  }, [data.datasets, options, stacked])

  return (
    <ResponsiveChartContainer title={title} subtitle={subtitle} actions={actions} minHeight={minHeight}>
      <Bar data={data} options={mergedOptions} updateMode="resize" className="h-full w-full" />
    </ResponsiveChartContainer>
  )
}

