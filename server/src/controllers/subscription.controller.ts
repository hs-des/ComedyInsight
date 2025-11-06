/**
 * Subscription Controller
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';
import { StripeService } from '../services/stripe.service';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import Stripe from 'stripe';

export class SubscriptionController {
  private stripeService: StripeService;
  private subscriptionRepo: SubscriptionRepository;

  constructor(db: Pool) {
    this.stripeService = new StripeService(db);
    this.subscriptionRepo = new SubscriptionRepository(db);
  }

  /**
   * Create Stripe checkout session
   */
  createCheckout = async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/subscription/cancel`;

      const session = await this.stripeService.createCheckoutSession(userId, successUrl, cancelUrl);

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ message: error.message });
    }
  };

  /**
   * Handle Stripe webhook events
   */
  handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
      return res.status(400).json({ message: 'Missing stripe-signature' });
    }

    try {
      const event = this.stripeService.verifyWebhookSignature(
        req.body,
        sig as string
      );

      console.log('Webhook event received:', event.type);

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(400).json({ message: error.message });
    }
  };

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;

    if (!userId) {
      console.error('No userId in session metadata');
      return;
    }

    // Get subscription from Stripe
    const subscription = await this.stripeService.getSubscription(
      session.subscription as string
    );

    // Create subscription in database
    await this.subscriptionRepo.create({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      subscription_type: 'monthly',
      status: 'active',
      price: subscription.items.data[0].price.unit_amount || 0,
      currency: subscription.currency,
      start_date: new Date(subscription.current_period_start * 1000),
      end_date: new Date(subscription.current_period_end * 1000),
      auto_renew: subscription.cancel_at_period_end === false,
      cancelled_at: undefined,
    });

    console.log(`Subscription created for user ${userId}`);
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return;

    const subscription = await this.stripeService.getSubscription(subscriptionId);

    await this.subscriptionRepo.updateByStripeId(subscriptionId, {
      status: 'active',
      end_date: new Date(subscription.current_period_end * 1000),
      auto_renew: !subscription.cancel_at_period_end,
    });

    console.log(`Payment succeeded for subscription ${subscriptionId}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;

    if (!subscriptionId) return;

    // Update subscription status
    await this.subscriptionRepo.updateByStripeId(subscriptionId, {
      status: 'expired',
    });

    console.log(`Payment failed for subscription ${subscriptionId}`);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await this.subscriptionRepo.updateByStripeId(subscription.id, {
      status: subscription.status === 'active' ? 'active' : 'cancelled',
      end_date: new Date(subscription.current_period_end * 1000),
      auto_renew: !subscription.cancel_at_period_end,
      cancelled_at: subscription.cancel_at_period_end
        ? new Date(subscription.current_period_end * 1000)
        : undefined,
    });

    console.log(`Subscription updated: ${subscription.id}`);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await this.subscriptionRepo.updateByStripeId(subscription.id, {
      status: 'cancelled',
      cancelled_at: new Date(),
      auto_renew: false,
    });

    console.log(`Subscription cancelled: ${subscription.id}`);
  }
}

