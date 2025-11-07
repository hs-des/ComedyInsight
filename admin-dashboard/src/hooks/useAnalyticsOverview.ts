import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface AnalyticsOverview {
  users: {
    total: number
    growth: number
  }
  storage: {
    used: number
    capacity: number
    growth: number
  }
  api: {
    last24h: number
    perMinute: number
    growth: number
  }
  uptime: {
    percentage: number
    streakHours: number
    lastIncident?: string
  }
}

export const useAnalyticsOverview = () =>
  useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      const { data } = await axios.get<AnalyticsOverview>('/api/admin/dashboard/overview')
      return data
    },
    refetchInterval: 30_000,
  })

