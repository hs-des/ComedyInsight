/**
 * Stripe Types
 */

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
}

export interface StripePlan {
  id: string;
  productId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  intervalCount: number;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

