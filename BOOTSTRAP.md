# 🚀 Quick Bootstrap Guide

Follow these steps to get your ComedyInsight project up and running:

## 1️⃣ Initial Setup

```bash
# Install all dependencies for both workspaces
yarn install
```

## 2️⃣ PostgreSQL Setup

```bash
# Install PostgreSQL (if not already installed)
# macOS:
brew install postgresql
brew services start postgresql

# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows:
# Download from https://www.postgresql.org/download/windows/
# Or use chocolatey:
choco install postgresql
```

Create the database:
```bash
# Create database
createdb comedyinsight

# Or using psql:
psql -U postgres
CREATE DATABASE comedyinsight;
\q
```

## 3️⃣ Server Configuration

```bash
cd server
cp env.example .env
```

Edit `server/.env`:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=comedyinsight
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## 4️⃣ Verify Installation

Test the server:
```bash
# Start server
yarn server

# In another terminal, test health endpoint:
curl http://localhost:3000/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "...",
#   "database": "connected"
# }
```

## 5️⃣ Mobile App Setup

```bash
# Start mobile app
yarn mobile

# Or:
cd mobile
yarn start
```

Choose your platform:
- Press `i` for iOS simulator (requires macOS + Xcode)
- Press `a` for Android emulator (requires Android Studio)
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

## 6️⃣ Install Expo CLI (Optional)

```bash
npm install -g expo-cli
```

Or use npx (already bundled):
```bash
npx expo --version
```

## 7️⃣ Add Mobile Assets

Replace placeholder assets in `mobile/assets/`:

```bash
# Required files:
mobile/assets/icon.png           # 1024x1024 app icon
mobile/assets/splash.png         # 2048x2048 splash screen
mobile/assets/adaptive-icon.png  # 1024x1024 Android adaptive icon
mobile/assets/favicon.png        # 48x48 web favicon
```

Generate assets online:
- https://www.appicon.co/
- https://icon.kitchen/
- https://expo.dev/accounts/[your-account]/projects/comedyinsight/app-icon

## 8️⃣ Development Workflow

### Terminal 1 - Mobile:
```bash
yarn mobile
```

### Terminal 2 - Server:
```bash
yarn server
```

### Terminal 3 - Run commands as needed:
```bash
# Install new package in mobile
yarn workspace mobile add <package-name>

# Install new package in server
yarn workspace server add <package-name>

# Run linters
yarn workspace mobile lint
yarn workspace server lint
```

## 9️⃣ Common Issues & Solutions

### Database Connection Error
```bash
# Check if PostgreSQL is running
pg_isready

# Check database exists
psql -U postgres -l | grep comedyinsight

# Reset password
psql -U postgres
ALTER USER postgres PASSWORD 'new_password';
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000          # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>          # macOS/Linux
taskkill /PID <PID> /F # Windows
```

### Metro Bundler Cache Issues
```bash
# Clear cache
watchman watch-del-all

# Reset Metro
yarn workspace mobile start --clear

# Or remove node_modules
rm -rf node_modules mobile/node_modules server/node_modules
yarn install
```

### TypeScript Errors
```bash
# Rebuild
yarn workspace server build

# Check types
yarn workspace server npx tsc --noEmit
yarn workspace mobile npx tsc --noEmit
```

## 🔟 Next Steps

1. ✅ Set up authentication (JWT, Passport)
2. ✅ Create API routes and controllers
3. ✅ Set up database migrations (Knex/TypeORM)
4. ✅ Configure navigation in mobile app
5. ✅ Add state management (Redux/Zustand)
6. ✅ Set up error boundaries
7. ✅ Add testing (Jest/Vitest)
8. ✅ Configure CI/CD pipeline

## 📱 Testing on Physical Devices

### iOS
1. Install Expo Go from App Store
2. Scan QR code from terminal
3. App loads on device

### Android
1. Install Expo Go from Play Store
2. Scan QR code from terminal
3. App loads on device

Make sure your phone and computer are on the same WiFi network!

## 🌐 Environment Variables

### Mobile (Expo)
```bash
# Create app.config.js if needed
# Or use app.json "extra" field
```

### Server
```bash
# Always use .env file
# Never commit .env to git
```

## 🎉 Success!

Your app should now be running at:
- Server API: http://localhost:3000
- Mobile App: http://localhost:8081 (Expo)

Happy coding! 🎭

