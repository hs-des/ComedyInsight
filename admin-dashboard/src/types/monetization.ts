export type BillingInterval = 'monthly' | 'quarterly' | 'yearly'

export interface AdMobSettings {
  bannerAndroid: string
  bannerIos: string
  interstitialAndroid: string
  interstitialIos: string
  rewardedAndroid: string
  rewardedIos: string
  appOpenAndroid: string
  appOpenIos: string
  refreshIntervalSeconds: number
  showAdsToPremium: boolean
}

export interface AdMobAnalyticsSummary {
  impressionsToday: number
  clicksToday: number
  revenueToday: number
  fillRate: number
  eCPM: number
  lastSyncedAt?: string
}

export interface AdMobBreakdownPoint {
  date: string
  impressions: number
  clicks: number
  revenue: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string | null
  price_cents: number
  currency: string
  billing_interval: BillingInterval
  trial_days: number
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SubscriptionPlanFormValues {
  name: string
  description?: string | null
  price_cents: number
  currency: string
  billing_interval: BillingInterval
  trial_days: number
  is_active: boolean
  features: string[]
}

export interface RevenueOverview {
  totalRevenue: number
  monthlyRecurringRevenue: number
  adRevenue: number
  subscriptionsRevenue: number
  activeSubscribers: number
  churnRate: number
  arpu: number
  lastUpdatedAt: string
}

export interface RevenueTimeseriesPoint {
  date: string
  revenue: number
  adRevenue: number
  subscriptionRevenue: number
  newSubscribers: number
  cancellations: number
}

export interface TopPlanPerformance {
  planId: string
  name: string
  subscribers: number
  revenue: number
  growthRate: number
}

