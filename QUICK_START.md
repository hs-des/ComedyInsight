# ⚡ Quick Start - ComedyInsight

**Get running in under 2 minutes!**

## 🎯 One-Time Setup

### 1. Install Dependencies
```bash
yarn install
```

### 2. Set Up Database
```bash
# Create database
createdb comedyinsight

# Or via psql
psql -U postgres -c "CREATE DATABASE comedyinsight;"
```

### 3. Configure Server
```bash
# Copy environment template
cp server/env.example server/.env

# Edit server/.env with your PostgreSQL password
# DB_PASSWORD=your_password
```

## 🚀 Start Development

### Terminal 1 - Mobile App
```bash
yarn mobile
```
Then press: `i` (iOS) | `a` (Android) | `w` (Web)

### Terminal 2 - Server
```bash
yarn server
```

### Verify
```bash
# Test server health
curl http://localhost:3000/health

# Should see:
# {"status":"healthy","database":"connected"}
```

## ✅ That's It!

- Mobile: Expo dev server running
- Server: Express API on port 3000
- Database: PostgreSQL connected

## 📋 All Commands

```bash
# Root
yarn mobile              # Start mobile app
yarn server              # Start server
yarn build               # Build server

# Mobile
yarn workspace mobile start     # Start Expo
yarn workspace mobile ios       # iOS simulator  
yarn workspace mobile android   # Android emulator

# Server
yarn workspace server dev       # Dev server
yarn workspace server lint      # Lint code
```

## 📚 Need More Details?

- **Full Guide**: `GETTING_STARTED.md`
- **Quick Setup**: `BOOTSTRAP.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
- **Full Docs**: `README.md`

---

**Happy coding! 🎭**

