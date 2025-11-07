import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export type ActivityType = 'user' | 'system' | 'security' | 'automation'

export interface ActivityItem {
  id: string
  title: string
  actor?: string
  type: ActivityType
  timestamp: string
  description?: string
  metadata?: Record<string, unknown>
}

export interface ActivityFeedResponse {
  items: ActivityItem[]
  page: number
  pageSize: number
  total: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ActivityFeedFilters {
  type?: ActivityType | 'all'
  dateRange?: '24h' | '7d' | '30d' | 'all'
}

interface Params extends ActivityFeedFilters {
  page: number
}

const buildQueryString = (params: Params) => {
  const query = new URLSearchParams()
  query.set('page', params.page.toString())
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.dateRange && params.dateRange !== 'all') query.set('range', params.dateRange)
  return query.toString()
}

export const useActivityFeed = (params: Params) =>
  useQuery<ActivityFeedResponse>({
    queryKey: ['activity-feed', params],
    queryFn: async () => {
      const qs = buildQueryString(params)
      const url = qs ? `/api/admin/dashboard/activity?${qs}` : '/api/admin/dashboard/activity'
      const { data } = await axios.get<ActivityFeedResponse>(url)
      return data
    },
    refetchInterval: 45_000,
  })

