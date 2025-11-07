import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FileUploadPanel from '../components/files/FileUploadPanel'
import FileManagerTable from '../components/files/FileManagerTable'
import StorageUsageCard from '../components/files/StorageUsageCard'
import FilePreviewModal from '../components/files/FilePreviewModal'
import { ConfirmationDialog } from '../components/feedback/ConfirmationDialog'
import { deleteFile, FileRecord, listFiles } from '../services/fileService'
import { useNotifications } from '../contexts/NotificationContext'

export default function FilesPage() {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null)
  const [openPreview, setOpenPreview] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['files', 1, 50],
    queryFn: () => listFiles(1, 50),
  })

  const files = data?.items ?? []

  const toggleSelect = (fileId: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(fileId)
      } else {
        next.delete(fileId)
      }
      return next
    })
  }

  const toggleAll = (selected: boolean) => {
    if (!selected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(files.map((file) => file.id)))
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteFile(id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] })
      setSelectedIds(new Set())
      setConfirmOpen(false)
      setPendingDeleteIds([])
      notify({ title: 'Files deleted', description: 'Selected files were removed from storage.', variant: 'success' })
    },
    onError: () => notify({ title: 'Delete failed', description: 'Could not delete selected files.', variant: 'error' }),
  })

  const handlePreview = (file: FileRecord) => {
    setSelectedFile(file)
    setOpenPreview(true)
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">File Storage</h1>
        <p className="text-gray-400">
          Manage uploaded assets across videos, artists, and marketing collateral. Upload directly to S3/MinIO, preview files, and monitor usage.
        </p>
      </header>

      <StorageUsageCard />
      <FileUploadPanel />

      <section className="settings-card">
        <div className="settings-card-header">
          <div>
            <h2 className="settings-card-title">Stored Files</h2>
            <p className="settings-card-subtitle">Browse uploaded files. Preview images and documents directly in-browser.</p>
          </div>
        </div>
        <FileManagerTable
          files={files}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onPreview={handlePreview}
          onBulkDelete={(ids) => {
            setPendingDeleteIds(ids)
            setConfirmOpen(true)
          }}
          bulkDeleting={bulkDeleteMutation.isPending}
        />
      </section>

      {selectedFile && (
        <FilePreviewModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          fileName={selectedFile.file_name}
          contentType={selectedFile.content_type}
          previewUrl={selectedFile.preview_url}
          downloadUrl={selectedFile.download_url}
        />
      )}
      <ConfirmationDialog
        open={confirmOpen}
        title="Delete selected files?"
        description="This action cannot be undone. Files will be removed from storage and will no longer be accessible."
        confirmLabel="Delete files"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        loading={bulkDeleteMutation.isPending}
        onConfirm={() => {
          bulkDeleteMutation.mutate(pendingDeleteIds)
          setConfirmOpen(false)
          setSelectedIds(new Set())
        }}
      />
    </div>
  )
}

