import axios, { AxiosRequestConfig } from 'axios'

export interface UploadRequestPayload {
  fileName: string
  contentType: string
  sizeBytes: number
  directory?: string
}

export interface UploadRequestResponse {
  fileId: string
  uploadUrl: string
  method: string
  expiresIn: number
}

export interface FileRecord {
  id: string
  file_name: string
  content_type: string
  size_bytes: number
  bucket: string
  key: string
  uploaded_at: string
  preview_url?: string | null
  download_url?: string | null
}

export interface FileListResponse {
  items: FileRecord[]
  page: number
  page_size: number
  total: number
}

export interface StorageUsage {
  total_files: number
  total_size: number
}

export const requestUpload = async (payload: UploadRequestPayload): Promise<UploadRequestResponse> => {
  const { data } = await axios.post<UploadRequestResponse>('/api/files/upload', {
    file_name: payload.fileName,
    content_type: payload.contentType,
    size_bytes: payload.sizeBytes,
    directory: payload.directory,
  })
  return data
}

export const uploadToPresignedUrl = async (url: string, file: File, onProgress?: (progress: number) => void): Promise<void> => {
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    onUploadProgress: (event) => {
      if (!event.total) return
      const percentage = Math.round((event.loaded / event.total) * 100)
      onProgress?.(percentage)
    },
  }
  await axios.put(url, file, config)
}

export const listFiles = async (page = 1, pageSize = 20): Promise<FileListResponse> => {
  const { data } = await axios.get<FileListResponse>('/api/files', {
    params: { page, page_size: pageSize },
  })
  return data
}

export const deleteFile = async (fileId: string): Promise<void> => {
  await axios.delete(`/api/files/${fileId}`)
}

export const getDownloadUrl = async (fileId: string): Promise<string> => {
  const { data } = await axios.get<{ url: string }>(`/api/files/${fileId}/download`)
  return data.url
}

export const getStorageUsage = async (): Promise<StorageUsage> => {
  const { data } = await axios.get<StorageUsage>('/api/files/storage-usage')
  return data
}

