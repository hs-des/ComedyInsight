import { Menu, Search } from 'lucide-react'
import Breadcrumbs from './Breadcrumbs'
import QuickActionsToolbar from './QuickActionsToolbar'
import ThemeToggle from '../ui/ThemeToggle'
import { useState } from 'react'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="sticky top-0 z-40 flex flex-col gap-4 border-b border-gray-800/60 bg-gray-900/70 px-6 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-gray-700 bg-gray-900/60 p-2 text-gray-300 hover:border-primary/60 hover:text-white lg:hidden" onClick={onMenuClick}>
            <Menu size={18} />
          </button>
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search videos, artists, categories…"
              className="w-full rounded-xl border border-gray-700 bg-gray-900/60 py-2 pl-9 pr-3 text-sm text-gray-200 placeholder:text-gray-500 focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <QuickActionsToolbar />
      </div>
    </div>
  )
}

