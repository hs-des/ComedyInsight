import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { Loader2, UploadCloud, CheckCircle2, XCircle } from 'lucide-react'
import { requestUpload, uploadToPresignedUrl } from '../../services/fileService'
import { useNotifications } from '../../contexts/NotificationContext'

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  message?: string
}

export default function FileUploadPanel() {
  const queryClient = useQueryClient()
  const { notify } = useNotifications()
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const presign = await requestUpload({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      })
      await uploadToPresignedUrl(presign.uploadUrl, file, (progress) => {
        setUploads((prev) =>
          prev.map((item) => (item.fileName === file.name ? { ...item, progress, status: 'uploading' } : item))
        )
      })
      setUploads((prev) =>
        prev.map((item) =>
          item.fileName === file.name ? { ...item, status: 'success', progress: 100, message: 'Uploaded' } : item
        )
      )
      queryClient.invalidateQueries({ queryKey: ['files'] })
      queryClient.invalidateQueries({ queryKey: ['storage-usage'] })
      notify({ title: 'Upload complete', description: `${file.name} ready to use`, variant: 'success' })
    },
    onError: (error: any, file) => {
      setUploads((prev) =>
        prev.map((item) =>
          item.fileName === file.name
            ? {
                ...item,
                status: 'error',
                message: error?.response?.data?.detail || 'Upload failed. Try again.',
              }
            : item
        )
      )
      notify({ title: 'Upload failed', description: error?.response?.data?.detail || 'Unable to upload file.', variant: 'error' })
    },
  })

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((file) => {
        setUploads((prev) => [
          ...prev,
          {
            fileName: file.name,
            progress: 0,
            status: 'uploading',
            message: 'Preparing upload...',
          },
        ])
        uploadMutation.mutate(file)
      })
    },
    [uploadMutation]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
  })

  return (
    <div className="settings-card space-y-4">
      <header>
        <h2 className="settings-card-title">Upload Files</h2>
        <p className="settings-card-subtitle">Drag and drop files or click to browse. Large files are uploaded directly to S3/MinIO.</p>
      </header>

      <div
        {...getRootProps()}
        className={`rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-900/40 hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto mb-4 text-primary" size={32} />
        <p className="text-sm text-gray-300">
          {isDragActive ? 'Drop files to upload' : 'Drag & drop files here, or click to select files'}
        </p>
        <p className="mt-2 text-xs text-gray-500">Maximum size is determined by your storage provider.</p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((upload) => (
            <div key={upload.fileName} className="rounded-lg border border-gray-700 bg-gray-900/60 px-4 py-3">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span className="font-medium">{upload.fileName}</span>
                <span>{upload.progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-800">
                <div
                  className={`h-2 rounded-full ${
                    upload.status === 'success' ? 'bg-emerald-500' : upload.status === 'error' ? 'bg-red-500' : 'bg-primary'
                  }`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {upload.status === 'uploading' && (
                  <>
                    <Loader2 className="animate-spin text-primary" size={14} />
                    <span className="text-gray-400">{upload.message}</span>
                  </>
                )}
                {upload.status === 'success' && (
                  <>
                    <CheckCircle2 className="text-emerald-400" size={14} />
                    <span className="text-emerald-300">{upload.message}</span>
                  </>
                )}
                {upload.status === 'error' && (
                  <>
                    <XCircle className="text-red-400" size={14} />
                    <span className="text-red-300">{upload.message}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

