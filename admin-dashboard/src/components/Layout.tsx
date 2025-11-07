import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Sidebar from './navigation/Sidebar'
import TopBar from './navigation/TopBar'
import QuickActionsFab from './navigation/QuickActionsFab'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 transition-colors dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity md:hidden ${mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileOpen(false)}
      />
      <div className={`fixed inset-y-0 left-0 z-50 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="relative h-[calc(100vh-5.5rem)] overflow-y-auto px-4 py-6 md:px-8">
          <Outlet />
          <QuickActionsFab />
        </main>
      </div>
    </div>
  )
}

