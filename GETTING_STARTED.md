# 🎯 Getting Started with ComedyInsight

Complete guide to bootstrap your ComedyInsight project from zero to running.

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** 18+ installed (`node --version`)
- [ ] **Yarn** 1.22+ installed (`yarn --version`)
- [ ] **PostgreSQL** 14+ installed and running
- [ ] **Git** installed (optional but recommended)

### Installing Prerequisites

#### macOS (via Homebrew)
```bash
# Install Node.js, Yarn, and PostgreSQL
brew install node@20
brew install yarn
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Verify installations
node --version  # Should be >= 18
yarn --version  # Should be >= 1.22
psql --version  # Should be >= 14
```

#### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt-get update && sudo apt-get install yarn

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Verify installations
node --version
yarn --version
psql --version
```

#### Windows
```bash
# Using Chocolatey package manager
choco install nodejs
choco install yarn
choco install postgresql

# Or download installers:
# Node.js: https://nodejs.org/
# Yarn: https://yarnpkg.com/getting-started/install
# PostgreSQL: https://www.postgresql.org/download/windows/
```

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

From the project root:

```bash
yarn install
```

This installs all dependencies for both `mobile` and `server` workspaces.

### Step 2: Set Up Database

```bash
# Create PostgreSQL database
createdb comedyinsight

# Or using psql interactively:
psql -U postgres
CREATE DATABASE comedyinsight;
\q
```

### Step 3: Configure Server

```bash
# Copy environment template
cp server/env.example server/.env

# Edit server/.env with your PostgreSQL credentials:
# DB_USER=postgres
# DB_PASSWORD=your_actual_password
# DB_NAME=comedyinsight
```

### Step 4: Start Development Servers

**Terminal 1 - Start Mobile:**
```bash
yarn mobile
```

**Terminal 2 - Start Server:**
```bash
yarn server
```

**Terminal 3 - Test Server Health:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy","timestamp":"...","database":"connected"}
```

### Step 5: Open Mobile App

After running `yarn mobile`, you'll see options:
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

## 📋 Verification Checklist

Run through these checks to ensure everything is working:

### ✅ Root Level
- [ ] `yarn install` completed without errors
- [ ] All workspaces listed in `package.json` are valid

### ✅ Server
- [ ] `yarn workspace server dev` starts without errors
- [ ] `curl http://localhost:3000/health` returns healthy status
- [ ] `curl http://localhost:3000/api` returns API info
- [ ] PostgreSQL connection is successful

### ✅ Mobile
- [ ] `yarn workspace mobile start` launches Metro bundler
- [ ] App displays "🎭 ComedyInsight" welcome screen
- [ ] No TypeScript errors in console

### ✅ Code Quality
- [ ] `yarn workspace server lint` shows no errors
- [ ] `yarn workspace mobile lint` shows no errors
- [ ] Prettier formatting is applied

## 🐛 Common Issues & Solutions

### Issue: PostgreSQL Connection Failed

**Symptoms:**
```
FATAL: password authentication failed
```

**Solutions:**
1. Check `.env` file has correct credentials
2. Reset PostgreSQL password:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'your_new_password';
   ```
3. Verify database exists:
   ```bash
   psql -U postgres -l | grep comedyinsight
   ```

### Issue: Port 3000 Already in Use

**Solutions:**
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in server/.env
PORT=3001
```

### Issue: Metro Bundler Cache Problems

**Solutions:**
```bash
# Clear watchman
watchman watch-del-all

# Clear Metro cache
yarn workspace mobile start --clear

# Nuclear option: reinstall
rm -rf node_modules mobile/node_modules server/node_modules
yarn install
```

### Issue: TypeScript Errors

**Solutions:**
```bash
# Rebuild server
yarn workspace server build

# Check types without emitting
yarn workspace server npx tsc --noEmit
yarn workspace mobile npx tsc --noEmit
```

### Issue: Expo CLI Not Found

**Solutions:**
```bash
# Install globally
npm install -g expo-cli

# Or use npx
npx expo --version

# Or use Yarn workspace
yarn workspace mobile npx expo start
```

## 📚 Next Steps

Once everything is running:

1. **Read Documentation**
   - `README.md` - Full project overview
   - `BOOTSTRAP.md` - Detailed setup guide
   - `PROJECT_STRUCTURE.md` - File structure reference

2. **Add Assets**
   - Replace placeholder icons in `mobile/assets/`
   - Generate icons at: https://www.appicon.co/

3. **Start Building**
   - Create API routes in `server/src/routes/`
   - Set up navigation in `mobile/`
   - Add database migrations

4. **Development Workflow**
   ```bash
   # Terminal 1: Server hot reload
   yarn server

   # Terminal 2: Mobile hot reload
   yarn mobile

   # Terminal 3: Run commands as needed
   yarn workspace server lint
   yarn workspace mobile lint
   ```

## 🎯 Development Commands Cheat Sheet

```bash
# Root
yarn install              # Install all dependencies
yarn mobile              # Start mobile app
yarn server              # Start server
yarn build               # Build server

# Mobile
yarn workspace mobile start     # Start Expo
yarn workspace mobile ios       # iOS simulator
yarn workspace mobile android   # Android emulator
yarn workspace mobile web       # Web browser
yarn workspace mobile lint      # Lint check

# Server
yarn workspace server dev       # Dev with reload
yarn workspace server build     # Compile TypeScript
yarn workspace server start     # Production mode
yarn workspace server lint      # Lint check
yarn workspace server lint:fix  # Auto-fix lint
yarn workspace server format    # Format code

# Testing
curl http://localhost:3000/health
curl http://localhost:3000/api
```

## 🎉 Success Indicators

You're all set when:
- ✅ Mobile app shows "🎭 ComedyInsight" welcome screen
- ✅ Server health endpoint returns healthy status
- ✅ No errors in terminal outputs
- ✅ Hot reload works in both terminals
- ✅ TypeScript compiles without errors

## 📞 Need Help?

- **Expo Docs**: https://docs.expo.dev/
- **Express Docs**: https://expressjs.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Yarn Workspaces**: https://yarnpkg.com/features/workspaces

Happy coding! 🎭

