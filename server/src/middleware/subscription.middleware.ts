/**
 * Subscription Middleware - Check if user has active subscription
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { SubscriptionRepository } from '../repositories/subscription.repository';

export const checkSubscription = (db: Pool) => {
  const subscriptionRepo = new SubscriptionRepository(db);

  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const isSubscribed = await subscriptionRepo.isUserSubscribed(userId);

      if (!isSubscribed) {
        return res.status(403).json({
          message: 'Premium subscription required',
          requiresSubscription: true,
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ message: 'Error checking subscription' });
    }
  };
};

