import axios, { AxiosRequestConfig } from 'axios'
import type {
  Artist,
  ArtistFormValues,
  Category,
  CategoryFormValues,
  PaginatedResponse,
  Subtitle,
  SubtitlePayload,
  Video,
  VideoFormValues,
} from '../types/content'

export interface ListQueryParams {
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'inactive' | 'draft' | 'published' | 'archived'
  artistId?: string
  categoryId?: string
}

const mapPaginated = <T>(data: any): PaginatedResponse<T> => ({
  items: data.items ?? [],
  pagination: data.pagination ?? { total: 0, page: 1, page_size: data.items?.length ?? 0 },
})

export const fetchArtists = async (params: ListQueryParams = {}): Promise<PaginatedResponse<Artist>> => {
  const { page = 1, pageSize = 20, search, status } = params
  const { data } = await axios.get('/api/artists', {
    params: {
      page,
      page_size: pageSize,
      search,
      status_filter: status,
    },
  })
  return mapPaginated<Artist>(data)
}

export const createArtist = async (payload: ArtistFormValues): Promise<Artist> => {
  const { data } = await axios.post<Artist>('/api/artists', payload)
  return data
}

export const getArtist = async (id: string): Promise<Artist> => {
  const { data } = await axios.get<Artist>(`/api/artists/${id}`)
  return data
}

export const updateArtist = async (id: string, payload: Partial<ArtistFormValues>): Promise<Artist> => {
  const { data } = await axios.put<Artist>(`/api/artists/${id}`, payload)
  return data
}

export const deleteArtist = async (id: string): Promise<void> => {
  await axios.delete(`/api/artists/${id}`)
}

export const fetchCategories = async (params: ListQueryParams = {}): Promise<PaginatedResponse<Category>> => {
  const { page = 1, pageSize = 20, search, status } = params
  const { data } = await axios.get('/api/categories', {
    params: {
      page,
      page_size: pageSize,
      search,
      status_filter: status,
    },
  })
  return mapPaginated<Category>(data)
}

export const createCategory = async (payload: CategoryFormValues): Promise<Category> => {
  const { data } = await axios.post<Category>('/api/categories', payload)
  return data
}

export const getCategory = async (id: string): Promise<Category> => {
  const { data } = await axios.get<Category>(`/api/categories/${id}`)
  return data
}

export const updateCategory = async (id: string, payload: Partial<CategoryFormValues>): Promise<Category> => {
  const { data } = await axios.put<Category>(`/api/categories/${id}`, payload)
  return data
}

export const deleteCategory = async (id: string): Promise<void> => {
  await axios.delete(`/api/categories/${id}`)
}

export const fetchVideos = async (params: ListQueryParams = {}): Promise<PaginatedResponse<Video>> => {
  const { page = 1, pageSize = 20, search, status, artistId, categoryId } = params
  const { data } = await axios.get('/api/videos', {
    params: {
      page,
      page_size: pageSize,
      search,
      status_filter: status,
      artist_id: artistId,
      category_id: categoryId,
    },
  })
  return mapPaginated<Video>(data)
}

export const createVideo = async (payload: VideoFormValues): Promise<Video> => {
  const { data } = await axios.post<Video>('/api/videos', payload)
  return data
}

export const getVideo = async (id: string): Promise<Video> => {
  const { data } = await axios.get<Video>(`/api/videos/${id}`)
  return data
}

export const updateVideo = async (id: string, payload: Partial<VideoFormValues>): Promise<Video> => {
  const { data } = await axios.put<Video>(`/api/videos/${id}`, payload)
  return data
}

export const deleteVideo = async (id: string): Promise<void> => {
  await axios.delete(`/api/videos/${id}`)
}

export interface DirectUploadResponse {
  file_id: string
  file_name: string
  key: string
  content_type: string
  size_bytes: number
  download_url: string
  object_url: string
}

export const uploadFileWithProgress = async (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<DirectUploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  const config: AxiosRequestConfig = {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (!event.total) return
      const percent = Math.round((event.loaded / event.total) * 100)
      onProgress?.(percent)
    },
  }
  const { data } = await axios.post<DirectUploadResponse>('/api/upload', formData, config)
  return data
}

export const fetchSubtitles = async (videoId?: string): Promise<Subtitle[]> => {
  const { data } = await axios.get<Subtitle[]>('/api/subtitles', {
    params: {
      video_id: videoId,
    },
  })
  return data
}

export const createSubtitle = async (payload: SubtitlePayload & { video_id: string }): Promise<Subtitle> => {
  const { data } = await axios.post<Subtitle>('/api/subtitles', payload)
  return data
}

export const updateSubtitle = async (id: string, payload: Partial<SubtitlePayload>): Promise<Subtitle> => {
  const { data } = await axios.put<Subtitle>(`/api/subtitles/${id}`, payload)
  return data
}

export const deleteSubtitle = async (id: string): Promise<void> => {
  await axios.delete(`/api/subtitles/${id}`)
}

export const bulkUpdateArtists = async (ids: string[], payload: Partial<ArtistFormValues>): Promise<void> => {
  await Promise.all(ids.map((id) => updateArtist(id, payload)))
}

export const bulkUpdateCategories = async (ids: string[], payload: Partial<CategoryFormValues>): Promise<void> => {
  await Promise.all(ids.map((id) => updateCategory(id, payload)))
}

export const bulkUpdateVideos = async (ids: string[], payload: Partial<VideoFormValues>): Promise<void> => {
  await Promise.all(ids.map((id) => updateVideo(id, payload)))
}

export const bulkDelete = async (ids: string[], handler: (id: string) => Promise<void>): Promise<void> => {
  await Promise.all(ids.map((id) => handler(id)))
}
