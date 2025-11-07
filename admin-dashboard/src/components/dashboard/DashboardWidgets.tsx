import { useMemo } from 'react'
import type { Layouts } from 'react-grid-layout'

import { BarChart } from '../charts/BarChart'
import { PieChart } from '../charts/PieChart'
import { WidgetGrid } from '../widgets/WidgetGrid'
import { WidgetLayoutProvider, WidgetDefinition } from '../../contexts/WidgetLayoutContext'
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics'
import UsageChart from './UsageChart'

const layoutsById: Record<string, Layouts> = {
  'usage-trend': {
    lg: [{ i: 'usage-trend', x: 0, y: 0, w: 7, h: 12 }],
    md: [{ i: 'usage-trend', x: 0, y: 0, w: 10, h: 12 }],
    sm: [{ i: 'usage-trend', x: 0, y: 0, w: 8, h: 12 }],
    xs: [{ i: 'usage-trend', x: 0, y: 0, w: 4, h: 10 }],
    xxs: [{ i: 'usage-trend', x: 0, y: 0, w: 2, h: 10 }],
  },
  'plan-comparison': {
    lg: [{ i: 'plan-comparison', x: 7, y: 0, w: 5, h: 12 }],
    md: [{ i: 'plan-comparison', x: 0, y: 12, w: 10, h: 12 }],
    sm: [{ i: 'plan-comparison', x: 0, y: 12, w: 8, h: 12 }],
    xs: [{ i: 'plan-comparison', x: 0, y: 10, w: 4, h: 10 }],
    xxs: [{ i: 'plan-comparison', x: 0, y: 10, w: 2, h: 10 }],
  },
  'audience-distribution': {
    lg: [{ i: 'audience-distribution', x: 0, y: 12, w: 5, h: 10 }],
    md: [{ i: 'audience-distribution', x: 0, y: 24, w: 10, h: 10 }],
    sm: [{ i: 'audience-distribution', x: 0, y: 24, w: 8, h: 10 }],
    xs: [{ i: 'audience-distribution', x: 0, y: 20, w: 4, h: 9 }],
    xxs: [{ i: 'audience-distribution', x: 0, y: 20, w: 2, h: 9 }],
  },
  'storage-breakdown': {
    lg: [{ i: 'storage-breakdown', x: 5, y: 12, w: 7, h: 10 }],
    md: [{ i: 'storage-breakdown', x: 0, y: 34, w: 10, h: 10 }],
    sm: [{ i: 'storage-breakdown', x: 0, y: 34, w: 8, h: 10 }],
    xs: [{ i: 'storage-breakdown', x: 0, y: 29, w: 4, h: 9 }],
    xxs: [{ i: 'storage-breakdown', x: 0, y: 29, w: 2, h: 9 }],
  },
}

export function DashboardWidgets() {
  const metrics = useDashboardMetrics()

  const widgetDefinitions = useMemo<WidgetDefinition[]>(() => {
    const planDataset = {
      labels: ['Basic', 'Standard', 'Pro', 'Enterprise'],
      datasets: [
        {
          label: 'Active accounts',
          data: [420, 380, 265, 88],
          backgroundColor: ['#0ea5e9', '#6366f1', '#22d3ee', '#f97316'],
          borderRadius: 8,
        },
      ],
    }

    const audienceDataset = {
      labels: ['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa'],
      datasets: [
        {
          label: 'Audience share',
          data: [36, 28, 22, 9, 5],
          backgroundColor: ['#38bdf8', '#6366f1', '#fbbf24', '#f97316', '#22d3ee'],
        },
      ],
    }

    const storageDataset = {
      labels: ['Original media', 'Transcoded outputs', 'Analytics', 'Backups'],
      datasets: [
        {
          label: 'Storage (TB)',
          data: [12.4, 7.8, 2.2, 3.5],
          backgroundColor: 'rgba(14, 165, 233, 0.35)',
          borderColor: '#0ea5e9',
          borderWidth: 2,
        },
      ],
    }

    return [
      {
        id: 'usage-trend',
        title: 'Realtime usage trend',
        description: 'Live view of API requests over the past few hours.',
        render: () => (
          <UsageChart
            initialData={metrics.usageTrend}
            fetchTrend={async () => metrics.usageTrend}
          />
        ),
        defaultLayouts: layoutsById['usage-trend'],
        minH: 10,
        minW: 4,
        settings: {
          smoothing: 0.35,
          showLegend: false,
        },
      },
      {
        id: 'plan-comparison',
        title: 'Plan adoption',
        description: 'Active customer counts per subscription tier.',
        render: <BarChart data={planDataset} title="Plan adoption" subtitle="Active customers" />,
        defaultLayouts: layoutsById['plan-comparison'],
        minH: 8,
        minW: 4,
        settings: {
          stacked: false,
        },
      },
      {
        id: 'audience-distribution',
        title: 'Audience distribution',
        description: 'Regional breakdown of viewership share.',
        render: <PieChart data={audienceDataset} title="Audience distribution" subtitle="Share by region" />,
        defaultLayouts: layoutsById['audience-distribution'],
        minH: 8,
        minW: 3,
        settings: {
          variant: 'doughnut',
        },
      },
      {
        id: 'storage-breakdown',
        title: 'Storage consumption',
        description: 'How storage capacity is allocated across workloads.',
        render: <BarChart data={storageDataset} title="Storage consumption" subtitle="TB used" />,
        defaultLayouts: layoutsById['storage-breakdown'],
        minH: 8,
        minW: 4,
        settings: {
          stacked: false,
        },
      },
    ] satisfies WidgetDefinition[]
  }, [metrics])

  return (
    <WidgetLayoutProvider definitions={widgetDefinitions}>
      <WidgetGrid className="mt-6" />
    </WidgetLayoutProvider>
  )
}

