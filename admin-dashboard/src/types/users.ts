export type UserStatusFilter = 'active' | 'inactive' | 'pending'
export type SubscriptionStatus = 'active' | 'expired' | 'canceled' | 'trial'

export interface UserSummary {
  id: string
  email?: string | null
  full_name?: string | null
  created_at: string
  last_seen_at?: string | null
  is_active?: boolean
  is_verified?: boolean
  subscription_status?: SubscriptionStatus
  plan_name?: string | null
}

export interface UserListResponse {
  items: UserSummary[]
  pagination: {
    total: number
    page: number
    page_size: number
  }
}

export interface UserProfile extends UserSummary {
  phone_number?: string | null
  country?: string | null
  roles?: string[]
  devices?: Array<{
    platform: string
    last_active: string
    app_version?: string
  }>
  preferences?: Record<string, unknown>
}

export interface UserSubscription {
  plan_id?: string | null
  plan_name?: string | null
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

