# 🎭 ComedyInsight

A full-stack mobile application with Express backend for comedy content insights.

## 📁 Project Structure

```
Comdy_insight/
├── mobile/              # Expo + TypeScript mobile app
│   ├── App.tsx         # Root component
│   ├── src/
│   │   ├── screens/    # Home, Search, Profile, etc.
│   │   ├── components/ # VideoCard, AdBanner, etc.
│   │   ├── navigation/ # Tab & Stack navigators
│   │   ├── theme/      # Colors, typography, spacing
│   │   └── data/       # Mock data
│   ├── package.json    # Mobile dependencies
│   └── tsconfig.json   # TypeScript config
├── admin-dashboard/    # React + Vite admin dashboard
│   ├── src/
│   │   ├── pages/      # Dashboard, Videos, Fake Views
│   │   ├── components/ # Layout, ProtectedRoute
│   │   └── contexts/   # Auth context
│   └── package.json    # Dashboard dependencies
├── server/             # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/# Auth, Subtitle controllers
│   │   ├── services/   # Business logic
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth, validation, audit
│   │   ├── types/      # TypeScript types
│   │   └── utils/      # Helpers
│   ├── migrations/     # Database migrations
│   ├── openapi.yml     # API specification
│   ├── package.json    # Server dependencies
│   └── tsconfig.json   # TypeScript config
├── package.json        # Root with Yarn workspaces
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **PostgreSQL** >= 14 (for server)
- **Expo CLI** (installed globally or via npx)

### Installation

1. **Clone and install dependencies:**
   ```bash
   yarn install
   ```

2. **Set up PostgreSQL database:**
   ```bash
   # Create database
   createdb comedyinsight

   # Or using psql:
   psql -U postgres
   CREATE DATABASE comedyinsight;
   ```

3. **Configure server environment:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start development servers:**

   **Terminal 1 - Mobile:**
   ```bash
   yarn mobile
   # or
   yarn workspace mobile start
   ```

   **Terminal 2 - Server:**
   ```bash
   yarn server
   # or
   yarn workspace server dev
   ```

## 📱 Mobile App Commands

```bash
# Start Expo dev server
yarn workspace mobile start

# Run on iOS simulator
yarn workspace mobile ios

# Run on Android emulator
yarn workspace mobile android

# Run on web
yarn workspace mobile web

# Build for production
yarn workspace mobile build
```

## 🖥️ Server Commands

```bash
# Start dev server with hot reload
yarn workspace server dev

# Build TypeScript to JavaScript
yarn workspace server build

# Start production server
yarn workspace server start

# Run linting
yarn workspace server lint

# Auto-fix linting issues
yarn workspace server lint:fix

# Format code with Prettier
yarn workspace server format
```

## 🔧 Root Commands

```bash
# Install all dependencies
yarn install

# Start mobile app
yarn mobile

# Start server
yarn server

# Build server
yarn build

# Build mobile
yarn build:mobile
```

## 📦 Mobile App Dependencies

- **expo** - React Native framework
- **expo-router** - File-based routing
- **@react-navigation/native** - Navigation library
- **expo-av** - Audio/Video playback
- **axios** - HTTP client
- **@react-native-async-storage/async-storage** - Local storage
- **react-native-google-mobile-ads** - Ads integration
- **react-native-vector-icons** - Icon library
- **nativewind** - Tailwind CSS for React Native

## 🗄️ Server Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **dotenv** - Environment variables
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP logger

## 🌐 API Endpoints

### Health Check
```
GET /health
```

Returns server and database connection status:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### API Info
```
GET /api
```

Returns API information:
```json
{
  "message": "ComedyInsight API",
  "version": "1.0.0"
}
```

## 📖 API Documentation

Complete OpenAPI 3.0 specification available:

```bash
# View API documentation
cat server/openapi.yml

# Use with Swagger UI
open https://editor.swagger.io/ and paste server/openapi.yml

# Or serve locally
npm install -g swagger-ui-serve
swagger-ui-serve server/openapi.yml
```

See `server/API_DOCUMENTATION.md` for detailed endpoint documentation.

## 🗄️ Database Setup

The server connects to PostgreSQL and uses a connection pool for managing connections.

### Environment Variables

Create `server/.env` from `.env.example`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=comedyinsight
DB_USER=postgres
DB_PASSWORD=your_password
```

### Running Migrations

Initial database schema is ready in `server/migrations/001_initial_schema.sql`.

Run the migration:
```bash
cd server
psql -U postgres -d comedyinsight -f migrations/001_initial_schema.sql
```

For more details, see `server/migrations/README.md`.

The migration includes:
- 27 tables with proper relationships
- UUID primary keys
- Full-text search indexes
- JSONB GIN indexes
- Auto-updating triggers
- Initial seed data (roles, permissions, categories)

## 🔐 Environment Setup

1. Mobile: Expo automatically handles environment variables through `app.json`
2. Server: Uses `.env` file in `server/` directory

## 🧪 Testing

### Mobile
```bash
yarn workspace mobile lint
```

### Server
```bash
yarn workspace server lint
yarn workspace server lint:fix
```

## 📝 Code Style

- **TypeScript** strict mode enabled
- **ESLint** for linting
- **Prettier** for formatting
- Follow existing code patterns

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running:
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql

   # Windows
   # Start via Services or pgAdmin
   ```

2. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Expo Issues

1. Clear cache:
   ```bash
   yarn workspace mobile start --clear
   ```

2. Reset Metro bundler:
   ```bash
   watchman watch-del-all
   ```

### Port Conflicts

- Mobile: Default `8081` (Metro)
- Server: Default `3000`
- Update ports in config if conflicts occur

## 📚 Next Steps

1. **Set up routing** - Configure navigation in mobile app
2. **Create API routes** - Add endpoints in `server/src/routes/`
3. **Database models** - Create schema and migrations
4. **Authentication** - Add JWT/Passport setup
5. **State management** - Add Redux/Context/Zustand
6. **Error handling** - Centralized error handling
7. **Testing** - Add Jest/Vitest tests

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run linters
4. Submit pull request

## 📄 License

MIT

---

**Happy coding! 🎉**

