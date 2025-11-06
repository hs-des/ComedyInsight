# Stripe Integration - Test Examples

Quick test guide for Stripe subscription integration.

## Setup

### 1. Configure Environment

```bash
# Copy example env
cp env.example .env

# Add Stripe keys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
FRONTEND_URL=http://localhost:3000
```

### 2. Run Migration

```bash
psql -U postgres -d comedyinsight -f migrations/003_add_stripe_columns.sql
```

### 3. Start Server

```bash
cd server
yarn install
yarn dev
```

## Testing Checkout

### Create Checkout Session

```bash
# Get JWT token first
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.access_token')

# Create checkout session
curl -X POST http://localhost:3000/api/subscribe \
  -H "Authorization: Bearer $TOKEN" \
  | jq
```

**Response:**
```json
{
  "sessionId": "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

**Use the URL to complete checkout:**

Open the `url` in your browser and use test card: `4242 4242 4242 4242`

## Testing Webhooks (Local)

### Install Stripe CLI

```bash
# Mac
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_1.x.x_linux_x86_64.tar.gz
tar -xvf stripe_1.x.x_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Forward Webhooks

```bash
# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This will output:
```
Ready! Your webhook signing secret is whsec_... (^C to quit)
```

**Copy the secret and add to `.env`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart your server to pick up the new secret.

### Trigger Test Events

```bash
# Checkout completed
stripe trigger checkout.session.completed

# Payment succeeded
stripe trigger invoice.payment_succeeded

# Payment failed
stripe trigger invoice.payment_failed

# Subscription updated
stripe trigger customer.subscription.updated

# Subscription deleted
stripe trigger customer.subscription.deleted
```

## Manual Webhook Testing

### Send Test Webhook

```bash
# Get webhook secret from Stripe CLI
SECRET=$(stripe listen --print-secret)

# Send test event
stripe trigger checkout.session.completed

# Or manually create event
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: $(stripe signing_secret decrypt '...')" \
  -d '{
    "id": "evt_test",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "customer": "cus_test",
        "subscription": "sub_test",
        "metadata": {
          "userId": "user-uuid-here"
        }
      }
    }
  }'
```

## Test Cards

Use these in Stripe Checkout:

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure |

- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

## Verify Subscription

### Check Database

```sql
-- Active subscriptions
SELECT * FROM subscriptions
WHERE status = 'active';

-- User subscriptions
SELECT u.email, s.status, s.end_date
FROM users u
JOIN subscriptions s ON s.user_id = u.id
WHERE s.status = 'active';
```

### Check User Access

```bash
# Protected endpoint (requires subscription)
curl -X GET http://localhost:3000/api/premium/videos \
  -H "Authorization: Bearer $TOKEN"
```

**If not subscribed:**
```json
{
  "message": "Premium subscription required",
  "requiresSubscription": true
}
```

## Webhook Payload Examples

### checkout.session.completed

```json
{
  "id": "evt_1Ab2Cd3Ef4Gh5Ij",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_a1B2c3D4",
      "customer": "cus_M5N4O3P2Q1",
      "subscription": "sub_S9T8U7V6W5",
      "metadata": {
        "userId": "550e8400-e29b-41d4-a716-446655440000"
      },
      "amount_total": 999
    }
  }
}
```

### invoice.payment_succeeded

```json
{
  "id": "evt_2Xy3Zw4Ab5Cd6",
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "in_1Ab2Cd3Ef",
      "subscription": "sub_S9T8U7V6W5",
      "amount_paid": 999,
      "customer": "cus_M5N4O3P2Q1"
    }
  }
}
```

### customer.subscription.deleted

```json
{
  "id": "evt_3Mn4Op5Qr6St",
  "type": "customer.subscription.deleted",
  "data": {
    "object": {
      "id": "sub_S9T8U7V6W5",
      "status": "canceled",
      "customer": "cus_M5N4O3P2Q1",
      "canceled_at": 1698765432
    }
  }
}
```

## Troubleshooting

### Webhook Not Received

1. Check Stripe CLI is running: `stripe listen`
2. Verify `STRIPE_WEBHOOK_SECRET` matches CLI output
3. Ensure server restarted after adding secret
4. Check raw body middleware applied

### 400 Bad Request

Webhook signature verification failed. Check:
- Secret matches in `.env`
- Raw body middleware used
- Request body not modified

### Subscription Not Created

1. Check logs: `tail -f logs/server.log`
2. Verify `userId` in session metadata
3. Check database connection
4. Ensure user exists in database

### Access Denied

1. Verify subscription status:
```sql
SELECT * FROM subscriptions WHERE user_id = 'user-id-here';
```

2. Check end_date is in future:
```sql
SELECT * FROM subscriptions
WHERE user_id = 'user-id-here'
  AND end_date > CURRENT_TIMESTAMP;
```

## Complete Test Flow

```bash
# 1. Create user and get token
TOKEN="Bearer $(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.access_token')"

# 2. Create checkout session
SESSION=$(curl -s -X POST http://localhost:3000/api/subscribe \
  -H "Authorization: $TOKEN" \
  | jq -r '.url')

# 3. Open checkout
echo "Open: $SESSION"

# 4. Wait for completion, then verify
sleep 5

# 5. Check subscription created
curl -s "http://localhost:3000/api/subscription" \
  -H "Authorization: $TOKEN" | jq

# 6. Test premium endpoint
curl -s "http://localhost:3000/api/premium/videos" \
  -H "Authorization: $TOKEN" | jq
```

## Production Testing

### Switch to Live Mode

```env
STRIPE_SECRET_KEY=sk_live_your_live_key
```

### Webhook Endpoint

Set webhook endpoint in Stripe Dashboard:
```
https://your-domain.com/api/webhooks/stripe
```

### Test Complete Flow

1. Create live checkout session
2. Complete with real test card
3. Verify webhook received
4. Check subscription in database
5. Test access to premium content

## Summary

Complete testing setup:
- ✅ Local checkout with test cards
- ✅ Webhook forwarding with CLI
- ✅ All webhook events triggered
- ✅ Database verification
- ✅ Access control testing
- ✅ Production ready

