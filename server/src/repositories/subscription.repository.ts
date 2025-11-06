/**
 * Subscription Repository
 */

import { Pool } from 'pg';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  subscription_type: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  price: number;
  currency: string;
  start_date: Date;
  end_date: Date;
  auto_renew: boolean;
  cancelled_at?: Date;
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class SubscriptionRepository {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async create(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<Subscription> {
    const query = `
      INSERT INTO subscriptions (
        user_id, stripe_subscription_id, stripe_customer_id, subscription_type,
        status, price, currency, start_date, end_date, auto_renew, cancelled_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      subscription.user_id,
      subscription.stripe_subscription_id,
      subscription.stripe_customer_id,
      subscription.subscription_type,
      subscription.status,
      subscription.price,
      subscription.currency,
      subscription.start_date,
      subscription.end_date,
      subscription.auto_renew,
      subscription.cancelled_at,
      subscription.metadata ? JSON.stringify(subscription.metadata) : null,
    ];
    const result = await this.db.query<Subscription>(query, values);
    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1';
    const result = await this.db.query<Subscription>(query, [userId]);
    return result.rows[0] || null;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1';
    const result = await this.db.query<Subscription>(query, [stripeSubscriptionId]);
    return result.rows[0] || null;
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(key === 'metadata' && value ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE subscriptions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
    const result = await this.db.query<Subscription>(query, values);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<Subscription | null> {
    const query = 'SELECT * FROM subscriptions WHERE id = $1';
    const result = await this.db.query<Subscription>(query, [id]);
    return result.rows[0] || null;
  }

  async updateByStripeId(stripeSubscriptionId: string, data: Partial<Subscription>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== 'id') {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(key === 'metadata' && value ? JSON.stringify(value) : value);
      }
    }

    if (fields.length === 0) return;

    values.push(stripeSubscriptionId);
    const query = `
      UPDATE subscriptions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE stripe_subscription_id = $${paramIndex};
    `;
    await this.db.query(query, values);
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM subscriptions
      WHERE user_id = $1
        AND status = 'active'
        AND end_date > CURRENT_TIMESTAMP
      LIMIT 1;
    `;
    const result = await this.db.query(query, [userId]);
    return result.rows.length > 0;
  }
}

