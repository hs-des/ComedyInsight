import { DownloadCloud, Settings2 } from 'lucide-react'
import { useNotifications } from '../../contexts/NotificationContext'

export default function ReportsPanel() {
  const { notify } = useNotifications()

  const handleExport = (format: 'csv' | 'pdf') => {
    notify({ title: 'Report queued', description: `Exporting dashboard metrics as ${format.toUpperCase()}.`, variant: 'info' })
    // Trigger export via API when backend is available.
  }

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reports & Exports</h3>
          <p className="text-xs text-slate-500 dark:text-gray-400">Generate CSV or PDF exports of current analytics.</p>
        </div>
        <button className="btn-secondary">
          <Settings2 size={14} />
          Configure
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={() => handleExport('csv')}>
          <DownloadCloud size={14} />
          Export CSV
        </button>
        <button className="btn-secondary" onClick={() => handleExport('pdf')}>
          <DownloadCloud size={14} />
          Export PDF
        </button>
      </div>
    </div>
  )
}

