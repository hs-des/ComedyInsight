export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'canceled';

export interface SubscriptionPlanSummary {
  id: string;
  name: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  billing_interval: 'monthly' | 'quarterly' | 'yearly';
  trial_days: number;
  is_active: boolean;
  metadata?: Record<string, unknown>;
}

