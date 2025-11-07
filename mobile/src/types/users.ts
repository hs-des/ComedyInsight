import type { SubscriptionStatus } from './subscriptions'

export interface UserSummary {
  id: string
  email?: string | null
  full_name?: string | null
  username?: string | null
  created_at: string
  last_seen_at?: string | null
  is_active?: boolean
  is_verified?: boolean
  subscription_status?: SubscriptionStatus
  plan_name?: string | null
}

export interface UserProfile extends UserSummary {
  phone_number?: string | null
  country?: string | null
  roles?: string[]
  preferences?: Record<string, unknown>
}

export interface UserSubscription {
  plan_id?: string | null
  status: SubscriptionStatus
  started_at: string
  expires_at?: string | null
  renewal_price_cents?: number | null
}

export interface UserActivityEntry {
  id: string
  type: 'login' | 'playback' | 'subscription' | 'download'
  description: string
  occurred_at: string
  metadata?: Record<string, unknown>
}

export interface UserListResponse {
  items: UserSummary[]
  pagination: {
    total: number
    page: number
    page_size: number
  }
}

