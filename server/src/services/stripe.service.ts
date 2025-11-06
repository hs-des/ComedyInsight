/**
 * Stripe Service
 */

import Stripe from 'stripe';
import { Pool } from 'pg';

const STRIPE_API_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export class StripeService {
  private stripe: Stripe;
  private db: Pool;

  constructor(db: Pool) {
    this.stripe = new Stripe(STRIPE_API_KEY, {
      apiVersion: '2023-10-16' as any,
    });
    this.db = db;
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ComedyInsight Premium',
              description: 'Access to premium comedy content',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: 999, // $9.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId: userId,
      },
    });

    return session;
  }

  /**
   * Create or retrieve customer
   */
  async getOrCreateCustomer(userId: string, email: string): Promise<Stripe.Customer> {
    // Check if customer exists in database
    const result = await this.db.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows[0]?.stripe_customer_id) {
      // Retrieve existing customer
      return await this.stripe.customers.retrieve(result.rows[0].stripe_customer_id) as Stripe.Customer;
    }

    // Create new customer
    const customer = await this.stripe.customers.create({
      email,
      metadata: {
        userId: userId,
      },
    });

    // Store customer ID in database
    await this.db.query(
      'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
      [customer.id, userId]
    );

    return customer;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
      return event;
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return await this.stripe.subscriptions.retrieve(subscriptionId);
  }
}

