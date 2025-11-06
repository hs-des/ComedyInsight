# 🏗️ ComedyInsight Project Structure

Complete file structure and quick reference for the ComedyInsight monorepo.

## 📂 Directory Tree

```
ComedyInsight/
│
├── 📄 Root Configuration
│   ├── package.json           # Yarn workspaces config
│   ├── .gitignore            # Git ignore rules
│   ├── LICENSE               # MIT License
│   ├── README.md             # Main documentation
│   ├── BOOTSTRAP.md          # Quick setup guide
│   └── PROJECT_STRUCTURE.md  # This file
│
├── 📱 mobile/                 # Expo + TypeScript App
│   ├── App.tsx               # Main app entry point
│   ├── app.json              # Expo configuration
│   ├── babel.config.js       # Babel transpiler config
│   ├── metro.config.js       # Metro bundler config
│   ├── tailwind.config.js    # Tailwind CSS config
│   ├── tsconfig.json         # TypeScript configuration
│   ├── package.json          # Mobile dependencies
│   │
│   └── assets/               # App assets (icons, images)
│       ├── icon.png          # 1024x1024 app icon
│       ├── splash.png        # 2048x2048 splash screen
│       ├── adaptive-icon.png # 1024x1024 Android icon
│       └── favicon.png       # 48x48 web favicon
│
└── 🖥️ server/                 # Express + TypeScript API
    ├── src/
    │   └── server.ts         # Express server & routes
    │
    ├── package.json          # Server dependencies
    ├── tsconfig.json         # TypeScript configuration
    ├── nodemon.json          # Nodemon dev config
    ├── .eslintrc.json        # ESLint config
    ├── .prettierrc           # Prettier formatting
    └── env.example           # Environment variables template
```

## 📋 File Descriptions

### Root Level

| File | Purpose |
|------|---------|
| `package.json` | Yarn workspaces configuration with root scripts |
| `.gitignore` | Git ignore patterns for node_modules, .env, etc. |
| `LICENSE` | MIT License file |
| `README.md` | Comprehensive project documentation |
| `BOOTSTRAP.md` | Step-by-step setup instructions |
| `PROJECT_STRUCTURE.md` | This file - structure reference |

### Mobile App (`/mobile`)

| File | Purpose |
|------|---------|
| `App.tsx` | Main React Native app component |
| `app.json` | Expo configuration (name, icon, splash, iOS/Android) |
| `package.json` | Mobile dependencies (React Native, Expo, navigation, etc.) |
| `tsconfig.json` | TypeScript config extending Expo base |
| `babel.config.js` | Babel presets for Expo |
| `metro.config.js` | Metro bundler configuration |
| `tailwind.config.js` | NativeWind/Tailwind CSS configuration |

### Server API (`/server`)

| File | Purpose |
|------|---------|
| `src/server.ts` | Express server, middleware, routes, health check |
| `package.json` | Server dependencies (Express, pg, cors, helmet, etc.) |
| `tsconfig.json` | TypeScript config for Node.js backend |
| `nodemon.json` | Nodemon auto-reload configuration |
| `.eslintrc.json` | ESLint TypeScript configuration |
| `.prettierrc` | Code formatting rules |
| `env.example` | Environment variables template |

## 🗂️ Key Dependencies

### Mobile Dependencies
```json
{
  "expo": "~51.0.0",
  "react": "18.2.0",
  "react-native": "0.74.0",
  "@react-navigation/native": "^6.1.0",
  "expo-av": "~14.0.0",
  "axios": "^1.6.0",
  "@react-native-async-storage/async-storage": "^1.23.0",
  "react-native-google-mobile-ads": "^14.0.0",
  "react-native-vector-icons": "^10.0.0",
  "nativewind": "^4.0.0"
}
```

### Server Dependencies
```json
{
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "dotenv": "^16.3.1",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0"
}
```

## 🎯 Core Scripts

### Root Commands
```bash
yarn install          # Install all workspace dependencies
yarn mobile           # Start Expo dev server
yarn server           # Start Express dev server
yarn build            # Build server TypeScript
yarn build:mobile     # Build mobile app for production
```

### Mobile Commands
```bash
yarn workspace mobile start     # Start Expo
yarn workspace mobile ios       # iOS simulator
yarn workspace mobile android   # Android emulator
yarn workspace mobile web       # Web browser
yarn workspace mobile build     # Production build
yarn workspace mobile lint      # ESLint check
```

### Server Commands
```bash
yarn workspace server dev       # Dev server with hot reload
yarn workspace server build     # Compile TypeScript
yarn workspace server start     # Production server
yarn workspace server lint      # ESLint check
yarn workspace server lint:fix  # Auto-fix lint issues
yarn workspace server format    # Prettier format
```

## 🔧 Configuration Details

### TypeScript
- **Mobile**: Extends `expo/tsconfig.base` with React Native settings
- **Server**: CommonJS, ES2020 target, strict mode enabled

### Node Versions
- **Node**: >= 18.0.0
- **Yarn**: >= 1.22.0

### Database
- **PostgreSQL** >= 14
- Connection pool via `pg`
- Environment-based configuration

### Security
- Helmet.js security headers
- CORS enabled
- Environment variables via dotenv
- .env files in .gitignore

## 📝 Next Steps

1. **Add Assets** - Replace placeholder icons in `mobile/assets/`
2. **Database Setup** - Run migrations, create schema
3. **Authentication** - Add JWT/Passport
4. **API Routes** - Create `/server/src/routes/`
5. **Navigation** - Set up React Navigation
6. **State Management** - Add Redux/Zustand
7. **Testing** - Add Jest/Vitest tests

## 🚀 Ready to Code!

Your ComedyInsight project is fully configured with:
- ✅ Yarn workspaces monorepo
- ✅ Expo + TypeScript mobile app
- ✅ Express + TypeScript + PostgreSQL API
- ✅ Development tooling (ESLint, Prettier, Nodemon)
- ✅ Complete documentation

Run `yarn install` and start building! 🎭

