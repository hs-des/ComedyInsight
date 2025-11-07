import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import VideosPage from './pages/VideosPage'
import UploadVideoPage from './pages/UploadVideoPage'
import EditVideoPage from './pages/EditVideoPage'
import FakeViewsPage from './pages/FakeViewsPage'
import ArtistsPage from './pages/ArtistsPage'
import AddArtistPage from './pages/AddArtistPage'
import EditArtistPage from './pages/EditArtistPage'
import CategoriesPage from './pages/CategoriesPage'
import AddCategoryPage from './pages/AddCategoryPage'
import EditCategoryPage from './pages/EditCategoryPage'
import HomepageConfigurationPage from './pages/HomepageConfigurationPage'
import SubtitlesPage from './pages/SubtitlesPage'
import UsersPage from './pages/UsersPage'
import AddUserPage from './pages/AddUserPage'
import SubscriptionsPage from './pages/SubscriptionsPage'
import AdsPage from './pages/AdsPage'
import AddAdsPage from './pages/AddAdsPage'
import NotificationsPage from './pages/NotificationsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import ProtectedRoute from './components/ProtectedRoute'
import SettingsPage from './pages/SettingsPage'
import FilesPage from './pages/FilesPage'
import NotificationCenter from './components/common/NotificationCenter'
import Toaster from './components/ui/Toaster'

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
              <Route path="/videos" element={<VideosPage />} />
              <Route path="/videos/upload" element={<UploadVideoPage />} />
              <Route path="/videos/edit/:id" element={<EditVideoPage />} />
              <Route path="/fake-views" element={<FakeViewsPage />} />
              <Route path="/artists" element={<ArtistsPage />} />
              <Route path="/artists/add" element={<AddArtistPage />} />
              <Route path="/artists/edit/:id" element={<EditArtistPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/add" element={<AddCategoryPage />} />
              <Route path="/categories/edit/:id" element={<EditCategoryPage />} />
              <Route path="/subtitles" element={<SubtitlesPage />} />
              <Route path="/homepage" element={<HomepageConfigurationPage />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/ads/add" element={<AddAdsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/add" element={<AddUserPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
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

