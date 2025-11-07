import { ReactNode, useMemo } from 'react'
import { ChartData, ChartOptions } from 'chart.js'
import { Doughnut, Pie } from 'react-chartjs-2'

import { ensureChartDefaults } from './ChartRegistry'
import { ResponsiveChartContainer } from './ResponsiveChartContainer'

ensureChartDefaults()

type PieVariant = 'pie' | 'doughnut'

interface PieChartProps {
  data: ChartData<'pie'>
  options?: ChartOptions<'pie'>
  title?: string
  subtitle?: string
  actions?: ReactNode
  minHeight?: number
  variant?: PieVariant
  cutoutPercentage?: number
}

export function PieChart({
  data,
  options,
  title,
  subtitle,
  actions,
  minHeight,
  variant = 'doughnut',
  cutoutPercentage = 60,
}: PieChartProps) {
  const mergedOptions = useMemo<ChartOptions<'pie'>>(() => {
    const baseOptions: ChartOptions<'pie'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
        },
      },
    }

    if (!options) {
      return variant === 'doughnut'
        ? {
            ...baseOptions,
            cutout: `${cutoutPercentage}%`,
          }
        : baseOptions
    }

    return {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        ...options.plugins,
      },
      cutout: variant === 'doughnut' ? `${cutoutPercentage}%` : options.cutout,
    }
  }, [options, variant, cutoutPercentage])

  const ChartComponent = variant === 'pie' ? Pie : Doughnut

  return (
    <ResponsiveChartContainer title={title} subtitle={subtitle} actions={actions} minHeight={minHeight}>
      <ChartComponent data={data} options={mergedOptions} updateMode="resize" className="h-full w-full" />
    </ResponsiveChartContainer>
  )
}

