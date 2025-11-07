import { type ReactNode, useMemo } from 'react'
import type { ChartData, ChartOptions } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

import { ensureChartDefaults } from './ChartRegistry'
import { ResponsiveChartContainer } from './ResponsiveChartContainer'

ensureChartDefaults()

interface PieChartProps {
  data: ChartData<'doughnut'>
  options?: ChartOptions<'doughnut'>
  title?: string
  subtitle?: string
  actions?: ReactNode
  minHeight?: number
  cutoutPercentage?: number
}

export function PieChart({
  data,
  options,
  title,
  subtitle,
  actions,
  minHeight,
  cutoutPercentage = 60,
}: PieChartProps) {
  const mergedOptions = useMemo<ChartOptions<'doughnut'>>(() => {
    const baseOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: `${cutoutPercentage}%`,
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
      },
    }

    if (!options) {
      return baseOptions
    }

    return {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        ...options.plugins,
      },
      cutout: options.cutout ?? baseOptions.cutout,
    }
  }, [options, cutoutPercentage])

  return (
    <ResponsiveChartContainer title={title} subtitle={subtitle} actions={actions} minHeight={minHeight}>
      <Doughnut data={data} options={mergedOptions} updateMode="resize" className="h-full w-full" />
    </ResponsiveChartContainer>
  )
}

