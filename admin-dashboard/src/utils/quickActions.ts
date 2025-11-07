import { LucideIcon, Plus, UploadCloud, Users, Video, HardDrive, ShieldCheck, ClipboardList } from 'lucide-react'

export interface QuickActionConfig {
  id: string
  label: string
  to?: string
  icon: LucideIcon
  shortcut?: string
  description?: string
}

const baseActions: QuickActionConfig[] = [
  {
    id: 'upload-video',
    label: 'Upload Video',
    to: '/videos/upload',
    icon: UploadCloud,
    shortcut: 'shift+u',
  },
  {
    id: 'add-artist',
    label: 'Add Artist',
    to: '/artists/add',
    icon: Users,
    shortcut: 'shift+a',
  },
  {
    id: 'manage-files',
    label: 'Open File Manager',
    to: '/files',
    icon: HardDrive,
    shortcut: 'shift+f',
  },
]

export const getQuickActions = (pathname: string): QuickActionConfig[] => {
  const actions = [...baseActions]

  if (pathname.startsWith('/videos')) {
    actions.unshift({
      id: 'new-playlist',
      label: 'Create Playlist',
      to: '/videos?tab=playlists',
      icon: Plus,
      shortcut: 'shift+p',
    })
  }

  if (pathname.startsWith('/users')) {
    actions.unshift({
      id: 'audit-log',
      label: 'View Audit Logs',
      to: '/audit-logs',
      icon: ClipboardList,
      shortcut: 'shift+l',
    })
  }

  if (pathname.startsWith('/settings')) {
    actions.unshift({
      id: 'security-settings',
      label: 'Security Controls',
      to: '/settings?tab=security',
      icon: ShieldCheck,
      shortcut: 'shift+s',
    })
  }

  if (!pathname.startsWith('/videos')) {
    actions.push({
      id: 'browse-videos',
      label: 'Browse Videos',
      to: '/videos',
      icon: Video,
    })
  }

  return actions
}

