export interface PaginationInfo {
  total: number
  page: number
  page_size: number
}

export interface Artist {
  id: string
  name: string
  slug: string
  bio?: string | null
  profile_image_url?: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface ArtistFormValues {
  name: string
  slug: string
  bio?: string | null
  profile_image_url?: string | null
  is_active: boolean
  is_featured: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CategoryFormValues {
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  display_order: number
  is_active: boolean
}

export type VideoStatus = 'draft' | 'published' | 'archived'

export interface Video {
  id: string
  title: string
  slug: string
  description?: string | null
  thumbnail_url?: string | null
  video_url?: string | null
  duration_seconds?: number | null
  status: VideoStatus
  release_date?: string | null
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  artists: Artist[]
  categories: Category[]
  subtitles: Subtitle[]
}

export interface VideoFormValues {
  title: string
  slug: string
  description?: string | null
  thumbnail_url?: string | null
  video_url?: string | null
  duration_seconds?: number | null
  status: VideoStatus
  release_date?: string | null
  is_featured: boolean
  metadata: {
    rating?: string | null
    trailer_url?: string | null
    tags?: string[]
    language?: string | null
    [key: string]: unknown
  }
  artist_ids: string[]
  category_ids: string[]
  subtitles: SubtitlePayload[]
}

export interface Subtitle {
  id: string
  video_id: string
  language: string
  label?: string | null
  file_url: string
  created_at: string
}

export interface SubtitlePayload {
  language: string
  label?: string | null
  file_url: string
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationInfo
}

