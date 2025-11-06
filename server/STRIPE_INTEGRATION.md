# Stripe Subscription Integration

Complete Stripe subscription integration for ComedyInsight.

## Overview

Secure subscription management with Stripe Checkout, webhooks, and access control.

## Features

✅ **Checkout Sessions** - One-click subscription  
✅ **Webhook Handling** - Real-time status updates  
✅ **Access Control** - Middleware for premium content  
✅ **Multiple Events** - Comprehensive subscription lifecycle  

## Architecture

```
User → /subscribe → Stripe Checkout → Payment → Webhook → Database
                                                          ↓
                                    Middleware → Premium Endpoint
```

## Environment Setup

Add to `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Getting Stripe Keys

1. **Secret Key**
   - Stripe Dashboard → Developers → API keys
   - Copy "Publishable key" (starts with `pk_`)
   - Copy "Secret key" (starts with `sk_test_` for test)

2. **Webhook Secret**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy signing secret (starts with `whsec_`)

## Database Migration

```bash
psql -U postgres -d comedyinsight -f migrations/003_add_stripe_columns.sql
```

## API Endpoints

### Create Checkout Session

**POST** `/api/subscribe`

Requires: JWT authentication

```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Webhook Endpoint

**POST** `/api/webhooks/stripe`

No authentication required (verified by signature)

Automatically handles events from Stripe.

## Webhook Events

### checkout.session.completed

User completes payment. Creates subscription in database.

### invoice.payment_succeeded

Recurring payment succeeded. Updates subscription status.

**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'active',
  end_date = CURRENT_TIMESTAMP + INTERVAL '1 month',
  auto_renew = true
WHERE stripe_subscription_id = 'sub_...';
```

### invoice.payment_failed

Payment failed. Sets subscription to expired.

**Database Update:**
```sql
UPDATE subscriptions SET status = 'expired'
WHERE stripe_subscription_id = 'sub_...';
```

### customer.subscription.updated

Subscription changed (e.g., cancelled, modified).

Updates all fields based on Stripe subscription.

### customer.subscription.deleted

Subscription cancelled or expired.

**Database Update:**
```sql
UPDATE subscriptions SET
  status = 'cancelled',
  cancelled_at = CURRENT_TIMESTAMP,
  auto_renew = false
WHERE stripe_subscription_id = 'sub_...';
```

## Access Control Middleware

### Check Subscription

Protect premium endpoints:

```typescript
import { checkSubscription } from './middleware/subscription.middleware';

router.get('/premium/videos/:id',
  authenticateToken,
  checkSubscription(db),  // Only subscribers allowed
  getPremiumVideo
);
```

**Response if not subscribed:**
```json
{
  "message": "Premium subscription required",
  "requiresSubscription": true
}
```

## Testing

### Local Testing

Use Stripe CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
```

### Test Cards

Use these test cards in Stripe Checkout:

| Card Number | Outcome |
|------------|---------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0025 0000 3155` | 3D Secure auth |

Use any future expiry date, any 3-digit CVC, any ZIP.

### Sample Webhook Payloads

#### checkout.session.completed

```json
{
  "id": "evt_123",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc",
      "customer": "cus_123",
      "subscription": "sub_123",
      "metadata": {
        "userId": "user-uuid"
      }
    }
  }
}
```

#### invoice.payment_succeeded

```json
{
  "id": "evt_456",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_123",
      "subscription": "sub_123",
      "amount_paid": 999
    }
  }
}
```

#### customer.subscription.deleted

```json
{
  "id": "evt_789",
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_123",
      "status": "canceled",
      "canceled_at": 1234567890
    }
  }
}
```

## Webhook Security

### Signature Verification

All webhooks are verified using Stripe's signature:

```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  STRIPE_WEBHOOK_SECRET
);
```

### Request Body

Webhook endpoints must receive raw body (not JSON-parsed):

```typescript
router.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handler
);
```

### Idempotency

Webhook handlers are idempotent. If the same webhook is delivered multiple times, the database remains consistent.

## Production Checklist

- [ ] Use live Stripe keys (not test)
- [ ] Configure production webhook endpoint
- [ ] Set secure `STRIPE_WEBHOOK_SECRET`
- [ ] Enable SSL/TLS
- [ ] Monitor webhook failures
- [ ] Set up alerting
- [ ] Test all webhook events
- [ ] Document pricing plans

## Pricing Plans

Current plan: **$9.99/month**

To add more plans:

```typescript
// stripe.service.ts
const plans = {
  monthly: {
    amount: 999,
    interval: 'month',
  },
  yearly: {
    amount: 9999,  // $99.99
    interval: 'year',
  },
};
```

## Error Handling

### Missing Secret Key

```json
{
  "message": "Stripe secret key not configured"
}
```

### Invalid Webhook Signature

```json
{
  "message": "Webhook signature verification failed: Invalid signature"
}
```

### Subscription Not Found

Webhook handler logs error and continues (prevents breaking other events).

## Monitoring

### Webhook Logs

```bash
# Check server logs
tail -f logs/server.log | grep "Webhook"
```

### Database Queries

```sql
-- Active subscriptions
SELECT COUNT(*) FROM subscriptions
WHERE status = 'active' AND end_date > CURRENT_TIMESTAMP;

-- Recent webhook activity
SELECT * FROM subscriptions
ORDER BY updated_at DESC
LIMIT 10;
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe Dashboard → Webhooks for failures
2. Verify endpoint URL is correct
3. Check `STRIPE_WEBHOOK_SECRET` is correct
4. Ensure raw body middleware is applied

### Subscription Not Created

1. Check webhook is being delivered
2. Verify `userId` in session metadata
3. Check server logs for errors
4. Verify database connection

### Access Denied for Subscribers

1. Verify subscription status in database
2. Check `end_date` is in the future
3. Confirm middleware is applied correctly

## Security Notes

### Secret Management

**Never commit secrets to git!**

Use environment variables:
```env
# Production
STRIPE_SECRET_KEY=sk_live_...

# Development
STRIPE_SECRET_KEY=sk_test_...
```

### Webhook Secrets

Rotate webhook secrets periodically:
1. Create new webhook endpoint in Stripe
2. Update `STRIPE_WEBHOOK_SECRET`
3. Verify old webhooks are cleared
4. Delete old endpoint

### PCI Compliance

This integration is PCI compliant. No card data touches your servers—all handled by Stripe.

## Summary

Complete Stripe integration with:
- ✅ Secure checkout sessions
- ✅ Real-time webhooks
- ✅ Database synchronization
- ✅ Access control middleware
- ✅ Comprehensive error handling
- ✅ Production-ready security

