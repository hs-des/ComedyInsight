import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { NAV_ITEMS, NavItem } from '../../constants/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useMemo, useState } from 'react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const hasActiveChild = (item: NavItem, pathname: string): boolean => {
  if (!item.children) return false
  return item.children.some((child) => pathname.startsWith(child.path))
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const showFull = !collapsed || hovered

  const initials = useMemo(() => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    }
    return 'AD'
  }, [user])

  const displayName = user?.name ?? 'Admin User'
  const displayRole = user?.role ?? 'Administrator'

  const toggleGroup = (path: string) => {
    setOpenGroups((prev) => ({ ...prev, [path]: !prev[path] }))
  }

  const renderNavItems = (items: NavItem[], depth = 0) => (
    <ul className={`space-y-1 ${depth > 0 ? 'ml-2 border-l border-gray-800/40 pl-3' : ''}`}>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
        const parentActive = hasActiveChild(item, location.pathname)
        const isExpanded = item.children ? openGroups[item.path] ?? parentActive : false

        if (item.children && item.children.length > 0) {
          return (
            <li key={item.path}>
              <button
                type="button"
                onClick={() => toggleGroup(item.path)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  parentActive ? 'bg-primary/10 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  {Icon && <Icon size={18} />}
                  {showFull && <span>{item.label}</span>}
                </span>
                {showFull && (
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isExpanded ? 'rotate-180 text-primary' : 'text-gray-500'}`}
                  />
                )}
              </button>
              {showFull && isExpanded && <div className="mt-1">{renderNavItems(item.children, depth + 1)}</div>}
            </li>
          )
        }

        return (
          <li key={item.path}>
            <Link
              to={item.path}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive ? 'bg-primary text-white shadow-lg shadow-primary/10' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {Icon && <Icon size={18} />}
              {showFull && <span>{item.label}</span>}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <aside
      className={`group relative flex h-full flex-col border-r border-gray-800/60 bg-gray-900/90 backdrop-blur transition-all ${
        showFull ? 'w-64' : 'w-20'
      }`}
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => collapsed && setHovered(false)}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold">CI</div>
          {showFull && (
            <div>
              <p className="text-sm font-semibold text-white">ComedyInsight</p>
              <p className="text-xs text-gray-400">Admin Dashboard</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg border border-gray-700 bg-gray-900/60 p-2 text-gray-300 hover:border-primary/60 hover:text-white"
        >
          <span className="sr-only">Toggle sidebar</span>
          <div className="h-3 w-3 rotate-90 border-b border-r border-current" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {renderNavItems(NAV_ITEMS)}
      </nav>

      <div className="border-t border-gray-800/60 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-800/80 bg-gray-900/80 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            {initials}
          </div>
          {showFull && (
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{displayName}</p>
              <p className="text-xs text-gray-400">{displayRole}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="rounded-lg border border-red-500/40 px-2 py-1 text-xs font-medium text-red-200 transition hover:border-red-400 hover:text-red-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

