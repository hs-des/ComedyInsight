import { Link } from 'react-router-dom'
import { ArrowUpRight, Settings, UploadCloud, Users } from 'lucide-react'
import { getQuickActions } from '../../utils/quickActions'
import { useQuickAccess } from '../../hooks/useQuickAccess'
import SkeletonBlock from '../common/SkeletonBlock'

export default function QuickAccessPanel() {
  const { data, isLoading } = useQuickAccess()
  const defaultActions = getQuickActions('/dashboard').slice(0, 3)
  const frequentActions = (data?.frequentlyUsed ?? defaultActions).filter((action) => Boolean(action.to))

  return (
    <div className="glass-panel p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Quick Access</h3>
          <p className="text-xs text-gray-400">Launch your most common workflows in a single click.</p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-9 w-32" />
            <SkeletonBlock className="h-9 w-32" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Frequent actions</p>
            <div className="flex flex-wrap gap-2">
              {frequentActions.map((action) => (
                <Link
                  key={action.id}
                  to={action.to!}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-700/60 px-3 py-2 text-xs font-medium text-gray-200 transition hover:border-primary/60 hover:text-white"
                >
                  <ArrowUpRight size={12} />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick settings</p>
            <div className="grid gap-2 text-sm text-gray-200">
              <Link to="/settings?tab=general" className="flex items-center gap-2 rounded-lg border border-gray-700/60 px-3 py-2 transition hover:border-primary/60 hover:text-white">
                <Settings size={14} /> General settings
              </Link>
              <Link to="/settings?tab=security" className="flex items-center gap-2 rounded-lg border border-gray-700/60 px-3 py-2 transition hover:border-primary/60 hover:text-white">
                <Users size={14} /> Security & access
              </Link>
              <Link to="/files" className="flex items-center gap-2 rounded-lg border border-gray-700/60 px-3 py-2 transition hover:border-primary/60 hover:text-white">
                <UploadCloud size={14} /> Manage storage
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recent files</p>
            <div className="mt-3 space-y-2">
              {(data?.recentFiles ?? []).slice(0, 5).map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border border-gray-800/60 bg-gray-900/60 px-3 py-2 text-xs text-gray-300">
                  <div>
                    <p className="font-medium text-gray-100">{file.name}</p>
                    <p className="text-[11px] text-gray-500">
                      {file.type} · {new Date(file.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  {file.path && (
                    <Link to={file.path} className="text-primary hover:underline">
                      Open
                    </Link>
                  )}
                </div>
              ))}
              {!data?.recentFiles?.length && (
                <div className="rounded-lg border border-dashed border-gray-700/60 bg-gray-900/40 px-3 py-6 text-center text-xs text-gray-500">
                  No recent files found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

