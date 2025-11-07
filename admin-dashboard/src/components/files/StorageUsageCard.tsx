import { useQuery } from '@tanstack/react-query'
import { getStorageUsage } from '../../services/fileService'
import { HardDrive } from 'lucide-react'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(1)} ${units[index]}`
}

export default function StorageUsageCard() {
  const { data } = useQuery({
    queryKey: ['storage-usage'],
    queryFn: getStorageUsage,
  })

  return (
    <div className="settings-card flex items-center gap-4">
      <div className="rounded-full bg-primary/10 p-3">
        <HardDrive className="text-primary" size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-gray-400">Total Storage Used</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">{formatBytes(data?.total_size ?? 0)}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-gray-500">{data?.total_files ?? 0} files stored</p>
      </div>
    </div>
  )
}

