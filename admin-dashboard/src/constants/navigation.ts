import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Video,
  Users,
  FolderOpen,
  TrendingUp,
  Eye,
  Bell,
  ScrollText,
  HardDrive,
  SlidersHorizontal,
} from 'lucide-react'

export interface NavItem {
  path: string
  label: string
  icon?: LucideIcon
  children?: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    path: '/videos',
    icon: Video,
    label: 'Videos',
    children: [
      { path: '/videos', label: 'Library' },
      { path: '/videos/upload', label: 'Upload Video' },
      { path: '/subtitles', label: 'Subtitles' },
    ],
  },
  {
    path: '/artists',
    icon: Users,
    label: 'Artists',
    children: [
      { path: '/artists', label: 'All Artists' },
      { path: '/artists/new', label: 'Add Artist' },
    ],
  },
  {
    path: '/categories',
    icon: FolderOpen,
    label: 'Categories',
    children: [
      { path: '/categories', label: 'All Categories' },
      { path: '/categories/new', label: 'Add Category' },
    ],
  },
  { path: '/homepage', icon: LayoutDashboard, label: 'Homepage' },
  {
    path: '/monetization',
    icon: TrendingUp,
    label: 'Monetization',
    children: [
      { path: '/monetization/plans', label: 'Subscription Plans' },
      { path: '/monetization/admob', label: 'AdMob Settings' },
      { path: '/ads', label: 'Ads Inventory' },
    ],
  },
  {
    path: '/users',
    icon: Users,
    label: 'Users',
    children: [
      { path: '/users', label: 'Directory' },
      { path: '/users/add', label: 'Invite User' },
    ],
  },
  { path: '/analytics/revenue', icon: Eye, label: 'Revenue Analytics' },
  { path: '/fake-views', icon: Eye, label: 'Fake Views' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/audit-logs', icon: ScrollText, label: 'Audit Logs' },
  { path: '/files', icon: HardDrive, label: 'Files' },
  { path: '/settings', icon: SlidersHorizontal, label: 'Settings' },
]

export const NAV_LABEL_LOOKUP = NAV_ITEMS.reduce<Record<string, string>>((acc, item) => {
  const stack: NavItem[] = [item]
  while (stack.length) {
    const current = stack.pop()!
    acc[current.path] = current.label
    if (current.children) {
      stack.push(...current.children)
    }
  }
  return acc
}, {})

