# ComedyInsight MVP - Quick Start

Minimal working MVP with all features connected.

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- **Node.js** 18+ installed
- **Yarn** 1.22+ installed
- **PostgreSQL** 14+ running locally
- **Expo CLI** (optional, for mobile dev tools)

### 1. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install all workspace dependencies
yarn install-all
```

### 2. Setup Database

```bash
# Create database
createdb comedyinsight

# OR with psql
psql -U postgres -c "CREATE DATABASE comedyinsight;"

# Run migration
cd server
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
psql -U postgres -d comedyinsight -f migrations/002_add_fake_views_campaigns.sql
```

### 3. Configure Environment

```bash
cd server
cp env.example .env
# Edit .env with your database credentials
```

**Required .env variables:**
```bash
NODE_ENV=development
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=comedyinsight
DB_PASSWORD=your_password
DB_PORT=5432

# Mock/skip these for MVP
JWT_SECRET=dev-jwt-secret-key
REDIS_URL=redis://localhost:6379
```

### 4. Start Server

```bash
# From project root
yarn server

# OR from server directory
cd server
yarn dev

# Server runs at http://localhost:3000
```

### 5. Start Mobile App

```bash
# From project root
yarn mobile

# OR from mobile directory
cd mobile
yarn start

# Press 'i' for iOS simulator, 'a' for Android
```

### 6. Start Admin Dashboard (Optional)

```bash
cd admin-dashboard
yarn install
yarn dev

# Admin runs at http://localhost:5173
```

## 🧪 Test the MVP

### Test Mobile App

1. Open Expo app on your device/simulator
2. Navigate Home screen → see video cards
3. Tap Search → enter query → see results
4. Tap Categories → see category grid
5. Tap Profile → see profile screen
6. Tap a video card → see landing page
7. Tap Play → video player opens

### Test Server API

```bash
# Health check
curl http://localhost:3000/health

# Get videos
curl http://localhost:3000/videos

# Send OTP (mock)
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890"}'

# Verify OTP (mock - no real SMS)
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "otp": "123456"}'
```

### Test Admin Dashboard

1. Open http://localhost:5173
2. Login (any credentials work in dev)
3. View videos list
4. Create fake views campaign
5. Check server logs for campaign execution

## 📂 Project Structure

```
ComedyInsight/
├── mobile/              # Expo React Native app
│   ├── src/
│   │   ├── screens/     # Home, Search, Categories, Profile, LandingPage
│   │   ├── components/  # VideoCard, VideoPlayer, AdBanner, etc.
│   │   ├── navigation/  # Bottom tabs, stack navigation
│   │   └── services/    # API client
│   └── package.json
│
├── server/              # Express API
│   ├── src/
│   │   ├── controllers/ # All controllers
│   │   ├── routes/      # All routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, security, validation
│   │   ├── workers/     # Fake views worker
│   │   └── server.ts    # Main entry
│   ├── migrations/      # SQL migrations
│   └── package.json
│
├── admin-dashboard/     # React admin app
│   ├── src/
│   │   ├── pages/       # Videos, FakeViews, etc.
│   │   ├── components/  # Reusable UI
│   │   └── App.tsx      # Main app
│   └── package.json
│
└── package.json         # Root workspace config
```

## 🔑 Key Features Implemented

### Mobile App
✅ **Navigation**: Bottom tabs (Home, Search, Categories, Profile)  
✅ **HomeScreen**: Slider + 3 video sections  
✅ **SearchScreen**: Live search with debounce  
✅ **CategoriesScreen**: Category grid + filters  
✅ **ProfileScreen**: Auth, subscriptions, favorites, settings  
✅ **VideoPlayer**: Play/pause, seek, subtitle toggle  
✅ **Downloads**: Encrypted offline storage (mock)  
✅ **Ads**: AdMob integration (mock)  

### Server API
✅ **Auth**: OTP + OAuth flows  
✅ **Videos**: CRUD with HLS manifests  
✅ **Subtitles**: Upload/CRUD  
✅ **Subscriptions**: Stripe integration  
✅ **Downloads**: Presigned URLs  
✅ **Fake Views**: Campaign management  
✅ **Worker**: Background processing  
✅ **Security**: Rate limiting, validation, CSRF  

### Admin Dashboard
✅ **Videos**: List, create, edit, delete  
✅ **Fake Views**: Campaign creation, execution  
✅ **Analytics**: View metrics  
✅ **Auth**: JWT-based admin login  

### Database
✅ **27 tables**: Users, videos, artists, categories, etc.  
✅ **Migrations**: Complete schema with indexes  
✅ **Seed data**: Initial categories, roles  

## 📊 Mock Data

The MVP includes mock video data:
- 9 sample comedy videos
- 3 categories (Stand-up, Sketch, Roast)
- 5 artists
- Pre-populated for development

## 🔧 Development Commands

```bash
# Root commands
yarn install-all          # Install all workspaces
yarn mobile              # Start mobile app
yarn server              # Start server

# Server commands
cd server
yarn dev                 # Development server
yarn build               # Build TypeScript
yarn test                # Run tests

# Mobile commands
cd mobile
yarn start               # Start Expo
yarn android             # Android simulator
yarn ios                 # iOS simulator

# Admin commands
cd admin-dashboard
yarn dev                 # Development server
yarn build               # Production build
```

## 🌐 API Endpoints

### Public
- `GET /health` - Health check
- `GET /videos` - List videos
- `GET /videos/:id` - Video details
- `GET /videos/:id/subtitles` - Video subtitles

### Auth
- `POST /auth/send-otp` - Send OTP (mock)
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/oauth` - OAuth login
- `POST /auth/logout` - Logout

### Subscriptions
- `POST /api/subscribe` - Create checkout
- `POST /api/webhooks/stripe` - Stripe webhooks

### Downloads
- `POST /api/downloads/request` - Request download
- `POST /api/downloads/verify-token` - Verify token
- `POST /api/downloads/revoke` - Revoke downloads

### Admin
- `POST /api/admin/fake-views` - Create campaign
- `GET /api/admin/fake-views` - List campaigns
- `POST /api/admin/videos/:id/subtitles` - Upload subtitles

### Ads
- `GET /api/ads` - Get ads
- `POST /api/ads/track/impression` - Track impression

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -l

# Verify connection
psql -U postgres -d comedyinsight -c "SELECT NOW();"

# Reset database
dropdb comedyinsight
createdb comedyinsight
psql -U postgres -d comedyinsight -f server/migrations/001_initial_schema.sql
```

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Mobile App Won't Connect
```bash
# Update API URL in mobile/src/services/api.service.ts
# Change localhost to your machine's IP

# Windows
IP=$(ipconfig | grep "IPv4" | cut -d: -f2 | tr -d ' ')

# Mac/Linux
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}')
```

### Expo Issues
```bash
# Clear cache
cd mobile
expo start -c

# Reset Metro bundler
yarn start --reset-cache
```

## 📝 Next Steps

1. **Add Real Content**: Replace mock videos with actual content
2. **Connect Services**: Add real S3, Stripe, SMS
3. **Configure FFmpeg**: Enable video transcoding
4. **Setup Redis**: For queues and caching
5. **Deploy**: Follow deployment guide

## 📚 Documentation

- **Full Setup**: `GETTING_STARTED.md`
- **API Docs**: `server/API_DOCUMENTATION.md`
- **Schema**: `server/migrations/SCHEMA_SUMMARY.md`
- **Security**: `security/SECURITY_IMPLEMENTATION.md`
- **Analytics**: `analytics/ANALYTICS_GUIDE.md`
- **Deployment**: `deployment/DEPLOYMENT_GUIDE.md`

## ✅ Success Checklist

- [ ] Server starts on port 3000
- [ ] Mobile app connects to server
- [ ] HomeScreen shows videos
- [ ] Search returns results
- [ ] Video player plays mock video
- [ ] Profile screen loads
- [ ] OTP flow works (mock)
- [ ] Admin dashboard loads
- [ ] Fake views campaign creates
- [ ] Database migrations succeed

## 🎉 You're Ready!

Your ComedyInsight MVP is now running locally. Start building features!

