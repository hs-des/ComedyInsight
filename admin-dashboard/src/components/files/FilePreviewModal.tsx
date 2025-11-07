import { X } from 'lucide-react'

interface FilePreviewModalProps {
  open: boolean
  onClose: () => void
  fileName: string
  contentType: string
  previewUrl?: string | null
  downloadUrl?: string | null
}

export default function FilePreviewModal({ open, onClose, fileName, contentType, previewUrl, downloadUrl }: FilePreviewModalProps) {
  if (!open) return null

  const isImage = contentType.startsWith('image/')
  const isPdf = contentType === 'application/pdf'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{fileName}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{contentType}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2 text-slate-500 hover:text-primary dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          {previewUrl ? (
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black/40">
              {isImage && <img src={previewUrl} alt={fileName} className="mx-auto max-h-[60vh] rounded-lg object-contain" />}
              {isPdf && <iframe src={previewUrl} title={fileName} className="h-[60vh] w-full rounded-lg bg-white" />}
              {!isImage && !isPdf && (
                <div className="text-sm text-slate-600 dark:text-gray-300">
                  Preview unavailable.
                  {downloadUrl && (
                    <>
                      {' '}
                      <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Download file
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-gray-800 dark:bg-black/40 dark:text-gray-400">
              Preview not available.
              {downloadUrl && (
                <>
                  {' '}
                  <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Download file
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

