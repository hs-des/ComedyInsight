# Authentication Module

Complete authentication implementation for ComedyInsight API.

## Overview

The authentication module provides:
- **OTP-based phone authentication** with rate limiting
- **OAuth integration** (Google, Apple, Facebook)
- **JWT token management** (access + refresh tokens)
- **User management** with automatic account creation
- **Security features**: input sanitization, audit logging, error normalization

## Architecture

```
auth/
├── types/
│   └── auth.types.ts           # TypeScript interfaces and types
├── services/
│   ├── sms.service.ts          # SMS provider abstraction (Twilio)
│   ├── otp.service.ts          # OTP generation & verification
│   ├── jwt.service.ts          # JWT token management
│   └── oauth.service.ts        # OAuth provider verification
├── controllers/
│   └── auth.controller.ts      # Request handlers
├── repositories/
│   └── user.repository.ts      # User database operations
├── middleware/
│   ├── auth.middleware.ts      # JWT authentication
│   ├── validation.middleware.ts # Input sanitization
│   └── audit.middleware.ts     # Audit logging
└── routes/
    └── auth.routes.ts          # Route definitions
```

## Flow Diagrams

### OTP Authentication Flow

```
1. Client → POST /auth/send-otp { phone }
   ↓
2. Server checks rate limit (5/hour)
   ↓
3. Server generates OTP & saves to DB
   ↓
4. Server sends OTP via SMS (Twilio)
   ↓
5. Client → POST /auth/verify-otp { phone, otp_code }
   ↓
6. Server validates OTP (expiry, attempts)
   ↓
7. Server finds/creates user
   ↓
8. Server generates JWT tokens
   ↓
9. Server returns { access_token, user }
```

### OAuth Authentication Flow

```
1. Client obtains provider token (Google/Apple/FB)
   ↓
2. Client → POST /auth/oauth { provider, access_token }
   ↓
3. Server verifies token with provider API
   ↓
4. Server extracts user info (email, id, etc.)
   ↓
5. Server finds/creates OAuth account
   ↓
6. Server links to user (by email or creates new)
   ↓
7. Server generates JWT tokens
   ↓
8. Server returns { access_token, user }
```

## Environment Variables

Required variables (see `env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=comedyinsight
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key

# Twilio (optional for development)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

## Setup

### 1. Install Dependencies

```bash
cd server
yarn install
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your credentials
```

### 3. Run Database Migration

```bash
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
```

### 4. Start Server

```bash
yarn dev
```

## Testing

### Unit Tests

```bash
# Run all tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage
```

### Manual Testing

See `AUTH_API_EXAMPLES.md` for complete curl examples.

## Security Features

### 1. Rate Limiting
- **5 OTP requests per hour** per phone number
- Tracks verified OTPs and maxed attempts
- Returns 429 with retry-after time

### 2. Input Sanitization
- Strips HTML/script tags from inputs
- Validates phone format (E.164)
- Prevents injection attacks

### 3. Error Normalization
- Production: Generic error messages
- Development: Detailed error messages
- Prevents user enumeration

### 4. Audit Logging
- Logs all auth actions
- Stores in `audit_logs` table
- Includes user_id, action, timestamp

### 5. OTP Security
- 6-digit random codes
- 5-minute expiry
- 3 max verification attempts
- Auto-cleanup after 24h

### 6. JWT Security
- Signed with secret key
- Includes issuer and audience
- 7-day access token expiry
- 30-day refresh token expiry

## Database Tables

### phone_otps
- `id`, `phone`, `otp_code`
- `is_verified`, `expires_at`
- `attempt_count`, `max_attempts`
- `created_at`

### users
- `id`, `phone`, `email`, `username`
- `profile_picture_url`, `is_verified`
- `created_at`, `updated_at`, `last_login`

### oauth_accounts
- `id`, `user_id`, `provider`
- `provider_user_id`, `access_token`
- `refresh_token`, `created_at`

### audit_logs
- `id`, `user_id`, `action`
- `resource_type`, `resource_id`
- `old_values`, `new_values`, `created_at`

## Extending the Module

### Add New OAuth Provider

1. Update `OAuthProvider` enum in `auth.types.ts`
2. Add verification method in `oauth.service.ts`
3. Update OpenAPI spec

### Customize OTP Settings

Edit `otp.service.ts`:

```typescript
private otpExpiryMinutes: number = 5;
private maxOtpRequestsPerHour: number = 5;
private maxAttempts: number = 3;
```

### Change JWT Expiry

Edit `jwt.service.ts`:

```typescript
private accessTokenExpiry: string = '7d';
private refreshTokenExpiry: string = '30d';
```

## Common Issues

### SMS Not Sending

**Cause**: Twilio credentials not configured  
**Solution**: In development, SMS logs to console. Check server logs.

### Rate Limit Too Strict

**Cause**: Testing multiple times  
**Solution**: Use different phone numbers or wait 1 hour

### JWT Verification Fails

**Cause**: Wrong secret key or expired token  
**Solution**: Ensure `JWT_SECRET` matches between environments

### Database Connection Error

**Cause**: PostgreSQL not running or wrong credentials  
**Solution**: Check `.env` and verify database is running

## Performance Considerations

### Optimizations
- **Connection pooling**: Reuse DB connections
- **Indexed queries**: Fast phone/email lookups
- **Async operations**: Non-blocking I/O

### Scaling
- Use Redis for rate limiting
- Cache user lookups
- Implement token blacklist for logout

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure Twilio production credentials
- [ ] Enable HTTPS only
- [ ] Set up rate limiting (Redis)
- [ ] Configure CORS properly
- [ ] Enable audit logging
- [ ] Set up monitoring/alerts
- [ ] Run database indexes
- [ ] Configure backups
- [ ] Test all OAuth providers

## API Reference

See `../openapi.yml` for complete OpenAPI specification.

## Support

For issues or questions:
- Check `AUTH_API_EXAMPLES.md` for testing
- Review logs in `console.log` output
- Verify database migrations completed

