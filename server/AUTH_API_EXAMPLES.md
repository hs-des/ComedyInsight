# Authentication API Examples

Complete examples for testing the ComedyInsight authentication endpoints.

## Base URL

```bash
BASE_URL="http://localhost:3000"
```

## 1. Send OTP

Send OTP code to phone number.

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "message": "OTP sent to +1234567890",
  "expires_in": 300
}
```

**Error Responses:**

Rate limit exceeded (429):
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many OTP requests. Please try again later."
}
```

## 2. Verify OTP

Verify OTP code and receive JWT tokens.

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "otp_code": "123456"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+1234567890",
    "is_verified": false
  }
}
```

**Error Responses:**

Invalid OTP (401):
```json
{
  "error": "INVALID_OTP",
  "message": "Invalid OTP code"
}
```

Expired OTP (400):
```json
{
  "error": "OTP_EXPIRED",
  "message": "OTP code has expired"
}
```

Max attempts exceeded (429):
```json
{
  "error": "MAX_ATTEMPTS_EXCEEDED",
  "message": "Maximum verification attempts exceeded"
}
```

## 3. OAuth Login (Google)

Authenticate via Google OAuth.

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "access_token": "ya29.a0AfH6SMC..."
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 604800,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@gmail.com",
    "profile_picture_url": "https://...",
    "is_verified": true
  }
}
```

## 4. OAuth Login (Facebook)

Authenticate via Facebook OAuth.

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "facebook",
    "access_token": "EAAEb..."
  }'
```

## 5. OAuth Login (Apple)

Authenticate via Apple Sign-In (requires id_token).

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/oauth \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "apple",
    "access_token": "a.b.c...",
    "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
  }'
```

## 6. Logout

Invalidate user session.

**Request:**
```bash
curl -X POST ${BASE_URL}/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Complete Flow Example

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
PHONE="+1234567890"

echo "1. Sending OTP to ${PHONE}..."
curl -X POST ${BASE_URL}/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"${PHONE}\"}"

echo -e "\n\n2. Enter OTP code:"
read OTP_CODE

echo -e "\n3. Verifying OTP..."
RESPONSE=$(curl -s -X POST ${BASE_URL}/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"${PHONE}\", \"otp_code\": \"${OTP_CODE}\"}")

# Extract access token (requires jq)
ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')

echo -e "\n4. Access token received!"
echo "Token: ${ACCESS_TOKEN}"

echo -e "\n5. Testing protected endpoint..."
curl -X POST ${BASE_URL}/auth/logout \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"

echo -e "\n\nDone!"
```

## Using Saved Variables

Save access token for subsequent requests:

```bash
# Get token
ACCESS_TOKEN=$(curl -s -X POST ${BASE_URL}/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp_code": "123456"}' \
  | jq -r '.access_token')

# Use token
curl -X GET ${BASE_URL}/videos \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

## Testing Rate Limiting

Test rate limiting (5 requests per hour):

```bash
for i in {1..6}; do
  echo "Request $i"
  curl -s -X POST ${BASE_URL}/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"phone": "+1234567890"}' | jq '.'
  echo ""
done
```

The 6th request should return rate limit error.

## Error Testing

### Invalid Phone Format

```bash
curl -X POST ${BASE_URL}/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890"}'
```

Expected: Validation error (missing `+` prefix)

### Missing Fields

```bash
curl -X POST ${BASE_URL}/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'
```

Expected: `"Phone number and OTP code are required"`

### Expired OTP

```bash
# Wait 6 minutes after sending OTP
curl -X POST ${BASE_URL}/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp_code": "123456"}'
```

Expected: `"OTP_EXPIRED"`

## Environment Setup

For testing, ensure your `.env` file has:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=comedyinsight
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=test-secret-key-change-in-production

# Twilio (optional - will log to console in dev)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

## Postman Collection

Import these into Postman:

1. **Send OTP**
   - Method: POST
   - URL: `{{base_url}}/auth/send-otp`
   - Body: `{"phone": "+1234567890"}`

2. **Verify OTP**
   - Method: POST
   - URL: `{{base_url}}/auth/verify-otp`
   - Body: `{"phone": "+1234567890", "otp_code": "123456"}`
   - Tests: Save `access_token` to environment variable

3. **OAuth Google**
   - Method: POST
   - URL: `{{base_url}}/auth/oauth`
   - Body: `{"provider": "google", "access_token": "..."}`

4. **Logout**
   - Method: POST
   - URL: `{{base_url}}/auth/logout`
   - Headers: `Authorization: Bearer {{access_token}}`

## Notes

- Phone numbers must be in E.164 format: `+[country_code][number]`
- OTP expires in 5 minutes
- Rate limit: 5 OTPs per hour per phone
- Max verification attempts: 3
- JWT access token expires in 7 days
- Refresh token expires in 30 days

## Troubleshooting

### Database Connection Error

```bash
# Verify PostgreSQL is running
psql -U postgres -d comedyinsight -c "SELECT COUNT(*) FROM phone_otps;"
```

### JWT Secret Not Set

Ensure `.env` has `JWT_SECRET` set.

### SMS Not Sending

In development, SMS is logged to console. Check server logs for:
```
📱 [MOCK SMS] to +1234567890: Your ComedyInsight verification code is: 123456
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001
```

