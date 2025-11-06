import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Video,
  Users,
  FolderOpen,
  TrendingUp,
  Settings,
  LogOut,
  LayoutDashboard,
  Eye,
  Bell,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/videos', icon: Video, label: 'Videos' },
  { path: '/artists', icon: Users, label: 'Artists' },
  { path: '/categories', icon: FolderOpen, label: 'Categories' },
  { path: '/subtitles', icon: Video, label: 'Subtitles' },
  { path: '/homepage', icon: LayoutDashboard, label: 'Homepage' },
  { path: '/ads', icon: TrendingUp, label: 'Ads' },
  { path: '/users', icon: Users, label: 'Users' },
  { path: '/subscriptions', icon: TrendingUp, label: 'Subscriptions' },
  { path: '/fake-views', icon: Eye, label: 'Fake Views' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/audit-logs', icon: Settings, label: 'Audit Logs' },
]

export default function Layout() {
  const { logout } = useAuth()
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <h1 className="text-2xl font-bold text-primary">ComedyInsight</h1>
          <p className="text-sm text-gray-400">Admin Dashboard</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout Button - Fixed at bottom */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-900">
        <div className="container mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

