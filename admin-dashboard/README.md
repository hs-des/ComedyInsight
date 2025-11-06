# ComedyInsight Admin Dashboard

Modern admin dashboard for managing the ComedyInsight platform. Built with React + TypeScript + Vite.

## 🚀 Features

### Implemented
- ✅ **Authentication** - JWT-based admin login
- ✅ **Dashboard** - Statistics and recent activity
- ✅ **Videos Management** - List, create, edit, delete
- ✅ **Fake Views** - Campaign creation and execution
- ✅ **Protected Routes** - Route-based authentication
- ✅ **Responsive Layout** - Sidebar navigation

### Planned
- 🎯 Artists management
- 🎯 Categories management
- 🎯 Subtitles management
- 🎯 Homepage sections (drag-reorder)
- 🎯 Ads management
- 🎯 Users management
- 🎯 Subscriptions
- 🎯 Notifications composer
- 🎯 Audit logs

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Main layout with sidebar
│   │   └── ProtectedRoute.tsx  # Auth guard
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth state management
│   ├── pages/
│   │   ├── LoginPage.tsx       # Admin login
│   │   ├── Dashboard.tsx       # Stats dashboard
│   │   ├── VideosPage.tsx      # Video management
│   │   └── FakeViewsPage.tsx   # View campaigns
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

## 🛠️ Installation

```bash
cd admin-dashboard
npm install
```

## 🏃 Running

```bash
# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

## 📖 Usage

### Login
- Navigate to `http://localhost:5173`
- Use any credentials (dev mode)
- Redirects to dashboard on success

### Dashboard
- View platform statistics
- Monitor recent activity
- Quick navigation to sections

### Videos Page
- View all videos in table
- Upload new videos
- Edit/delete existing videos
- See video status and metrics

### Fake Views Page
- Create view boosting campaigns
- Set total views and duration
- Choose pattern (burst/steady)
- Execute campaigns
- Track progress

## 🎨 UI Components

### Dark Theme
- Background: `#0A0A0A` (gray-900)
- Surface: `#1A1A1A` (gray-800)
- Primary: `#FF6B35`
- Text: White/Gray scale

### Layout
- Sidebar navigation (fixed)
- Main content area (scrollable)
- Responsive grid layouts
- Modal overlays

## 🔌 API Integration

All API calls use the backend server:

```typescript
// API base URL configured in vite.config.ts
const response = await axios.get('/api/videos')
```

### Endpoints

**Authentication**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Dashboard stats

**Videos**
- `GET /api/videos` - List videos
- `POST /api/videos` - Create video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video

**Fake Views**
- `GET /api/admin/fake-views` - List campaigns
- `POST /api/admin/fake-views` - Create campaign
- `POST /api/admin/fake-views/:id/execute` - Execute campaign
- `DELETE /api/admin/fake-views/:id` - Delete campaign

## 🎯 Next Steps

1. **Complete remaining pages**:
   - Artists, Categories, Subtitles
   - Homepage sections with drag-reorder
   - Ads, Users, Subscriptions
   - Notifications and Audit logs

2. **Video Upload**:
   - Implement presigned URL flow
   - Add progress tracking
   - Show transcoding status

3. **Enhancements**:
   - Data tables with sorting/filtering
   - Advanced search
   - Bulk operations
   - Export functionality
   - Real-time updates

## 🔒 Security

- JWT token stored in localStorage
- Protected routes with auth guard
- API calls include auth headers
- CORS configured in backend

## 📝 License

MIT

