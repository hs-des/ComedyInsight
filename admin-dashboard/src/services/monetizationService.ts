import axios from 'axios'
import type {
  AdMobSettings,
  AdMobAnalyticsSummary,
  AdMobBreakdownPoint,
  SubscriptionPlan,
  SubscriptionPlanFormValues,
  TopPlanPerformance,
  RevenueOverview,
  RevenueTimeseriesPoint,
} from '../types/monetization'

export const fetchAdMobSettings = async (): Promise<AdMobSettings> => {
  const { data } = await axios.get<AdMobSettings>('/api/admin/monetization/admob')
  return data
}

export const updateAdMobSettings = async (payload: AdMobSettings): Promise<AdMobSettings> => {
  const { data } = await axios.put<AdMobSettings>('/api/admin/monetization/admob', payload)
  return data
}

export const testAdMobAdUnit = async (adUnitId: string, adType: string): Promise<{ success: boolean; message: string }> => {
  const { data } = await axios.post<{ success: boolean; message: string }>('/api/admin/monetization/admob/test', {
    adUnitId,
    adType,
  })
  return data
}

export const fetchAdMobAnalytics = async (): Promise<{
  summary: AdMobAnalyticsSummary
  trend: AdMobBreakdownPoint[]
}> => {
  const { data } = await axios.get<{ summary: AdMobAnalyticsSummary; trend: AdMobBreakdownPoint[] }>(
    '/api/admin/monetization/admob/analytics',
  )
  return data
}

export const fetchSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  const { data } = await axios.get<SubscriptionPlan[]>('/api/subscription-plans')
  return data
}

type PlanPayload = Partial<SubscriptionPlanFormValues> & { metadata?: Record<string, unknown> }

export const createSubscriptionPlan = async (payload: PlanPayload): Promise<SubscriptionPlan> => {
  const { data } = await axios.post<SubscriptionPlan>('/api/subscription-plans', payload)
  return data
}

export const updateSubscriptionPlan = async (id: string, payload: PlanPayload): Promise<SubscriptionPlan> => {
  const { data } = await axios.put<SubscriptionPlan>(`/api/subscription-plans/${id}`, payload)
  return data
}

export const deleteSubscriptionPlan = async (id: string): Promise<{ success: boolean }> => {
  const { data } = await axios.delete<{ success: boolean }>(`/api/subscription-plans/${id}`)
  return data
}

export const fetchTopPlans = async (): Promise<TopPlanPerformance[]> => {
  const { data } = await axios.get<TopPlanPerformance[]>('/api/analytics/revenue/top-plans')
  return data
}

export const fetchRevenueOverview = async (): Promise<RevenueOverview> => {
  const { data } = await axios.get<RevenueOverview>('/api/analytics/revenue/overview')
  return data
}

export const fetchRevenueTimeseries = async (range: '7d' | '30d' | '90d' = '30d'): Promise<RevenueTimeseriesPoint[]> => {
  const { data } = await axios.get<RevenueTimeseriesPoint[]>('/api/analytics/revenue/timeseries', {
    params: { range },
  })
  return data
}

