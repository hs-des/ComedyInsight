import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFile, FileRecord, getDownloadUrl } from '../../services/fileService'
import { Download, Eye, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNotifications } from '../../contexts/NotificationContext'

interface FileManagerTableProps {
  files: FileRecord[]
  isLoading: boolean
  selectedIds: Set<string>
  onToggleSelect: (fileId: string, selected: boolean) => void
  onToggleAll: (selected: boolean) => void
  onPreview: (file: FileRecord) => void
  onBulkDelete: (ids: string[]) => void
  bulkDeleting: boolean
}

export default function FileManagerTable({ files, isLoading, selectedIds, onToggleSelect, onToggleAll, onPreview, onBulkDelete, bulkDeleting }: FileManagerTableProps) {
  const queryClient = useQueryClient()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const { notify } = useNotifications()
  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] })
      notify({ title: 'File deleted', description: 'The selected file was removed.', variant: 'success' })
    },
    onError: () => notify({ title: 'Delete failed', description: 'Unable to delete file right now.', variant: 'error' }),
  })

  const handleDownload = async (fileId: string) => {
    setDownloadingId(fileId)
    try {
      const url = await getDownloadUrl(fileId)
      window.open(url, '_blank')
      notify({ title: 'Download started', description: 'Generating secure link…', variant: 'info' })
    } finally {
      setDownloadingId(null)
    }
  }

  const allSelected = files.length > 0 && files.every((file) => selectedIds.has(file.id))

  return (
    <div className="rounded-xl border border-gray-200 bg-white/90 dark:border-gray-700 dark:bg-gray-900/60">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <thead className="bg-white/70 text-slate-500 uppercase text-xs tracking-wide dark:bg-gray-900/60 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
                checked={allSelected}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Size</th>
            <th className="px-4 py-3 text-left">Uploaded</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-slate-700 dark:divide-gray-800 dark:text-gray-200">
          {isLoading &&
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`}>
                <td className="px-4 py-4">
                  <div className="skeleton h-4 w-4 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="skeleton mb-2 h-4 w-40 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="skeleton h-4 w-24 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="skeleton ml-auto h-4 w-16 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="skeleton h-4 w-28 rounded" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <div className="skeleton h-8 w-8 rounded-lg" />
                    <div className="skeleton h-8 w-8 rounded-lg" />
                    <div className="skeleton h-8 w-8 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          {!isLoading && files.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                No files uploaded yet.
              </td>
            </tr>
          )}
          {files.map((file) => (
            <tr key={file.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 bg-white text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                  checked={selectedIds.has(file.id)}
                  onChange={(event) => onToggleSelect(file.id, event.target.checked)}
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900 dark:text-white">{file.file_name}</div>
                <div className="text-xs text-slate-500 dark:text-gray-500">{file.bucket}</div>
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{file.content_type}</td>
              <td className="px-4 py-3 text-right text-slate-600 dark:text-gray-300">{formatBytes(file.size_bytes)}</td>
              <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{new Date(file.uploaded_at).toLocaleString()}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white"
                    onClick={() => onPreview(file)}
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white disabled:opacity-60"
                    onClick={() => handleDownload(file.id)}
                    disabled={downloadingId === file.id}
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    className="p-2 rounded-lg border border-red-500/40 text-red-300 hover:text-red-200 disabled:opacity-50"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-t border-gray-800 bg-gray-900/70 px-4 py-3 text-sm text-gray-300">
          <span>{selectedIds.size} selected</span>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-medium text-red-300 hover:text-red-200"
            onClick={() => onBulkDelete(Array.from(selectedIds))}
            disabled={bulkDeleting}
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
        </div>
      )}
    </div>
  )
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(1)} ${units[exponent]}`
}

