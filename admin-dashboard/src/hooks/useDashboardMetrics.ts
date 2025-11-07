import { useEffect, useState } from 'react'

export interface UsagePoint {
  timestamp: string
  value: number
}

export interface DashboardMetrics {
  totals: {
    users: number
    storage: number
    apiCalls: number
    activeSessions: number
  }
  usageTrend: UsagePoint[]
  systemStatus: Array<{ name: string; status: 'operational' | 'degraded' | 'outage'; lastChecked: string }>
  recentActivity: Array<{ id: string; title: string; timestamp: string; description?: string }>
}

const initialTrend: UsagePoint[] = Array.from({ length: 12 }).map((_, index) => ({
  timestamp: new Date(Date.now() - (11 - index) * 60 * 60 * 1000).toISOString(),
  value: Math.round(200 + Math.random() * 100),
}))

export function useDashboardMetrics(): DashboardMetrics {
  const [trend, setTrend] = useState<UsagePoint[]>(initialTrend)
  const [totals, setTotals] = useState({
    users: 12870,
    storage: 4.7 * 1024 * 1024 * 1024,
    apiCalls: 48230,
    activeSessions: 324,
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTrend((prev) => {
        const nextValue = Math.max(120, prev[prev.length - 1].value + Math.round((Math.random() - 0.5) * 40))
        return [
          ...prev.slice(1),
          {
            timestamp: new Date().toISOString(),
            value: nextValue,
          },
        ]
      })
      setTotals((prev) => ({
        ...prev,
        apiCalls: prev.apiCalls + Math.round(200 + Math.random() * 120),
        activeSessions: Math.max(50, prev.activeSessions + Math.round((Math.random() - 0.5) * 20)),
      }))
    }, 15000)
    return () => window.clearInterval(interval)
  }, [])

  return {
    totals,
    usageTrend: trend,
    systemStatus: [
      { name: 'API Gateway', status: 'operational', lastChecked: new Date().toISOString() },
      { name: 'Video Transcoder', status: 'degraded', lastChecked: new Date().toISOString() },
      { name: 'Redis Cache', status: 'operational', lastChecked: new Date().toISOString() },
      { name: 'S3 Storage', status: 'operational', lastChecked: new Date().toISOString() },
    ],
    recentActivity: [
      { id: '1', title: 'Uploaded special “Late Night Show” trailer', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { id: '2', title: 'Invited new admin “Monica”', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), description: 'Assigned analytics role' },
      { id: '3', title: 'Published artist profile “Jordan Lee”', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      { id: '4', title: 'Processed 32 queued video transcodes', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    ],
  }
}

