# ComedyInsight Mobile App Setup

Complete guide for the React Native + Expo mobile app.

## Quick Start

```bash
cd mobile
yarn install
yarn start
```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── VideoCard.tsx    # Video thumbnail card
│   │   └── AdBanner.tsx     # Advertisement banner
│   ├── screens/             # Screen components
│   │   ├── HomeScreen.tsx   # Main homepage
│   │   ├── CategoriesScreen.tsx
│   │   ├── SearchScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── VideoDetailScreen.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── AppNavigator.tsx # Root navigator
│   │   └── TabNavigator.tsx # Bottom tabs
│   ├── theme/               # Design system
│   │   ├── colors.ts        # Color palette
│   │   ├── typography.ts    # Text styles
│   │   └── spacing.ts       # Spacing system
│   └── data/                # Mock data
│       └── mockData.ts      # Sample videos
├── App.tsx                  # Root component
└── package.json             # Dependencies
```

## Features Implemented

### Navigation
- ✅ Bottom tab navigation (Home, Categories, Search, Profile)
- ✅ Stack navigation for nested screens
- ✅ Video detail screen with back navigation

### Home Screen
- ✅ Featured video slider with pagination
- ✅ New Releases section (horizontal scroll)
- ✅ Top Rated section
- ✅ By Artist section
- ✅ Advertisement banners between sections

### Components
- ✅ VideoCard with thumbnail, metadata, rating
- ✅ AdBanner placeholder
- ✅ Dark theme styling
- ✅ Responsive layout

### Styling
- ✅ Complete dark theme
- ✅ Typography system
- ✅ Spacing system
- ✅ Color palette

## Running the App

### Start Development Server

```bash
# From project root
yarn mobile

# Or from mobile directory
cd mobile
yarn start
```

### Run on Platforms

**iOS Simulator (macOS only):**
```bash
yarn ios
# or press 'i' in Expo dev tools
```

**Android Emulator:**
```bash
yarn android
# or press 'a' in Expo dev tools
```

**Web Browser:**
```bash
yarn web
# or press 'w' in Expo dev tools
```

**Physical Device:**
1. Install Expo Go app
2. Scan QR code from terminal
3. App loads on device

## Navigation Flow

```
AppNavigator
└── TabNavigator (Bottom Tabs)
    ├── Home → HomeScreen
    │   └── VideoCard → VideoDetailScreen
    ├── Categories → CategoriesScreen
    ├── Search → SearchScreen
    │   └── VideoCard → VideoDetailScreen
    └── Profile → ProfileScreen

Stack Navigator
└── VideoDetailScreen (accessed from cards)
```

## Screen Descriptions

### HomeScreen
- Featured slider at top
- Three horizontal video sections
- Ad banners between sections
- Infinite scroll
- Tap card → Video detail

### CategoriesScreen
- Grid of category cards
- Placeholder for browsing by category
- Icons and video counts

### SearchScreen
- Search input field
- Real-time filtering
- Empty states (no query, no results)
- Tap result → Video detail

### ProfileScreen
- User profile card
- Settings menu items
- Logout button
- Placeholder for user management

### VideoDetailScreen
- Full-screen thumbnail
- Video information
- Play/download/share buttons
- Description and details
- Ad banner
- Back navigation to previous screen

## Mock Data

All data is currently mocked in `src/data/mockData.ts`:

- **6 sample videos** with thumbnails
- **3 featured videos** for slider
- **4 artist profiles**
- Picsum placeholder images

To connect real API:
1. Update imports in screens
2. Replace mock data calls
3. Add loading states
4. Handle errors

## Theme Customization

Edit theme files:

**Colors** (`src/theme/colors.ts`):
```typescript
export const colors = {
  primary: '#FF6B35',  // Brand color
  background: '#0A0A0A', // Dark background
  // ... customize
};
```

**Typography** (`src/theme/typography.ts`):
```typescript
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  // ... customize
};
```

**Spacing** (`src/theme/spacing.ts`):
```typescript
export const spacing = {
  xs: 4,
  md: 16,
  xl: 32,
  // ... customize
};
```

## Adding New Screens

1. Create screen file: `src/screens/NewScreen.tsx`
2. Import and add to navigator
3. Add to tabs or stack as needed

## Components API

### VideoCard

```typescript
<VideoCard
  video={videoObject}
  onPress={(video) => navigation.navigate('VideoDetail', { video })}
  width={optionalWidth}
/>
```

### AdBanner

```typescript
<AdBanner height={optionalHeight} />
```

## Next Steps

### Required
1. Add real API integration
2. Implement authentication
3. Add actual video playback
4. Connect to backend
5. Add loading states
6. Implement error handling

### Enhancements
1. Add pull-to-refresh
2. Implement favorites
3. Add download functionality
4. Video player integration
5. Push notifications
6. Offline support
7. Analytics
8. Performance optimization

## Troubleshooting

### Metro Bundler Issues

```bash
# Clear cache
watchman watch-del-all
yarn start --clear
```

### Navigation Not Working

Ensure all dependencies installed:
```bash
yarn install
```

### Images Not Loading

Check network permissions and image URLs.

### TypeScript Errors

Run type check:
```bash
yarn tsc --noEmit
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## Support

For issues, check:
1. Expo dev server logs
2. Device console
3. Network tab for API calls
4. TypeScript errors

Happy coding! 🎭

