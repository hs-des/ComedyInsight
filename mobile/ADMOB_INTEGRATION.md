# AdMob Integration Guide

Complete AdMob integration for ComedyInsight mobile app.

## Overview

Google AdMob integration with banner, interstitial, and rewarded ads. Includes pre-roll ad insertion for free users and tracking.

## Features

✅ **Banner Ads** - Adaptive banners  
✅ **Interstitial Ads** - Full-screen pre-roll  
✅ **Rewarded Ads** - Optional video rewards  
✅ **Pre-Roll Logic** - Free users only  
✅ **Tracking** - Server-side analytics  

## Setup

### 1. Install Dependencies

```bash
cd mobile
yarn add react-native-google-mobile-ads
```

### 2. Configure AdMob

#### iOS

1. Add to `ios/Podfile`:
```ruby
pod 'Google-Mobile-Ads-SDK'
```

2. Run:
```bash
cd ios
pod install
```

#### Android

1. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-ads:22.0.0'
}
```

### 3. Get Ad Unit IDs

1. Create AdMob account: https://apps.admob.com
2. Add your app (iOS + Android)
3. Create ad units:
   - Banner: `ca-app-pub-XXXXX/XXXXX`
   - Interstitial: `ca-app-pub-XXXXX/XXXXX`
   - Rewarded: `ca-app-pub-XXXXX/XXXXX`

### 4. Add to app.json

```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-3940256099942544~3347511713",
        "iosAppId": "ca-app-pub-3940256099942544~1458002511"
      }
    ]
  ]
}
```

## Usage

### Banner Ads

```typescript
import { AdBanner } from '../components/AdBanner';

<AdBanner 
  size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  adId="server-ad-id"  // Optional: for tracking
/>
```

### Pre-Roll Interstitial

```typescript
import { usePreRollAd } from '../components/PreRollAd';

const { showPreRoll } = usePreRollAd();

const handlePlay = async () => {
  await showPreRoll();  // Shows ad for free users
  // Navigate to video player
};
```

### Rewarded Ads

```typescript
import { useRewardedAd } from '../components/RewardedAd';

const { showAd, loaded } = useRewardedAd();

const handleWatchAd = async () => {
  await showAd();
  // User earns reward
};
```

## Ad Positions

### Home Screen

```typescript
<AdBanner 
  size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  adId="home-banner"
/>
```

### Video Detail

```typescript
<AdBanner 
  size={BannerAdSize.LARGE_BANNER}
  adId="detail-banner"
/>
```

### Pre-roll (Before Video)

```typescript
import { usePreRollAd } from '../components/PreRollAd';

const { showPreRoll } = usePreRollAd();

const handlePlay = async () => {
  await showPreRoll();
  // Play video
};
```

## Pre-Roll Logic

Pre-roll ads are shown based on subscription status:

```typescript
const isFreeUser = isAuthenticated ? !user?.subscription_active : true;

if (isFreeUser && loaded) {
  await showAd();  // Show ad
} else {
  // Skip ad for subscribers
}
```

## Testing

### Test Ad Unit IDs

Use these IDs for development:

| Platform | Banner | Interstitial | Rewarded |
|----------|--------|--------------|----------|
| iOS | `ca-app-pub-3940256099942544/2934735716` | `ca-app-pub-3940256099942544/4411468910` | `ca-app-pub-3940256099942544/1712485313` |
| Android | `ca-app-pub-3940256099942544/6300978111` | `ca-app-pub-3940256099942544/1033173712` | `ca-app-pub-3940256099942544/5224354917` |

### Verify Ads Load

```bash
# Check logs for:
# "Banner ad loaded"
# "Interstitial ad loaded"
# "Rewarded ad loaded"
```

## Tracking

### Server-Side Tracking

All ads track to backend:

```typescript
import { trackAdImpression, trackAdClick } from '../services/ad-tracking.service';

// On ad load
trackAdImpression(adId);

// On ad click
const clickUrl = await trackAdClick(adId);
```

### Backend Endpoints

- `POST /api/ads/track/impression` - Track view
- `POST /api/ads/track/click` - Track click
- `GET /api/ads/analytics` - Get stats

## Sample Implementation

### Complete Flow

```typescript
import { usePreRollAd } from '../components/PreRollAd';
import { AdBanner } from '../components/AdBanner';

function VideoScreen() {
  const { showPreRoll } = usePreRollAd();

  const handlePlay = async () => {
    // 1. Show pre-roll ad (free users only)
    await showPreRoll();
    
    // 2. Navigate to player
    navigation.navigate('VideoPlayer', { video });
  };

  return (
    <View>
      {/* Video details */}
      
      {/* Banner ad */}
      <AdBanner adId="video-detail-banner" />
      
      {/* Play button */}
      <Button onPress={handlePlay}>Play</Button>
    </View>
  );
}
```

## Monetization

### Revenue Estimation

- **Banner**: $1-3 CPM
- **Interstitial**: $5-15 CPM
- **Rewarded**: $8-20 CPM

### Best Practices

1. **Don't overwhelm users** - Limit interstitial frequency
2. **Natural placement** - Ads between content sections
3. **Fast loading** - Cache ad requests
4. **Clear labels** - Mark ads as "Ad"
5. **User choice** - Offer ad-free subscription

## Troubleshooting

### Ads Not Loading

1. Check Ad Unit IDs
2. Verify app in AdMob console
3. Check internet connection
4. Review logs for errors

### Test Ads Not Showing

```typescript
// Use test IDs in development
unitId={__DEV__ ? TestIds.BANNER : productionUnitId}
```

### Production Issues

1. Verify live Ad Unit IDs
2. Check app approval status
3. Monitor AdMob console
4. Review server logs

## Production Checklist

- [ ] Live Ad Unit IDs configured
- [ ] App verified in AdMob
- [ ] Tracking working
- [ ] Pre-roll logic tested
- [ ] Banner placement optimized
- [ ] Subscription integration working
- [ ] Analytics dashboard ready

## Summary

Complete AdMob integration:
- ✅ Banner, interstitial, rewarded ads
- ✅ Pre-roll for free users
- ✅ Server-side tracking
- ✅ Subscription logic
- ✅ Production ready

