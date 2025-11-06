# ComedyInsight API Documentation

Complete API documentation for the ComedyInsight backend.

## 📄 OpenAPI Specification

The API is documented using OpenAPI 3.0.3 specification.

**File**: `server/openapi.yml`

## 🚀 View Documentation

### Using Swagger UI

1. **Online (Quick Preview)**
   - Visit: https://editor.swagger.io/
   - Copy contents of `server/openapi.yml`
   - Paste into Swagger Editor
   - View interactive documentation

2. **Local Swagger UI**
   ```bash
   # Install Swagger UI
   npm install -g swagger-ui-serve

   # Serve the API docs
   swagger-ui-serve server/openapi.yml
   # Open browser to http://localhost:8080
   ```

3. **Using Docker**
   ```bash
   docker run -p 8080:8080 \
     -e SWAGGER_JSON=/api/openapi.yml \
     -v $(pwd)/server:/api \
     swaggerapi/swagger-ui
   ```

4. **Redoc**
   ```bash
   npm install -g redoc-cli
   redoc-cli serve server/openapi.yml
   ```

### Using Postman

1. Open Postman
2. File → Import
3. Select `server/openapi.yml`
4. API collection will be imported automatically

## 📋 API Overview

### Base URLs

- **Development**: `http://localhost:3000/api`
- **Production**: `https://api.comedyinsight.com`

### Authentication

All protected endpoints require JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Rate Limiting

- Public endpoints: 100 requests/minute
- Authenticated endpoints: 1000 requests/minute
- Admin endpoints: 5000 requests/minute

## 🔐 Authentication Endpoints

### Send OTP
**POST** `/auth/send-otp`

Send OTP code to phone number for verification.

**Request:**
```json
{
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "OTP sent to +1234567890",
  "expires_in": 300
}
```

### Verify OTP
**POST** `/auth/verify-otp`

Verify OTP and receive JWT tokens.

**Request:**
```json
{
  "phone": "+1234567890",
  "otp_code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "dGhpcyBp...",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-...",
    "username": "john_doe",
    "email": "john@example.com",
    "profile_picture_url": "..."
  }
}
```

### OAuth Login
**POST** `/auth/oauth`

Authenticate via OAuth (Google, Apple, Facebook).

**Request:**
```json
{
  "provider": "google",
  "access_token": "ya29.a0AfH6..."
}
```

**Response:** Same as Verify OTP

### Logout
**POST** `/auth/logout` 🔒

Invalidate user session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## 📺 Video Endpoints

### List Videos
**GET** `/videos`

Get paginated list of videos with filters.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `category` (UUID): Filter by category
- `artist` (UUID): Filter by artist
- `search` (string): Search in titles
- `is_premium` (boolean): Filter premium content
- `is_featured` (boolean): Filter featured content
- `sort` (string): Sort by (created_at, published_at, views, title)

**Example:**
```
GET /videos?page=1&limit=20&is_preatured=true&sort=views
```

**Response:**
```json
{
  "videos": [
    {
      "id": "550e8400-...",
      "title": "Funny Stand-up Special",
      "slug": "funny-stand-up",
      "thumbnail_url": "https://...",
      "duration_seconds": 3600,
      "is_premium": false,
      "visible_view_count": 15000,
      "artists": [...],
      "categories": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

### Get Video
**GET** `/videos/{id}`

Retrieve single video with full details.

**Response:** Single `VideoResponse` object

### Get Video Subtitles
**GET** `/videos/{id}/subtitles`

Get available subtitles for video.

**Query Parameters:**
- `language` (string): Filter by language code (en, es, fr, etc.)

**Response:**
```json
{
  "subtitles": [
    {
      "id": "550e8400-...",
      "language": "en",
      "subtitle_url": "https://..."
    },
    {
      "id": "550e8400-...",
      "language": "es",
      "subtitle_url": "https://..."
    }
  ]
}
```

### Get Video Manifest
**GET** `/videos/{id}/manifest` 🔒

Get streaming manifest URL (HLS/DASH).

**Query Parameters:**
- `format` (string): hls or dash (default: hls)

**Response:**
```json
{
  "manifest_url": "https://cdn.comedyinsight.com/manifest.m3u8",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

## 🏠 Homepage Endpoint

### Get Homepage
**GET** `/homepage` 🔒

Get homepage sections with featured content.

**Response:**
```json
{
  "sections": [
    {
      "id": "550e8400-...",
      "name": "featured",
      "title": "Featured Content",
      "layout_type": "horizontal",
      "display_order": 1,
      "items": [
        {
          "item_type": "video",
          "video": {...}
        }
      ]
    }
  ]
}
```

## ⭐ Favorites Endpoints

### Add Favorite
**POST** `/favorites` 🔒

Add video to user favorites.

**Request:**
```json
{
  "video_id": "550e8400-..."
}
```

**Response:**
```json
{
  "id": "550e8400-...",
  "user_id": "550e8400-...",
  "video_id": "550e8400-...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Get User Favorites
**GET** `/user/favorites` 🔒

Get all favorites for authenticated user.

**Query Parameters:** `page`, `limit`

**Response:** Paginated list of videos

## 📥 Downloads Endpoint

### Request Download
**POST** `/downloads/request` 🔒

Request download and get presigned URL.

**Request:**
```json
{
  "video_id": "550e8400-...",
  "quality": "720p"
}
```

**Response:**
```json
{
  "download_url": "https://s3.amazonaws.com/...",
  "expires_at": "2024-01-02T00:00:00Z",
  "file_size_mb": 1250.5
}
```

## 👁️ Views Endpoint

### Report View
**POST** `/views` 🔒

Record video view from client.

**Request:**
```json
{
  "video_id": "550e8400-...",
  "watched_seconds": 120
}
```

**Response:**
```json
{
  "message": "View recorded",
  "view_id": "550e8400-..."
}
```

## 💳 Subscription Endpoints

### Subscribe
**POST** `/subscribe` 🔒

Create new subscription.

**Request:**
```json
{
  "subscription_type": "monthly",
  "payment_method_id": "pm_1234567890"
}
```

**Response:**
```json
{
  "id": "550e8400-...",
  "subscription_type": "monthly",
  "status": "active",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-02-01T00:00:00Z"
}
```

### Get User Subscription
**GET** `/user/subscription` 🔒

Get current subscription status.

**Response:** `SubscriptionResponse` or `{"active": false}`

### Stripe Webhook
**POST** `/webhooks/stripe`

Handle Stripe webhook events (no auth required).

## 🛠️ Admin Endpoints

All admin endpoints require JWT with admin role.

### Videos CRUD

- **List**: `GET /admin/videos`
- **Create**: `POST /admin/videos`
- **Update**: `PUT /admin/videos/{id}`
- **Delete**: `DELETE /admin/videos/{id}`

**Create Request:**
```json
{
  "title": "New Comedy Special",
  "slug": "new-comedy-special",
  "description": "...",
  "video_url": "https://...",
  "video_type": "full",
  "quality": "1080p",
  "thumbnail_url": "https://...",
  "is_premium": true,
  "artist_ids": ["550e8400-..."],
  "category_ids": ["550e8400-..."]
}
```

### Artists CRUD

- **List**: `GET /admin/artists`
- **Create**: `POST /admin/artists`
- **Update**: `PUT /admin/artists/{id}`
- **Delete**: `DELETE /admin/artists/{id}`

### Categories CRUD

- **List**: `GET /admin/categories`
- **Create**: `POST /admin/categories`
- **Update**: `PUT /admin/categories/{id}`
- **Delete**: `DELETE /admin/categories/{id}`

### Subtitles

**Upload Subtitle**
**POST** `/admin/videos/{id}/subtitles` 🔒

```json
{
  "language": "en",
  "subtitle_url": "https://..."
}
```

### Homepage Management

**List Sections**: `GET /admin/homepage/sections` 🔒

**Create Section**: `POST /admin/homepage/sections` 🔒

**Add Item**: `POST /admin/homepage/sections/{id}/items` 🔒

### Ads Management

- **List**: `GET /admin/ads`
- **Create**: `POST /admin/ads`
- **Update**: `PUT /admin/ads/{id}`
- **Delete**: `DELETE /admin/ads/{id}`

### Fake Views Management

**Create Request**: `POST /admin/fake-views` 🔒

```json
{
  "video_id": "550e8400-...",
  "request_type": "boost",
  "fake_views_count": 1000,
  "notes": "Boosting views for promotion"
}
```

**Get Request**: `GET /admin/fake-views/{id}` 🔒

**Execute Request**: `POST /admin/fake-views/{id}/execute` 🔒

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## 🔑 Error Response Format

All error responses follow this format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

## 📝 Data Types

### UUIDs
All IDs are UUID v4 format:
```
550e8400-e29b-41d4-a716-446655440000
```

### Timestamps
All timestamps are ISO 8601 with timezone:
```
2024-01-01T12:00:00Z
```

### Phone Numbers
Phone numbers must be in E.164 format:
```
+1234567890
```

### Language Codes
Language codes are ISO 639-1 (2 letters):
```
en, es, fr, de, it, etc.
```

## 🔒 Security Best Practices

1. **Never expose JWT tokens** in client logs
2. **Always use HTTPS** in production
3. **Validate all inputs** on the server
4. **Implement rate limiting** to prevent abuse
5. **Use secure password hashing** (bcrypt)
6. **Implement CSRF protection** for state-changing operations
7. **Sanitize user inputs** to prevent injection
8. **Log security events** for audit trails

## 🧪 Testing the API

### Using cURL

```bash
# Get access token
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp_code": "123456"}'

# Use token to access protected endpoint
curl http://localhost:3000/api/homepage \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Postman

1. Import `openapi.yml` into Postman
2. Set environment variables:
   - `base_url`: http://localhost:3000/api
   - `access_token`: (auto-filled after auth)
3. Run collection

### Using JavaScript

```javascript
const API_BASE = 'http://localhost:3000/api';

// Authenticate
const authResponse = await fetch(`${API_BASE}/auth/verify-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+1234567890', otp_code: '123456' })
});

const { access_token } = await authResponse.json();

// Get videos
const videosResponse = await fetch(`${API_BASE}/videos`, {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

const videos = await videosResponse.json();
```

## 📚 Additional Resources

- **OpenAPI 3.0 Spec**: https://swagger.io/specification/
- **JWT Authentication**: https://jwt.io/
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **HTTP Status Codes**: https://httpstatuses.com/

## 🤝 Support

For API support:
- Check documentation: https://api.comedyinsight.com/docs
- Contact: api-support@comedyinsight.com
- Issues: https://github.com/comedyinsight/api/issues

