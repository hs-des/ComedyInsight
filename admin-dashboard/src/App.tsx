import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import FakeViewsPage from './pages/FakeViewsPage'
import HomepageConfigurationPage from './pages/HomepageConfigurationPage'
import AddUserPage from './pages/AddUserPage'
import AdsPage from './pages/AdsPage'
import AddAdsPage from './pages/AddAdsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import ProtectedRoute from './components/ProtectedRoute'
import SettingsPage from './pages/SettingsPage'
import FilesPage from './pages/FilesPage'
import NotificationCenter from './components/common/NotificationCenter'
import Toaster from './components/ui/Toaster'
import ArtistsList from './pages/artists/ArtistsList'
import ArtistForm from './pages/artists/ArtistForm'
import CategoriesList from './pages/categories/CategoriesList'
import CategoryForm from './pages/categories/CategoryForm'
import VideosList from './pages/videos/VideosList'
import VideoUpload from './pages/videos/VideoUpload'
import SubtitleManager from './pages/subtitles/SubtitleManager'
import AdMobSettings from './pages/monetization/AdMobSettings'
import SubscriptionPlans from './pages/monetization/SubscriptionPlans'
import UsersList from './pages/users/UsersList'
import UserDetail from './pages/users/UserDetail'
import RevenueDashboard from './pages/analytics/RevenueDashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
        <Router>
            <Toaster />
            <NotificationCenter />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/videos" element={<VideosList />} />
              <Route path="/videos/upload" element={<VideoUpload />} />
              <Route path="/videos/:videoId/edit" element={<VideoUpload />} />
              <Route path="/fake-views" element={<FakeViewsPage />} />
              <Route path="/artists" element={<ArtistsList />} />
              <Route path="/artists/new" element={<ArtistForm />} />
              <Route path="/artists/:artistId/edit" element={<ArtistForm />} />
              <Route path="/categories" element={<CategoriesList />} />
              <Route path="/categories/new" element={<CategoryForm />} />
              <Route path="/categories/:categoryId/edit" element={<CategoryForm />} />
              <Route path="/subtitles" element={<SubtitleManager />} />
              <Route path="/monetization/admob" element={<AdMobSettings />} />
              <Route path="/monetization/plans" element={<SubscriptionPlans />} />
              <Route path="/analytics/revenue" element={<RevenueDashboard />} />
              <Route path="/homepage" element={<HomepageConfigurationPage />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/ads/add" element={<AddAdsPage />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/users/manage" element={<UsersList />} />
              <Route path="/users/add" element={<AddUserPage />} />
              <Route path="/users/:userId" element={<UserDetail />} />
              <Route path="/subscriptions" element={<SubscriptionPlans />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/files" element={<FilesPage />} />
            </Route>
          </Routes>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

