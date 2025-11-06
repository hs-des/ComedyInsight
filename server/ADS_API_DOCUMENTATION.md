# Ads API Documentation

Complete API documentation for ad management and tracking.

## Endpoints

### Get Ads

**GET** `/api/ads`

Query parameters:
- `position` (optional): Filter by position (home, pre_roll, sidebar, top_banner)
- `user_id` (optional): User ID for targeting
- `device_type` (optional): Device type

**Response:**
```json
{
  "ads": [
    {
      "id": "ad-uuid",
      "title": "Sponsored Content",
      "ad_type": "banner",
      "position": "home",
      "ad_url": "https://example.com/ad",
      "image_url": "https://example.com/image.jpg",
      "click_url": "https://example.com/click",
      "target_demographics": {}
    }
  ],
  "count": 1
}
```

### Track Impression

**POST** `/api/ads/track/impression`

Body:
```json
{
  "ad_id": "ad-uuid",
  "user_id": "user-uuid",  // Optional
  "device_type": "mobile",
  "platform": "ios"
}
```

**Response:**
```json
{
  "success": true
}
```

### Track Click

**POST** `/api/ads/track/click`

Body:
```json
{
  "ad_id": "ad-uuid",
  "user_id": "user-uuid",  // Optional
  "device_type": "mobile",
  "platform": "ios"
}
```

**Response:**
```json
{
  "success": true,
  "click_url": "https://example.com/ad/click"
}
```

### Get Analytics

**GET** `/api/ads/analytics`

Query parameters:
- `ad_id` (optional): Filter by ad ID
- `start_date` (optional): Start date for period

**Response:**
```json
{
  "analytics": [
    {
      "id": "ad-uuid",
      "title": "Sponsored Content",
      "impressions": 15000,
      "clicks": 450,
      "ctr": 3.0,
      "impressions_period": 5000,
      "clicks_period": 150
    }
  ]
}
```

## Usage Examples

### Fetch Home Banner Ads

```bash
curl http://localhost:3000/api/ads?position=home
```

### Track Impression

```bash
curl -X POST http://localhost:3000/api/ads/track/impression \
  -H "Content-Type: application/json" \
  -d '{
    "ad_id": "ad-uuid",
    "device_type": "mobile",
    "platform": "ios"
  }'
```

### Track Click

```bash
curl -X POST http://localhost:3000/api/ads/track/click \
  -H "Content-Type: application/json" \
  -d '{
    "ad_id": "ad-uuid",
    "device_type": "mobile",
    "platform": "ios"
  }'
```

### Get Analytics

```bash
curl http://localhost:3000/api/ads/analytics?start_date=2024-01-01
```

## Mobile Integration

### Fetch and Display Ads

```typescript
import { getAds, trackAdImpression, trackAdClick } from '../services/ad-tracking.service';

// Fetch ads
const ads = await getAds('home');

// Track impression
await trackAdImpression(adId);

// Track click
const clickUrl = await trackAdClick(adId);
```

## Database Tables

### ads

Main ad campaigns table with targeting and limits.

### ad_impressions

Track each ad view for analytics.

### ad_clicks

Track each ad click for analytics and attribution.

## Analytics Metrics

- **Impressions**: Total ad views
- **Clicks**: Total clicks
- **CTR**: Click-through rate (clicks / impressions)
- **Period Stats**: Filtered by date range

## Targeting

Currently supports:
- Position-based targeting
- Date-based scheduling
- Impression/click limits

Future enhancements:
- Geographic targeting
- Device-based targeting
- User segment targeting

