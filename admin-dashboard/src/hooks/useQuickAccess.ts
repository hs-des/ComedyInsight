import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export interface QuickAccessAction {
  id: string
  label: string
  description?: string
  to: string
  icon?: string
}

export interface RecentFileItem {
  id: string
  name: string
  type: string
  updatedAt: string
  path?: string
}

export interface QuickAccessResponse {
  frequentlyUsed: QuickAccessAction[]
  recentFiles: RecentFileItem[]
  shortcuts: QuickAccessAction[]
}

export const useQuickAccess = () =>
  useQuery<QuickAccessResponse>({
    queryKey: ['quick-access'],
    queryFn: async () => {
      const { data } = await axios.get<QuickAccessResponse>('/api/admin/dashboard/quick-access')
      return data
    },
    refetchInterval: 60_000,
  })

