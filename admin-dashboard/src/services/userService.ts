import axios from 'axios'
import type {
  UserListResponse,
  UserProfile,
  UserSummary,
  UserSubscription,
  UserActivityEntry,
  SubscriptionStatus,
} from '../types/users'

export interface UserListQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'inactive' | 'pending'
  planId?: string
  subscriptionStatus?: SubscriptionStatus
}

export const fetchUsers = async (params: UserListQuery = {}): Promise<UserListResponse> => {
  const { page = 1, pageSize = 20, search, status, planId, subscriptionStatus } = params
  const { data } = await axios.get<UserListResponse>('/api/users', {
    params: {
      page,
      page_size: pageSize,
      search,
      status_filter: status,
      plan_id: planId,
      subscription_status: subscriptionStatus,
    },
  })
  return data
}

export const fetchUserById = async (id: string): Promise<UserProfile> => {
  const { data } = await axios.get<UserProfile>(`/api/users/${id}`)
  return data
}

export const updateUser = async (id: string, payload: Partial<UserProfile>): Promise<UserProfile> => {
  const { data } = await axios.put<UserProfile>(`/api/users/${id}`, payload)
  return data
}

export const bulkUpdateUsers = async (ids: string[], payload: Partial<UserProfile>): Promise<void> => {
  await Promise.all(ids.map((id) => updateUser(id, payload)))
}

export const fetchUserSubscription = async (id: string): Promise<UserSubscription> => {
  const { data } = await axios.get<UserSubscription>(`/api/users/${id}/subscription`)
  return data
}

export const updateUserSubscription = async (
  id: string,
  payload: { plan_id?: string | null; status: SubscriptionStatus; expires_at?: string | null; renewal_price_cents?: number | null },
): Promise<UserSubscription> => {
  const { data } = await axios.post<UserSubscription>(`/api/users/${id}/subscription`, payload)
  return data
}

export const fetchUserActivity = async (id: string): Promise<UserActivityEntry[]> => {
  const { data } = await axios.get<UserActivityEntry[]>(`/api/users/${id}/activity`)
  return data
}

