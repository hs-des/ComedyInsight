import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, Col, Row, Select, Space, Statistic, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  fetchRevenueOverview,
  fetchRevenueTimeseries,
  fetchTopPlans,
  fetchAdMobAnalytics,
} from '../../services/monetizationService'
import type { RevenueOverview, RevenueTimeseriesPoint, TopPlanPerformance } from '../../types/monetization'
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const { Title, Text } = Typography

const rangeOptions = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

export default function RevenueDashboard() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'revenue', 'overview'],
    queryFn: fetchRevenueOverview,
  })

  const timeseriesQuery = useQuery({
    queryKey: ['analytics', 'revenue', 'timeseries', range],
    queryFn: () => fetchRevenueTimeseries(range),
  })

  const topPlansQuery = useQuery({
    queryKey: ['analytics', 'revenue', 'top-plans'],
    queryFn: fetchTopPlans,
  })

  const adAnalyticsQuery = useQuery({
    queryKey: ['analytics', 'admob', 'summary'],
    queryFn: fetchAdMobAnalytics,
  })

  const columns: ColumnsType<TopPlanPerformance> = [
    {
      title: 'Plan',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Subscribers',
      dataIndex: 'subscribers',
      key: 'subscribers',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      title: 'Growth',
      dataIndex: 'growthRate',
      key: 'growthRate',
      render: (value: number) => `${(value * 100).toFixed(1)}%`,
    },
  ]

  const overview = overviewQuery.data
  const timeseries = timeseriesQuery.data ?? []

  const renderOverviewCard = (title: string, value: number, prefix?: string, suffix?: string, precision = 0) => (
    <Card className="bg-gray-900/60 border border-gray-800">
      <Statistic title={<span className="text-gray-400 text-sm">{title}</span>} value={value} precision={precision} prefix={prefix} suffix={suffix} valueStyle={{ color: '#f5f5f5' }} />
    </Card>
  )

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Title level={3} className="!text-white">
            Revenue Dashboard
          </Title>
          <Text type="secondary">Track subscription, ad revenue, and plan performance at a glance.</Text>
        </div>
        <Space>
          <Select<'7d' | '30d' | '90d'> value={range} onChange={setRange} options={rangeOptions} />
        </Space>
      </header>

      <Row gutter={[24, 24]}>
        <Col xl={6} md={12} sm={24}>
          {renderOverviewCard('Monthly Recurring Revenue', overview?.monthlyRecurringRevenue ?? 0, '$')}
        </Col>
        <Col xl={6} md={12} sm={24}>
          {renderOverviewCard('Total Revenue (YTD)', overview?.totalRevenue ?? 0, '$')}
        </Col>
        <Col xl={6} md={12} sm={24}>
          {renderOverviewCard('Active Subscribers', overview?.activeSubscribers ?? 0)}
        </Col>
        <Col xl={6} md={12} sm={24}>
          {renderOverviewCard('Churn Rate', (overview?.churnRate ?? 0) * 100, undefined, '%', 2)}
        </Col>
      </Row>

      <Card className="bg-gray-900/60 border border-gray-800" title="Revenue vs Ads">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={timeseries} margin={{ left: 16, right: 16, top: 24, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSubscriptions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAds" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 100).toFixed(0)}`} />
            <Tooltip
              formatter={(value: number) => `$${(value / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              contentStyle={{ background: '#111827', border: 'none' }}
            />
            <Legend />
            <Area type="monotone" dataKey="subscriptionRevenue" stroke="#34d399" fill="url(#colorSubscriptions)" name="Subscriptions" />
            <Area type="monotone" dataKey="adRevenue" stroke="#60a5fa" fill="url(#colorAds)" name="Ads" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Row gutter={[24, 24]}>
        <Col xl={10} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800" title="Top Performing Plans" loading={topPlansQuery.isLoading}>
            <Table<TopPlanPerformance>
              columns={columns}
              dataSource={topPlansQuery.data ?? []}
              pagination={false}
              rowKey={(record) => record.planId}
            />
          </Card>
        </Col>
        <Col xl={14} lg={24}>
          <Card className="bg-gray-900/60 border border-gray-800" title="AdMob Snapshot" loading={adAnalyticsQuery.isLoading}>
            {adAnalyticsQuery.data ? (
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Impressions (24h)" value={adAnalyticsQuery.data.summary.impressionsToday} valueStyle={{ color: '#60a5fa' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="Clicks (24h)" value={adAnalyticsQuery.data.summary.clicksToday} valueStyle={{ color: '#f97316' }} />
                </Col>
                <Col span={6}>
                  <Statistic prefix="$" precision={2} title="Revenue" value={adAnalyticsQuery.data.summary.revenueToday / 100} valueStyle={{ color: '#34d399' }} />
                </Col>
                <Col span={6}>
                  <Statistic suffix="%" precision={2} title="Fill rate" value={adAnalyticsQuery.data.summary.fillRate} valueStyle={{ color: '#c084fc' }} />
                </Col>
              </Row>
            ) : (
              <Text type="secondary">Ad analytics currently unavailable.</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

