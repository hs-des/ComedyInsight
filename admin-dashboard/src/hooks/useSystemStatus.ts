import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface SystemStatusItem {
  id: string
  name: string
  component: 'database' | 'api' | 'storage' | 'queue' | 'ml'
  status: 'operational' | 'degraded' | 'outage'
  message?: string
  lastChecked: string
  responseTimeMs?: number
}

export interface SystemStatusResponse {
  items: SystemStatusItem[]
  lastUpdated: string
}

export const useSystemStatus = () =>
  useQuery<SystemStatusResponse>({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await axios.get<SystemStatusResponse>('/api/admin/dashboard/system-status')
      return data
    },
    refetchInterval: 15000,
    staleTime: 10000,
  })

